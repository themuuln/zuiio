import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ProductCatalog, ReadPlan } from "@/read-engine/types";
import { ReadEngine } from "@/read-engine/index";

const catalog: ProductCatalog = JSON.parse(
	readFileSync(
		resolve(__dirname, "../../../src/read-engine/catalogs/tolom.json"),
		"utf-8",
	),
);

const TENANT_ID = "11111111-1111-1111-1111-111111111111";

interface MockCall {
	op: string;
	field: string;
	val: string;
}

function createMockSupabase(returns: Record<string, unknown>[] = [{ value: 100 }]) {
	const calls: MockCall[] = [];
	const queryBuilder: Record<string, unknown> = {
		select: vi.fn(() => queryBuilder),
		eq: vi.fn((field: string, val: string) => { calls.push({ op: "eq", field, val }); return queryBuilder; }),
		neq: vi.fn((field: string, val: string) => { calls.push({ op: "neq", field, val }); return queryBuilder; }),
		gt: vi.fn((field: string, val: string) => { calls.push({ op: "gt", field, val }); return queryBuilder; }),
		gte: vi.fn((field: string, val: string) => { calls.push({ op: "gte", field, val }); return queryBuilder; }),
		lt: vi.fn((field: string, val: string) => { calls.push({ op: "lt", field, val }); return queryBuilder; }),
		lte: vi.fn((field: string, val: string) => { calls.push({ op: "lte", field, val }); return queryBuilder; }),
		like: vi.fn((field: string, val: string) => { calls.push({ op: "like", field, val }); return queryBuilder; }),
		ilike: vi.fn((field: string, val: string) => { calls.push({ op: "ilike", field, val }); return queryBuilder; }),
		in: vi.fn((field: string, val: string) => { calls.push({ op: "in", field, val }); return queryBuilder; }),
		order: vi.fn(() => queryBuilder),
		range: vi.fn(() => queryBuilder),
	};
	queryBuilder.select = vi.fn(() => queryBuilder);
	// Make the builder awaitable: resolves to the simulated PostgREST response.
	queryBuilder.then = (resolve: (v: unknown) => void) =>
		resolve({ data: returns, error: null, count: returns.length });
	const from = vi.fn(() => queryBuilder);
	const client = {
		from,
		__calls: calls,
		__queryBuilder: queryBuilder,
	};
	return { client, calls, queryBuilder };
}

describe("ReadEngine", () => {
	it("executes valid plan and returns structured result", async () => {
		const mock = createMockSupabase([{ status: "paid", total: 100 }]);
		const engine = new ReadEngine({
			tenantId: TENANT_ID,
			catalog,
			supabaseUrl: "https://example.supabase.co",
			supabaseAnonKey: "anon",
			// @ts-expect-error - inject mock client
			supabase: mock.client,
		});

		const plan: ReadPlan = {
			queries: [
				{
					dataset: "work_orders",
					measures: [{ field: "total_amount", op: "sum", alias: "total" }],
				},
			],
		};

		const result = await engine.execute(plan);
		expect(result.meta.totalQueries).toBe(1);
		expect(result.queries).toHaveLength(1);
		expect(result.queries[0]?.rowCount).toBe(1);
	});

	it("returns validation errors (as warnings) for invalid plan", async () => {
		const engine = new ReadEngine({
			tenantId: TENANT_ID,
			catalog,
			supabaseUrl: "https://example.supabase.co",
			supabaseAnonKey: "anon",
			// @ts-expect-error - inject mock client
			supabase: createMockSupabase().client,
		});

		const plan: ReadPlan = { queries: [{ dataset: "nonexistent" }] };
		const result = await engine.execute(plan);
		expect(result.meta.totalQueries).toBe(0);
		expect(result.meta.warnings.some((w) => w.includes("DATASET_NOT_FOUND") || w.includes("nonexistent"))).toBe(true);
	});

	it("always injects tenant filter into compiled query", async () => {
		const mock = createMockSupabase([{ organization_id: TENANT_ID }]);
		const engine = new ReadEngine({
			tenantId: TENANT_ID,
			catalog,
			supabaseUrl: "https://example.supabase.co",
			supabaseAnonKey: "anon",
			// @ts-expect-error - inject mock client
			supabase: mock.client,
		});

		const plan: ReadPlan = { queries: [{ dataset: "work_orders" }] };
		await engine.execute(plan);
		// The mock records calls; tenant filter is applied as eq(organization_id, TENANT_ID)
		expect(mock.calls.some((c) => c.field === "organization_id" && c.val === TENANT_ID)).toBe(true);
	});

	it("applies derivation when specified", async () => {
		const mock = createMockSupabase([{ value: 100 }, { value: 50 }]);
		// Note: the mock returns same array for all queries; for this test we just check the derived block exists
		const engine = new ReadEngine({
			tenantId: TENANT_ID,
			catalog,
			supabaseUrl: "https://example.supabase.co",
			supabaseAnonKey: "anon",
			// @ts-expect-error - inject mock client
			supabase: mock.client,
		});

		const plan: ReadPlan = {
			queries: [
				{ dataset: "work_orders", measures: [{ field: "total_amount", op: "sum", alias: "value" }] },
				{ dataset: "invoices", measures: [{ field: "total", op: "sum", alias: "value" }] },
			],
			derivation: { type: "compare", targetField: "value" },
		};

		const result = await engine.execute(plan);
		expect(result.derived).toBeDefined();
		expect(result.derived?.type).toBe("compare");
	});
});
