/**
 * Integration tests — storefront loyalty earn/spend contract
 * (migration 20260813020000).
 *
 * Real RLS + real JWTs against the local Supabase stack:
 *   - `get_public_loyalty` resolves the buyer's contact by store account
 *     phone/email and returns balance, history, rewards.
 *   - `submit_shop_order` `p_redeem_points` discounts server-side and earns
 *     in the same transaction; idempotent replay cannot double-award.
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
  trackCleanup,
} from "./helpers";

const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54326";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";

type TestSupabaseClient = SupabaseClient;

interface LoyaltyStore {
  org: { id: string; slug: string; name: string };
  orgId: string;
  productId: string;
}

interface LoyaltyBuyer {
  userId: string;
  phone: string;
  client: TestSupabaseClient;
  contactId: string;
}

/** Org + catalog profile + default branch + one public 5,000₮ product. */
async function setupStore(admin: TestSupabaseClient): Promise<LoyaltyStore> {
  const { org, orgId } = await createTestOrg(admin);
  await admin.from("organization_public_profiles").upsert({
    organization_id: orgId,
    catalog_enabled: true,
    display_name: org.name,
    delivery_enabled: false,
    pickup_enabled: true,
  });
  const { branchId } = await createTestBranch(admin, orgId);
  await admin.from("branches").update({ is_default: true }).eq("id", branchId);

  const { productId } = await createTestProduct(admin, orgId, {
    name: "Онооны бүтээгдэхүүн",
    currentStock: 50,
  });
  await admin
    .from("products")
    .update({ sale_price: 5000, is_public: true })
    .eq("id", productId);

  return { org, orgId, productId };
}

/** Enable the org's loyalty program. */
async function enableLoyalty(
  admin: TestSupabaseClient,
  orgId: string,
  opts: { pointsPerMnt?: number; minPurchase?: number; enabled?: boolean } = {},
) {
  const { data, error } = await admin
    .from("loyalty_settings")
    .insert({
      organization_id: orgId,
      points_per_mnt: opts.pointsPerMnt ?? 1,
      min_purchase: opts.minPurchase ?? 0,
      is_enabled: opts.enabled ?? true,
    })
    .select("id")
    .single();
  if (error) throw new Error(`loyalty_settings insert: ${error.message}`);
  trackCleanup("loyalty_settings", data.id);
}

/**
 * Signed-in store buyer whose phone matches a contact row (the loyalty
 * identity). Contact starts with the given points balance.
 */
async function createLoyaltyBuyer(
  admin: TestSupabaseClient,
  orgId: string,
  opts: { phone: string; points?: number },
): Promise<LoyaltyBuyer> {
  const email = `loyalty-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = "test-password-123";

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const authBody = (await authResponse.json()) as { id?: string; msg?: string };
  if (!authResponse.ok || !authBody.id) {
    throw new Error(
      `Admin user creation failed: ${authBody.msg ?? authResponse.statusText}`,
    );
  }
  const userId = authBody.id;
  const { data: signInData, error: signInError } =
    await createAnonClient().auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`SignIn failed: ${signInError.message}`);
  const session = signInData.session;
  if (!session) throw new Error("SignIn returned no session");

  const client = createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  });

  const { error: accountError } = await client
    .from("store_accounts" as never)
    .insert({ id: userId, email, phone: opts.phone } as never);
  if (accountError) throw new Error(`store_accounts: ${accountError.message}`);
  trackCleanup("store_accounts", userId);

  const { data: contact, error: contactError } = await admin
    .from("contacts")
    .insert({
      organization_id: orgId,
      name: "Онооны худалдан авагч",
      phone: opts.phone,
      type: "customer",
      points_balance: opts.points ?? 0,
    })
    .select("id")
    .single();
  if (contactError) throw new Error(`contacts: ${contactError.message}`);
  trackCleanup("contacts", contact.id);

  return { userId, phone: opts.phone, client, contactId: contact.id };
}

/** Buyer places a pickup order via submit_shop_order. */
async function placeOrder(
  buyer: LoyaltyBuyer,
  slug: string,
  productId: string,
  opts: {
    quantity?: number;
    redeemPoints?: number;
    idempotencyKey?: string;
    contactPhone?: string;
  } = {},
): Promise<{
  orderId: string;
  total: number;
  discount: number;
  pointsDiscount: number;
  pointsRedeemed: number;
  pointsEarned: number;
}> {
  const { data, error } = (await buyer.client.rpc("submit_shop_order", {
    p_org_slug: slug,
    p_items: [
      { product_id: productId, quantity: opts.quantity ?? 1, variant_id: "" },
    ],
    p_payment_method: "cash",
    p_contact_name: "Онооны худалдан авагч",
    p_contact_phone: opts.contactPhone ?? buyer.phone,
    p_delivery_type: "pickup",
    p_idempotency_key: opts.idempotencyKey ?? null,
    p_redeem_points: opts.redeemPoints ?? 0,
  } as never)) as unknown as {
    data: Array<{
      order_id: string;
      total_amount: number;
      discount_amount: number;
      points_discount: number;
      points_redeemed: number;
      points_earned: number;
    }> | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(`submit_shop_order: ${error.message}`);
  const row = data?.[0];
  if (!row?.order_id) throw new Error("submit_shop_order returned no order");
  trackCleanup("sales", row.order_id);
  return {
    orderId: row.order_id,
    total: Number(row.total_amount),
    discount: Number(row.discount_amount),
    pointsDiscount: Number(row.points_discount),
    pointsRedeemed: Number(row.points_redeemed),
    pointsEarned: Number(row.points_earned),
  };
}

async function getLoyalty(
  buyer: LoyaltyBuyer,
  slug: string,
): Promise<{
  enabled: boolean;
  balance: number;
  points_per_mnt: number;
  history: Array<{ points: number; type: string }>;
} | null> {
  const { data, error } = (await buyer.client.rpc("get_public_loyalty", {
    p_slug: slug,
  } as never)) as unknown as {
    data: {
      enabled: boolean;
      balance: number;
      points_per_mnt: number;
      history: Array<{ points: number; type: string }>;
    } | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(`get_public_loyalty: ${error.message}`);
  return data;
}

describe("storefront loyalty — earn", () => {
  it("credits floor(net × rate) points when an order clears min_purchase", async () => {
    const admin = createAdminClient();
    const store = await setupStore(admin);
    await enableLoyalty(admin, store.orgId, {
      pointsPerMnt: 1,
      minPurchase: 0,
    });
    const buyer = await createLoyaltyBuyer(admin, store.orgId, {
      phone: "99110011",
    });

    const result = await placeOrder(buyer, store.org.slug, store.productId);
    expect(result.total).toBe(5000);
    expect(result.pointsEarned).toBe(5000);

    const loyalty = await getLoyalty(buyer, store.org.slug);
    expect(loyalty?.enabled).toBe(true);
    expect(loyalty?.balance).toBe(5000);
    expect(loyalty?.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ points: 5000, type: "earned" }),
      ]),
    );
  });

  it("skips earning below the min_purchase threshold", async () => {
    const admin = createAdminClient();
    const store = await setupStore(admin);
    await enableLoyalty(admin, store.orgId, {
      pointsPerMnt: 1,
      minPurchase: 10000,
    });
    const buyer = await createLoyaltyBuyer(admin, store.orgId, {
      phone: "99110012",
    });

    const result = await placeOrder(buyer, store.org.slug, store.productId);
    expect(result.pointsEarned).toBe(0);
    expect((await getLoyalty(buyer, store.org.slug))?.balance).toBe(0);
  });
  it("does not earn when the buyer has no matching contact", async () => {
    const admin = createAdminClient();
    const store = await setupStore(admin);
    await enableLoyalty(admin, store.orgId, {});
    const buyer = await createLoyaltyBuyer(admin, store.orgId, {
      phone: "99990000",
    });
    await admin
      .from("contacts")
      .update({ phone: "77777777" })
      .eq("id", buyer.contactId);

    const result = await placeOrder(buyer, store.org.slug, store.productId, {
      contactPhone: "88881111",
    });
    expect(result.pointsEarned).toBe(0);
    expect((await getLoyalty(buyer, store.org.slug))?.balance).toBe(0);
  });
});

describe("storefront loyalty — spend", () => {
  it("redeems points as a server-priced discount and re-earns on the net", async () => {
    const admin = createAdminClient();
    const store = await setupStore(admin);
    await enableLoyalty(admin, store.orgId, {
      pointsPerMnt: 1,
      minPurchase: 0,
    });
    // Buyer starts with 5,000 points.
    const buyer = await createLoyaltyBuyer(admin, store.orgId, {
      phone: "99110021",
      points: 5000,
    });

    const result = await placeOrder(buyer, store.org.slug, store.productId, {
      redeemPoints: 3000,
    });
    // subtotal 5,000 − points 3,000 → 2,000 payable; earn on the 2,000.
    expect(result.pointsDiscount).toBe(3000);
    expect(result.discount).toBe(3000);
    expect(result.total).toBe(2000);
    expect(result.pointsRedeemed).toBe(3000);
    expect(result.pointsEarned).toBe(2000);

    const loyalty = await getLoyalty(buyer, store.org.slug);
    expect(loyalty?.balance).toBe(5000 - 3000 + 2000);

    // Ledger + sale trace persisted.
    const { data: ledger } = (await admin
      .from("loyalty_points")
      .select("points, type")
      .eq("customer_id", buyer.contactId)) as unknown as {
      data: Array<{ points: number; type: string }> | null;
    };
    expect(ledger).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ points: -3000, type: "redeemed" }),
        expect.objectContaining({ points: 2000, type: "earned" }),
      ]),
    );

    const { data: sale } = (await admin
      .from("sales")
      .select("points_redeemed, discount_amount")
      .eq("id", result.orderId)
      .single()) as unknown as {
      data: {
        points_redeemed: number | null;
        discount_amount: number | null;
      } | null;
    };
    expect(sale?.points_redeemed).toBe(3000);
    expect(Number(sale?.discount_amount)).toBe(3000);
  });

  it("caps the points discount at the payable amount", async () => {
    const admin = createAdminClient();
    const store = await setupStore(admin);
    await enableLoyalty(admin, store.orgId, {});
    const buyer = await createLoyaltyBuyer(admin, store.orgId, {
      phone: "99110022",
      points: 1_000_000,
    });

    // Redeem 1M points against a 5,000₮ order → discount capped at 5,000.
    const result = await placeOrder(buyer, store.org.slug, store.productId, {
      redeemPoints: 1_000_000,
    });
    expect(result.pointsDiscount).toBe(5000);
    expect(result.total).toBe(0);
    expect(result.pointsEarned).toBe(0);
  });

  it("rejects redemption beyond the buyer balance", async () => {
    const admin = createAdminClient();
    const store = await setupStore(admin);
    await enableLoyalty(admin, store.orgId, {});
    const buyer = await createLoyaltyBuyer(admin, store.orgId, {
      phone: "99110023",
      points: 100,
    });

    await expect(
      placeOrder(buyer, store.org.slug, store.productId, { redeemPoints: 500 }),
    ).rejects.toThrow("Оноо хүрэлцэхгүй байна");
    // Balance untouched.
    expect((await getLoyalty(buyer, store.org.slug))?.balance).toBe(100);
  });

  it("rejects anon redemption", async () => {
    const admin = createAdminClient();
    const store = await setupStore(admin);
    await enableLoyalty(admin, store.orgId, {});
    const buyer = await createLoyaltyBuyer(admin, store.orgId, {
      phone: "99110024",
      points: 5000,
    });

    // Call as a fresh anon client — no session → auth.uid() is NULL.
    const anon = createAnonClient();
    const { error } = (await anon.rpc("submit_shop_order", {
      p_org_slug: store.org.slug,
      p_items: [{ product_id: store.productId, quantity: 1, variant_id: "" }],
      p_payment_method: "cash",
      p_contact_name: "Худалдан авагч",
      p_contact_phone: buyer.phone,
      p_delivery_type: "pickup",
      p_redeem_points: 100,
    } as never)) as unknown as { error: { message: string } | null };
    expect(error?.message).toContain("нэвтрэх");
  });
});

describe("storefront loyalty — idempotency + disabled", () => {
  it("never double-awards on an idempotent replay", async () => {
    const admin = createAdminClient();
    const store = await setupStore(admin);
    await enableLoyalty(admin, store.orgId, {});
    const buyer = await createLoyaltyBuyer(admin, store.orgId, {
      phone: "99110031",
      points: 5000,
    });

    const first = await placeOrder(buyer, store.org.slug, store.productId, {
      redeemPoints: 3000,
      idempotencyKey: "loyalty-replay-1",
    });
    const replay = await placeOrder(buyer, store.org.slug, store.productId, {
      redeemPoints: 3000,
      idempotencyKey: "loyalty-replay-1",
    });

    expect(replay.orderId).toBe(first.orderId);
    expect(replay.pointsRedeemed).toBe(0);
    expect(replay.pointsEarned).toBe(0);

    const { data: ledger } = (await admin
      .from("loyalty_points")
      .select("points")
      .eq("customer_id", buyer.contactId)) as unknown as {
      data: Array<{ points: number }> | null;
    };
    // Exactly two rows: one redeemed, one earned.
    expect(ledger).toHaveLength(2);
    expect((await getLoyalty(buyer, store.org.slug))?.balance).toBe(
      5000 - 3000 + 2000,
    );
  });

  it("reports disabled and never earns when loyalty is off", async () => {
    const admin = createAdminClient();
    const store = await setupStore(admin);
    await enableLoyalty(admin, store.orgId, { enabled: false });
    const buyer = await createLoyaltyBuyer(admin, store.orgId, {
      phone: "99110032",
      points: 100,
    });

    const result = await placeOrder(buyer, store.org.slug, store.productId);
    expect(result.pointsEarned).toBe(0);
    const loyalty = await getLoyalty(buyer, store.org.slug);
    expect(loyalty?.enabled).toBe(false);
    expect(loyalty?.balance).toBe(0);
  });

  it("returns null for an unknown store slug", async () => {
    const admin = createAdminClient();
    const store = await setupStore(admin);
    await enableLoyalty(admin, store.orgId, {});
    const buyer = await createLoyaltyBuyer(admin, store.orgId, {
      phone: "99110033",
    });

    const { data } = (await buyer.client.rpc("get_public_loyalty", {
      p_slug: "no-such-store",
    } as never)) as unknown as { data: unknown; error: unknown };
    expect(data).toBeNull();
  });
});
