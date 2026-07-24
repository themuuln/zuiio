/**
 * Tests for src/lib/pricing.ts — calculateSalePricing
 */
import assert from "node:assert/strict";
import { describe, test, mock } from "node:test";
import { mockMod, resolved } from "./actions-helpers";

import type {
  calculateSalePricing as CalculateSalePricingFn,
  SaleItemInput,
  PricedSaleItem,
} from "@/lib/pricing";

// ─── Mocks ────────────────────────────────────────────────────────────

mockMod("@zuiio/capture", {
  capture: mock.fn(),
  withDbCapture: mock.fn(async (_name: string, query: unknown) => {
    // withDbCapture is a passthrough — just await the thenable chain
    return await query;
  }),
});

mockMod("@zuiio/core", {
  formatInUB: mock.fn((_date: Date, _fmt: string) => "2026-07-22"),
});

// ─── Chain builder ────────────────────────────────────────────────────

/**
 * Build a thenable chain that resolves to `result`.
 * Every chain method returns `self` so `.select().eq().in()...` works.
 * A `.then` method makes the chain awaitable (like a real Supabase query).
 */
function chainResult(result: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {};
  for (const m of [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "in",
    "not",
    "is",
    "or",
    "order",
    "limit",
    "range",
    "textSearch",
    "returns",
    "throwOnError",
  ]) {
    self[m] = mock.fn(() => self);
  }
  self.single = mock.fn(() => resolved(result.data, result.error));
  self.maybeSingle = mock.fn(() => resolved(result.data, result.error));
  self.then = (
    onFulfilled: (v: typeof result) => void,
    onRejected?: (e: unknown) => void,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return self;
}

/**
 * Create a mock Supabase client where `from(table)` pops the next result
 * from the per-table queue on each call.
 */
function makeSupabase(
  tableResults: Record<string, Array<{ data: unknown; error: unknown }>>,
) {
  const counts: Record<string, number> = {};
  return {
    from: mock.fn((table: string) => {
      const results = tableResults[table] || [];
      const idx = counts[table] || 0;
      counts[table] = idx + 1;
      return chainResult(results[idx] || { data: null, error: null });
    }),
  };
}

// ─── Lazy imports (dynamic — mockMod must register before import) ─────

let calculateSalePricing: typeof CalculateSalePricingFn;

test.before(async () => {
  const mod = await import("@/lib/pricing");
  calculateSalePricing = mod.calculateSalePricing;
});

// ─── Tests ────────────────────────────────────────────────────────────

test("empty items returns empty array", async () => {
  const supabase = makeSupabase({
    products: [{ data: [], error: null }],
    price_lists: [{ data: [], error: null }],
  });

  const result = await calculateSalePricing(supabase, "org-1", null, []);

  assert.deepStrictEqual(result, []);
});

test("single item uses product base price when no price lists exist", async () => {
  const supabase = makeSupabase({
    products: [
      {
        data: [
          {
            id: "prod-1",
            sale_price: 5000,
            category_id: "cat-1",
          },
        ],
        error: null,
      },
    ],
    price_lists: [{ data: [], error: null }],
  });

  const result = await calculateSalePricing(supabase, "org-1", null, [
    { productId: "prod-1", quantity: 1 },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].productId, "prod-1");
  assert.equal(result[0].baseUnitPrice, 5000);
  assert.equal(result[0].finalUnitPrice, 5000);
  assert.equal(result[0].priceListRuleId, null);
});

test("item with price list rule applies fixed unit price", async () => {
  const supabase = makeSupabase({
    products: [
      {
        data: [
          {
            id: "prod-1",
            sale_price: 5000,
            category_id: "cat-1",
          },
        ],
        error: null,
      },
    ],
    price_lists: [
      {
        data: [{ id: "list-1", priority: 10, valid_from: null, valid_until: null }],
        error: null,
      },
    ],
    price_list_rules: [
      {
        data: [
          {
            id: "rule-1",
            price_list_id: "list-1",
            product_id: "prod-1",
            category_id: null,
            min_quantity: 1,
            unit_price: 4200,
            percentage_adjustment: null,
          },
        ],
        error: null,
      },
    ],
  });

  const result = await calculateSalePricing(supabase, "org-1", null, [
    { productId: "prod-1", quantity: 1 },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].baseUnitPrice, 5000);
  assert.equal(result[0].finalUnitPrice, 4200);
  assert.equal(result[0].priceListRuleId, "rule-1");
});

test("item with segment-linked price list uses segment price", async () => {
  const supabase = makeSupabase({
    contacts: [
      {
        data: { customer_segment_id: "seg-1" },
        error: null,
      },
    ],
    products: [
      {
        data: [
          {
            id: "prod-1",
            sale_price: 5000,
            category_id: "cat-1",
          },
        ],
        error: null,
      },
    ],
    price_lists: [
      {
        data: [
          { id: "list-seg", priority: 10, valid_from: null, valid_until: null },
          { id: "list-default", priority: 20, valid_from: null, valid_until: null },
        ],
        error: null,
      },
    ],
    price_list_segments: [
      {
        data: [{ price_list_id: "list-seg" }],
        error: null,
      },
    ],
    price_list_rules: [
      {
        data: [
          {
            id: "rule-seg",
            price_list_id: "list-seg",
            product_id: "prod-1",
            category_id: null,
            min_quantity: 1,
            unit_price: 3800,
            percentage_adjustment: null,
          },
          {
            id: "rule-default",
            price_list_id: "list-default",
            product_id: "prod-1",
            category_id: null,
            min_quantity: 1,
            unit_price: 4500,
            percentage_adjustment: null,
          },
        ],
        error: null,
      },
    ],
  });

  const result = await calculateSalePricing(supabase, "org-1", "contact-1", [
    { productId: "prod-1", quantity: 1 },
  ]);

  assert.equal(result.length, 1);
  // Segment-linked rule (rule-seg at 3800) should win over default (rule-default at 4500)
  assert.equal(result[0].baseUnitPrice, 5000);
  assert.equal(result[0].finalUnitPrice, 3800);
  assert.equal(result[0].priceListRuleId, "rule-seg");
});

test("multiple items are priced correctly", async () => {
  const supabase = makeSupabase({
    products: [
      {
        data: [
          { id: "prod-1", sale_price: 5000, category_id: "cat-1" },
          { id: "prod-2", sale_price: 8000, category_id: "cat-2" },
        ],
        error: null,
      },
    ],
    price_lists: [
      {
        data: [{ id: "list-1", priority: 10, valid_from: null, valid_until: null }],
        error: null,
      },
    ],
    price_list_rules: [
      {
        data: [
          {
            id: "rule-1",
            price_list_id: "list-1",
            product_id: "prod-1",
            category_id: null,
            min_quantity: 1,
            unit_price: 4000,
            percentage_adjustment: null,
          },
          {
            id: "rule-2",
            price_list_id: "list-1",
            product_id: "prod-2",
            category_id: null,
            min_quantity: 1,
            unit_price: null,
            percentage_adjustment: -10,
          },
        ],
        error: null,
      },
    ],
  });

  const result = await calculateSalePricing(supabase, "org-1", null, [
    { productId: "prod-1", quantity: 2 },
    { productId: "prod-2", quantity: 1 },
  ]);

  assert.equal(result.length, 2);

  // prod-1: fixed price 4000
  assert.equal(result[0].productId, "prod-1");
  assert.equal(result[0].baseUnitPrice, 5000);
  assert.equal(result[0].finalUnitPrice, 4000);
  assert.equal(result[0].priceListRuleId, "rule-1");

  // prod-2: 10% off 8000 = 7200
  assert.equal(result[1].productId, "prod-2");
  assert.equal(result[1].baseUnitPrice, 8000);
  assert.equal(result[1].finalUnitPrice, 7200);
  assert.equal(result[1].priceListRuleId, "rule-2");
});

test("missing product returns zero base and final price", async () => {
  const supabase = makeSupabase({
    products: [{ data: [], error: null }],
    price_lists: [{ data: [], error: null }],
  });

  const result = await calculateSalePricing(supabase, "org-1", null, [
    { productId: "nonexistent", quantity: 5 },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].productId, "nonexistent");
  assert.equal(result[0].baseUnitPrice, 0);
  assert.equal(result[0].finalUnitPrice, 0);
  assert.equal(result[0].priceListRuleId, null);
});

test("quantity-based pricing: higher quantity gets better price", async () => {
  const baseResults = {
    products: [
      {
        data: [{ id: "prod-1", sale_price: 10000, category_id: "cat-1" }],
        error: null,
      },
    ],
    price_lists: [
      {
        data: [{ id: "list-1", priority: 10, valid_from: null, valid_until: null }],
        error: null,
      },
    ],
    price_list_rules: [
      {
        data: [
          {
            id: "rule-low",
            price_list_id: "list-1",
            product_id: "prod-1",
            category_id: null,
            min_quantity: 1,
            unit_price: 9500,
            percentage_adjustment: null,
          },
          {
            id: "rule-high",
            price_list_id: "list-1",
            product_id: "prod-1",
            category_id: null,
            min_quantity: 10,
            unit_price: 8000,
            percentage_adjustment: null,
          },
        ],
        error: null,
      },
    ],
  };

  // qty=5 → only rule-low satisfied (min_qty 1) → price 9500
  const lowQtyResult = await calculateSalePricing(
    makeSupabase(baseResults),
    "org-1",
    null,
    [{ productId: "prod-1", quantity: 5 }],
  );
  assert.equal(lowQtyResult[0].finalUnitPrice, 9500);
  assert.equal(lowQtyResult[0].priceListRuleId, "rule-low");

  // qty=15 → both satisfied, rule-high has higher min_quantity → price 8000
  const highQtyResult = await calculateSalePricing(
    makeSupabase(baseResults),
    "org-1",
    null,
    [{ productId: "prod-1", quantity: 15 }],
  );
  assert.equal(highQtyResult[0].finalUnitPrice, 8000);
  assert.equal(highQtyResult[0].priceListRuleId, "rule-high");
});

test("category rule applies when no product-specific rule exists", async () => {
  const supabase = makeSupabase({
    products: [
      {
        data: [
          { id: "prod-1", sale_price: 5000, category_id: "cat-1" },
        ],
        error: null,
      },
    ],
    price_lists: [
      {
        data: [{ id: "list-1", priority: 10, valid_from: null, valid_until: null }],
        error: null,
      },
    ],
    price_list_rules: [
      {
        data: [
          {
            id: "rule-cat",
            price_list_id: "list-1",
            product_id: null,
            category_id: "cat-1",
            min_quantity: 1,
            unit_price: null,
            percentage_adjustment: -5,
          },
        ],
        error: null,
      },
    ],
  });

  const result = await calculateSalePricing(supabase, "org-1", null, [
    { productId: "prod-1", quantity: 1 },
  ]);

  // 5% off 5000 = 4750
  assert.equal(result[0].baseUnitPrice, 5000);
  assert.equal(result[0].finalUnitPrice, 4750);
  assert.equal(result[0].priceListRuleId, "rule-cat");
});

test("percentage adjustment rounds to nearest integer", async () => {
  const supabase = makeSupabase({
    products: [
      {
        data: [
          { id: "prod-1", sale_price: 3333, category_id: "cat-1" },
        ],
        error: null,
      },
    ],
    price_lists: [
      {
        data: [{ id: "list-1", priority: 10, valid_from: null, valid_until: null }],
        error: null,
      },
    ],
    price_list_rules: [
      {
        data: [
          {
            id: "rule-pct",
            price_list_id: "list-1",
            product_id: "prod-1",
            category_id: null,
            min_quantity: 1,
            unit_price: null,
            percentage_adjustment: -15,
          },
        ],
        error: null,
      },
    ],
  });

  const result = await calculateSalePricing(supabase, "org-1", null, [
    { productId: "prod-1", quantity: 1 },
  ]);

  // 3333 * 0.85 = 2833.05 → Math.round → 2833
  assert.equal(result[0].finalUnitPrice, 2833);
});
