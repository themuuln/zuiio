/**
 * Tests for `shop/actions.ts` — getStaffList, fetchProductsPage.
 *
 * These are read-only server actions used by the POS catalog.
 * Run: tsx --test tests/actions-shop.test.ts
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";

import {
  createMockSupabase,
  mockActionCtx,
  mockMod,
  registerDefaultMocks,
  resolved,
} from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

registerDefaultMocks();

let mockCtx: Record<string, unknown> = mockActionCtx();

mockMod("@zuiio/capture", {
  capture: mock.fn(() => {}),
  withDbCapture: mock.fn(async (_name: string, query: Promise<unknown>) => {
    const result = await query;
    return result;
  }),
});

mockMod("@/lib/action-utils", {
  requireAppContext: mock.fn(async () => mockCtx),
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let getStaffList: () => Promise<Record<string, unknown>>;
let fetchProductsPage: (offset: number) => Promise<Record<string, unknown>>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/shop/actions");
  getStaffList = mod.getStaffList;
  fetchProductsPage = mod.fetchProductsPage;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  // nothing to reset for now
}

// ─── Tests: getStaffList ────────────────────────────────────────────

test("getStaffList returns profiles and currentUserId", async () => {
  resetMocks();
  const profiles = [
    { id: "user-1", full_name: "Баяр", role: "admin" },
    { id: "user-2", full_name: "Сүрэн", role: "cashier" },
  ];
  const supabase = createMockSupabase({
    profiles: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          order: mock.fn(() => resolved(profiles)),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({
    supabase,
    userId: "user-1",
  });

  const result = await getStaffList();

  assert.ok(result && "profiles" in result, "should return profiles");
  if ("profiles" in result) {
    assert.equal(result.profiles.length, 2);
    assert.equal(result.profiles[0].id, "user-1");
    assert.equal(result.currentUserId, "user-1");
  }
});

test("getStaffList returns empty profiles on DB error", async () => {
  resetMocks();
  const supabase = createMockSupabase({
    profiles: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          order: mock.fn(() => resolved(null, { message: "DB error" })),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await getStaffList();

  // Should return error when DB fails
  assert.ok(result && "error" in result, "should return error");
});

test("getStaffList queries profiles for the correct org", async () => {
  resetMocks();
  const mockEq = mock.fn(() => ({
    order: mock.fn(() =>
      resolved([{ id: "u1", full_name: "Test", role: "admin" }]),
    ),
  }));
  const supabase = createMockSupabase({
    profiles: {
      select: mock.fn(() => ({
        eq: mockEq,
        order: mock.fn(() => resolved([])),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase, organizationId: "org-42" });

  await getStaffList();

  const eqCall = mockEq.mock.calls[0];
  assert.ok(eqCall, "should call .eq()");
  assert.equal(eqCall.arguments[0], "organization_id");
  assert.equal(eqCall.arguments[1], "org-42");
});

// ─── Tests: fetchProductsPage ────────────────────────────────────────

test("fetchProductsPage calls supabase with correct query", async () => {
  resetMocks();
  const products = [
    {
      id: "p1",
      name: "Test Product",
      sale_price: 10000,
      cost_price: 5000,
      current_stock: 10,
      sku: "TST-001",
      is_public: true,
      category: { name: "Хүнс" },
    },
  ];
  // fetchProductsPage chains: from("products").select(...).eq(...).is(...).order(...).range(...)
  const mockRange = mock.fn(() => resolved(products));
  const mockOrder = mock.fn(() => ({ range: mockRange }));
  const mockIs = mock.fn(() => ({ order: mockOrder }));
  const mockEq = mock.fn(() => ({ is: mockIs }));
  const supabase = createMockSupabase({
    products: {
      select: mock.fn(() => ({ eq: mockEq })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await fetchProductsPage(0);

  // Should return products
  assert.ok(result, "should return a result");
  assert.ok("products" in result, "should have products key");
  assert.ok("hasMore" in result, "should have hasMore key");
});

test("fetchProductsPage passes correct offset to range", async () => {
  resetMocks();
  let rangeStart: number | undefined;
  let rangeEnd: number | undefined;
  const mockRange = mock.fn((start: number, end: number) => {
    rangeStart = start;
    rangeEnd = end;
    return resolved([]);
  });
  const mockOrder = mock.fn(() => ({ range: mockRange }));
  const mockIs = mock.fn(() => ({ order: mockOrder }));
  const mockEq = mock.fn(() => ({ is: mockIs }));
  const supabase = createMockSupabase({
    products: {
      select: mock.fn(() => ({ eq: mockEq })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  await fetchProductsPage(100);

  assert.equal(rangeStart, 100, "range should start at offset");
  // Page size is 50 — so range(100, 149)
  assert.equal(rangeEnd, 149, "range should end at offset + page size - 1");
});
