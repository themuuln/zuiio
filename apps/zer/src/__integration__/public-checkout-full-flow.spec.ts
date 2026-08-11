/**
 * Integration tests for the public checkout full flow
 * (migration 20260810190000_public_checkout_full_flow.sql).
 *
 * Covers: delivery order auto-creates a deliveries row (+ fee), free-delivery
 * threshold, pickup branch resolution, coupons (percent + min purchase +
 * usage increment), gift cards (partial redemption + balance decrement),
 * promotions (free_shipping → fee 0, threshold discount applied), the
 * show_stock privacy opt-in, and get_public_order buyer isolation.
 *
 * Requires a running local Supabase stack (see AGENTS.md).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "../lib/supabase/types";
import {
  createAdminClient,
  createAnonClient,
  createTestBranch,
  createTestOrg,
  createTestProduct,
  runSql,
  trackCleanup,
} from "./helpers";

interface OrderRow {
  order_id: string;
  total_amount: number;
  status: string;
  delivery_fee: number | null;
  discount_amount: number | null;
  gift_card_amount: number | null;
  payment_instructions: Record<string, unknown> | null;
}

type Admin = ReturnType<typeof createAdminClient>;

interface CheckoutStore {
  org: { id: string; slug: string; name: string };
  orgId: string;
  defaultBranchId: string;
  productId: string;
}

/**
 * Org + catalog-enabled profile (with checkout config) + default branch +
 * stocked product (sale_price 5000, stock 20).
 */
async function setupStore(
  admin: Admin,
  opts?: {
    deliveryFee?: number;
    freeDeliveryThreshold?: number;
    deliveryEnabled?: boolean;
    pickupEnabled?: boolean;
    showStock?: boolean;
    paymentBankName?: string;
    paymentBankAccount?: string;
    paymentAccountName?: string;
    qpayQrUrl?: string;
  },
): Promise<CheckoutStore> {
  const { org, orgId } = await createTestOrg(admin);

  const { error: profileError } = await admin
    .from("organization_public_profiles")
    .upsert({
      organization_id: orgId,
      catalog_enabled: true,
      display_name: org.name,
      delivery_enabled: opts?.deliveryEnabled ?? false,
      pickup_enabled: opts?.pickupEnabled ?? true,
      delivery_fee_amount: opts?.deliveryFee ?? 5000,
      free_delivery_threshold: opts?.freeDeliveryThreshold ?? 0,
      show_stock: opts?.showStock ?? false,
      payment_bank_name: opts?.paymentBankName ?? null,
      payment_bank_account: opts?.paymentBankAccount ?? null,
      payment_account_name: opts?.paymentAccountName ?? null,
      qpay_qr_url: opts?.qpayQrUrl ?? null,
    });
  if (profileError) {
    throw new Error(`Failed to enable catalog: ${profileError.message}`);
  }

  const { branchId } = await createTestBranch(admin, orgId);
  const { error: defaultError } = await admin
    .from("branches")
    .update({ is_default: true })
    .eq("id", branchId);
  if (defaultError) {
    throw new Error(`Failed to set default branch: ${defaultError.message}`);
  }

  const { productId } = await createTestProduct(admin, orgId, {
    currentStock: 20,
  });
  // Catalog RPCs only expose is_public products.
  const { error: publishError } = await admin
    .from("products")
    .update({ is_public: true })
    .eq("id", productId);
  if (publishError) {
    throw new Error(`Failed to publish product: ${publishError.message}`);
  }

  return { org, orgId, defaultBranchId: branchId, productId };
}

function orderItems(productId: string, quantity: number) {
  return [{ product_id: productId, quantity, variant_id: "" }];
}

async function insertCoupon(
  admin: Admin,
  orgId: string,
  overrides: Record<string, unknown> = {},
) {
  const { data, error } = await admin
    .from("coupons")
    .insert({
      organization_id: orgId,
      code: `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      discount_type: "percentage",
      discount_value: 10,
      min_purchase_amount: 0,
      valid_from: new Date(Date.now() - 86_400_000).toISOString(),
      is_active: true,
      usage_limit: null,
      per_customer_limit: 1,
      applies_to: "all",
      ...overrides,
    })
    .select("id, code")
    .single();
  if (error) throw new Error(`Failed to create coupon: ${error.message}`);
  trackCleanup("coupons", data.id);
  return data as { id: string; code: string };
}

async function insertGiftCard(
  admin: Admin,
  orgId: string,
  overrides: Record<string, unknown> = {},
) {
  const { data, error } = await admin
    .from("gift_cards")
    .insert({
      organization_id: orgId,
      code: `GC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      initial_balance: 10000,
      current_balance: 10000,
      currency_code: "MNT",
      is_active: true,
      ...overrides,
    })
    .select("id, code, current_balance")
    .single();
  if (error) throw new Error(`Failed to create gift card: ${error.message}`);
  trackCleanup("gift_cards", data.id);
  return data as { id: string; code: string; current_balance: number };
}

async function insertPromotion(
  admin: Admin,
  orgId: string,
  opts: {
    type: string;
    rewardType: string;
    rewardValue: number;
    conditions: Array<{ condition_type: string; condition_value: string }>;
  },
) {
  const { data: promo, error: promoError } = await admin
    .from("promotions")
    .insert({
      organization_id: orgId,
      name: `Promo-${Date.now()}`,
      type: opts.type,
      is_active: true,
      priority: 0,
      valid_from: new Date(Date.now() - 86_400_000).toISOString(),
      stackable: false,
    })
    .select("id")
    .single();
  if (promoError)
    throw new Error(`Failed to create promotion: ${promoError.message}`);
  trackCleanup("promotions", promo.id);

  for (const c of opts.conditions) {
    const { error: condError } = await admin
      .from("promotion_conditions")
      .insert({
        promotion_id: promo.id,
        condition_type: c.condition_type,
        condition_value: c.condition_value,
      });
    if (condError)
      throw new Error(`Failed to create condition: ${condError.message}`);
  }

  const { error: rewardError } = await admin.from("promotion_rewards").insert({
    promotion_id: promo.id,
    reward_type: opts.rewardType,
    reward_value: opts.rewardValue,
  });
  if (rewardError)
    throw new Error(`Failed to create reward: ${rewardError.message}`);

  return promo.id as string;
}

async function trackOrderContact(admin: Admin, orgId: string, phone: string) {
  const { data: contactRows } = (await admin
    .from("contacts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("phone", phone)) as unknown as { data: Array<{ id: string }> };
  for (const c of contactRows ?? []) trackCleanup("contacts", c.id);
}

describe("public checkout full flow", () => {
  const admin = createAdminClient();

  it("delivery order auto-creates a deliveries row with the address + fee", async () => {
    const { org, orgId, productId } = await setupStore(admin, {
      deliveryEnabled: true,
      deliveryFee: 5000,
      freeDeliveryThreshold: 20000,
    });
    const anon = createAnonClient();

    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 2),
      p_payment_method: "cash",
      p_contact_name: "Хүргэлтийн Хэрэглэгч",
      p_contact_phone: "99112233",
      p_contact_email: "buyer@example.mn",
      p_delivery_type: "delivery",
      p_address: "УБ, Баянгол дүүрэг, 1-р хороо, 12-р байр",
      p_address_note: "2-р орц, 3-р давхар",
    } as never);

    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.status).toBe("pending");
    // 2 × 5000 = 10000 subtotal, below the 20000 threshold → fee 5000
    expect(row?.total_amount).toBe(15000);
    expect(row?.delivery_fee).toBe(5000);
    expect(row?.discount_amount).toBe(0);
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");

    const { data: deliveries } = (await admin
      .from("deliveries")
      .select(
        "sale_id, address, address_note, contact_name, contact_phone, delivery_fee, status, branch_id",
      )
      .eq("sale_id", row?.order_id)) as unknown as {
      data: Array<{
        sale_id: string;
        address: string;
        address_note: string;
        contact_name: string;
        contact_phone: string;
        delivery_fee: number;
        status: string;
        branch_id: string;
      }>;
    };
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].address).toBe(
      "УБ, Баянгол дүүрэг, 1-р хороо, 12-р байр",
    );
    expect(deliveries[0].address_note).toBe("2-р орц, 3-р давхар");
    expect(deliveries[0].contact_name).toBe("Хүргэлтийн Хэрэглэгч");
    expect(deliveries[0].contact_phone).toBe("99112233");
    expect(deliveries[0].delivery_fee).toBe(5000);
    expect(deliveries[0].status).toBe("pending");

    const { data: sale } = (await admin
      .from("sales")
      .select(
        "delivery_type, delivery_address, delivery_fee, discount_amount, contact_email",
      )
      .eq("id", row?.order_id)
      .single()) as unknown as {
      data: {
        delivery_type: string;
        delivery_address: string;
        delivery_fee: number;
        discount_amount: number;
        contact_email: string | null;
      } | null;
    };
    expect(sale?.delivery_type).toBe("delivery");
    expect(sale?.delivery_address).toBe(
      "УБ, Баянгол дүүрэг, 1-р хороо, 12-р байр",
    );
    expect(sale?.delivery_fee).toBe(5000);
    expect(sale?.contact_email).toBe("buyer@example.mn");
  });

  it("rejects delivery when the org has delivery disabled", async () => {
    const { org, productId } = await setupStore(admin, {
      deliveryEnabled: false,
    });
    const anon = createAnonClient();

    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 1),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_delivery_type: "delivery",
      p_address: "УБ, СБД",
    } as never);
    expect(data).toBeNull();
    expect(error?.message ?? "").toMatch(/хүргэлт/i);
  });

  it("free-delivery threshold zeroes the fee above it", async () => {
    const { org, orgId, productId } = await setupStore(admin, {
      deliveryEnabled: true,
      deliveryFee: 5000,
      freeDeliveryThreshold: 8000,
    });
    const anon = createAnonClient();

    // 2 × 5000 = 10000 ≥ 8000 → free delivery
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 2),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_delivery_type: "delivery",
      p_address: "УБ, Баянгол дүүрэг",
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.total_amount).toBe(10000);
    expect(row?.delivery_fee).toBe(0);
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");
  });

  it("pickup order with a branch slug resolves that branch, no deliveries row", async () => {
    const { org, orgId, defaultBranchId, productId } = await setupStore(admin, {
      pickupEnabled: true,
    });

    const { branchId: secondBranchId } = await createTestBranch(admin, orgId);

    const anon = createAnonClient();
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 1),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_delivery_type: "pickup",
      p_pickup_branch_slug: (
        await admin
          .from("branches")
          .select("slug")
          .eq("id", secondBranchId)
          .single()
      ).data?.slug,
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.delivery_fee).toBe(0);
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");

    const { data: sale } = (await admin
      .from("sales")
      .select("branch_id, delivery_type")
      .eq("id", row?.order_id)
      .single()) as unknown as {
      data: { branch_id: string; delivery_type: string } | null;
    };
    expect(sale?.branch_id).toBe(secondBranchId);
    expect(sale?.delivery_type).toBe("pickup");

    const { data: deliveries } = (await admin
      .from("deliveries")
      .select("id")
      .eq("sale_id", row?.order_id)) as unknown as {
      data: Array<{ id: string }>;
    };
    expect(deliveries).toHaveLength(0);
    void defaultBranchId;
  });

  it("coupon: percent discount applied, usage incremented, min purchase rejected", async () => {
    const { org, orgId, productId } = await setupStore(admin);
    const coupon = await insertCoupon(admin, orgId, { discount_value: 10 });
    const anon = createAnonClient();

    // 1 × 5000, 10% off → 500 discount
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 1),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_coupon_code: coupon.code,
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.discount_amount).toBe(500);
    expect(row?.total_amount).toBe(4500);
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");

    const { data: couponRow } = (await admin
      .from("coupons")
      .select("used_count")
      .eq("id", coupon.id)
      .single()) as unknown as { data: { used_count: number } | null };
    expect(couponRow?.used_count).toBe(1);

    // Min purchase: 20000 required, subtotal 5000 → rejected
    const strictCoupon = await insertCoupon(admin, orgId, {
      min_purchase_amount: 20000,
    });
    const { data: rejected, error: rejectError } = await anon.rpc(
      "submit_shop_order",
      {
        p_org_slug: org.slug,
        p_items: orderItems(productId, 1),
        p_contact_name: "Бат",
        p_contact_phone: "99112233",
        p_coupon_code: strictCoupon.code,
      } as never,
    );
    expect(rejected).toBeNull();
    expect(rejectError?.message ?? "").toMatch(/нөхцөл/i);
  });

  it("gift card: partial redemption + balance decrement + paid_amount", async () => {
    const { org, orgId, productId } = await setupStore(admin);
    const giftCard = await insertGiftCard(admin, orgId, {
      current_balance: 3000,
    });
    const anon = createAnonClient();

    // 2 × 5000 = 10000 payable; card covers 3000
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 2),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_gift_card_code: giftCard.code,
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.total_amount).toBe(10000);
    expect(row?.gift_card_amount).toBe(3000);
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");

    const { data: card } = (await admin
      .from("gift_cards")
      .select("current_balance")
      .eq("id", giftCard.id)
      .single()) as unknown as { data: { current_balance: number } | null };
    expect(card?.current_balance).toBe(0);

    const { data: sale } = (await admin
      .from("sales")
      .select("paid_amount, payment_splits, gift_card_amount")
      .eq("id", row?.order_id)
      .single()) as unknown as {
      data: {
        paid_amount: number;
        payment_splits: Record<string, number> | null;
        gift_card_amount: number;
      } | null;
    };
    expect(sale?.paid_amount).toBe(3000);
    expect(sale?.gift_card_amount).toBe(3000);
    expect(sale?.payment_splits).toEqual({ cash: 7000, gift_card: 3000 });
  });

  it("promotion: free_shipping forces delivery fee 0 below the threshold", async () => {
    const { org, productId } = await setupStore(admin, {
      deliveryEnabled: true,
      deliveryFee: 5000,
      freeDeliveryThreshold: 20000,
    });
    await insertPromotion(admin, org.id, {
      type: "free_shipping",
      rewardType: "free_shipping",
      rewardValue: 5000,
      conditions: [{ condition_type: "min_amount", condition_value: "5000" }],
    });
    const anon = createAnonClient();

    // payable 10000 < 20000 → fee would be 5000, but free_shipping promo → 0
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 2),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_delivery_type: "delivery",
      p_address: "УБ, СБД",
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.delivery_fee).toBe(0);
    expect(row?.total_amount).toBe(10000);
    trackCleanup("sales", row?.order_id);
  });

  it("promotion: threshold discount applied and recorded on the sale", async () => {
    const { org, orgId, productId } = await setupStore(admin);
    await insertPromotion(admin, orgId, {
      type: "threshold_discount",
      rewardType: "percentage_discount",
      rewardValue: 10,
      conditions: [{ condition_type: "min_amount", condition_value: "5000" }],
    });
    const anon = createAnonClient();

    // 2 × 5000 = 10000 ≥ 5000 → 10% = 1000 off
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 2),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.discount_amount).toBe(1000);
    expect(row?.total_amount).toBe(9000);
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");

    const { data: sale } = (await admin
      .from("sales")
      .select("promotion_id, promotion_discount")
      .eq("id", row?.order_id)
      .single()) as unknown as {
      data: { promotion_id: string | null; promotion_discount: number } | null;
    };
    expect(sale?.promotion_id).toBeTruthy();
    expect(sale?.promotion_discount).toBe(1000);
  });

  it("show_stock=false hides stock, show_stock=true exposes it", async () => {
    const { org, productId } = await setupStore(admin, { showStock: false });
    const anon = createAnonClient();

    const { data: hidden } = (await anon.rpc("get_public_products", {
      p_slug: org.slug,
    })) as unknown as {
      data: {
        products: Array<{ id: string; current_stock: number | null }>;
      } | null;
    };
    const hiddenProduct = hidden?.products.find((p) => p.id === productId);
    expect(hiddenProduct?.current_stock).toBeNull();

    await admin
      .from("organization_public_profiles")
      .update({ show_stock: true })
      .eq("organization_id", org.id);

    const { data: shown } = (await anon.rpc("get_public_products", {
      p_slug: org.slug,
    })) as unknown as {
      data: {
        products: Array<{ id: string; current_stock: number | null }>;
      } | null;
    };
    const shownProduct = shown?.products.find((p) => p.id === productId);
    expect(shownProduct?.current_stock).toBe(20);
  });

  it("get_public_order returns only the caller's own order", async () => {
    const { org, orgId, productId } = await setupStore(admin);

    const buyerA = await createStoreBuyer(admin, "Buyer A");
    const buyerB = await createStoreBuyer(admin, "Buyer B");

    const { data } = await buyerA.client.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 1),
      p_contact_name: "Buyer A",
      p_contact_phone: "99112233",
    } as never);
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");

    // Buyer B must get null for A's order (not owned / not found).
    const { data: bResult } = (await buyerB.client.rpc("get_public_order", {
      p_slug: org.slug,
      p_order_id: row?.order_id,
    })) as unknown as { data: { order?: unknown } | null };
    expect(bResult).toBeNull();

    // Buyer A gets the wrapped detail ({ order: OrderDetail }).
    const { data: aResult } = (await buyerA.client.rpc("get_public_order", {
      p_slug: org.slug,
      p_order_id: row?.order_id,
    })) as unknown as {
      data: {
        order: {
          id: string;
          status: string;
          total_amount: number;
          delivery_fee: number;
          discount_amount: number;
          delivery: {
            status: string;
            external_tracking_id: string | null;
          } | null;
          items: Array<{ product_id: string; name: string; quantity: number }>;
        };
      } | null;
    };
    expect(aResult?.order.id).toBe(row?.order_id);
    expect(aResult?.order.total_amount).toBe(5000);
    expect(aResult?.order.delivery_fee).toBe(0);
    expect(aResult?.order.discount_amount).toBe(0);
    expect(aResult?.order.delivery).toBeNull();
    expect(aResult?.order.items).toHaveLength(1);
    expect(aResult?.order.items[0].quantity).toBe(1);
  });

  it("returns payment_instructions (bank/QPay) on the success row", async () => {
    const { org, productId } = await setupStore(admin, {
      paymentBankName: "Хаан банк",
      paymentBankAccount: "5000123456",
      paymentAccountName: "Тест ХХК",
      qpayQrUrl: "https://qpay.example/qr.png",
    });
    const anon = createAnonClient();

    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 1),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_payment_method: "qpay",
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.payment_instructions).toEqual({
      bank_name: "Хаан банк",
      bank_account: "5000123456",
      account_name: "Тест ХХК",
      qpay_qr_url: "https://qpay.example/qr.png",
    });
    trackCleanup("sales", row?.order_id);
  });
});

/** Signed-in store buyer (auth user + own store_accounts row via RLS). */
async function createStoreBuyer(
  _admin: Admin,
  displayName: string,
): Promise<{ userId: string; client: SupabaseClient<Database> }> {
  const email = `buyer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = "test-password-123";

  const { data: signUpData, error: signUpError } =
    await createAnonClient().auth.signUp({ email, password });
  if (signUpError) throw new Error(`SignUp failed: ${signUpError.message}`);
  const userId = signUpData.user?.id;
  if (!userId) throw new Error("SignUp returned no user id");

  await runSql(
    `UPDATE auth.users SET email_confirmed_at = now() WHERE id = '${userId}'`,
  );

  const { data: signInData, error: signInError } =
    await createAnonClient().auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`SignIn failed: ${signInError.message}`);
  const session = signInData.session;
  if (!session) throw new Error("SignIn returned no session");

  const supabaseUrl = process.env.SUPABASE_URL as string;
  const anonKey = process.env.SUPABASE_ANON_KEY as string;
  const client = createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  });

  const { error: insertError } = await client.from("store_accounts").insert({
    id: userId,
    email,
    display_name: displayName,
    phone: "99112233",
  });
  if (insertError) {
    throw new Error(`store_accounts insert failed: ${insertError.message}`);
  }
  trackCleanup("store_accounts", userId);

  return { userId, client };
}
