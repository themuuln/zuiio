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

	it("returns all Tolom tools (12 read + 6 write)", () => {
		const tools = getProductTools("tolom", context);
		const toolNames = tools.map((t) => t.name).sort();
		expect(toolNames).toEqual([
			"createAppointment",
			"createInvoice",
			"createWorkOrder",
			"getActiveWorkOrders",
			"getAppointments",
			"getCustomerHistory",
			"getDailySummary",
			"getExpensesSummary",
			"getFinancialSummary",
			"getInvoiceStatus",
			"getMechanics",
			"getSuppliers",
			"getVehicleAnalytics",
			"getWorkOrderDetails",
			"queryData",
			"recordPayment",
			"updateWorkOrderDetails",
			"updateWorkOrderStatus",
		]);
		expect(tools).toHaveLength(18);
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

	it("getActiveWorkOrders returns work orders data", async () => {
		const { onTable, mockClient } = createMockToolSupabase();

		onTable("work_orders", (chain, respond) => {
			respond([
				{
					id: "wo-1",
					status: "InProgress",
					total: "1200000",
					created_at: "2026-07-01T08:00:00Z",
					bay_number: 3,
					description: "Engine repair",
					customers: { full_name: "Бат-Эрдэнэ", phone: "99111111" },
					vehicles: {
						plate_number: "УБА1234",
						make: "Toyota",
						model: "Camry",
					},
				},
			]);
		});

		const tools = getProductTools("tolom", {
			...context,
			supabase: mockClient,
		});
		const tool = tools.find((t) => t.name === "getActiveWorkOrders")!;
		const result = await tool.execute({});

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(1);
	});

	it("getCustomerHistory searches by plate", async () => {
		const { onTable, mockClient } = createMockToolSupabase();

		onTable("vehicles", (chain, respond) => {
			respond([
				{
					customer_id: "cust-1",
					plate_number: "УБА1234",
					make: "Toyota",
					model: "Camry",
					year: 2020,
					total_visits: 5,
					last_visit_at: "2026-06-15T10:00:00Z",
				},
			]);
		});
		onTable("customers", (chain, respond) => {
			respond([
				{
					id: "cust-1",
					full_name: "Бат-Эрдэнэ",
					phone: "99111111",
					total_visits: 5,
					last_visit_at: "2026-06-15T10:00:00Z",
				},
			]);
		});

		const tools = getProductTools("tolom", {
			...context,
			supabase: mockClient,
		});
		const tool = tools.find((t) => t.name === "getCustomerHistory")!;
		const result = await tool.execute({ query: "УБА1234" });

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(1);
	});
	
	it("getCustomerHistory returns not-found for empty input", async () => {
		const { mockClient } = createMockToolSupabase();
		const tools = getProductTools("tolom", {
			...context,
			supabase: mockClient,
		});
		const tool = tools.find((t) => t.name === "getCustomerHistory")!;
		const result = await tool.execute({ query: "" });
		// The webhook-helpers version passes empty string as-is to the DB,
		// which matches all. With empty mock data it returns "not found".
		expect(result).toHaveProperty("message");
		expect(result.message).toBe("Харилцагч олдсонгүй");
	});

	it("getInvoiceStatus returns invoice summary", async () => {
		const { onTable, mockClient } = createMockToolSupabase();

		onTable("invoices", (chain, respond) => {
			respond([
				{ total: "1000000", amount_paid: "1000000", balance_due: "0", status: "paid" },
				{ total: "500000", amount_paid: "200000", balance_due: "300000", status: "partial" },
				{ total: "750000", amount_paid: "0", balance_due: "750000", status: "unpaid" },
			]);
		});

		const tools = getProductTools("tolom", {
			...context,
			supabase: mockClient,
		});
		const tool = tools.find((t) => t.name === "getInvoiceStatus")!;
		const result = await tool.execute({});

		expect(result).not.toHaveProperty("error");
		expect(result).toHaveProperty("totalInvoiced");
		expect(result).toHaveProperty("totalPaid");
		expect(result).toHaveProperty("totalUnpaid");
	});

	it("getExpensesSummary returns expense breakdown", async () => {
		const { onTable, mockClient } = createMockToolSupabase();

		onTable("expenses", (chain, respond) => {
			respond([
				{
					amount: "200000",
					category_id: "cat-1",
					expense_date: "2026-07-01",
					expense_categories: { name: "Сэлбэг" },
				},
				{
					amount: "100000",
					category_id: "cat-2",
					expense_date: "2026-07-02",
					expense_categories: { name: "Цалин" },
				},
			]);
		});

		const tools = getProductTools("tolom", {
			...context,
			supabase: mockClient,
		});
		const tool = tools.find((t) => t.name === "getExpensesSummary")!;
		const result = await tool.execute({});

		expect(result).not.toHaveProperty("error");
		expect(result).toHaveProperty("total");
		expect(result).toHaveProperty("byCategory");
		expect(result).toHaveProperty("expenseCount");
	});

	it("getAppointments returns schedule data", async () => {
		const { onTable, mockClient } = createMockToolSupabase();

		onTable("appointments", (chain, respond) => {
			respond([
				{
					id: "apt-1",
					title: "Oil change",
					scheduled_at: "2026-07-07T14:00:00Z",
					end_at: "2026-07-07T15:00:00Z",
					status: "confirmed",
					notes: "Customer prefers synthetic oil",
					customers: { full_name: "Ганбат", phone: "99222222" },
					vehicles: { plate_number: "УББ5678", make: "Hyundai", model: "Sonata" },
				},
			]);
		});

		const tools = getProductTools("tolom", {
			...context,
			supabase: mockClient,
		});
		const tool = tools.find((t) => t.name === "getAppointments")!;
		const result = await tool.execute({});
		expect(result[0]).toHaveProperty("vehicle");
		expect(result[0]).toHaveProperty("plate");
	});
});

describe("Zer Tools", () => {
	const context: ToolContext = {
		orgId: TEST_ORG_ID,
		userId: "user-1",
		supabase: {} as ReturnType<typeof createMockToolSupabase>["mockClient"],
	};

	it("returns all 5 Zer tools (3 read + 2 write)", () => {
		const tools = getProductTools("zer", context);
		const toolNames = tools.map((t) => t.name).sort();
		expect(toolNames).toEqual([
			"createSale",
			"getPendingSales",
			"getSalesSummary",
			"getTodaySales",
			"recordPayment",
		]);
		expect(tools).toHaveLength(5);
	});

	it("getSalesSummary returns sales data with default 7 days", async () => {
		const { onTable, mockClient } = createMockToolSupabase();

		onTable("sales", (chain, respond) => {
			respond([
				{ total_amount: "500000", paid_amount: "500000" },
				{ total_amount: "300000", paid_amount: "100000" },
				{ total_amount: "200000", paid_amount: null },
			]);
		});

		const tools = getProductTools("zer", {
			...context,
			supabase: mockClient,
		});
		const tool = tools.find((t) => t.name === "getSalesSummary")!;
		const result = await tool.execute({});

		expect(result).not.toHaveProperty("error");
		expect(result).toHaveProperty("period", "Сүүлийн 7 өдөр");
		expect(result).toHaveProperty("totalAmount");
		expect(result).toHaveProperty("totalPaid");
		expect(result).toHaveProperty("saleCount", 3);
	});

	it("getSalesSummary respects custom days parameter", async () => {
		const { onTable, mockClient } = createMockToolSupabase();

		onTable("sales", (chain, respond) => {
			respond([]);
		});

		const tools = getProductTools("zer", {
			...context,
			supabase: mockClient,
		});
		const tool = tools.find((t) => t.name === "getSalesSummary")!;
		const result = await tool.execute({ days: 30 });

		expect(result).toHaveProperty("period", "Сүүлийн 30 өдөр");
	});

	it("getPendingSales returns unpaid sales", async () => {
		const { onTable, mockClient } = createMockToolSupabase();

		onTable("sales", (chain, respond) => {
			respond([
				{
					id: "sale-1",
					sale_date: "2026-07-01",
					total_amount: "500000",
					paid_amount: "100000",
				},
				{
					id: "sale-2",
					sale_date: "2026-07-02",
					total_amount: "300000",
					paid_amount: null,
				},
			]);
		});

		const tools = getProductTools("zer", {
			...context,
			supabase: mockClient,
		});
		const tool = tools.find((t) => t.name === "getPendingSales")!;
		const result = await tool.execute({});

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
		expect(result[0]).toHaveProperty("id");
		expect(result[0]).toHaveProperty("totalAmount");
	});

	it("getTodaySales returns today's summary", async () => {
		const { onTable, mockClient } = createMockToolSupabase();

		onTable("sales", (chain, respond) => {
			respond([
				{ total_amount: "1000000", paid_amount: "800000" },
				{ total_amount: "500000", paid_amount: "500000" },
			]);
		});

		const tools = getProductTools("zer", {
			...context,
			supabase: mockClient,
		});
		const tool = tools.find((t) => t.name === "getTodaySales")!;
		const result = await tool.execute({});

		expect(result).not.toHaveProperty("error");
		expect(result).toHaveProperty("totalAmount");
		expect(result).toHaveProperty("totalPaid");
		expect(result).toHaveProperty("saleCount");
	});
});
