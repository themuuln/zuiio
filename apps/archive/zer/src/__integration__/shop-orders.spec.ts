/**
 * Integration tests for the PUBLIC buyer checkout RPC `submit_shop_order`.
 *
 * Covers: guest (anon) ordering with server-side pricing + stock decrement,
 * signed-in buyer order linkage (store_account_id + get_my_orders),
 * short-stock rejection, unknown-slug rejection, and cross-buyer isolation.
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
}

/** Org + catalog-enabled profile + default branch + stocked product. */
async function setupStore(admin: ReturnType<typeof createAdminClient>) {
  const { org, orgId } = await createTestOrg(admin);

  const { error: profileError } = await admin
    .from("organization_public_profiles")
    .upsert({
      organization_id: orgId,
      catalog_enabled: true,
      display_name: org.name,
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

  return { org, orgId, productId };
}

/** Signed-in store buyer (auth user + own store_accounts row via RLS). */
async function createStoreBuyer(
  _admin: ReturnType<typeof createAdminClient>,
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

function orderItems(productId: string, quantity: number) {
  return [{ product_id: productId, quantity, variant_id: "" }];
}

/** Track contacts the RPC created so org cleanup can delete them. */
async function trackOrderContact(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  phone: string,
) {
  const { data: contactRows } = (await admin
    .from("contacts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("phone", phone)) as unknown as { data: Array<{ id: string }> };
  for (const c of contactRows ?? []) trackCleanup("contacts", c.id);
}

describe("submit_shop_order (public buyer checkout)", () => {
  const admin = createAdminClient();

  it("guest (anon) order: server-side pricing, pending status, stock decrement", async () => {
    const { org, orgId, productId } = await setupStore(admin);

    const anon = createAnonClient();
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 2),
      p_payment_method: "cash",
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
    } as never);

    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.status).toBe("pending");
    expect(row?.total_amount).toBe(10000); // 2 × sale_price 5000, priced server-side
    trackCleanup("sales", row!.order_id);
    await trackOrderContact(admin, orgId, "99112233");

    const { data: sale } = (await admin
      .from("sales")
      .select(
        "status, total_amount, paid_amount, store_account_id, branch_id, is_online",
      )
      .eq("id", row!.order_id)
      .single()) as unknown as {
      data: {
        status: string;
        total_amount: number;
        paid_amount: number;
        store_account_id: string | null;
        branch_id: string;
        is_online: boolean;
      } | null;
    };
    expect(sale?.status).toBe("pending");
    expect(sale?.total_amount).toBe(10000);
    expect(sale?.paid_amount).toBe(0);
    expect(sale?.store_account_id).toBeNull(); // guest order
    expect(sale?.is_online).toBe(true); // storefront order flag

    const { data: product } = (await admin
      .from("products")
      .select("current_stock")
      .eq("id", productId)
      .single()) as unknown as { data: { current_stock: number } | null };
    expect(product?.current_stock).toBe(18);

    const { data: movements } = (await admin
      .from("stock_movements")
      .select("type, quantity, reference")
      .eq("organization_id", orgId)) as unknown as {
      data: Array<{ type: string; quantity: number; reference: string }>;
    };
    expect(movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "out", quantity: 2 }),
      ]),
    );
  });

  it("signed-in buyer order is linked to their account and appears in get_my_orders", async () => {
    const { org, productId } = await setupStore(admin);
    const buyer = await createStoreBuyer(admin, "Buyer A");

    const { data, error } = await buyer.client.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 1),
      p_payment_method: "card",
      p_contact_name: "Buyer A",
      p_contact_phone: "99112233",
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    trackCleanup("sales", row!.order_id);

    const { data: sale } = (await admin
      .from("sales")
      .select("store_account_id")
      .eq("id", row!.order_id)
      .single()) as unknown as {
      data: { store_account_id: string | null } | null;
    };
    expect(sale?.store_account_id).toBe(buyer.userId);

    const { data: orders } = await buyer.client.rpc("get_my_orders");
    const ids = (orders ?? []).map((o: { id: string }) => o.id);
    expect(ids).toContain(row!.order_id);
  });

  it("rejects short stock and changes nothing", async () => {
    const { org, orgId, productId } = await setupStore(admin);
    const anon = createAnonClient();

    const before = (await admin
      .from("sales")
      .select("id")
      .eq("organization_id", orgId)) as unknown as {
      data: Array<{ id: string }>;
    };

    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 999),
    } as never);
    expect(error).not.toBeNull();
    expect(error?.message ?? "").toMatch(/хүрэлцэхгүй|нөөц/i);
    expect(data).toBeNull();

    const after = (await admin
      .from("sales")
      .select("id")
      .eq("organization_id", orgId)) as unknown as {
      data: Array<{ id: string }>;
    };
    expect(after.data.length).toBe(before.data.length);

    const { data: product } = (await admin
      .from("products")
      .select("current_stock")
      .eq("id", productId)
      .single()) as unknown as { data: { current_stock: number } | null };
    expect(product?.current_stock).toBe(20);
  });

  it("rejects duplicate lines for the same product that oversell stock", async () => {
    const { org, productId } = await setupStore(admin);
    const anon = createAnonClient();

    // Stock is 20; two lines of 15 each would total 30 → must be rejected
    // even though each line alone passes the per-line stock check.
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: [
        { product_id: productId, quantity: 15, variant_id: "" },
        { product_id: productId, quantity: 15, variant_id: "" },
      ],
      p_contact_name: "Бат",
    } as never);
    expect(data).toBeNull();
    expect(error?.message ?? "").toMatch(/хүрэлцэхгүй|нөөц/i);

    const { data: product } = (await admin
      .from("products")
      .select("current_stock")
      .eq("id", productId)
      .single()) as unknown as { data: { current_stock: number } | null };
    expect(product?.current_stock).toBe(20);
  });

  it("rejects an unknown store slug", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: `no-such-store-${Date.now()}`,
      p_items: orderItems("00000000-0000-0000-0000-000000000000", 1),
    } as never);
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("replays the same idempotency key to the same order (no duplicate sale)", async () => {
    const { org, orgId, productId } = await setupStore(admin);
    const anon = createAnonClient();
    const key = `replay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const args = {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 1),
      p_payment_method: "cash",
      p_idempotency_key: key,
    } as never;

    const first = await anon.rpc("submit_shop_order", args);
    const firstRow = Array.isArray(first.data)
      ? (first.data[0] as OrderRow)
      : null;
    expect(first.error).toBeNull();
    expect(firstRow?.order_id).toBeTruthy();
    trackCleanup("sales", firstRow!.order_id);

    // A retry (process death mid-replay) must return the same order.
    const second = await anon.rpc("submit_shop_order", args);
    const secondRow = Array.isArray(second.data)
      ? (second.data[0] as OrderRow)
      : null;
    expect(second.error).toBeNull();
    expect(secondRow?.order_id).toBe(firstRow!.order_id);

    const { data: sales } = (await admin
      .from("sales")
      .select("id")
      .eq("organization_id", orgId)
      .eq("dedupe_key", key)) as unknown as {
      data: Array<{ id: string }>;
    };
    expect(sales).toHaveLength(1);

    // Stock decremented exactly once (20 - 1).
    const { data: product } = (await admin
      .from("products")
      .select("current_stock")
      .eq("id", productId)
      .single()) as unknown as { data: { current_stock: number } | null };
    expect(product?.current_stock).toBe(19);
  });

  it("rate-limits anon orders per contact phone (5 pending/hour)", async () => {
    const { org, orgId, productId } = await setupStore(admin);
    const anon = createAnonClient();
    const phone = `99${String(Date.now()).slice(-6)}`;

    for (let i = 0; i < 5; i++) {
      const { data, error } = await anon.rpc("submit_shop_order", {
        p_org_slug: org.slug,
        p_items: orderItems(productId, 1),
        p_payment_method: "cash",
        p_contact_name: `Buyer ${i}`,
        p_contact_phone: phone,
      } as never);
      expect(error).toBeNull();
      const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
      expect(row?.order_id).toBeTruthy();
      trackCleanup("sales", row!.order_id);
    }

    // 6th order from the same phone is throttled.
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 1),
      p_payment_method: "cash",
      p_contact_name: "Spammer",
      p_contact_phone: phone,
    } as never);
    expect(error).not.toBeNull();
    expect(error?.message ?? "").toMatch(/хэт олон захиалга/i);
    expect(data).toBeNull();

    await trackOrderContact(admin, orgId, phone);
  });

  it("rate-limits anon orders per org (20 pending/hour)", async () => {
    const { org, productId } = await setupStore(admin);
    const anon = createAnonClient();

    // 20 orders × 1 item = exactly the seeded stock; the 21st is throttled
    // BEFORE stock validation, so the stock error never masks the rate limit.
    for (let i = 0; i < 20; i++) {
      const { data, error } = await anon.rpc("submit_shop_order", {
        p_org_slug: org.slug,
        p_items: orderItems(productId, 1),
        p_payment_method: "cash",
      } as never);
      expect(error).toBeNull();
      const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
      expect(row?.order_id).toBeTruthy();
      trackCleanup("sales", row!.order_id);
    }

    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 1),
      p_payment_method: "cash",
    } as never);
    expect(error).not.toBeNull();
    expect(error?.message ?? "").toMatch(/хэт олон захиалга/i);
    expect(data).toBeNull();
  });

  it("buyers cannot see other buyers' orders", async () => {
    const { org, productId } = await setupStore(admin);
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
    trackCleanup("sales", row!.order_id);

    const { data: buyerBOrders } = await buyerB.client.rpc("get_my_orders");
    const ids = (buyerBOrders ?? []).map((o: { id: string }) => o.id);
    expect(ids).not.toContain(row!.order_id);
  });

  it("variant order: prices from product_variants, decrements variant stock", async () => {
    // Regression guard: submit_shop_order decrements variant stock via
    // `UPDATE product_variants`, which fires the sync_product_has_variants
    // trigger. That trigger must run with a public search_path — without it
    // the RPC's empty search_path made `UPDATE products` raise 42P01 and the
    // whole order failed (fix: migration 20260810150000).
    const { org, orgId, productId } = await setupStore(admin);

    const variantId = crypto.randomUUID();
    await runSql(
      `INSERT INTO public.product_variants (id, product_id, sku, sale_price, current_stock, min_stock) VALUES ('${variantId}', '${productId}', 'V-${Date.now()}', 7500, 10, 2);`,
    );
    // Reset has_variants explicitly — the trigger already flipped it.
    await admin
      .from("products")
      .update({ has_variants: true })
      .eq("id", productId);

    const anon = createAnonClient();
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: [{ product_id: productId, quantity: 2, variant_id: variantId }],
      p_payment_method: "cash",
      p_contact_name: "Вариант Захиалагч",
      p_contact_phone: "99881122",
      p_idempotency_key: `variant-${Date.now()}`,
    } as never);

    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    // 2 × variant sale_price 7500, priced server-side from product_variants
    expect(row?.total_amount).toBe(15000);
    trackCleanup("sales", row!.order_id);
    await trackOrderContact(admin, orgId, "99881122");

    const { data: variant } = (await admin
      .from("product_variants")
      .select("current_stock")
      .eq("id", variantId)
      .single()) as unknown as { data: { current_stock: number } | null };
    // 10 - 2 = 8 — the variant stock decrement path (and its trigger) worked
    expect(variant?.current_stock).toBe(8);
  });
});
