import { describe, expect, it, vi } from "vitest";
import { getProductTools } from "@/gateway/webhook-helpers";
import type { ToolContext } from "@/providers/types";
import { TEST_ORG_ID } from "../fixtures/supabase-mock";

/**
 * Helper: create a mock Supabase that returns specific data per query.
 * The webhook-helpers module uses tolomTools/zerTools which query specific tables
 * via the supabase client passed in ToolContext.
 */
function createMockToolSupabase() {
	// Default mock: most queries return empty arrays
	const chainDefaults = () => {
		const chain: Record<string, unknown> = {
			select: vi.fn(() => chain),
			from: vi.fn(() => chain),
			insert: vi.fn(() => chain),
			update: vi.fn(() => chain),
			upsert: vi.fn(() => chain),
			delete: vi.fn(() => chain),
			eq: vi.fn(() => chain),
			neq: vi.fn(() => chain),
			in: vi.fn(() => chain),
			not: vi.fn(() => chain),
			or: vi.fn(() => chain),
			order: vi.fn(() => chain),
			limit: vi.fn(() => chain),
			range: vi.fn(() => chain),
			ilike: vi.fn(() => chain),
			gte: vi.fn(() => chain),
			lte: vi.fn(() => chain),
			is: vi.fn(() => chain),
			single: vi.fn(() =>
				Promise.resolve({ data: null, error: null }),
			),
			maybeSingle: vi.fn(() =>
				Promise.resolve({ data: null, error: null }),
			),
			then: vi.fn((resolve: (v: unknown) => unknown) =>
				resolve({ data: [], error: null }),
			),
		};
		return chain;
	};

	// Allow per-table overrides
	const tableHandlers = new Map<
		string,
		(chain: ReturnType<typeof chainDefaults>) => void
	>();

	const fromMock = vi.fn((table: string) => {
		const chain = chainDefaults();
		const handler = tableHandlers.get(table);
		if (handler) handler(chain);
		return chain;
	});

	const mockClient = {
		from: fromMock,
		rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
		// Make the whole client thenable (for `await client.from(...)`)
		then: vi.fn((resolve: (v: unknown) => unknown) => resolve({ data: [], error: null })),
	};

	return {
		mockClient,
		/**
		 * Register a handler for a specific table to set up mock data responses.
		 */
		onTable: (
			table: string,
			setup: (
				chain: ReturnType<typeof chainDefaults>,
				buildResponse: (data: unknown, error?: unknown) => void,
			) => void,
		) => {
			tableHandlers.set(table, (chain) => {
				setup(chain, (data, error = null) => {
					// Replace .then to resolve with our specific data
					chain.then = vi.fn(
						(resolve: (v: { data: unknown; error: unknown }) => unknown) =>
							resolve({ data, error }),
					);
				});
			});
		},
	};
}

describe("Tolom Tools", () => {
	const context: ToolContext = {
		orgId: TEST_ORG_ID,
		userId: "user-1",
		supabase: {} as ReturnType<typeof createMockToolSupabase>["mockClient"],
	};

	it("returns Tolom tools with queryData and complex analytics", () => {
		const tools = getProductTools("tolom", context);
		const toolNames = tools.map((t) => t.name).sort();
		expect(toolNames).toEqual([
			"bulkUpdateWorkOrderStatus",
			"createAppointment",
			"createInvoice",
			"createReminder",
			"createWorkOrder",
			"exportData",
			"getDailySummary",
			"getFinancialSummary",
			"getSparePartsSales",
			"getVehicleAnalytics",
			"getWorkOrderDetails",
			"partsLookup",
			"queryData",
			"recordPayment",
			"sendInvoicePdf",
			"updateWorkOrderDetails",
			"updateWorkOrderStatus",
		]);
		expect(tools).toHaveLength(17);
	});

	it("getDailySummary returns summary data", async () => {
		const { onTable, mockClient } = createMockToolSupabase();

		// Mock all 9 parallel Tolom queries with realistic data
		onTable("invoice_payments", (chain, respond) => {
			respond([
				{ amount: "500000" },
				{ amount: "300000" },
			]);
		});
		onTable("payments", (chain, respond) => {
			respond([{ amount: "200000" }]);
		});
		onTable("work_orders", (chain, respond) => {
			// This uses count({ exact: true, head: true })
			// Override count on chain
			chain.count = { count: 5, data: null, error: null };
			respond([]);
		});
		onTable("expenses", (chain, respond) => {
			respond([{ amount: "150000" }, { amount: "80000" }]);
		});
		onTable("customers", (chain, respond) => {
			chain.count = { count: 3, data: null, error: null };
			respond([]);
		});

		const tools = getProductTools("tolom", {
			...context,
			supabase: mockClient,
		});
		const summaryTool = tools.find((t) => t.name === "getDailySummary")!;
		const result = await summaryTool.execute({});

		expect(result).not.toHaveProperty("error");
		expect(typeof result).toBe("object");
	});

});

describe("Zer Tools", () => {
	const context: ToolContext = {
		orgId: TEST_ORG_ID,
		userId: "user-1",
		supabase: {} as ReturnType<typeof createMockToolSupabase>["mockClient"],
	};

	it("returns Zer tools with getSalesByCategory", () => {
		const tools = getProductTools("zer", context);
		const toolNames = tools.map((t) => t.name).sort();
		expect(toolNames).toEqual([
			"createSale",
			"getSalesByCategory",
			"recordPayment",
		]);
		expect(tools).toHaveLength(3);
	});
});
