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
      .select("status, total_amount, paid_amount, store_account_id, branch_id")
      .eq("id", row!.order_id)
      .single()) as unknown as {
      data: {
        status: string;
        total_amount: number;
        paid_amount: number;
        store_account_id: string | null;
        branch_id: string;
      } | null;
    };
    expect(sale?.status).toBe("pending");
    expect(sale?.total_amount).toBe(10000);
    expect(sale?.paid_amount).toBe(0);
    expect(sale?.store_account_id).toBeNull(); // guest order

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
});
