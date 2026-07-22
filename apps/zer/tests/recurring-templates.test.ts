/**
 * Tests for src/lib/recurring-templates.ts — processRecurringTemplates, pauseRecurringTemplate.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod, resolved } from "./actions-helpers";

// ─── Mocks ────────────────────────────────────────────────────────────

const captureSpy = mock.fn();
const withDbCaptureSpy = mock.fn(async (_name: string, query: unknown) => {
  if (query instanceof Promise) return query;
  return { data: null, error: null };
});
mockMod("@zuiio/capture", {
  capture: captureSpy,
  withDbCapture: withDbCaptureSpy,
});

// Mock pricing
mockMod("@/lib/pricing", {
  calculateSalePricing: mock.fn(async () => [
    { productId: "p1", finalUnitPrice: 5000, quantity: 2 },
  ]),
});

// ─── Test data ────────────────────────────────────────────────────────

let templatesResult: { data: unknown; error: unknown } = resolved([]);
let itemsResult: { data: unknown; error: unknown } = resolved([]);
let contactResult: { data: unknown; error: unknown } = resolved(null);
let updateResult: { data: unknown; error: unknown } = resolved(null);

function makeSupabase() {
  const chain: Record<string, ReturnType<typeof mock.fn>> = {};
  chain.select = mock.fn(() => chain);
  chain.eq = mock.fn(() => chain);
  chain.not = mock.fn(() => chain);
  chain.order = mock.fn(() => chain);
  chain.maybeSingle = mock.fn(async () => contactResult);

  // Terminal method — lte returns the actual data
  chain.lte = mock.fn(async () => templatesResult);

  return {
    from: mock.fn((table: string) => {
      // For updates, return a simpler chain
      if (table === "order_templates") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              not: mock.fn(() => ({
                lte: mock.fn(async () => templatesResult),
              })),
            })),
          })),
          update: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(async () => updateResult),
            })),
          })),
        };
      }
      if (table === "order_template_items") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(async () => itemsResult),
            })),
          })),
        };
      }
      if (table === "contacts") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              maybeSingle: mock.fn(async () => contactResult),
            })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    rpc: mock.fn(async () => resolved(null)),
  };
}

let processRecurringTemplates: (
  supabase: unknown,
) => Promise<{ processed: number; drafts: unknown[] }>;
let pauseRecurringTemplate: (
  supabase: unknown,
  templateId: string,
  orgId: string,
) => Promise<{ success: boolean; error?: string }>;

test.before(async () => {
  const mod = await import("@/lib/recurring-templates");
  processRecurringTemplates = mod.processRecurringTemplates;
  pauseRecurringTemplate = mod.pauseRecurringTemplate;
});

test.beforeEach(() => {
  captureSpy.mock.resetCalls();
  withDbCaptureSpy.mock.resetCalls();

  templatesResult = resolved([
    {
      id: "t-1",
      name: "Сарын захиалга",
      contact_id: "c-1",
      organization_id: "org-123",
      schedule_interval_days: 30,
      next_run_date: "2025-01-01",
    },
  ]);

  itemsResult = resolved([
    {
      product_id: "p1",
      variant_id: null,
      quantity: 2,
      products: {
        id: "p1",
        name: "Бүтээгдэхүүн 1",
        current_stock: 10,
        sale_price: 5000,
        category_id: null,
      },
    },
  ]);

  contactResult = resolved({ name: "Харилцагч 1" });
  updateResult = resolved(null);
});

test("processRecurringTemplates processes due templates", async () => {
  const result = await processRecurringTemplates(makeSupabase());
  assert.equal(result.processed, 1);
  assert.equal(result.drafts.length, 1);
});

test("processRecurringTemplates returns 0 when no templates due", async () => {
  templatesResult = resolved([]);
  const result = await processRecurringTemplates(makeSupabase());
  assert.equal(result.processed, 0);
  assert.equal(result.drafts.length, 0);
});

test("processRecurringTemplates returns 0 on query error", async () => {
  templatesResult = { data: null, error: new Error("DB error") };
  const result = await processRecurringTemplates(makeSupabase());
  assert.equal(result.processed, 0);
  assert.equal(result.drafts.length, 0);
});

test("processRecurringTemplates generates draft with correct structure", async () => {
  const result = await processRecurringTemplates(makeSupabase());
  const draft = result.drafts[0] as Record<string, unknown>;
  assert.equal(draft.templateId, "t-1");
  assert.equal(draft.templateName, "Сарын захиалга");
  assert.ok(Array.isArray(draft.items));
  assert.ok(typeof draft.totalAmount === "number");
  assert.ok(typeof draft.generatedAt === "string");
});

test("pauseRecurringTemplate updates template and returns success", async () => {
  const result = await pauseRecurringTemplate(makeSupabase(), "t-1", "org-123");
  assert.equal(result.success, true);
});

test("pauseRecurringTemplate returns error on failure", async () => {
  updateResult = { data: null, error: new Error("Update failed") };
  const result = await pauseRecurringTemplate(makeSupabase(), "t-1", "org-123");
  assert.equal(result.success, false);
  assert.ok(result.error);
});
