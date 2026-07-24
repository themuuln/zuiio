import { describe, expect, it, vi } from "vitest";

describe("executeCompiledQuery", () => {
	it("executes a basic select query", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockResolvedValue({
				data: [{ id: "1", name: "Test" }],
				error: null,
				count: null,
			}),
		};

		const { executeCompiledQuery } = await import("@/read-engine/execute");

		const result = await executeCompiledQuery(
			{
				sourceQuery: { dataset: "customers", alias: "c" },
				params: { select: "id,name" },
			} as never,
			mockSupabase as never,
		);

		expect(result.rows).toHaveLength(1);
		expect(result.rowCount).toBe(1);
		expect(mockSupabase.from).toHaveBeenCalledWith("customers");
		expect(mockSupabase.select).toHaveBeenCalledWith("id,name", {
			count: undefined,
		});
	});

	it("applies filter parameters correctly", async () => {
		const resolveChain = {
			data: [{ id: "1", name: "Active" }],
			error: null,
			count: null,
		};

		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnValue(Promise.resolve(resolveChain)),
		};

		const { executeCompiledQuery } = await import("@/read-engine/execute");

		const result = await executeCompiledQuery(
			{
				sourceQuery: { dataset: "customers" },
				params: { select: "*", status: "eq.active" },
			} as never,
			mockSupabase as never,
		);

		expect(result.rows).toHaveLength(1);
	});

	it("applies order parameters correctly", async () => {
		// Make select and order chainable, then resolve at end
		const resolveChain = {
			data: [{ id: "1" }, { id: "2" }],
			error: null,
			count: null,
		};
		const buildChain = () => {
			const chain: Record<string, unknown> = {};
			chain.from = vi.fn().mockReturnValue(chain);
			chain.select = vi.fn().mockReturnValue(chain);
			chain.order = vi.fn().mockReturnValue(chain);
			chain.range = vi.fn().mockReturnValue(chain);
			chain.eq = vi.fn().mockReturnValue(chain);
			chain.gte = vi.fn().mockReturnValue(chain);
			chain.lte = vi.fn().mockReturnValue(chain);
			chain.then = vi.fn(async (resolve: (v: unknown) => unknown) =>
				resolve(resolveChain),
			);
			return chain;
		};

		const chain = buildChain();

		const { executeCompiledQuery } = await import("@/read-engine/execute");

		await executeCompiledQuery(
			{
				sourceQuery: { dataset: "work_orders" },
				params: { select: "*", order: "created_at.desc" },
			} as never,
			chain as never,
		);

		expect(chain.order).toHaveBeenCalledWith("created_at", {
			ascending: false,
		});
	});

	it("applies limit and offset via range", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			range: vi.fn().mockResolvedValue({
				data: [{ id: "1" }],
				error: null,
				count: null,
			}),
		};

		const { executeCompiledQuery } = await import("@/read-engine/execute");

		await executeCompiledQuery(
			{
				sourceQuery: { dataset: "customers" },
				params: { select: "*", limit: "10", offset: "20" },
			} as never,
			mockSupabase as never,
		);

		expect(mockSupabase.range).toHaveBeenCalledWith(20, 29);
	});

	it("includes count when includeCount is true", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockResolvedValue({
				data: [{ id: "1" }],
				error: null,
				count: 42,
			}),
		};

		const { executeCompiledQuery } = await import("@/read-engine/execute");

		const result = await executeCompiledQuery(
			{
				sourceQuery: { dataset: "customers", includeCount: true },
				params: { select: "*" },
			} as never,
			mockSupabase as never,
		);

		expect(mockSupabase.select).toHaveBeenCalledWith("*", {
			count: "exact",
		});
		expect(result.totalCount).toBe(42);
	});

	it("returns empty rows when no data matches", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockResolvedValue({
				data: [],
				error: null,
				count: 0,
			}),
		};

		const { executeCompiledQuery } = await import("@/read-engine/execute");

		const result = await executeCompiledQuery(
			{
				sourceQuery: { dataset: "customers" },
				params: { select: "*" },
			} as never,
			mockSupabase as never,
		);

		expect(result.rows).toHaveLength(0);
		expect(result.rowCount).toBe(0);
	});

	it("throws on query error", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockResolvedValue({
				data: null,
				error: { message: "relation does not exist", code: "42P01" },
				count: null,
			}),
		};

		const { executeCompiledQuery } = await import("@/read-engine/execute");

		await expect(
			executeCompiledQuery(
				{
					sourceQuery: { dataset: "nonexistent" },
					params: { select: "*" },
				} as never,
				mockSupabase as never,
			),
		).rejects.toThrow("Асуулга амжилтгүй");
	});

	it("handles null data as empty array", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockResolvedValue({
				data: null,
				error: null,
				count: null,
			}),
		};

		const { executeCompiledQuery } = await import("@/read-engine/execute");

		const result = await executeCompiledQuery(
			{
				sourceQuery: { dataset: "customers" },
				params: { select: "*" },
			} as never,
			mockSupabase as never,
		);

		expect(result.rows).toHaveLength(0);
	});

	it("reports execution time", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockResolvedValue({
				data: [{ id: "1" }],
				error: null,
				count: null,
			}),
		};

		const { executeCompiledQuery } = await import("@/read-engine/execute");

		const result = await executeCompiledQuery(
			{
				sourceQuery: { dataset: "customers" },
				params: { select: "*" },
			} as never,
			mockSupabase as never,
		);

		expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
	});
});
