/**
 * N+1 query detection and query assertion utilities for Vitest tests.
 *
 * Use these helpers to verify that service functions don't make N+1 queries
 * (a parent query followed by many child queries in a loop).
 *
 * @example
 * ```ts
 * import { createMockSupabaseClient } from "@/test/mocks/supabase";
 * import { monitorQueries, expectNoNPlusOne } from "@/test/query-assertions";
 *
 * it("avoids N+1 when fetching orders with items", async () => {
 *   const db = createMockSupabaseClient();
 *   const queries = monitorQueries(db);
 *
 *   await getOrdersWithItems(db, "org-1");
 *
 *   // Assert: items table should NOT be queried more than 3 times
 *   expectMaxQueries(queries, "order_items", 3);
 *
 *   // Or use the automatic N+1 detection
 *   expectNoNPlusOne(queries);
 * });
 * ```
 */

import { expect } from "vitest";
import type { MockSupabaseClient } from "./mocks/supabase";

// ── Types ──────────────────────────────────────────────────────

export interface QueryCall {
  /** The table name passed to `.from("table")`. */
  table: string;
}

// ── Query Monitor ──────────────────────────────────────────────

/**
 * Monitors all `.from()` calls made through a mock Supabase client.
 *
 * Counts how many times each table is queried, enabling tests to assert
 * that child tables are not queried in a loop (N+1 anti-pattern).
 *
 * Works by wrapping `client.from` to record every invocation while
 * still delegating to the original mock, so existing test setups
 * (mockReturnValue chains) continue to work.
 *
 * @example
 * ```ts
 * const db = createMockSupabaseClient();
 * const queries = monitorQueries(db);
 *
 * await getCustomers(db, "org-1");
 *
 * expect(queries.count("customers")).toBe(1);
 * expect(queries.count("vehicle_owners")).toBeLessThanOrEqual(1);
 * ```
 */
export interface Queries {
  /** All `.from()` calls recorded so far. */
  readonly calls: readonly QueryCall[];
  /** Clears all recorded calls. */
  clear(): void;
  /** Number of times a specific table was passed to `.from()`. */
  count(table: string): number;
  /** All unique tables that were queried. */
  tables(): string[];
}

export function monitorQueries(client: MockSupabaseClient): Queries {
  const log: QueryCall[] = [];

  // Save the original vi.fn() so existing mock return value chains are preserved.
  // client.from was created as: vi.fn().mockReturnValue(qb)
  const originalFrom = client.from;

  // Replace .from with a wrapper that records the table name and delegates.
  // We use a regular function (not vi.fn) to avoid interference with existing
  // mock expectations on the original from.
  client.from = ((table: string) => {
    log.push({ table });
    return originalFrom(table);
  }) as typeof client.from;

  return {
    get calls(): readonly QueryCall[] {
      return log;
    },
    clear(): void {
      log.length = 0;
    },
    count(table: string): number {
      return log.filter((c) => c.table === table).length;
    },
    tables(): string[] {
      return [...new Set(log.map((c) => c.table))];
    },
  };
}

// ── Assertions ─────────────────────────────────────────────────

/**
 * Asserts that a table was queried at most `max` times.
 *
 * Use this to prevent N+1 patterns where a child table is queried
 * once per parent row instead of being batched with `.in()`.
 *
 * @example
 * expectMaxQueries(queries, "vehicle_owners", 1);
 */
export function expectMaxQueries(
  queries: Queries,
  table: string,
  max: number,
): void {
  const count = queries.count(table);
  expect(
    count,
    `Expected at most ${max} query(ies) on "${table}", got ${count}. ` +
      `This likely indicates an N+1 pattern where a child table is queried ` +
      `in a loop instead of being batched.`,
  ).toBeLessThanOrEqual(max);
}

export interface NPlusOneFinding {
  table: string;
  queryCount: number;
  threshold: number;
}

/**
 * Asserts that no table exhibits an N+1 query pattern.
 *
 * An N+1 pattern is flagged when any single table is queried more than
 * `threshold` times (default: 3) in a single test execution. This
 * catches cases where a developer loops over parent results and queries
 * a child table for each one instead of using a batched `.in()` filter.
 *
 * The threshold is deliberately conservative (3) to catch even subtle
 * N+1 patterns early. Adjust per-test when a higher count is expected.
 *
 * @example
 * expectNoNPlusOne(queries);
 * expectNoNPlusOne(queries, { threshold: 5 });
 */
export function expectNoNPlusOne(
  queries: Queries,
  options?: { threshold?: number },
): void {
  const threshold = options?.threshold ?? 3;
  const findings: NPlusOneFinding[] = [];

  for (const table of queries.tables()) {
    const count = queries.count(table);
    if (count > threshold) {
      findings.push({ table, queryCount: count, threshold });
    }
  }

  if (findings.length > 0) {
    const detail = findings
      .map(
        (f) =>
          `  - "${f.table}" was queried ${f.queryCount} times (threshold: ${f.threshold})`,
      )
      .join("\n");

    expect(
      findings.length,
      `N+1 query pattern detected:\n${detail}\n\n` +
        `This means queries were made in a loop instead of being batched. ` +
        `Use \`.in()\` (Supabase), \`DataLoader\`, or eager-loading to batch them.`,
    ).toBe(0);
  }
}

/**
 * Returns a formatted summary of all `.from()` calls made during a test.
 * Useful for debugging unexpected query patterns.
 *
 * @example
 * console.log(formatQueryLog(queries));
 */
export function formatQueryLog(queries: Queries): string {
  const byTable = new Map<string, number>();
  for (const call of queries.calls) {
    byTable.set(call.table, (byTable.get(call.table) ?? 0) + 1);
  }

  const lines: string[] = ["Query Log:"];
  for (const [table, count] of byTable) {
    lines.push(`  ${table}: ${count} query(ies)`);
  }
  return lines.join("\n");
}
