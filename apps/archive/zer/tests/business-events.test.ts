import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod } from "./actions-helpers";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type QueryChainMethod = (...args: unknown[]) => QueryChain;

type QueryChain = {
  select: QueryChainMethod;
  eq: QueryChainMethod;
  gte: QueryChainMethod;
  lte: QueryChainMethod;
  is: QueryChainMethod;
  in: QueryChainMethod;
  order: QueryChainMethod;
  single: () => Promise<QueryResult>;
  then: PromiseLike<QueryResult>["then"];
};

type BusinessEventsSupabase = Parameters<
  typeof import("@/lib/business-events").listBusinessEvents
>[0];

const captureMock = mock.fn(() => {});
const withDbCaptureMock = mock.fn(
  async (_name: string, query: PromiseLike<QueryResult>) => await query,
);

// ─── Module mocks ───────────────────────────────────────────────────

mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});
mockMod("server-only", {});

// ─── Chainable Supabase mock ────────────────────────────────────────
// Each from() call pops the next enqueued response for that table.
// Chain methods are thenable so `await` works through withDbCapture.

function makeChain(data: unknown, error: unknown = null): QueryChain {
  const result: QueryResult = { data, error };
  const chain = {} as QueryChain;
  for (const method of [
    "select",
    "eq",
    "gte",
    "lte",
    "is",
    "in",
    "order",
  ] as const) {
    chain[method] = mock.fn((..._args: unknown[]) => makeChain(data, error));
  }
  chain.single = mock.fn(async () => result);
  // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are intentionally thenable.
  Object.defineProperty(chain, "then", {
    value: Promise.resolve(result).then.bind(Promise.resolve(result)),
  });
  return chain;
}

type TableResponse = QueryResult;
let responseQueues: Record<string, TableResponse[]> = {};

function enqueue(table: string, data: unknown, error: unknown = null) {
  if (!responseQueues[table]) responseQueues[table] = [];
  responseQueues[table].push({ data, error });
}

function makeSupabase(): BusinessEventsSupabase {
  return {
    from: mock.fn((table: string) => {
      const queue = responseQueues[table] ?? [];
      const entry = queue.shift();
      return makeChain(entry?.data ?? null, entry?.error ?? null);
    }),
  } as unknown as BusinessEventsSupabase;
}

// ─── Import SUT ─────────────────────────────────────────────────────

let bizEvents: typeof import("@/lib/business-events");

test.before(async () => {
  bizEvents = await import("@/lib/business-events");
});

test.beforeEach(() => {
  captureMock.mock.resetCalls();
  withDbCaptureMock.mock.resetCalls();
  responseQueues = {};
});

// ─── Helpers ────────────────────────────────────────────────────────

function dateInDays(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
}

// ====================================================================
//  listBusinessEvents
// ====================================================================

test("listBusinessEvents returns empty list for no events", async () => {
  const supabase = makeSupabase();
  enqueue("business_events", []);

  const result = await bizEvents.listBusinessEvents(supabase, "org-1");

  assert.deepEqual(result.events, []);
  assert.equal(result.error, undefined);
});

test("listBusinessEvents returns events list", async () => {
  const events = [
    { id: "e1", name: "Spring Sale", start_date: "2025-04-01" },
    { id: "e2", name: "Summer Fest", start_date: "2025-07-01" },
  ];
  const supabase = makeSupabase();
  enqueue("business_events", events);

  const result = await bizEvents.listBusinessEvents(supabase, "org-1");

  assert.equal(result.events.length, 2);
  assert.equal(result.events[0].id, "e1");
  assert.equal(result.events[1].name, "Summer Fest");
  assert.equal(result.error, undefined);
});

// ====================================================================
//  getUpcomingEvents
// ====================================================================

test("getUpcomingEvents returns upcoming events within preparation window", async () => {
  const futureDate = dateInDays(15);
  const upcomingEvents = [
    {
      id: "e1",
      name: "Upcoming Sale",
      start_date: futureDate,
      is_active: true,
      preparation_lead_days: 5,
    },
  ];
  const supabase = makeSupabase();
  enqueue("business_events", upcomingEvents);

  const result = await bizEvents.getUpcomingEvents(supabase, "org-1", 30);

  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].id, "e1");
  assert.equal(result.error, undefined);
});

test("getUpcomingEvents returns empty when none are upcoming", async () => {
  // Event in the past — passes query but fails in-memory filter (start_date < today)
  const pastEvents = [
    {
      id: "e-old",
      name: "Past Event",
      start_date: "2020-01-01",
      is_active: true,
      preparation_lead_days: 5,
    },
  ];
  const supabase = makeSupabase();
  enqueue("business_events", pastEvents);

  const result = await bizEvents.getUpcomingEvents(supabase, "org-1", 30);

  assert.deepEqual(result.events, []);
  assert.equal(result.error, undefined);
});

// ====================================================================
//  checkStockTargets
// ====================================================================

test("checkStockTargets returns empty shortages when stock is sufficient", async () => {
  const supabase = makeSupabase();
  enqueue("business_events", { id: "e1" });
  enqueue("business_event_stock_targets", [
    {
      id: "t1",
      event_id: "e1",
      organization_id: "org-1",
      product_id: "p1",
      category_id: null,
      target_quantity: 10,
      demand_multiplier: null,
    },
  ]);
  enqueue("products", [{ id: "p1", name: "Widget", current_stock: 15 }]);

  const result = await bizEvents.checkStockTargets(supabase, "org-1", "e1");

  assert.deepEqual(result.shortages, []);
  assert.equal(result.error, undefined);
});

test("checkStockTargets reports shortage when stock is below target", async () => {
  const supabase = makeSupabase();
  enqueue("business_events", { id: "e1" });
  // demand_multiplier 1.5 × target_quantity 10 = adjustedTarget 15
  enqueue("business_event_stock_targets", [
    {
      id: "t1",
      event_id: "e1",
      organization_id: "org-1",
      product_id: "p1",
      category_id: null,
      target_quantity: 10,
      demand_multiplier: 1.5,
    },
  ]);
  enqueue("products", [{ id: "p1", name: "Widget", current_stock: 8 }]);

  const result = await bizEvents.checkStockTargets(supabase, "org-1", "e1");

  assert.equal(result.shortages.length, 1);
  const s = result.shortages[0];
  assert.equal(s.targetId, "t1");
  assert.equal(s.productName, "Widget");
  assert.equal(s.categoryName, null);
  assert.equal(s.targetQuantity, 10);
  assert.equal(s.adjustedTarget, 15);
  assert.equal(s.currentStock, 8);
  assert.equal(s.shortage, 7);
  assert.equal(result.error, undefined);
});

test("checkStockTargets handles event query error", async () => {
  const supabase = makeSupabase();
  enqueue("business_events", null, { message: "db error" });

  const result = await bizEvents.checkStockTargets(supabase, "org-1", "e1");

  assert.deepEqual(result.shortages, []);
  assert.equal(result.error, "Үйл явдал олдсонгүй.");
});

test("checkStockTargets reports category-level shortage", async () => {
  const supabase = makeSupabase();
  enqueue("business_events", { id: "e1" });
  enqueue("business_event_stock_targets", [
    {
      id: "t2",
      event_id: "e1",
      organization_id: "org-1",
      product_id: null,
      category_id: "cat1",
      target_quantity: 20,
      demand_multiplier: null,
    },
  ]);
  // Two products in category: total stock = 5 + 3 = 8 < 20
  enqueue("products", [
    { id: "pa", category_id: "cat1", name: "A", current_stock: 5 },
    { id: "pb", category_id: "cat1", name: "B", current_stock: 3 },
  ]);
  enqueue("categories", [{ id: "cat1", name: "Beverages" }]);

  const result = await bizEvents.checkStockTargets(supabase, "org-1", "e1");

  assert.equal(result.shortages.length, 1);
  assert.equal(result.shortages[0].categoryName, "Beverages");
  assert.equal(result.shortages[0].productName, null);
  assert.equal(result.shortages[0].targetQuantity, 20);
  assert.equal(result.shortages[0].adjustedTarget, 20);
  assert.equal(result.shortages[0].currentStock, 8);
  assert.equal(result.shortages[0].shortage, 12);
});
