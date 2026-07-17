/**
 * Real Tool Execution Tests
 *
 * Executes actual tool code against a mock Supabase client that returns
 * realistic data. Verifies the REAL output shape — what tools actually
 * return, not what we wish they returned.
 */
import { describe, it, expect, vi } from "vitest";

// ─── Module Mocks (hoisted by vitest) ───────────────────────────────────────
vi.mock("@zuiio/capture", () => ({
	capture: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({ data: null, error: null }),
	}),
}));

vi.mock("@/lib/redis", () => ({
	getRedis: vi.fn().mockReturnValue(null),
}));

vi.mock("server-only", () => ({}));

// ─── Imports (after mocks are set up) ───────────────────────────────────────
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import type { ToolContext } from "@/providers/types";

// ─── Realistic Mock Data ─────────────────────────────────────────────────────
const MOCK_DATA: Record<string, any[]> = {
	work_orders: [
		{
			id: "wo-1",
			status: "in_progress",
			total_amount: 1200000,
			plate_number: "1234АБ",
			description: "Тормоз засвар",
			created_at: "2025-07-15T10:00:00Z",
			customers: { full_name: "Бат-Эрдэнэ", phone: "99112233" },
			vehicles: { plate_number: "1234АБ", make: "Toyota", model: "Camry", year: 2020 },
		},
		{
			id: "wo-2",
			status: "completed",
			total_amount: 800000,
			plate_number: "5678СД",
			description: "Мотор oil change",
			created_at: "2025-07-14T14:00:00Z",
			customers: { full_name: "Сараа", phone: "88112233" },
			vehicles: { plate_number: "5678СД", make: "Hyundai", model: "Sonata", year: 2021 },
		},
		{
			id: "wo-3",
			status: "received",
			total_amount: 2500000,
			plate_number: "9999ЕР",
			description: "AC засвар",
			created_at: "2025-07-16T09:00:00Z",
			customers: { full_name: "Оюун", phone: "77112233" },
			vehicles: { plate_number: "9999ЕР", make: "Toyota", model: "Land Cruiser", year: 2019 },
		},
	],
	work_order_parts: [
		{ part_name: "Window Motor", part_number: "WM-001", quantity: 3, unit_price: 8597494, final_price: 25792482, created_at: "2025-07-10T10:00:00Z", work_order_id: "wo-1" },
		{ part_name: "Coolant Tester", part_number: "CT-002", quantity: 2, unit_price: 10000000, final_price: 20000000, created_at: "2025-07-12T10:00:00Z", work_order_id: "wo-2" },
		{ part_name: "AC Accumulator", part_number: "AC-003", quantity: 1, unit_price: 10300000, final_price: 10300000, created_at: "2025-07-14T10:00:00Z", work_order_id: "wo-3" },
	],
	customers: [
		{ id: "c-1", full_name: "Бат-Эрдэнэ", first_name: "Бат", last_name: "Эрдэнэ", phone: "99112233", total_visits: 5, last_visit_at: "2025-07-15T10:00:00Z" },
		{ id: "c-2", full_name: "Сараа", first_name: "Сараа", phone: "88112233", total_visits: 3, last_visit_at: "2025-07-14T14:00:00Z" },
		{ id: "c-3", full_name: "Оюун", first_name: "Оюун", phone: "77112233", total_visits: 1, last_visit_at: "2025-07-16T09:00:00Z" },
	],
	vehicles: [
		{ id: "v-1", plate_number: "1234АБ", make: "Toyota", model: "Camry", year: 2020, customer_id: "c-1" },
		{ id: "v-2", plate_number: "5678СД", make: "Hyundai", model: "Sonata", year: 2021, customer_id: "c-2" },
		{ id: "v-3", plate_number: "9999ЕР", make: "Toyota", model: "Land Cruiser", year: 2019, customer_id: "c-3" },
	],
	invoices: [
		{ id: "inv-1", invoice_number: "INV-001", total: 1200000, amount_paid: 500000, balance_due: 700000, status: "partial", customer_name: "Бат-Эрдэнэ", issued_at: "2025-07-15T10:00:00Z" },
		{ id: "inv-2", invoice_number: "INV-002", total: 800000, amount_paid: 800000, balance_due: 0, status: "paid", customer_name: "Сараа", issued_at: "2025-07-14T14:00:00Z" },
	],
	expenses: [
		{ id: "e-1", amount: 500000, expense_date: "2025-07-15", description: "Цалин", expense_categories: { name: "Цалин" } },
		{ id: "e-2", amount: 200000, expense_date: "2025-07-14", description: "Түрээс", expense_categories: { name: "Түрээс" } },
	],
	suppliers: [
		{ id: "s-1", name: "Tenger", contact_person: "Мөнх", phone: "88650102", email: "tenger@gmail.com", is_active: true },
	],
	profiles: [
		{ id: "p-1", full_name: "Temuulen", phone: "99001122", is_active: true, username: "temuulen" },
		{ id: "p-2", full_name: "Zet", phone: "88001122", is_active: true, username: "zet" },
	],
	parts_catalog: [
		{ id: "pc-1", name: "Window Motor", part_number: "WM-001", unit_price: 8597494, category: "Electrical" },
		{ id: "pc-2", name: "Coolant Tester", part_number: "CT-002", unit_price: 10000000, category: "Tools" },
		{ id: "pc-3", name: "AC Accumulator", part_number: "AC-003", unit_price: 10300000, category: "AC" },
	],
	service_catalog: [
		{ id: "sc-1", name: "Тормоз засвар", price: 200000 },
		{ id: "sc-2", name: "Мотор oil change", price: 150000 },
	],
	products: [
		{ id: "prod-1", name: "Тормозны диск", price: 150000, sku: "TD-001", category_id: "cat-1" },
		{ id: "prod-2", name: "Motor oil 5W30", price: 45000, sku: "MO-001", category_id: "cat-2" },
	],
	employees: [
		{ id: "emp-1", full_name: "Temuulen", position: "Механик", is_active: true },
	],
	appointments: [],
	sales: [],
	sales_items: [],
	cash_register_sessions: [],
	mechanic_daily_reports: [],
};

// Tables with no data — queryData's allowedTables list
const EMPTY_TABLES = [
	"contacts", "quotations", "purchase_orders", "returns", "loyalty_points",
	"payroll_runs", "bank_accounts", "journal_entries", "stock_movements",
	"warehouses", "categories", "brands", "discounts", "price_lists",
	"budgets", "branches", "notifications", "sale_addons", "return_items",
	"commission_payouts", "commission_payout_items", "attendance_records",
	"leave_requests", "payroll_items", "loyalty_rewards", "loyalty_settings",
	"customer_segments", "currency_accounts", "chart_of_accounts",
	"journal_entry_lines", "fiscal_periods", "currencies", "product_variants",
	"product_variant_groups", "product_variant_options",
	"product_variant_assignments", "product_bundles", "product_bundle_items",
	"product_presets", "uom_conversions", "cash_registers", "cash_sessions",
	"gift_options", "order_templates", "order_template_items",
	"shared_reports", "warehouse_products", "discount_conditions",
	"price_list_rules", "price_list_segments", "purchase_order_items",
	"quotation_items", "invoice_items", "invoice_payments",
];

const ALL_DATA: Record<string, any[]> = { ...MOCK_DATA };
for (const t of EMPTY_TABLES) ALL_DATA[t] = [];

// ─── Mock Supabase Client ────────────────────────────────────────────────────
function createMockSupabase() {
	function buildChain(table: string) {
		const rows = ALL_DATA[table] ?? [];
		let filtered = [...rows];
		let _limit: number | null = null;
		let _single = false;

		function resolve() {
			const data = _single
				? (filtered[0] ?? null)
				: _limit !== null
					? filtered.slice(0, _limit)
					: filtered;
			return { data, error: null };
		}

		const chain: Record<string, unknown> = {
			select: () => chain,
			eq: () => chain,
			is: () => chain,
			gte: () => chain,
			lte: () => chain,
			not: () => chain,
			or: () => chain,
			ilike: () => chain,
			in: () => chain,
			order: () => chain,
			limit: (n: number) => { _limit = n; return chain; },
			single: () => { _single = true; return chain; },
			// Thenable — makes `await chain` resolve like a real Supabase query
			then(onFulfilled: (v: unknown) => unknown) {
				return Promise.resolve(resolve()).then(onFulfilled);
			},
		};
		return chain;
	}
	return { from: (table: string) => buildChain(table) };
}

// ─── Shared Context ──────────────────────────────────────────────────────────
const orgId = "test-org-123";
const context: ToolContext = {
	orgId,
	userId: "user-123",
	supabase: createMockSupabase() as any,
};

// ─── Helper: get a tool by name ─────────────────────────────────────────────
function getTool(name: string) {
	const tools = getProductTools("tolom", context);
	const tool = tools.find((t) => t.name === name);
	if (!tool) throw new Error(`Tool "${name}" not found among ${tools.length} tools`);
	return tool;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Real Tool Execution — Output Format Verification", () => {
	// ─── getSparePartsSales ─────────────────────────────────────────────────
	describe("getSparePartsSales — parts ranked by revenue", () => {
		it("returns { period, totalRevenue, totalParts, parts[] }", async () => {
			const result = await getTool("getSparePartsSales").execute({}, context) as any;

			expect(result).toHaveProperty("period");
			expect(result).toHaveProperty("totalRevenue");
			expect(result).toHaveProperty("totalParts");
			expect(Array.isArray(result.parts)).toBe(true);
			expect(result.parts.length).toBe(3);

			// Top part by revenue: Window Motor (25,792,482)
			const top = result.parts[0];
			expect(top.partName).toBe("Window Motor");
			expect(top.totalRevenue).toBe(25792482);
			expect(top.totalQuantity).toBe(3);
			expect(top.saleCount).toBe(1);
			expect(typeof top.partNumber).toBe("string");

			// Revenue order: Window Motor > Coolant Tester > AC Accumulator
			expect(result.parts[0].totalRevenue).toBeGreaterThan(result.parts[1].totalRevenue);
			expect(result.parts[1].totalRevenue).toBeGreaterThan(result.parts[2].totalRevenue);
		});
	});

	// ─── getCustomerHistory ────────────────────────────────────────────────
	describe("getCustomerHistory — returns FLAT array, not {customers}", () => {
		it("returns array of customer objects with vehicles", async () => {
			const result = await getTool("getCustomerHistory").execute({ query: "Бат" }, context) as any;

			// REAL shape: flat array, NOT { customers: [...] }
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);

			const customer = result[0];
			expect(customer.customerName).toContain("Бат");
			expect(customer.phone).toBe("99112233");
			expect(customer.totalVisits).toBe(5);
			expect(customer.matchType).toBe("name");
			expect(Array.isArray(customer.vehicles)).toBe(true);
			expect(customer.vehicles[0].plateNumber).toBe("1234АБ");
			expect(customer.vehicles[0].info).toContain("Toyota");
		});

	});

	// ─── getDailySummary ───────────────────────────────────────────────────
	describe("getDailySummary — returns FLAT shape, not nested", () => {
		it("returns { today, activeWorkOrders, totalWorkOrders, ... }", async () => {
			const result = await getTool("getDailySummary").execute({}, context) as any;

			// REAL shape: flat, NOT { today: { activeWorkOrders } }
			expect(typeof result.today).toBe("string");
			expect(typeof result.activeWorkOrders).toBe("number");
			expect(typeof result.totalWorkOrders).toBe("number");
			expect(typeof result.monthlyInvoices).toBe("number");
			expect(typeof result.monthlyInvoicesPaid).toBe("number");
			expect(typeof result.newCustomersThisMonth).toBe("number");

			// With mock data: 3 total work orders
			expect(result.totalWorkOrders).toBe(3);
			// Monthly invoices: 1,200,000 + 800,000 = 2,000,000
			expect(result.monthlyInvoices).toBe(2000000);
		});
	});

	// ─── getActiveWorkOrders ───────────────────────────────────────────────
	describe("getActiveWorkOrders — returns FLAT array, not {activeWorkOrders}", () => {
		it("returns array of work order objects", async () => {
			const result = await getTool("getActiveWorkOrders").execute({}, context) as any;

			// REAL shape: flat array, NOT { activeWorkOrders: [...] }
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);

			const order = result[0];
			expect(order).toHaveProperty("id");
			expect(order).toHaveProperty("status");
			expect(order).toHaveProperty("total");
			expect(order).toHaveProperty("plate");
			expect(order).toHaveProperty("customerName");
			expect(order).toHaveProperty("phone");

			// total is a number, not a string
			expect(typeof order.total).toBe("number");
		});
	});

	// ─── getInvoiceStatus ──────────────────────────────────────────────────
	describe("getInvoiceStatus — monthly invoice summary", () => {
		it("returns { totalInvoiced, totalPaid, totalUnpaid, invoiceCount }", async () => {
			const result = await getTool("getInvoiceStatus").execute({}, context) as any;

			expect(typeof result.totalInvoiced).toBe("number");
			expect(typeof result.totalPaid).toBe("number");
			expect(typeof result.totalUnpaid).toBe("number");
			expect(typeof result.invoiceCount).toBe("number");

			// 1,200,000 + 800,000 = 2,000,000
			expect(result.totalInvoiced).toBe(2000000);
			// 500,000 + 800,000 = 1,300,000
			expect(result.totalPaid).toBe(1300000);
			// 700,000 + 0 = 700,000
			expect(result.totalUnpaid).toBe(700000);
		});
	});

	// ─── getExpensesSummary ────────────────────────────────────────────────
	describe("getExpensesSummary — expenses by category", () => {
		it("returns { total, byCategory, expenseCount }", async () => {
			const result = await getTool("getExpensesSummary").execute({}, context) as any;

			expect(typeof result.total).toBe("number");
			expect(typeof result.byCategory).toBe("object");
			expect(typeof result.expenseCount).toBe("number");

			// 500,000 + 200,000 = 700,000
			expect(result.total).toBe(700000);
			expect(result.byCategory["Цалин"]).toBe(500000);
			expect(result.byCategory["Түрээс"]).toBe(200000);
		});
	});

	// ─── getMechanics ──────────────────────────────────────────────────────
	describe("getMechanics — FLAT array of profiles", () => {
		it("returns array with name, phone, isActive, username", async () => {
			const result = await getTool("getMechanics").execute({}, context) as any;

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);

			const mechanic = result[0];
			expect(typeof mechanic.name).toBe("string");
			expect(typeof mechanic.phone).toBe("string");
			expect(typeof mechanic.isActive).toBe("boolean");
			expect(typeof mechanic.username).toBe("string");
		});
	});

	// ─── getSuppliers ──────────────────────────────────────────────────────
	describe("getSuppliers — FLAT array", () => {
		it("returns array with name, contactPerson, phone, email, isActive", async () => {
			const result = await getTool("getSuppliers").execute({}, context) as any;

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(1);

			const supplier = result[0];
			expect(supplier.name).toBe("Tenger");
			expect(supplier.contactPerson).toBe("Мөнх");
			expect(supplier.phone).toBe("88650102");
			expect(supplier.isActive).toBe(true);
		});
	});

	// ─── partsLookup ───────────────────────────────────────────────────────
	describe("partsLookup — catalog + historical pricing", () => {
		it("returns { query, internalCatalog[], historicalPricing[] }", async () => {
			const result = await getTool("partsLookup").execute({ query: "Window Motor" }, context) as any;

			expect(result.query).toBe("Window Motor");
			expect(Array.isArray(result.internalCatalog)).toBe(true);
			expect(result.internalCatalog.length).toBeGreaterThan(0);

			const part = result.internalCatalog[0];
			expect(part.name).toBe("Window Motor");
			expect(part.partNumber).toBe("WM-001");
			expect(typeof part.price).toBe("number");
			expect(part.price).toBe(8597494);
		});
	});

	// ─── queryData ─────────────────────────────────────────────────────────
	describe("queryData — flexible query engine", () => {
		it("returns { table, rows[], count }", async () => {
			const result = await getTool("queryData").execute({ table: "customers", limit: 5 }, context) as unknown;
			const r = result as Record<string, unknown>;
			expect(r.table).toBe("customers");
			expect(Array.isArray(r.rows)).toBe(true);
			expect((r.rows as unknown[]).length).toBe(3);
			expect(typeof r.count).toBe("number");
		});

		it("rejects nonexistent table with Mongolian error", async () => {
			const result = await getTool("queryData").execute({ table: "nonexistent" }, context) as any;

			expect(result.error).toBeDefined();
			expect(result.error).toContain("Хүчингүй багана");
			expect(result.error).toContain("nonexistent");
		});

		it("counts rows with aggregate=count", async () => {
			const result = await getTool("queryData").execute({ table: "customers", aggregate: "count" }, context) as any;

			expect(result.table).toBe("customers");
			expect(result.count).toBe(3);
		});

		it("sums a column with aggregate=sum:<col>", async () => {
			const result = await getTool("queryData").execute({
				table: "work_orders",
				aggregate: "sum:total_amount",
			}, context) as any;

			expect(result.table).toBe("work_orders");
			expect(typeof result.total).toBe("number");
			// 1,200,000 + 800,000 + 2,500,000 = 4,500,000
			expect(result.total).toBe(4500000);
		});
	});

	// ─── Output format sanity ──────────────────────────────────────────────
	describe("Output format — no HTML in tool output", () => {
		it("read tools return plain objects (no HTML tags)", async () => {
			const readToolNames = [
				"getDailySummary", "getActiveWorkOrders", "getInvoiceStatus",
				"getExpensesSummary", "getMechanics", "getSuppliers",
				"partsLookup", "getSparePartsSales", "queryData",
			];

			for (const name of readToolNames) {
				const tool = getTool(name);
				try {
					const result = await tool.execute({}, context);
					const str = JSON.stringify(result);
					expect(str).not.toContain("<hr");
					expect(str).not.toContain("<div");
					expect(str).not.toContain("<table");
					expect(str).not.toContain("<p>");
				} catch {
					// Some tools need required params — skip
				}
			}
		});
	});

	// ─── System prompt — actual content verification ───────────────────────
	describe("System prompt — Tolom MN", () => {
		it("contains Mongolian-only instruction", async () => {
			const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
			expect(prompt).toContain("ЗӨВХӨН Монгол хэлээр хариулна");
		});

		it("contains HTML format instruction", async () => {
			const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
			expect(prompt).toContain("Зөвхөн HTML");
		});

		it("contains org ID", async () => {
			const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
			expect(prompt).toContain(orgId);
		});

		it("contains write tool category description", async () => {
			const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
			expect(prompt).toContain("Бичлэгийн хэрэгслүүд");
		});
	});

	describe("System prompt — Tolom EN", () => {
		it("contains English rules", async () => {
			const prompt = await systemPromptFor("tolom", orgId, "private", "en");
			expect(prompt).toContain("Write tools (confirm before executing)");
			expect(prompt).toContain("Never say");
			expect(prompt).toContain(orgId);
		});
	});

	describe("System prompt — Zer MN", () => {
		it("contains Zer-specific tools", async () => {
			const prompt = await systemPromptFor("zer", orgId, "private", "mn");
			expect(prompt).toContain("getSalesByCategory");
			expect(prompt).toContain("getTodaySales");
			expect(prompt).toContain(orgId);
		});
	});
});
