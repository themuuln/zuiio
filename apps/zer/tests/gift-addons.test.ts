/**
 * Tests for src/lib/gift-addons.ts — resolveGiftOption, addGiftToSale, getSaleAddons.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod, resolved } from "./actions-helpers";

// ─── Mocks ────────────────────────────────────────────────────────────

const captureSpy = mock.fn();
mockMod("@zuiio/capture", {
  capture: captureSpy,
  withDbCapture: mock.fn(async (_name, q) => q),
});
mockMod("server-only", {});

let giftOptionRow: Record<string, unknown> | null = {
  id: "gift-1",
  organization_id: "org-123",
  name: "Бэлэг савлагаа",
  price: 2000,
  is_active: true,
  description: null,
  created_at: "2025-01-01",
};
let saleInsertResult: { data: unknown; error: unknown } = resolved({
  id: "addon-1",
  gift_option_id: "gift-1",
  sale_id: "sale-1",
  price: 2000,
});
let addonsQueryResult: { data: unknown; error: unknown } = resolved([]);

function makeSupabase() {
  return {
    from: mock.fn((table: string) => {
      if (table === "gift_options") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(async () => resolved(giftOptionRow)),
                })),
              })),
            })),
          })),
        };
      }
      if (table === "sale_addons") {
        return {
          insert: mock.fn(async () => ({
            select: mock.fn(() => ({
              single: mock.fn(async () => saleInsertResult),
            })),
          })),
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              order: mock.fn(async () => addonsQueryResult),
            })),
          })),
        };
      }
      return {
        select: mock.fn(() => ({
          eq: mock.fn(() => ({ single: mock.fn(async () => resolved(null)) })),
        })),
      };
    }),
    rpc: mock.fn(() => resolved(null)),
  };
}

let resolveGiftOption: (
  ...args: unknown[]
) => Promise<{ giftOption: unknown; error?: string }>;
let _addGiftToSale: (
  ...args: unknown[]
) => Promise<{ addon: unknown; error?: string }>;
let getSaleAddons: (
  ...args: unknown[]
) => Promise<{ addons: unknown[]; error?: string }>;

test.before(async () => {
  const mod = await import("@/lib/gift-addons");
  resolveGiftOption = mod.resolveGiftOption;
  _addGiftToSale = mod.addGiftToSale;
  getSaleAddons = mod.getSaleAddons;
});

test.beforeEach(() => {
  captureSpy.mock.resetCalls();
  giftOptionRow = {
    id: "gift-1",
    organization_id: "org-123",
    name: "Бэлэг савлагаа",
    price: 2000,
    is_active: true,
    description: null,
    created_at: "2025-01-01",
  };
  saleInsertResult = resolved({
    id: "addon-1",
    gift_option_id: "gift-1",
    sale_id: "sale-1",
    price: 2000,
  });
  addonsQueryResult = resolved([]);
});

// ─── resolveGiftOption ────────────────────────────────────────────────

test("resolveGiftOption returns gift option when found and active", async () => {
  const result = await resolveGiftOption(makeSupabase(), "org-123", "gift-1");
  assert.ok(result.giftOption);
  assert.equal((result.giftOption as Record<string, unknown>).id, "gift-1");
  assert.equal(
    (result.giftOption as Record<string, unknown>).name,
    "Бэлэг савлагаа",
  );
  assert.equal((result.giftOption as Record<string, unknown>).price, 2000);
});

test("resolveGiftOption returns error when gift option not found", async () => {
  giftOptionRow = null;
  const result = await resolveGiftOption(
    makeSupabase(),
    "org-123",
    "nonexistent",
  );
  assert.equal(result.giftOption, null);
  assert.ok(result.error);
});

// ─── getSaleAddons ────────────────────────────────────────────────────

test("getSaleAddons returns addons for a sale", async () => {
  addonsQueryResult = resolved([
    { id: "addon-1", gift_option_id: "gift-1", sale_id: "sale-1", price: 2000 },
    { id: "addon-2", gift_option_id: "gift-2", sale_id: "sale-1", price: 3000 },
  ]);

  const result = await getSaleAddons(makeSupabase(), "sale-1");
  assert.equal(result.addons.length, 2);
});

test("getSaleAddons returns empty array when no addons", async () => {
  const result = await getSaleAddons(makeSupabase(), "sale-2");
  assert.equal(result.addons.length, 0);
});

test("getSaleAddons handles error", async () => {
  addonsQueryResult = { data: null, error: new Error("Query failed") };

  const result = await getSaleAddons(makeSupabase(), "sale-1");
  assert.equal(result.addons.length, 0);
  assert.ok(result.error);
});
