/**
 * Integration tests for the storefront-gaps backend contract
 * (migration 20260811100000_storefront_gaps.sql).
 *
 * Covers: store_account_addresses own-row RLS, cancel_my_order (restock,
 * owner isolation, status/history, re-cancel rejection), get_public_products
 * price/sort/product_ids params, review stats, promo matching,
 * get_public_product related, get_public_promotions, and
 * estimated_delivery_hours.
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
  createTestCategory,
  createTestOrg,
  createTestProduct,
  runSql,
  trackCleanup,
} from "./helpers";

type TestSupabaseClient = SupabaseClient;

const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54326";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";

interface Storefront {
  org: { id: string; slug: string; name: string };
  orgId: string;
  branchId: string;
}

/** Org + catalog-enabled profile + default branch. */
async function setupStorefront(
  admin: TestSupabaseClient,
  opts?: { estimatedDeliveryHours?: number },
): Promise<Storefront> {
  const { org, orgId } = await createTestOrg(admin);

  const { error: profileError } = await admin
    .from("organization_public_profiles")
    .upsert({
      organization_id: orgId,
      catalog_enabled: true,
      display_name: org.name,
      delivery_enabled: false,
      pickup_enabled: true,
      estimated_delivery_hours: opts?.estimatedDeliveryHours ?? null,
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

  return { org, orgId, branchId };
}

/** Create a public product with a specific price + stock, publish it. */
async function addProduct(
  admin: TestSupabaseClient,
  orgId: string,
  opts: { name: string; price: number; stock?: number; categoryId?: string },
): Promise<string> {
  const { productId } = await createTestProduct(admin, orgId, {
    name: opts.name,
    currentStock: opts.stock ?? 20,
  });
  const { error } = await admin
    .from("products")
    .update({
      sale_price: opts.price,
      is_public: true,
      category_id: opts.categoryId ?? null,
    })
    .eq("id", productId);
  if (error) throw new Error(`Failed to publish product: ${error.message}`);
  return productId;
}

interface StoreAccountUser {
  userId: string;
  client: TestSupabaseClient;
}

/** Signed-in store buyer (auth user + own store_accounts row via RLS). */
async function createStoreBuyer(
  _admin: TestSupabaseClient,
): Promise<StoreAccountUser> {
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

  const client = createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  });

  const { error: insertError } = await client
    .from("store_accounts" as never)
    .insert({ id: userId, email, display_name: email.split("@")[0] } as never);
  if (insertError) {
    throw new Error(`store_accounts insert failed: ${insertError.message}`);
  }
  trackCleanup("store_accounts", userId);

  return { userId, client };
}

/** Buyer places a pickup order for the given product/qty via submit_shop_order. */
async function placeOrder(
  buyer: StoreAccountUser,
  slug: string,
  productId: string,
  quantity: number,
): Promise<string> {
  const { data, error } = (await buyer.client.rpc("submit_shop_order", {
    p_org_slug: slug,
    p_items: [{ product_id: productId, quantity, variant_id: "" }],
    p_payment_method: "cash",
    p_contact_name: "Бат",
    p_contact_phone: "99112233",
  } as never)) as unknown as {
    data: Array<{ order_id: string; status: string }> | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(`submit_shop_order failed: ${error.message}`);
  const orderId = data?.[0]?.order_id;
  if (!orderId) throw new Error("submit_shop_order returned no order");
  trackCleanup("sales", orderId);
  return orderId;
}

async function getProductStock(
  admin: TestSupabaseClient,
  productId: string,
): Promise<number | null> {
  const { data } = (await admin
    .from("products")
    .select("current_stock")
    .eq("id", productId)
    .single()) as unknown as { data: { current_stock: number | null } | null };
  return data?.current_stock ?? null;
}

describe("store_account_addresses RLS", () => {
  const admin = createAdminClient();

  it("buyers manage only their own rows; guests cannot insert", async () => {
    const buyerA = await createStoreBuyer(admin);
    const buyerB = await createStoreBuyer(admin);

    const { error: insertA, data: rowA } = await buyerA.client
      .from("store_account_addresses" as never)
      .insert({
        store_account_id: buyerA.userId,
        label: "Гэр",
        address: "УБ, Баянзүрх дүүрэг, 13-р хороо",
        phone: "99112233",
        is_default: true,
      } as never)
      .select()
      .single();
    expect(insertA).toBeNull();
    expect(rowA).not.toBeNull();
    trackCleanup(
      "store_account_addresses",
      (rowA as unknown as { id: string }).id,
    );

    // Buyer A sees their own row.
    const { data: own } = await buyerA.client
      .from("store_account_addresses" as never)
      .select("id, address")
      .eq("store_account_id", buyerA.userId);
    expect((own as unknown as unknown[]).length).toBe(1);

    // Buyer B cannot see A's rows.
    const { data: other } = await buyerB.client
      .from("store_account_addresses" as never)
      .select("id")
      .eq("store_account_id", buyerA.userId);
    expect((other as unknown as unknown[]).length).toBe(0);

    // B cannot update A's row (RLS silently skips).
    const { error: updateError } = await buyerB.client
      .from("store_account_addresses" as never)
      .update({ label: "hacked" } as never)
      .eq("id", (rowA as unknown as { id: string }).id);
    expect(updateError).toBeNull();
    const { data: afterUpdate } = (await admin
      .from("store_account_addresses")
      .select("label")
      .eq("id", (rowA as unknown as { id: string }).id)
      .single()) as unknown as { data: { label: string } | null };
    expect(afterUpdate?.label).toBe("Гэр");

    // Guest (anon) cannot insert — no store_account_id = auth.uid() row.
    const anon = createAnonClient();
    const { error: guestInsert } = await anon
      .from("store_account_addresses" as never)
      .insert({
        store_account_id: "00000000-0000-0000-0000-000000000000",
        address: "Хаяг",
      } as never);
    expect(guestInsert).not.toBeNull();
  });
});

describe("cancel_my_order", () => {
  const admin = createAdminClient();

  it("restocks, records history, rejects non-owners and re-cancels", async () => {
    const { org, orgId } = await setupStorefront(admin);
    const productId = await addProduct(admin, orgId, {
      name: "Цуцлагдах бараа",
      price: 5000,
      stock: 20,
    });

    const buyerA = await createStoreBuyer(admin);
    const buyerB = await createStoreBuyer(admin);

    // A places an order for 3 units → stock 20 → 17.
    const orderId = await placeOrder(buyerA, org.slug, productId, 3);
    expect(await getProductStock(admin, productId)).toBe(17);

    // Initial history entry was seeded at insert (pending/buyer).
    const { data: saleBefore } = (await admin
      .from("sales")
      .select("status, status_history")
      .eq("id", orderId)
      .single()) as unknown as {
      data: {
        status: string;
        status_history: Array<{ status: string; by: string }>;
      } | null;
    };
    expect(saleBefore?.status).toBe("pending");
    expect(saleBefore?.status_history?.[0]).toMatchObject({
      status: "pending",
      by: "buyer",
    });

    // Buyer B cannot cancel A's order.
    const bCancel = (await buyerB.client.rpc("cancel_my_order", {
      p_slug: org.slug,
      p_order_id: orderId,
    } as never)) as unknown as {
      data: unknown;
      error: { message: string } | null;
    };
    expect(bCancel.data).toBeNull();
    expect(bCancel.error?.message ?? "").toMatch(/олдсонгүй/i);

    // A cancels → cancelled + restocked to 20 + 'in' movement with
    // reference cancel:<sale_id>.
    const cancel = (await buyerA.client.rpc("cancel_my_order", {
      p_slug: org.slug,
      p_order_id: orderId,
    } as never)) as unknown as {
      data: Array<{ order_id: string; status: string }> | null;
      error: { message: string } | null;
    };
    expect(cancel.error).toBeNull();
    expect(cancel.data?.[0]).toEqual({
      order_id: orderId,
      status: "cancelled",
    });

    expect(await getProductStock(admin, productId)).toBe(20);

    const { data: movements } = (await admin
      .from("stock_movements")
      .select("type, quantity, reference, variant_id")
      .eq("product_id", productId)
      .eq("reference", `cancel:${orderId}`)) as unknown as {
      data: Array<{
        type: string;
        quantity: number;
        reference: string;
        variant_id: string | null;
      }>;
    };
    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe("in");
    expect(movements[0].quantity).toBe(3);
    expect(movements[0].variant_id).toBeNull();

    const { data: saleAfter } = (await admin
      .from("sales")
      .select("status, status_history")
      .eq("id", orderId)
      .single()) as unknown as {
      data: {
        status: string;
        status_history: Array<{ status: string; by: string }>;
      } | null;
    };
    expect(saleAfter?.status).toBe("cancelled");
    expect(saleAfter?.status_history).toHaveLength(2);
    expect(saleAfter?.status_history?.[1]).toMatchObject({
      status: "cancelled",
      by: "buyer",
    });

    // Re-cancel is rejected — the order is no longer pending.
    const reCancel = (await buyerA.client.rpc("cancel_my_order", {
      p_slug: org.slug,
      p_order_id: orderId,
    } as never)) as unknown as {
      data: unknown;
      error: { message: string } | null;
    };
    expect(reCancel.data).toBeNull();
    expect(reCancel.error?.message ?? "").toMatch(/цуцлах боломжтой/i);

    // Stock did not double-restock.
    expect(await getProductStock(admin, productId)).toBe(20);
  });

  it("rejects unknown orgs and guest callers", async () => {
    const { org, orgId } = await setupStorefront(admin);
    const productId = await addProduct(admin, orgId, {
      name: "Гостест",
      price: 3000,
      stock: 5,
    });
    const buyer = await createStoreBuyer(admin);
    const orderId = await placeOrder(buyer, org.slug, productId, 1);

    const unknownOrg = (await buyer.client.rpc("cancel_my_order", {
      p_slug: "no-such-org",
      p_order_id: orderId,
    } as never)) as unknown as { error: { message: string } | null };
    expect(unknownOrg.error?.message ?? "").toMatch(/олдсонгүй/i);

    const anon = createAnonClient();
    const guest = (await anon.rpc("cancel_my_order", {
      p_slug: org.slug,
      p_order_id: orderId,
    } as never)) as unknown as { error: { message: string } | null };
    expect(guest.error?.message ?? "").toMatch(/нэвтрэх|олдсонгүй/i);
  });
});

describe("get_public_products filters + stats", () => {
  const admin = createAdminClient();

  async function fetchProducts(slug: string, params: Record<string, unknown>) {
    const { data, error } = (await createAnonClient().rpc(
      "get_public_products",
      { p_slug: slug, ...params } as never,
    )) as unknown as {
      data: {
        products: Array<{
          id: string;
          name: string;
          sale_price: number | null;
          review_count: number;
          review_average: number | null;
          promo: { id: string; title: string; reward_label: string } | null;
        }>;
        total: number;
      } | null;
      error: { message: string } | null;
    };
    expect(error).toBeNull();
    return data;
  }

  it("filters by min/max price, sorts, and restricts to product_ids", async () => {
    const { org, orgId } = await setupStorefront(admin);
    const p1 = await addProduct(admin, orgId, { name: "Алим", price: 3000 });
    const p2 = await addProduct(admin, orgId, { name: "Банана", price: 5000 });
    const p3 = await addProduct(admin, orgId, { name: "Дарс", price: 7000 });
    const p4 = await addProduct(admin, orgId, {
      name: "Өргөст хэмх",
      price: 10000,
    });

    // min/max on the BASE sale_price.
    const ranged = await fetchProducts(org.slug, {
      p_min_price: 4000,
      p_max_price: 7000,
    });
    expect(ranged!.total).toBe(2);
    const rangedIds = ranged!.products.map((p) => p.id).sort();
    expect(rangedIds).toEqual([p2, p3].sort());

    // price_asc / price_desc.
    const asc = await fetchProducts(org.slug, { p_sort: "price_asc" });
    expect(asc!.products.map((p) => p.sale_price)).toEqual([
      3000, 5000, 7000, 10000,
    ]);
    expect(asc!.products[3].id).toBe(p4);
    const desc = await fetchProducts(org.slug, { p_sort: "price_desc" });
    expect(desc!.products.map((p) => p.sale_price)).toEqual([
      10000, 7000, 5000, 3000,
    ]);
    expect(desc!.products[0].id).toBe(p4);

    // invalid sort → default name order (no error).
    const invalid = await fetchProducts(org.slug, { p_sort: "bogus" });
    expect(invalid!.total).toBe(4);

    // product_ids (wishlist fetch).
    const wishlist = await fetchProducts(org.slug, { p_product_ids: [p1, p3] });
    expect(wishlist!.total).toBe(2);
    expect(wishlist!.products.map((p) => p.id).sort()).toEqual([p1, p3].sort());
  });

  it("review_count/average come from approved reviews only", async () => {
    const { org, orgId } = await setupStorefront(admin);
    const productId = await addProduct(admin, orgId, {
      name: "Үнэлгээтэй бараа",
      price: 6000,
    });

    for (const rating of [4, 5]) {
      const { data: review, error } = await admin
        .from("reviews")
        .insert({
          organization_id: orgId,
          product_id: productId,
          customer_name: "Шүүмжлэгч",
          rating,
          comment: "Сайн",
          status: "approved",
        })
        .select("id")
        .single();
      if (error) throw new Error(`Failed to seed review: ${error.message}`);
      trackCleanup("reviews", review.id);
    }
    const { data: pendingReview, error: pendingError } = await admin
      .from("reviews")
      .insert({
        organization_id: orgId,
        product_id: productId,
        customer_name: "Хүлээгдэж буй",
        rating: 1,
        comment: "Хараахан батлаагүй",
        status: "pending",
      })
      .select("id")
      .single();
    if (pendingError) throw new Error(`Failed to seed pending review`);
    trackCleanup("reviews", pendingReview.id);

    const data = await fetchProducts(org.slug, {});
    const product = data!.products.find((p) => p.id === productId);
    expect(product?.review_count).toBe(2);
    expect(product?.review_average).toBe(4.5);
  });

  it("promo field resolves the best matching promotion", async () => {
    const { org, orgId } = await setupStorefront(admin);
    const rewardProduct = await addProduct(admin, orgId, {
      name: "1+1 бэлэг бараа",
      price: 8000,
    });
    const otherProduct = await addProduct(admin, orgId, {
      name: "Промогүй бараа",
      price: 9000,
    });

    const { data: promo, error: promoError } = await admin
      .from("promotions")
      .insert({
        organization_id: orgId,
        name: "1+1 урамшуулал",
        type: "buy_x_get_y",
        is_active: true,
        priority: 10,
        valid_from: new Date(Date.now() - 86_400_000).toISOString(),
      })
      .select("id")
      .single();
    if (promoError)
      throw new Error(`Failed to create promo: ${promoError.message}`);
    trackCleanup("promotions", promo.id);

    const { error: condError } = await admin
      .from("promotion_conditions")
      .insert({
        promotion_id: promo.id,
        condition_type: "min_quantity",
        condition_value: "1",
      });
    if (condError) throw new Error(`Failed to create condition`);

    const { error: rewardError } = await admin
      .from("promotion_rewards")
      .insert({
        promotion_id: promo.id,
        reward_type: "free_product",
        reward_value: 0,
        reward_product_id: rewardProduct,
      });
    if (rewardError) throw new Error(`Failed to create reward`);

    const data = await fetchProducts(org.slug, {});
    const matched = data!.products.find((p) => p.id === rewardProduct);
    expect(matched?.promo).toMatchObject({
      id: promo.id,
      title: "1+1 урамшуулал",
      reward_label: "1+1",
    });
    const unmatched = data!.products.find((p) => p.id === otherProduct);
    expect(unmatched?.promo).toBeNull();
  });
});

describe("get_public_product related", () => {
  const admin = createAdminClient();

  it("returns same-category public products, excluding self", async () => {
    const { org, orgId } = await setupStorefront(admin);
    const catA = await createTestCategory(admin, orgId);
    const catB = await createTestCategory(admin, orgId);

    const a1 = await addProduct(admin, orgId, {
      name: "А1",
      price: 1000,
      categoryId: catA.categoryId,
    });
    const a2 = await addProduct(admin, orgId, {
      name: "А2",
      price: 2000,
      categoryId: catA.categoryId,
    });
    const a3 = await addProduct(admin, orgId, {
      name: "А3",
      price: 3000,
      categoryId: catA.categoryId,
    });
    const a4 = await addProduct(admin, orgId, {
      name: "А4",
      price: 4000,
      categoryId: catA.categoryId,
    });
    const a5 = await addProduct(admin, orgId, {
      name: "А5",
      price: 5000,
      categoryId: catA.categoryId,
    });
    const b1 = await addProduct(admin, orgId, {
      name: "В1",
      price: 6000,
      categoryId: catB.categoryId,
    });

    const { data, error } = (await createAnonClient().rpc(
      "get_public_product",
      { p_slug: org.slug, p_product_id: a1 },
    )) as unknown as {
      data: {
        product: {
          id: string;
          review_count: number;
          review_average: number | null;
          promo: unknown;
          related: Array<{
            id: string;
            name: string;
            sale_price: number | null;
            category_name: string | null;
          }>;
        };
      } | null;
      error: { message: string } | null;
    };
    expect(error).toBeNull();
    const product = data?.product;
    expect(product?.id).toBe(a1);

    // Same category only, self excluded, capped at 4, no cross-category leak.
    const relatedIds = product?.related.map((r) => r.id) ?? [];
    expect(relatedIds).toHaveLength(4);
    expect(relatedIds).not.toContain(a1);
    expect(relatedIds).not.toContain(b1);
    expect(relatedIds.sort()).toEqual([a2, a3, a4, a5].sort());
    expect(product?.related[0]).toHaveProperty(
      "category_name",
      catA.category?.name ?? null,
    );
  });
});

describe("get_public_promotions + estimated_delivery_hours", () => {
  const admin = createAdminClient();

  it("lists active promos ordered by priority and exposes delivery estimate", async () => {
    const { org, orgId } = await setupStorefront(admin, {
      estimatedDeliveryHours: 4,
    });

    const low = await admin
      .from("promotions")
      .insert({
        organization_id: orgId,
        name: "Хямдрал 10%",
        description: "Бүх бараанд",
        type: "threshold_discount",
        is_active: true,
        priority: 1,
        valid_from: new Date(Date.now() - 86_400_000).toISOString(),
      })
      .select("id")
      .single();
    trackCleanup("promotions", low.data!.id);
    await admin.from("promotion_rewards").insert({
      promotion_id: low.data!.id,
      reward_type: "percentage_discount",
      reward_value: 10,
    });

    const high = await admin
      .from("promotions")
      .insert({
        organization_id: orgId,
        name: "Үнэгүй хүргэлт",
        type: "free_shipping",
        is_active: true,
        priority: 5,
        valid_from: new Date(Date.now() - 86_400_000).toISOString(),
      })
      .select("id")
      .single();
    trackCleanup("promotions", high.data!.id);
    await admin.from("promotion_rewards").insert({
      promotion_id: high.data!.id,
      reward_type: "free_shipping",
      reward_value: 0,
    });

    const { data, error } = (await createAnonClient().rpc(
      "get_public_promotions",
      { p_slug: org.slug },
    )) as unknown as {
      data: Array<{
        id: string;
        title: string;
        description: string | null;
        reward_label: string;
        type: string;
        valid_from: string | null;
        valid_until: string | null;
      }> | null;
      error: { message: string } | null;
    };
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    // Highest priority first.
    expect(data![0].id).toBe(high.data!.id);
    expect(data![0].title).toBe("Үнэгүй хүргэлт");
    expect(data![0].reward_label).toBe("Үнэгүй хүргэлт");
    expect(data![1].id).toBe(low.data!.id);
    expect(data![1].reward_label).toBe("Хямдрал");

    // estimated_delivery_hours is publicly readable.
    const { data: profile } = (await createAnonClient()
      .from("organization_public_profiles")
      .select("estimated_delivery_hours")
      .eq("organization_id", orgId)
      .single()) as unknown as {
      data: { estimated_delivery_hours: number | null } | null;
    };
    expect(profile?.estimated_delivery_hours).toBe(4);
  });
});
