/**
 * Tests for `settings/organization/actions.ts` — updatePublicProfile with
 * the storefront checkout configuration fields (D3 of the checkout full
 * flow push): delivery fee / free-delivery threshold parsing + validation,
 * delivery/pickup/show_stock toggles, bank/QPay payment instructions.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod } from "./actions-helpers";

function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Mocks: must run before importing the action module (dynamic) ──
mockMod("server-only", {});
mockMod("@zuiio/capture", {
  capture: mock.fn(),
  withDbCapture: mock.fn(async (_name: unknown, q: Promise<unknown>) => q),
});
mockMod("@/lib/revalidate", {
  revalidateEntity: mock.fn(),
});

let currentSupabase: unknown = null;
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () =>
    mockActionCtx({ supabase: currentSupabase }),
  ),
});

function makeSupabase() {
  let lastUpsert: Record<string, unknown> | null = null;
  const supabase = {
    from: mock.fn((table: string) => {
      if (table === "organization_public_profiles") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              maybeSingle: mock.fn(async () => resolved(null)),
            })),
          })),
          upsert: mock.fn(async (payload: Record<string, unknown>) => {
            lastUpsert = payload;
            return resolved(null);
          }),
        };
      }
      throw new Error(`unexpected table: ${table}`);
    }),
    get lastUpsert() {
      return lastUpsert;
    },
  };
  return supabase;
}

let updatePublicProfile: (
  prev: { error?: string } | undefined,
  fd: FormData,
) => Promise<{ error?: string } | { success: true }>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/settings/organization/actions");
  updatePublicProfile = mod.updatePublicProfile;
});

test("updatePublicProfile persists the checkout config fields", async () => {
  const supabase = makeSupabase();
  currentSupabase = supabase;

  const result = await updatePublicProfile(
    undefined,
    formData({
      catalog_enabled: "on",
      display_name: "Тест",
      delivery_enabled: "on",
      pickup_enabled: "on",
      show_stock: "on",
      delivery_fee_amount: "5000",
      free_delivery_threshold: "20000",
      payment_bank_name: "Хаан банк",
      payment_bank_account: "5000123456",
      payment_account_name: "Тест ХХК",
      qpay_qr_url: "https://qpay.example/qr.png",
    }),
  );

  assert.deepEqual(result, { success: true });
  assert.equal(supabase.lastUpsert?.delivery_enabled, true);
  assert.equal(supabase.lastUpsert?.pickup_enabled, true);
  assert.equal(supabase.lastUpsert?.show_stock, true);
  assert.equal(supabase.lastUpsert?.delivery_fee_amount, 5000);
  assert.equal(supabase.lastUpsert?.free_delivery_threshold, 20000);
  assert.equal(supabase.lastUpsert?.payment_bank_name, "Хаан банк");
  assert.equal(supabase.lastUpsert?.payment_bank_account, "5000123456");
  assert.equal(supabase.lastUpsert?.payment_account_name, "Тест ХХК");
  assert.equal(supabase.lastUpsert?.qpay_qr_url, "https://qpay.example/qr.png");
});

test("updatePublicProfile rejects a negative delivery fee", async () => {
  const supabase = makeSupabase();
  currentSupabase = supabase;

  const result = await updatePublicProfile(
    undefined,
    formData({
      catalog_enabled: "on",
      delivery_fee_amount: "-500",
    }),
  );

  assert.ok("error" in result && result.error !== undefined);
  assert.match(result.error, /0-ээс бага/);
  assert.equal(supabase.lastUpsert, null);
});

test("updatePublicProfile rejects a negative free-delivery threshold", async () => {
  const supabase = makeSupabase();
  currentSupabase = supabase;

  const result = await updatePublicProfile(
    undefined,
    formData({
      catalog_enabled: "on",
      free_delivery_threshold: "-1",
    }),
  );

  assert.ok("error" in result && result.error !== undefined);
  assert.match(result.error, /0-ээс бага/);
});

test("updatePublicProfile defaults toggles off and fees to 0", async () => {
  const supabase = makeSupabase();
  currentSupabase = supabase;

  const result = await updatePublicProfile(
    undefined,
    formData({
      catalog_enabled: "on",
    }),
  );

  assert.deepEqual(result, { success: true });
  assert.equal(supabase.lastUpsert?.delivery_enabled, false);
  assert.equal(supabase.lastUpsert?.pickup_enabled, false);
  assert.equal(supabase.lastUpsert?.show_stock, false);
  assert.equal(supabase.lastUpsert?.delivery_fee_amount, 0);
  assert.equal(supabase.lastUpsert?.free_delivery_threshold, 0);
});
