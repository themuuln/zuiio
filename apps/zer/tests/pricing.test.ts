/**
 * Tests for src/lib/pricing.ts — calculateSalePricing.
 *
 * Tests the multi-factor price list resolution logic.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod, resolved } from "./actions-helpers";

// ─── Mocks ────────────────────────────────────────────────────────────

const withDbCaptureSpy = mock.fn(async (_name: string, query: unknown) => {
  if (query instanceof Promise) return query;
  return { data: null, error: null };
});
mockMod("@zuiio/capture", {
  capture: mock.fn(),
  withDbCapture: withDbCaptureSpy,
});

// ─── Mock data builders ───────────────────────────────────────────────

let contactResult: { data: { customer_segment_id: string | null } | null; error: unknown } = resolved(null);
let productsResult: { data: unknown[]; error: unknown } = resolved([]);
let priceListsResult: { data: unknown[]; error: unknown } = resolved([]);
let segmentLinksResult: { data: unknown[]; error: unknown } = resolved([]);
let rulesResult: { data: unknown[]; error: unknown } = resolved([]);

function makeSupabase() {
  return {
    from: mock.fn((table: string) => {
      if (table === "products") {
        return {
          select: mock.fn(() => ({
            in: mock.fn(() => ({
              eq: mock.fn(() => ({
                is: mock.fn(async () => productsResult),
              })),
            })),
          })),
        };
      }
      if (table === "contacts") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(() => ({
                maybeSingle: mock.fn(async () => contactResult),
              })),
            })),
          })),
        };
      }
      if (table === "price_lists") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(() => ({
                or: mock.fn(() => ({
                  or: mock.fn(() => ({
                    order: mock.fn(async () => priceListsResult),
                  })),
                })),
              })),
            })),
          })),
        };
      }
      if (table === "price_list_segments") {
        return {
          select: mock.fn(() => ({
            in: mock.fn(() => ({
              eq: mock.fn(async () => segmentLinksResult),
            })),
          })),
        };
      }
      if (table === "price_list_rules") {
        return {
          select: mock.fn(() => ({
            in: mock.fn(() => ({
              eq: mock.fn(async () => rulesResult),
            })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    rpc: mock.fn(async () => resolved(null)),
  };
}

let calculateSalePricing: (supabase: unknown, orgId: string, contactId: string | null, items: unknown[]) => Promise<unknown[]>;

test.before(async () => {
  const mod = await import("@/lib/pricing");
  calculateSalePricing = mod.calculateSalePricing;
});

test.beforeEach(() => {
  withDbCaptureSpy.mock.resetCalls();
  contactResult = resolved(null);
  productsResult = resolved([]);
  priceListsResult = resolved([]);
  segmentLinksResult = resolved([]);
  rulesResult = resolved([]);
});

test("returns catalog prices when no price lists exist", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: 5000, category_id: "cat-1" },
  ]);
  priceListsResult = resolved([]);

  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    "c-1",
    [{ productId: "p1", quantity: 1 }],
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].finalUnitPrice, 5000);
  assert.equal(result[0].baseUnitPrice, 5000);
  assert.equal(result[0].priceListRuleId, null);
});

test("returns zero for products without price", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: null, category_id: null },
  ]);
  priceListsResult = resolved([]);

  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    null,
    [{ productId: "p1", quantity: 1 }],
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].finalUnitPrice, 0);
});

test("returns catalog prices when rules exist but none match", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: 5000, category_id: "cat-1" },
  ]);
  priceListsResult = resolved([
    { id: "pl-1", priority: 1, valid_from: null, valid_until: null },
  ]);
  rulesResult = resolved([
    { id: "r-1", price_list_id: "pl-1", product_id: "p2", category_id: null, min_quantity: 1, unit_price: 3000, percentage_adjustment: null },
  ]);

  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    null,
    [{ productId: "p1", quantity: 1 }],
  );

  assert.equal(result[0].finalUnitPrice, 5000);
  assert.equal(result[0].priceListRuleId, null);
});

test("applies product-specific fixed price rule", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: 5000, category_id: "cat-1" },
  ]);
  priceListsResult = resolved([
    { id: "pl-1", priority: 1, valid_from: null, valid_until: null },
  ]);
  rulesResult = resolved([
    { id: "r-1", price_list_id: "pl-1", product_id: "p1", category_id: null, min_quantity: 1, unit_price: 3500, percentage_adjustment: null },
  ]);

  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    null,
    [{ productId: "p1", quantity: 1 }],
  );

  assert.equal(result[0].finalUnitPrice, 3500);
  assert.equal(result[0].priceListRuleId, "r-1");
});

test("applies percentage adjustment rule", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: 10000, category_id: "cat-1" },
  ]);
  priceListsResult = resolved([
    { id: "pl-1", priority: 1, valid_from: null, valid_until: null },
  ]);
  rulesResult = resolved([
    { id: "r-1", price_list_id: "pl-1", product_id: "p1", category_id: null, min_quantity: 1, unit_price: null, percentage_adjustment: -10 },
  ]);

  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    null,
    [{ productId: "p1", quantity: 1 }],
  );

  // 10% off 10000 = 9000
  assert.equal(result[0].finalUnitPrice, 9000);
});

test("prefers product-specific rule over category rule", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: 5000, category_id: "cat-1" },
  ]);
  priceListsResult = resolved([
    { id: "pl-1", priority: 1, valid_from: null, valid_until: null },
  ]);
  rulesResult = resolved([
    { id: "r-1", price_list_id: "pl-1", product_id: "p1", category_id: null, min_quantity: 1, unit_price: 3000, percentage_adjustment: null },
    { id: "r-2", price_list_id: "pl-1", product_id: null, category_id: "cat-1", min_quantity: 1, unit_price: 4000, percentage_adjustment: null },
  ]);

  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    null,
    [{ productId: "p1", quantity: 1 }],
  );

  assert.equal(result[0].finalUnitPrice, 3000);
  assert.equal(result[0].priceListRuleId, "r-1");
});

test("prefers higher min_quantity that is satisfied", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: 5000, category_id: "cat-1" },
  ]);
  priceListsResult = resolved([
    { id: "pl-1", priority: 1, valid_from: null, valid_until: null },
  ]);
  rulesResult = resolved([
    { id: "r-1", price_list_id: "pl-1", product_id: "p1", category_id: null, min_quantity: 1, unit_price: 4000, percentage_adjustment: null },
    { id: "r-2", price_list_id: "pl-1", product_id: "p1", category_id: null, min_quantity: 5, unit_price: 3500, percentage_adjustment: null },
  ]);

  // Buying 3 — not enough for min 5 on r-2
  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    null,
    [{ productId: "p1", quantity: 3 }],
  );

  // Should pick r-1 (min 1) since r-2 min 5 not satisfied
  assert.equal(result[0].finalUnitPrice, 4000);
});

test("prefers segment-linked list over default", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: 5000, category_id: "cat-1" },
  ]);
  contactResult = resolved({ customer_segment_id: "seg-1" });
  priceListsResult = resolved([
    { id: "pl-1", priority: 1, valid_from: null, valid_until: null },
    { id: "pl-2", priority: 1, valid_from: null, valid_until: null },
  ]);
  segmentLinksResult = resolved([{ price_list_id: "pl-2" }]);
  rulesResult = resolved([
    { id: "r-1", price_list_id: "pl-1", product_id: "p1", category_id: null, min_quantity: 1, unit_price: 4500, percentage_adjustment: null },
    { id: "r-2", price_list_id: "pl-2", product_id: "p1", category_id: null, min_quantity: 1, unit_price: 4000, percentage_adjustment: null },
  ]);

  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    "c-1",
    [{ productId: "p1", quantity: 1 }],
  );

  // pl-2 is segment-linked, so r-2 wins
  assert.equal(result[0].finalUnitPrice, 4000);
});

test("prefers lower priority number", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: 5000, category_id: "cat-1" },
  ]);
  priceListsResult = resolved([
    { id: "pl-1", priority: 2, valid_from: null, valid_until: null },
    { id: "pl-2", priority: 1, valid_from: null, valid_until: null },
  ]);
  rulesResult = resolved([
    { id: "r-1", price_list_id: "pl-1", product_id: "p1", category_id: null, min_quantity: 1, unit_price: 4500, percentage_adjustment: null },
    { id: "r-2", price_list_id: "pl-2", product_id: "p1", category_id: null, min_quantity: 1, unit_price: 4000, percentage_adjustment: null },
  ]);

  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    null,
    [{ productId: "p1", quantity: 1 }],
  );

  // pl-2 has lower priority (1 < 2), so r-2 should win
  assert.equal(result[0].finalUnitPrice, 4000);
});

test("prefers fixed price over percentage adjustment", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: 10000, category_id: "cat-1" },
  ]);
  priceListsResult = resolved([
    { id: "pl-1", priority: 1, valid_from: null, valid_until: null },
  ]);
  rulesResult = resolved([
    { id: "r-1", price_list_id: "pl-1", product_id: "p1", category_id: null, min_quantity: 1, unit_price: null, percentage_adjustment: -20 },
    { id: "r-2", price_list_id: "pl-1", product_id: "p1", category_id: null, min_quantity: 1, unit_price: 7000, percentage_adjustment: null },
  ]);

  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    null,
    [{ productId: "p1", quantity: 1 }],
  );

  // Fixed price (7000) should win over percentage (-20% = 8000)
  assert.equal(result[0].finalUnitPrice, 7000);
});

test("handles contact without segment", async () => {
  productsResult = resolved([
    { id: "p1", sale_price: 5000, category_id: null },
  ]);
  contactResult = resolved({ customer_segment_id: null });
  priceListsResult = resolved([
    { id: "pl-1", priority: 1, valid_from: null, valid_until: null },
  ]);
  rulesResult = resolved([
    { id: "r-1", price_list_id: "pl-1", product_id: "p1", category_id: null, min_quantity: 1, unit_price: 3500, percentage_adjustment: null },
  ]);

  const result = await calculateSalePricing(
    makeSupabase(),
    "org-123",
    "c-1",
    [{ productId: "p1", quantity: 1 }],
  );

  assert.equal(result[0].finalUnitPrice, 3500);
});
