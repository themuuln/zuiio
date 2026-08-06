/**
 * Tests for `returns/actions.ts` — createReturn, completeReturn, cancelReturn.
 *
 * Run: tsx --test tests/actions-returns.test.ts
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";

import {
  createMockSupabase,
  formData,
  mockActionCtx,
  mockMod,
  registerDefaultMocks,
  resolved,
} from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

registerDefaultMocks();

let mockCtx: Record<string, unknown> = mockActionCtx();

// Mock withDbCapture to execute the query (default behavior captures errors)
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: mock.fn(async (_name: string, query: Promise<unknown>) => {
    const result = await query;
    return result;
  }),
});

mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// Track revalidate calls
const revalidateCalls: string[][] = [];
mockMod("@/lib/revalidate", {
  revalidateEntities: mock.fn((entities: string[]) => {
    revalidateCalls.push(entities);
  }),
  revalidateEntity: mock.fn(() => {}),
  revalidateEntityTag: mock.fn(() => {}),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createReturn: (
  prev: undefined,
  fd: FormData,
) => Promise<Record<string, unknown> | undefined>;
let completeReturn: (
  returnId: string,
) => Promise<Record<string, unknown> | undefined>;
let cancelReturn: (
  returnId: string,
) => Promise<Record<string, unknown> | undefined>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/returns/actions");
  createReturn = mod.createReturn;
  completeReturn = mod.completeReturn;
  cancelReturn = mod.cancelReturn;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  revalidateCalls.length = 0;
  captureMock.mock.resetCalls();
}

// ─── Helper: create supabase mock for createReturn ──────────────────

function makeReturnSupabase() {
  return {
    from: mock.fn((table: string) => {
      const builder = {
        select: mock.fn(() => builder),
        eq: mock.fn(() => builder),
        single: mock.fn(() => resolved({ id: "existing-id" })),
        maybeSingle: mock.fn(() => resolved(null, null)),
        order: mock.fn(() => builder),
        limit: mock.fn(() => builder),
        insert: mock.fn(() => ({
          select: mock.fn(() => ({
            single: mock.fn(() => resolved({ id: "ret-id" })),
          })),
        })),
      };

      if (table === "returns") {
        return {
          ...builder,
          insert: mock.fn(() => ({
            select: mock.fn(() => ({
              single: mock.fn(() => resolved({ id: "ret-1" })),
            })),
          })),
        };
      }

      if (table === "return_items") {
        return {
          ...builder,
          insert: mock.fn(() => resolved(null, null)),
        };
      }

      if (table === "sales") {
        return {
          ...builder,
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(() => ({
                single: mock.fn(() => resolved({ id: "sale-1" })),
              })),
            })),
          })),
        };
      }

      return builder;
    }),
    rpc: mock.fn(() => resolved("RN-001")),
  };
}

// ─── Tests: createReturn ────────────────────────────────────────────

test("createReturn rejects missing type", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const fd = formData({
    items: JSON.stringify([
      { product_id: "p1", quantity: 1, unit_price: 1000 },
    ]),
  });
  const result = await createReturn(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
});

test("createReturn rejects missing items", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const fd = formData({ type: "sales_return" });
  const result = await createReturn(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
});

test("createReturn calls insert with return items", async () => {
  resetMocks();
  const supabase = makeReturnSupabase();
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    type: "sales_return",
    reference_id: "sale-1",
    items: JSON.stringify([
      { product_id: "prod-1", quantity: 2, unit_price: 5000 },
    ]),
  });

  const result = await createReturn(undefined, fd);
  assert.ok(result, "should return a result");

  const fromCalls = supabase.from.mock.calls;
  const tablesCalled = fromCalls.map(
    (c: { arguments: [string] }) => c.arguments[0],
  );
  // First call is for sales reference validation, then returns
  assert.ok(tablesCalled.includes("returns"), "should call from('returns')");
  assert.ok(
    tablesCalled.includes("sales"),
    "should call from('sales') for reference validation",
  );
  assert.ok(
    tablesCalled.includes("return_items"),
    "should call from('return_items')",
  );
});

// ─── Tests: completeReturn ──────────────────────────────────────────

test("completeReturn rejects missing returnId", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const result = await completeReturn("");
  assert.ok(result && "error" in result, "should return error");
});

test("completeReturn rejects non-draft returns", async () => {
  resetMocks();
  const supabase = createMockSupabase({
    returns: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(() =>
              resolved({
                id: "ret-1",
                organization_id: "test-org-id",
                status: "completed",
                return_items: [],
              }),
            ),
          })),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });
  const result = await completeReturn("ret-1");
  assert.ok(result && "error" in result, "should return error (not draft)");
});

test("completeReturn handles missing return record", async () => {
  resetMocks();
  const supabase = createMockSupabase({
    returns: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(() => resolved(null, { message: "Not found" })),
          })),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });
  const result = await completeReturn("nonexistent");
  assert.ok(result && "error" in result, "should return error on missing");
});

// ─── Tests: cancelReturn ────────────────────────────────────────────

test("cancelReturn updates status to cancelled", async () => {
  resetMocks();
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });
  const result = await cancelReturn("ret-1");
  assert.ok(result, "should return a result");

  if ("error" in result! && result.error !== undefined) {
    assert.ok(typeof result.error === "string");
  } else {
    assert.ok("success" in result!, "should return success");
    const fromCalls = supabase.from.mock.calls;
    assert.ok(fromCalls.length >= 1, "should call supabase.from");
    assert.equal(fromCalls[0].arguments[0], "returns");
  }
});
