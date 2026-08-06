/**
 * Integration tests for Store buyer accounts.
 *
 * Covers: store_accounts own-row RLS, sales.store_account_id linkage,
 * get_my_orders RPC, and buyer-only SELECT on sales (RLS).
 *
 * Requires a running local Supabase stack — do NOT run in CI without it.
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

type TestSupabaseClient = SupabaseClient;

const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54326";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";

type StoreAccountRow = {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
};

type StoreAccountUser = {
  userId: string;
  email: string;
  password: string;
  client: TestSupabaseClient;
};

/**
 * Create a signed-in store buyer: auth user (auto-confirmed) + own
 * store_accounts row inserted through RLS (exercises the insert policy).
 */
async function createStoreAccountUser(
  _admin: TestSupabaseClient,
  opts?: { displayName?: string; phone?: string },
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
    .insert({
      id: userId,
      email,
      display_name: opts?.displayName ?? email.split("@")[0],
      phone: opts?.phone ?? "99112233",
    } as never);
  if (insertError) {
    throw new Error(`store_accounts insert failed: ${insertError.message}`);
  }
  trackCleanup("store_accounts", userId);

  return { userId, email, password, client };
}

/** Admin inserts a sale linked to the given buyer (bypasses RLS). */
async function insertBuyerSale(
  admin: TestSupabaseClient,
  orgId: string,
  branchId: string,
  storeAccountId: string,
  totalAmount = 10000,
): Promise<string> {
  const { data: sale, error } = await admin
    .from("sales")
    .insert({
      organization_id: orgId,
      branch_id: branchId,
      total_amount: totalAmount,
      paid_amount: totalAmount,
      payment_method: "card",
      status: "completed",
      store_account_id: storeAccountId,
    } as never)
    .select()
    .single();
  if (error) throw new Error(`Failed to insert buyer sale: ${error.message}`);
  trackCleanup("sales", sale.id);
  return sale.id;
}

async function insertSaleItem(
  admin: TestSupabaseClient,
  saleId: string,
  productId: string,
) {
  const { error } = await admin.from("sale_items").insert({
    sale_id: saleId,
    product_id: productId,
    quantity: 2,
    unit_price: 5000,
    total_price: 10000,
  });
  if (error) throw new Error(`Failed to insert sale item: ${error.message}`);
}

describe("Store accounts RLS", () => {
  const admin = createAdminClient();

  it("buyer can select/insert own store_accounts row but not others'", async () => {
    const buyerA = await createStoreAccountUser(admin, {
      displayName: "Buyer A",
      phone: "99112233",
    });
    const buyerB = await createStoreAccountUser(admin);

    // Own row is readable.
    const { data: own } = await buyerA.client
      .from("store_accounts" as never)
      .select("id, email, display_name, phone")
      .eq("id", buyerA.userId)
      .maybeSingle();
    expect(own).not.toBeNull();
    const ownRow = own as unknown as StoreAccountRow;
    expect(ownRow.id).toBe(buyerA.userId);
    expect(ownRow.display_name).toBe("Buyer A");
    expect(ownRow.phone).toBe("99112233");

    // Another buyer's row is invisible.
    const { data: other } = await buyerA.client
      .from("store_accounts" as never)
      .select("id")
      .eq("id", buyerB.userId)
      .maybeSingle();
    expect(other).toBeNull();

    // Updating another buyer's row is rejected by RLS: PostgREST filters
    // the row silently (0 rows affected, no error) — assert no mutation
    // actually landed.
    const { error: updateError } = await buyerA.client
      .from("store_accounts" as never)
      .update({ display_name: "hacked" } as never)
      .eq("id", buyerB.userId);
    expect(updateError).toBeNull(); // RLS silently skips, not a hard error
    const { data: buyerBRow } = (await admin
      .from("store_accounts" as never)
      .select("display_name")
      .eq("id", buyerB.userId)
      .single()) as unknown as { data: { display_name: string } | null };
    expect(buyerBRow?.display_name).not.toBe("hacked");
  });

  it("buyer can update own store_accounts row", async () => {
    const buyerA = await createStoreAccountUser(admin);

    const { error } = await buyerA.client
      .from("store_accounts" as never)
      .update({ display_name: "Updated Name" } as never)
      .eq("id", buyerA.userId);
    expect(error).toBeNull();

    const { data: row } = await buyerA.client
      .from("store_accounts" as never)
      .select("display_name")
      .eq("id", buyerA.userId)
      .maybeSingle();
    expect((row as unknown as { display_name: string }).display_name).toBe(
      "Updated Name",
    );
  });
});

describe("get_my_orders RPC", () => {
  const admin = createAdminClient();

  it("returns only the caller's orders with items, newest first", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, {
      currentStock: 50,
    });

    const buyerA = await createStoreAccountUser(admin);
    const buyerB = await createStoreAccountUser(admin);

    const saleA = await insertBuyerSale(
      admin,
      orgId,
      branchId,
      buyerA.userId,
      20000,
    );
    const saleA2 = await insertBuyerSale(
      admin,
      orgId,
      branchId,
      buyerA.userId,
      5000,
    );
    const saleB = await insertBuyerSale(admin, orgId, branchId, buyerB.userId);
    await insertSaleItem(admin, saleA, productId);
    await insertSaleItem(admin, saleA2, productId);
    await insertSaleItem(admin, saleB, productId);

    const result = (await buyerA.client.rpc("get_my_orders" as never)) as {
      data: Array<{
        id: string;
        invoice_number: string | null;
        total_amount: number;
        status: string | null;
        created_at: string | null;
        items: Array<{ product_id: string | null; name: string | null }>;
      }> | null;
      error: { message: string } | null;
    };

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    // Only buyerA's two sales, newest first.
    expect(result.data!.length).toBe(2);
    expect(result.data![0].id).toBe(saleA2);
    expect(result.data![1].id).toBe(saleA);
    expect(result.data![0].total_amount).toBe(5000);
    expect(result.data![0].status).toBe("completed");
    expect(result.data![0].items.length).toBe(1);
    expect(result.data![0].items[0].product_id).toBe(productId);
    // No order belonging to buyerB leaks through.
    expect(result.data!.some((o) => o.id === saleB)).toBe(false);
  });

  it("returns empty list for a buyer with no orders", async () => {
    const buyerA = await createStoreAccountUser(admin);
    const result = (await buyerA.client.rpc("get_my_orders" as never)) as {
      data: unknown[] | null;
      error: { message: string } | null;
    };
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });
});

describe("Sales RLS for buyers", () => {
  const admin = createAdminClient();

  it("buyer SELECT sees only rows linked to their store account", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, {
      currentStock: 10,
    });

    const buyerA = await createStoreAccountUser(admin);
    const buyerB = await createStoreAccountUser(admin);

    const saleA = await insertBuyerSale(admin, orgId, branchId, buyerA.userId);
    const saleB = await insertBuyerSale(admin, orgId, branchId, buyerB.userId);
    await insertSaleItem(admin, saleA, productId);

    const { data: rowsA } = await buyerA.client
      .from("sales")
      .select("id, store_account_id" as never);
    expect(rowsA).not.toBeNull();
    const ids = (rowsA as unknown as Array<{ id: string }>).map((r) => r.id);
    expect(ids).toContain(saleA);
    expect(ids).not.toContain(saleB);
    expect(ids.length).toBe(1);

    // Direct lookup of buyerB's sale by id is also blocked by RLS.
    const { data: foreign } = await buyerA.client
      .from("sales")
      .select("id")
      .eq("id", saleB)
      .maybeSingle();
    expect(foreign).toBeNull();
  });
});
