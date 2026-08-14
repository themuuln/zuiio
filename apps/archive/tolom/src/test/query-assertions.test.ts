import { describe, expect, it } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  expectMaxQueries,
  expectNoNPlusOne,
  formatQueryLog,
  monitorQueries,
} from "./query-assertions";

// ── monitorQueries ────────────────────────────────────────────

describe("monitorQueries", () => {
  it("records a single query call", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    db.from("customers").select("*");
    db.from("customers").select("id");

    expect(queries.calls).toHaveLength(2);
    expect(queries.calls[0].table).toBe("customers");
  });

  it("counts queries per table correctly", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    db.from("customers").select("*");
    db.from("customers").select("id");
    db.from("vehicles").select("*");

    expect(queries.count("customers")).toBe(2);
    expect(queries.count("vehicles")).toBe(1);
    expect(queries.tables()).toEqual(
      expect.arrayContaining(["customers", "vehicles"]),
    );
  });

  it("clear() resets the log", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    db.from("customers").select("*");
    expect(queries.calls.length).toBeGreaterThan(0);

    queries.clear();
    expect(queries.calls).toHaveLength(0);
  });

  it("still returns the query builder for chaining", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    // Simulate a realistic service query
    const qb = db.from("parts_catalog").select("*").eq("org_id", "o-1");
    // qb is thenable (like real Supabase)
    expect(qb).toHaveProperty("then");

    expect(queries.count("parts_catalog")).toBe(1);
  });
});

// ── expectMaxQueries ──────────────────────────────────────────

describe("expectMaxQueries", () => {
  it("passes when query count is within limit", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    db.from("customers").select("*");
    db.from("customers").select("id");

    expect(() => expectMaxQueries(queries, "customers", 3)).not.toThrow();
  });

  it("fails when query count exceeds limit", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    db.from("customers").select("*");
    db.from("customers").select("id");
    db.from("customers").select("name");
    db.from("customers").select("email");
    db.from("customers").select("phone");

    expect(() => expectMaxQueries(queries, "customers", 3)).toThrow(
      "N+1 pattern",
    );
  });
});

// ── expectNoNPlusOne ──────────────────────────────────────────

describe("expectNoNPlusOne", () => {
  it("passes with no queries", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    expect(() => expectNoNPlusOne(queries)).not.toThrow();
  });

  it("passes when each table is queried at most 3 times", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    db.from("work_orders").select("*");
    db.from("work_orders").select("id");
    db.from("customers").select("*");
    db.from("vehicles").select("*");

    expect(() => expectNoNPlusOne(queries)).not.toThrow();
  });

  it("fails when a table is queried more than default threshold (3)", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    db.from("work_orders").select("*");
    db.from("order_items").select("*");
    db.from("order_items").select("*");
    db.from("order_items").select("*");
    db.from("order_items").select("*");

    expect(() => expectNoNPlusOne(queries)).toThrow(
      "N+1 query pattern detected",
    );
    expect(() => expectNoNPlusOne(queries)).toThrow("order_items");
  });

  it("respects custom threshold", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    db.from("order_items").select("*");
    db.from("order_items").select("*");
    db.from("order_items").select("*");
    db.from("order_items").select("*");

    expect(() => expectNoNPlusOne(queries, { threshold: 5 })).not.toThrow();
  });

  it("fails with custom threshold when exceeded", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    db.from("order_items").select("*");
    db.from("order_items").select("*");
    db.from("order_items").select("*");
    db.from("order_items").select("*");
    db.from("order_items").select("*");
    db.from("order_items").select("*");

    expect(() => expectNoNPlusOne(queries, { threshold: 5 })).toThrow(
      "N+1 query pattern detected",
    );
  });
});

// ── formatQueryLog ────────────────────────────────────────────

describe("formatQueryLog", () => {
  it("returns a human-readable summary", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    db.from("customers").select("*");
    db.from("vehicles").select("id, plate");

    const log = formatQueryLog(queries);
    expect(log).toContain("Query Log:");
    expect(log).toContain("customers");
    expect(log).toContain("vehicles");
  });
});

// ── Real-world N+1 scenarios ──────────────────────────────────

describe("real-world N+1 scenario detection", () => {
  it("detects N+1 when child data is fetched in a loop", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    // Anti-pattern: 1 parent query + 5 child queries in a loop
    db.from("work_orders").select("*");
    for (let i = 0; i < 5; i++) {
      db.from("work_order_items").select("*");
    }

    expect(queries.count("work_orders")).toBe(1);
    expect(queries.count("work_order_items")).toBe(5);
    expect(() => expectNoNPlusOne(queries)).toThrow("work_order_items");
  });

  it("passes with a single joined query (no separate child queries)", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    // Batched: one from() with join
    db.from("work_orders").select("*, work_order_items(*)");

    expect(queries.count("work_orders")).toBe(1);
    expect(queries.count("work_order_items")).toBe(0);
    expect(() => expectNoNPlusOne(queries)).not.toThrow();
  });

  it("detects N+1 in vehicle owners query pattern", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    // Anti-pattern: query customers once, then vehicle_owners in a loop
    db.from("customers").select("*");
    for (let i = 0; i < 10; i++) {
      db.from("vehicle_owners").select("customer_id");
    }

    expect(() => expectNoNPlusOne(queries)).toThrow("vehicle_owners");
    expect(queries.count("vehicle_owners")).toBeGreaterThan(3);
  });

  it("passes when child data uses batched .in() query", () => {
    const db = createMockSupabaseClient();
    const queries = monitorQueries(db);

    // Correct pattern: 1 parent query + 1 batched child query using .in()
    db.from("customers").select("*");
    db.from("vehicle_owners")
      .select("customer_id", { count: "exact" })
      .in("customer_id", ["c1", "c2", "c3", "c4", "c5"]);

    expect(queries.count("customers")).toBe(1);
    expect(queries.count("vehicle_owners")).toBe(1);
    expect(() => expectNoNPlusOne(queries)).not.toThrow();
  });
});
