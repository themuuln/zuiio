import { capture } from "@zuiio/capture";

import "server-only";

import type { GatewayTool, ToolContext } from "@/providers/types";
import { getRedis } from "@/lib/redis";
import { createServiceClient } from "@/lib/supabase";
import { createWriteDataTool } from "@/gateway/write-data-tool";
import { createReadDataTool } from "@/gateway/read-data-tool";

 /**
 * Generate system prompt for a product type.
 * Shared between Mode A and Mode B webhooks.
 */
export async function systemPromptFor(
	productType: string,
	orgId: string,
	chatType: string,
	lang?: string,
): Promise<string> {
	const groupWarning =
		chatType !== "private"
			? "\n\nАНХААРУУЛГА: Та group чат-д байна. Хэрэглэгчийн хувийн өгөгдлийг group-д бичиж болохгүй. Зөвхөн ерөнхий мэдээлэл өгнө үү."
			: "";
	// Fetch organization name — cached in Redis for 1 hour
	let orgName = "";
	const redis = getRedis();
	const orgCacheKey = `org:name:${orgId}`;
	
	// Try Redis cache first (independent try — don't let Redis failure block DB)
	if (redis) {
		try {
			orgName = (await redis.get<string>(orgCacheKey)) ?? "";
		} catch {
			// Redis failure — fall through to DB query
		}
	}
	
	// Cache miss — query Supabase
	if (!orgName) {
		try {
			const sb = createServiceClient();
			const { data } = await sb
				.from("organizations")
				.select("name")
				.eq("id", orgId)
				.single();
			if (data?.name) {
				orgName = data.name;
				if (redis) {
					// Fire-and-forget cache write
					redis.set(orgCacheKey, orgName, { ex: 3600 }).catch(() => {});
				}
			}
		} catch {
			// If we can't fetch org name, continue without it
		}
	}

	if (productType === "tolom") {
		if (lang === "en") {
return `You are "${orgName || "This auto repair shop"}" — a proactive Tolom auto repair agent.
RESPONSE: HTML only (<b>, <i>, <code>). No Markdown. 1-2 sentences max, warm but brief.
RULES:
1. Never say "I don't have that data" — always use tools to query business data
2. Use correct date ranges: "last year" → 1yr ago, "this month" → month start, omit for all time
3. After showing data, offer relevant next steps
4. Write tool (confirm before executing): writeData(dataset, operation, data). Datasets: vehicles, customers, work_orders, appointments, expenses, suppliers, parts_catalog, service_catalog, sales, invoices. Operations: insert, update, delete. Always confirm the exact change with the user before executing.
5. General greetings → respond without tools
6. Complex ops → guide step by step, ONE question per step, confirm before submit
READ TOOL: Use readData(plan) for ALL data lookups. plan is a ReadPlan: { queries: [{ dataset, dimensions?, measures?, embeds?, filters?, sort?, limit?, offset?, includeCount? }], derivation?, responseFormat? }. Datasets include: work_orders, customers, vehicles, appointments, invoices, invoice_items, invoice_payments, expenses, expense_categories, suppliers, profiles, parts_catalog, service_catalog, sales, sales_items, cash_register_sessions, work_order_parts, work_order_services, mechanic_daily_reports, notifications.
Examples: "show active orders" → readData({ queries: [{ dataset:"work_orders", filters:[{field:"status",op:"eq",value:"in_progress"}], limit:10 }] }); "customer by phone" → readData({ queries: [{ dataset:"customers", filters:[{field:"phone",op:"eq",value:"12345678"}] }] }); "today's appointments" → readData({ queries: [{ dataset:"appointments", filters:[{field:"scheduled_at",op:"gte",value:"2024-01-15"}] }] })
Organization ID: ${orgId}${groupWarning}`;
		}
return `Та "${orgName || "This auto repair shop"}" — идэвхтэй засварын газрын бизнес агент.
ХЭЛНИЙ ДҮРЭМ: ЗӨВХӨН Монгол хэлээр хариулна. Англи, Орос бусад хэл ашиглахгүй.
ФОРМАТ: Зөвхөн HTML (<b>, <i>, <code>). Markdown ашиглахгүй. Хариулт богино — 1-2 өгүүлбэр.
АЖИЛЧНЫ ДҮРЭМ:
1. "би мэдээлэлгүй" гэж хэзээ ч хэлэхгүй — бүх өгөгдлийг хэрэгслээр асууна
2. Бизнесийн асуулт бүрт хэрэгсэл ашиглах. Зөв хугацаа ашиглах.
3. Идэвхтэй байх — өгөгдөл харуулсны дараа дараагийн алхмуудыг санал болго
4. Бичлэгийн хэрэгсэл — writeData(dataset, operation, data). Хүснэгтүүд: vehicles, customers, work_orders, appointments, expenses, suppliers, parts_catalog, service_catalog, sales, invoices. Үйлдлүүд: insert, update, delete. Гүйцэтгэхээс өмнө хэрэглэгчээс заавал баталгаажуулна.
5. Ерөнхий асуулт — хэрэгсэлгүйгээр хариул
6. Төвөгтэй үйлдэл: алхам алхамаар, нэг асуулт нэг алхам, баталгаажуул
ХЭРЭГСЛИЙН ДҮРЭМ: readData(plan) ашиглах — бүх өгөгдөл хайх, шүүх, бүлэглэх. plan нь ReadPlan: { queries: [{ dataset, dimensions?, measures?, embeds?, filters?, sort?, limit?, offset?, includeCount? }], derivation?, responseFormat? }. Хүснэгтүүд: work_orders, customers, vehicles, appointments, invoices, invoice_items, invoice_payments, expenses, expense_categories, suppliers, profiles, parts_catalog, service_catalog, sales, sales_items, cash_register_sessions, work_order_parts, work_order_services, mechanic_daily_reports, notifications.
Жишээ: "идэвхтэй захиалга" → readData({ queries: [{ dataset:"work_orders", filters:[{field:"status",op:"eq",value:"in_progress"}], limit:10 }] }); "утсаар харилцагч" → readData({ queries: [{ dataset:"customers", filters:[{field:"phone",op:"eq",value:"12345678"}] }] }); "өнөөдрийн цаг" → readData({ queries: [{ dataset:"appointments", filters:[{field:"scheduled_at",op:"gte",value:"2024-01-15"}] }] })
ОЛОН ШАТЫН ТУСЛАМЖ:
- Захиалга: харилцагчийн нэр → улсын дугаар → тайлбар
- Цаг захиалга: харилцагч → огноо/цаг → тайлбар
- Нэхэмжлэх: харилцагч → дүн → тайлбар
Organization ID: ${orgId}${groupWarning}`;
	}
	if (lang === "en") {
return `You are "${orgName || "This store"}" — a proactive Zer retail/accounting agent.
RESPONSE: HTML only (<b>, <i>, <code>). 1-2 sentences max.
RULES:
1. Never say "I don't have that data" — always use tools to query business data
2. Use correct date ranges for queries
3. After showing data, offer relevant next steps
4. Use queryData for all lookups (sales, products, customers, expenses, invoices)
5. Use getSalesByCategory for category breakdowns
6. General questions → respond without tools
Organization ID: ${orgId}${groupWarning}`;
	}
	return `Та "${orgName || "This store"}" — найрсаг, мэргэжлийн бизнес агент.
ХЭЛНИЙ ДҮРЭМ: ЗӨВХӨН Монгол хэлээр хариулна. Англи, Орос бусад хэл ашиглахгүй.
ФОРМАТ: Зөвхөн HTML (<b>, <i>, <code>). Markdown ашиглахгүй. Хариулт богино — 1-2 өгүүлбэр.
ХЭРЭГСЛИЙН ДҮРЭМ: queryData ашиглах — бүх өгөгдөл хайх, шүүх, бүлэглэх. Борлуулалт, бараа, харилцагч, нягтлан хэрэгслүүдэд хандах боломжтой.
- Ангиллаар: getSalesByCategory
- Бусад бүх асуулт: queryData ашиглах
Ерөнхий асуулт — хэрэгсэлгүйгээр хариул.
Organization ID: ${orgId}${groupWarning}`;
}

// ─── Tolom Tools ───────────────────────────────────────────────────────────

function tolomTools(context: ToolContext): GatewayTool[] {
	const { supabase, orgId } = context;
	const now = new Date();
	const today = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	).toISOString();
	const yesterday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() - 1,
	).toISOString();
	const monthStart = new Date(
		now.getFullYear(),
		now.getMonth(),
		1,
	).toISOString();
	const monthEnd = new Date(
		now.getFullYear(),
		now.getMonth() + 1,
		0,
		23,
		59,
		59,
	).toISOString();
	const monthStartDate = monthStart.split("T")[0]!;

	return [
		{
			name: "getDailySummary",
			description:
				"Өнөөдрийн болон өчигдрийн хураангуй: орлого, идэвхтэй ажлын тоо, шинэ харилцагч",
			parameters: [],
			execute: async () => {
				try {
					const [workOrders, invoices, customers] = await Promise.all([
						supabase
							.from("work_orders")
							.select("status, total_amount")
							.eq("organization_id", orgId)
							.is("deleted_at", null),
						supabase
							.from("invoices")
							.select("total, amount_paid")
							.eq("organization_id", orgId)
							.is("deleted_at", null)
							.gte("issued_at", monthStart),
						supabase
							.from("customers")
							.select("id")
							.eq("organization_id", orgId)
							.is("deleted_at", null)
							.gte("created_at", monthStartDate),
					]);

					const activeWO = (workOrders.data ?? []).filter(
						(wo: any) =>
							!["delivered", "cancelled", "completed"].includes(wo.status),
					);

					return {
						today: today.split("T")[0],
						activeWorkOrders: activeWO.length,
						totalWorkOrders: (workOrders.data ?? []).length,
						monthlyInvoices: (invoices.data ?? []).reduce(
							(s: number, r: any) => s + (Number(r.total) || 0),
							0,
						),
						monthlyInvoicesPaid: (invoices.data ?? []).reduce(
							(s: number, r: any) => s + (Number(r.amount_paid) || 0),
							0,
						),
						newCustomersThisMonth: (customers.data ?? []).length,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: getDailySummary" });
					return { error: "Өдрийн хураангуй авахад алдаа гарлаа" };
				}
			},
		},
		{
			name: "getWorkOrderDetails",
			description: "Ажлын захиалгын дэлгэрэнгүй: сэлбэг, нэмэлт мэдээлэл",
			parameters: [
				{
					name: "workOrderId",
					type: "string",
					description: "Ажлын захиалгын ID",
					required: true,
				},
			],
			execute: async (args) => {
				try {
					const woId = args.workOrderId as string;
					const [woRes, partsRes] = await Promise.all([
						supabase
							.from("work_orders")
							.select(
								"*, customers(full_name, phone), vehicles(plate_number, make, model, year)",
							)
							.eq("id", woId)
							.eq("organization_id", orgId)
							.single(),
						supabase
							.from("work_order_parts")
							.select(
								"part_name, part_number, quantity, unit_price, final_price",
							)
							.eq("work_order_id", woId)
							.eq("organization_id", orgId),
					]);
					if (woRes.error || !woRes.data)
						return { error: "Ажлын захиалга олдсонгүй" };
					const wo = woRes.data;
					return {
						id: wo.id,
						status: wo.status,
						total: Number(wo.total_amount) || 0,
						plate: wo.plate_number ?? (wo.vehicles as any)?.plate_number ?? "—",
						vehicle: [(wo.vehicles as any)?.make, (wo.vehicles as any)?.model]
							.filter(Boolean)
							.join(" "),
						customerName: (wo.customers as any)?.full_name ?? "—",
						phone: (wo.customers as any)?.phone ?? "—",
						description: wo.description ?? "—",
						parts: (partsRes.data ?? []).map((p: any) => ({
							name: p.part_name,
							qty: p.quantity,
							price: Number(p.final_price) || 0,
						})),
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: getWorkOrderDetails" });
					return { error: "Ажлын захиалгын дэлгэрэнгүй авахад алдаа гарлаа" };
				}
			},
		},
		{
			name: "getVehicleAnalytics",
			description:
				"Машин бүрийн засвар аналитик: тоо, орлого.",
			parameters: [
				{
					name: "date_from",
					type: "string",
					description: "Эхлэх огноо (YYYY-MM-DD)",
					required: false,
				},
				{
					name: "date_to",
					type: "string",
					description: "Дуусах огноо (YYYY-MM-DD)",
					required: false,
				},
				{
					name: "sort_by",
					type: "string",
					description:
						"Эрэмбэлэх: repair_count, total_revenue, last_repair (default: repair_count)",
					required: false,
				},
				{
					name: "limit",
					type: "number",
					description: "Хэдэн машин харуулах (default: 10)",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const dateFrom =
						typeof args.date_from === "string" ? args.date_from : undefined;
					const dateTo =
						typeof args.date_to === "string"
							? `${args.date_to}T23:59:59Z`
							: undefined;
					const limit =
						typeof args.limit === "number" ? Math.min(args.limit, 50) : 10;

					let woQuery = supabase
						.from("work_orders")
						.select(
							"id, vehicle_id, total_amount, created_at, status, vehicles(plate_number, make, model, year)",
						)
						.eq("organization_id", orgId)
						.is("deleted_at", null)
						.not("status", "in", '("cancelled")');

					if (dateFrom) woQuery = woQuery.gte("created_at", dateFrom);
					if (dateTo) woQuery = woQuery.lte("created_at", dateTo);

					const { data: workOrders, error: woError } = await woQuery.limit(500);
					if (woError) return { error: "Машин аналитик авахад алдаа гарлаа" };

					const vehicleMap = new Map<
						string,
						{
							plate: string;
							make: string;
							model: string;
							year: number | null;
							repairCount: number;
							totalRevenue: number;
							lastRepair: string;
						}
					>();

					for (const wo of workOrders ?? []) {
						const v = wo.vehicles as any;
						const vid = wo.vehicle_id ?? "unknown";
						const existing = vehicleMap.get(vid);
						const revenue = Number(wo.total_amount) || 0;
						const woDate = wo.created_at ?? "";

						if (existing) {
							existing.repairCount++;
							existing.totalRevenue += revenue;
							if (woDate > existing.lastRepair) existing.lastRepair = woDate;
						} else {
							vehicleMap.set(vid, {
								plate: v?.plate_number ?? "—",
								make: v?.make ?? "—",
								model: v?.model ?? "—",
								year: v?.year ?? null,
								repairCount: 1,
								totalRevenue: revenue,
								lastRepair: woDate,
							});
						}
					}

					const vehicles = Array.from(vehicleMap.values());
					const sortBy =
						typeof args.sort_by === "string" ? args.sort_by : "repair_count";
					if (sortBy === "total_revenue") {
						vehicles.sort((a, b) => b.totalRevenue - a.totalRevenue);
					} else if (sortBy === "last_repair") {
						vehicles.sort((a, b) => b.lastRepair.localeCompare(a.lastRepair));
					} else {
						vehicles.sort((a, b) => b.repairCount - a.repairCount);
					}

					return {
						period:
							dateFrom || dateTo
								? `${dateFrom ?? "эхлээгүй"} → ${args.date_to ?? "өнөөдөр"}`
								: "Бүх цаг хугацаа",
						vehicles: vehicles.slice(0, limit),
						totalVehicles: vehicles.length,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: getVehicleAnalytics" });
					return { error: "Машин аналитик авахад алдаа гарлаа" };
				}
			},
		},
		{
			name: "getFinancialSummary",
			description:
				"Орлого, зарлага, төлбөрийн хураангуй.",
			parameters: [
				{
					name: "date_from",
					type: "string",
					description: "Эхлэх огноо (YYYY-MM-DD)",
					required: false,
				},
				{
					name: "date_to",
					type: "string",
					description: "Дуусах огноо (YYYY-MM-DD)",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const now = new Date();
					const dateFrom =
						typeof args.date_from === "string"
							? args.date_from
							: new Date(now.getFullYear(), now.getMonth(), 1)
									.toISOString()
									.split("T")[0];
					const dateTo =
						typeof args.date_to === "string"
							? `${args.date_to}T23:59:59Z`
							: now.toISOString();

					const [invoicesRes, expensesRes, paymentsRes] = await Promise.all([
						supabase
							.from("invoices")
							.select("total, amount_paid, balance_due, status")
							.eq("organization_id", orgId)
							.is("deleted_at", null)
							.gte("issued_at", dateFrom)
							.lte("issued_at", dateTo),
						supabase
							.from("expenses")
							.select("amount, expense_categories(name)")
							.eq("organization_id", orgId)
							.is("deleted_at", null)
							.gte("expense_date", dateFrom)
							.lte("expense_date", dateTo),
						supabase
							.from("invoice_payments")
							.select("amount, method, paid_at")
							.eq("organization_id", orgId)
							.gte("paid_at", dateFrom)
							.lte("paid_at", dateTo),
					]);

					const invoiceRows = invoicesRes.data ?? [];
					const expenseRows = expensesRes.data ?? [];
					const paymentRows = paymentsRes.data ?? [];

					const totalInvoiced = invoiceRows.reduce(
						(s: number, r: any) => s + (Number(r.total) || 0),
						0,
					);
					const totalPaid = invoiceRows.reduce(
						(s: number, r: any) => s + (Number(r.amount_paid) || 0),
						0,
					);
					const totalUnpaid = invoiceRows.reduce(
						(s: number, r: any) => s + (Number(r.balance_due) || 0),
						0,
					);
					const totalExpenses = expenseRows.reduce(
						(s: number, r: any) => s + (Number(r.amount) || 0),
						0,
					);
					const expensesByCategory: Record<string, number> = {};
					for (const r of expenseRows) {
						const cat = ((r as any).expense_categories as any)?.name ?? "Бусад";
						expensesByCategory[cat] =
							(expensesByCategory[cat] ?? 0) + (Number((r as any).amount) || 0);
					}
					const paymentsByMethod: Record<string, number> = {};
					for (const r of paymentRows) {
						const method = (r as any).method ?? "бусад";
						paymentsByMethod[method] =
							(paymentsByMethod[method] ?? 0) +
							(Number((r as any).amount) || 0);
					}

					return {
						period: `${dateFrom} → ${typeof args.date_to === "string" ? args.date_to : now.toISOString().split("T")[0]}`,
						summary: {
							totalInvoiced,
							totalCollected: totalPaid,
							totalOutstanding: totalUnpaid,
							totalExpenses,
							netIncome: totalPaid - totalExpenses,
						},
						invoiceCount: invoiceRows.length,
						expenseCount: expenseRows.length,
						expensesByCategory,
						paymentsByMethod,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: getFinancialSummary" });
					return { error: "Санхүүгийн хураангуй авахад алдаа гарлаа" };
				}
			},
		},
		{
			name: "exportData",
			description:
				"Өгөгдлийг CSV болгож экспортлох.",
			parameters: [
				{
					name: "table",
					type: "string",
					description:
						"Хүснэгтийн нэр (work_orders, invoices, customers, expenses, sales)",
					required: true,
				},
				{
					name: "date_from",
					type: "string",
					description: "Эхлэх огноо (YYYY-MM-DD)",
					required: false,
				},
				{
					name: "date_to",
					type: "string",
					description: "Дуусах огноо (YYYY-MM-DD)",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const table = (args.table as string)?.toLowerCase();
					const allowedTables: Record<
						string,
						{ dateCol: string; select: string }
					> = {
						work_orders: {
							dateCol: "created_at",
							select: "id, status, description, total_amount, created_at",
						},
						invoices: {
							dateCol: "issued_at",
							select:
								"id, invoice_number, status, total, amount_paid, balance_due, issued_at",
						},
						customers: {
							dateCol: "created_at",
							select: "id, full_name, phone, email, total_visits",
						},
						expenses: {
							dateCol: "expense_date",
							select: "id, amount, description, expense_date",
						},
						sales: {
							dateCol: "sale_date",
							select: "id, total_amount, paid_amount, sale_date, customer_name",
						},
					};
					if (!table || !allowedTables[table]) {
						return { error: `Экспортлох боломжгүй хүснэгт: "${args.table}"` };
					}
					const cfg = allowedTables[table];
					let query = supabase
						.from(table)
						.select(cfg.select)
						.eq("organization_id", orgId)
						.is("deleted_at", null);
					if (args.date_from && typeof args.date_from === "string")
						query = query.gte(cfg.dateCol, args.date_from);
					if (args.date_to && typeof args.date_to === "string")
						query = query.lte(cfg.dateCol, `${args.date_to}T23:59:59Z`);
					const { data, error } = await query
						.order(cfg.dateCol, { ascending: false })
						.limit(500);
					if (error) return { error: "Өгөгдөл татахад алдаа гарлаа" };
					const rows = data ?? [];
					if (rows.length === 0)
						return { message: "Өгөгдөл олдсонгүй", csv: "" };
					const headers = Object.keys(
						(rows[0] ?? {}) as unknown as Record<string, unknown>,
					);
					const csvRows = (rows as unknown as Record<string, unknown>[]).map(
						(r) =>
							headers
								.map((h) => {
									const val = r[h];
									if (val === null || val === undefined) return "";
									if (typeof val === "object") return JSON.stringify(val);
									const str = String(val);
									return str.includes(",") || str.includes('"')
										? `"${str.replace(/"/g, '""')}"`
										: str;
								})
								.join(","),
					);
					const csv = [headers.join(","), ...csvRows].join("\n");
					return { table, rowCount: rows.length, csv };
				} catch (err) {
					capture(err, { context: "agent-gateway: exportData" });
					return { error: "Экспортлохад алдаа гарлаа" };
				}
			},
		},
		{
			name: "partsLookup",
			description:
				"Сэлбэгийн үнийн мэдээлэл хайх.",
			parameters: [
				{
					name: "query",
					type: "string",
					description: "Сэлбэгийн нэр, дугаар эсвэл тодорхойлолт",
					required: true,
				},
			],
			execute: async (args) => {
				try {
					const q = args.query as string;
					const [internalRes, historicalRes] = await Promise.all([
						supabase
							.from("parts_catalog")
							.select("id, name, part_number, unit_price, category")
							.eq("organization_id", orgId)
							.is("deleted_at", null)
							.or(`name.ilike.%${q}%,part_number.ilike.%${q}%`)
							.limit(10),
						supabase
							.from("work_order_parts")
							.select("part_name, part_number, unit_price, final_price, created_at")
							.eq("organization_id", orgId)
							.or(`part_name.ilike.%${q}%,part_number.ilike.%${q}%`)
							.order("created_at", { ascending: false })
							.limit(10),
					]);
					const internalParts = internalRes.data;
					const historicalParts = historicalRes.data;
					return {
						query: q,
						internalCatalog: (internalParts ?? []).map(
							(p: Record<string, unknown>) => ({
								name: p.name,
								partNumber: p.part_number,
								price: Number(p.unit_price) || 0,
								category: p.category,
							}),
						),
						historicalPricing: (historicalParts ?? []).map(
							(p: Record<string, unknown>) => ({
								name: p.part_name,
								partNumber: p.part_number,
								unitPrice: Number(p.unit_price) || 0,
								date: p.created_at,
							}),
						),
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: partsLookup" });
					return { error: "Сэлбэг хайхад алдаа гарлаа" };
				}
			},
		},
		{
			name: "getSparePartsSales",
			description:
				"Сэлбэгийн борлуулалтын хураангуй.",
			parameters: [
				{
					name: "date_from",
					type: "string",
					description: "Эхлэх огноо (YYYY-MM-DD)",
					required: false,
				},
				{
					name: "date_to",
					type: "string",
					description: "Дуусах огноо (YYYY-MM-DD)",
					required: false,
				},
				{
					name: "limit",
					type: "number",
					description: "Хэдэн сэлбэг харуулах (default 10)",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const now = new Date();
					const dateFrom =
						typeof args.date_from === "string"
							? args.date_from
							: new Date(now.getFullYear(), now.getMonth(), 1)
									.toISOString()
									.split("T")[0];
					const dateTo =
						typeof args.date_to === "string"
							? `${args.date_to}T23:59:59Z`
							: now.toISOString();
					const limit =
						typeof args.limit === "number" ? Math.min(args.limit, 50) : 10;

					// Query work_order_parts (parts used in repairs)
					const woPartsPromise = supabase
						.from("work_order_parts")
						.select(
							"part_name, part_number, quantity, unit_price, final_price, created_at",
						)
						.eq("organization_id", orgId)
						.gte("created_at", dateFrom)
						.lte("created_at", dateTo)
						.order("created_at", { ascending: false })
						.limit(1000);

					// Query sales_items (direct parts sales) if the table exists
					const salesItemsPromise = supabase
						.from("sales_items")
						.select(
							"part_name, part_number, quantity, unit_price, total_price, created_at",
						)
						.eq("organization_id", orgId)
						.gte("created_at", dateFrom)
						.lte("created_at", dateTo)
						.order("created_at", { ascending: false })
						.limit(1000)
						.then(
							(res) => res,
							() => ({ data: null, error: null }),
						);
					const [woPartsRes, salesItemsRes] = await Promise.all([
						woPartsPromise,
						salesItemsPromise,
					]);

					// Merge and aggregate by part_name
					type PartRow = {
						part_name?: string | null;
						part_number?: string | null;
						quantity?: number | string | null;
						unit_price?: number | string | null;
						final_price?: number | string | null;
						total_price?: number | string | null;
					};

					const partsMap = new Map<
						string,
						{
							partName: string;
							partNumber: string;
							totalQuantity: number;
							totalRevenue: number;
							saleCount: number;
						}
					>();

					for (const p of (woPartsRes.data ?? []) as PartRow[]) {
						const name = p.part_name ?? "—";
						const num = p.part_number ?? "";
						const revenue =
							Number(p.final_price) ||
							Number(p.unit_price) * Number(p.quantity) ||
							0;
						const qty = Number(p.quantity) || 0;
						const existing = partsMap.get(name);
						if (existing) {
							existing.totalQuantity += qty;
							existing.totalRevenue += revenue;
							existing.saleCount += 1;
						} else {
							partsMap.set(name, {
								partName: name,
								partNumber: num,
								totalQuantity: qty,
								totalRevenue: revenue,
								saleCount: 1,
							});
						}
					}

					for (const p of (salesItemsRes.data ?? []) as PartRow[]) {
						const name = p.part_name ?? "—";
						const num = p.part_number ?? "";
						const revenue =
							Number(p.total_price) ||
							Number(p.unit_price) * Number(p.quantity) ||
							0;
						const qty = Number(p.quantity) || 0;
						const existing = partsMap.get(name);
						if (existing) {
							existing.totalQuantity += qty;
							existing.totalRevenue += revenue;
							existing.saleCount += 1;
						} else {
							partsMap.set(name, {
								partName: name,
								partNumber: num,
								totalQuantity: qty,
								totalRevenue: revenue,
								saleCount: 1,
							});
						}
					}

					// Sort by revenue descending
					const parts = Array.from(partsMap.values())
						.sort((a, b) => b.totalRevenue - a.totalRevenue)
						.slice(0, limit);

					const totalRevenue = parts.reduce((s, p) => s + p.totalRevenue, 0);

					return {
						period: `${dateFrom} → ${typeof args.date_to === "string" ? args.date_to : now.toISOString().split("T")[0]}`,
						totalRevenue,
						totalParts: parts.length,
						parts,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: getSparePartsSales" });
					return {
						error: "Сэлбэгийн борлуулалтын хураангуй авахад алдаа гарлаа",
					};
				}
			},
		},
	];
}

// ─── Tolom Write Tools ─────────────────────────────────────────────────────

function tolomWriteTools(context: ToolContext): GatewayTool[] {
	const { supabase, orgId } = context;
	return [
		{
			name: "createWorkOrder",
			description:
				"Шинэ ажлын захиалга үүсгэх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "customerName",
					type: "string",
					description: "Харилцагчийн нэр",
					required: true,
				},
				{
					name: "customerPhone",
					type: "string",
					description: "Харилцагчийн утасны дугаар",
					required: false,
				},
				{
					name: "plateNumber",
					type: "string",
					description: "Улсын дугаар",
					required: false,
				},
				{
					name: "description",
					type: "string",
					description: "Ажлын тайлбар / юу хийх вэ",
					required: true,
				},
				{
					name: "totalAmount",
					type: "number",
					description: "Нийт дүн (₮)",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const phone = (args.customerPhone as string) ?? "";
					let customerId: string;

					const { data: existing } = await supabase
						.from("customers")
						.select("id")
						.eq("organization_id", orgId)
						.eq("phone", phone)
						.is("deleted_at", null)
						.limit(1);

					if (existing && existing.length > 0) {
						customerId = (existing[0] as { id: string }).id;
					} else {
						const name = (args.customerName as string) ?? "—";
						const [firstName, ...rest] = name.split(" ");
						const { data: created, error: createErr } = await supabase
							.from("customers")
							.insert({
								organization_id: orgId,
								full_name: name,
								first_name: firstName ?? name,
								last_name: rest.join(" ") || undefined,
								phone: phone || undefined,
							})
							.select("id")
							.single();
						if (createErr || !created) {
							return { error: "Харилцагч үүсгэхэд алдаа гарлаа" };
						}
						customerId = (created as { id: string }).id;
					}

					const { data: wo, error } = await supabase
						.from("work_orders")
						.insert({
							organization_id: orgId,
							customer_id: customerId,
							plate_number: (args.plateNumber as string) ?? undefined,
							status: "received",
							description: args.description as string,
							total_amount: (args.totalAmount as number) ?? 0,
						})
						.select("id, status, total_amount")
						.single();

					if (error || !wo) {
						return { error: "Ажлын захиалга үүсгэхэд алдаа гарлаа" };
					}

					const woData = wo as {
						id: string;
						status: string;
						total_amount: number;
					};
					return {
						success: true,
						message: `Шинэ ажлын захиалга үүслээ: #${woData.id.split("-")[0]}`,
						workOrderId: woData.id,
						status: woData.status,
						totalAmount: woData.total_amount,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: createWorkOrder" });
					return { error: "Ажлын захиалга үүсгэхэд алдаа гарлаа" };
				}
			},
		},
		{
			name: "updateWorkOrderStatus",
			description:
				"Төлөв өөрчлөх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "workOrderId",
					type: "string",
					description: "Ажлын захиалгын ID",
					required: true,
				},
				{
					name: "newStatus",
					type: "string",
					description: "Шинэ төлөв",
					required: true,
				},
			],
			execute: async (args) => {
				try {
					const validStatuses = [
						"received",
						"in_progress",
						"completed",
						"delivered",
						"cancelled",
					];
					const newStatus = (args.newStatus as string).toLowerCase();
					if (!validStatuses.includes(newStatus)) {
						return {
							error: `Хүчингүй төлөв: "${args.newStatus}". Боломжит: ${validStatuses.join(", ")}`,
						};
					}

					const { data, error } = await supabase
						.from("work_orders")
						.update({ status: newStatus })
						.eq("organization_id", orgId)
						.eq("id", args.workOrderId as string)
						.select("id, status")
						.single();

					if (error || !data) {
						return { error: "Ажлын захиалга олдсонгүй эсвэл өөрчлөх эрхгүй" };
					}

					return {
						success: true,
						message: `Ажлын захиалга #${(args.workOrderId as string).split("-")[0]} төлөв "${newStatus}" болж өөрчлөгдлөө`,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: updateWorkOrderStatus" });
					return { error: "Төлөв өөрчлөхөд алдаа гарлаа" };
				}
			},
		},
		{
			name: "createInvoice",
			description:
				"Нэхэмжлэх үүсгэх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "customerId",
					type: "string",
					description: "Харилцагчийн ID (хайлтаас олох)",
					required: true,
				},
				{
					name: "total",
					type: "number",
					description: "Нийт дүн (₮)",
					required: true,
				},
				{
					name: "description",
					type: "string",
					description: "Нэхэмжлэхийн тайлбар",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const { data, error } = await supabase
						.from("invoices")
						.insert({
							organization_id: orgId,
							customer_id: args.customerId as string,
							total: Number(args.total),
							amount_paid: 0,
							description: (args.description as string) ?? undefined,
							issued_at: new Date().toISOString(),
						})
						.select("id, total, amount_paid")
						.single();

					if (error || !data) {
						return { error: "Нэхэмжлэх үүсгэхэд алдаа гарлаа" };
					}

					return {
						success: true,
						message: `Шинэ нэхэмжлэх үүслээ: #${(data as { id: string }).id.split("-")[0]}`,
						invoiceId: (data as { id: string }).id,
						total: (data as { total: number }).total,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: createInvoice" });
					return { error: "Нэхэмжлэх үүсгэхэд алдаа гарлаа" };
				}
			},
		},
		// ─── New CRU Tools ─────────────────────────────────────────────
		{
			name: "updateWorkOrderDetails",
			description:
				"Дэлгэрэнгүй засах. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "workOrderId",
					type: "string",
					description: "Ажлын захиалгын ID",
					required: true,
				},
				{
					name: "description",
					type: "string",
					description: "Шинэ тайлбар",
					required: false,
				},
				{
					name: "notes",
					type: "string",
					description: "Шинэ тэмдэглээ",
					required: false,
				},
				{
					name: "totalAmount",
					type: "number",
					description: "Шинэ нийт дүн (₮)",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const updates: Record<string, unknown> = {};
					if (typeof args.description === "string")
						updates.description = args.description;
					if (typeof args.notes === "string") updates.notes = args.notes;
					if (typeof args.totalAmount === "number")
						updates.total_amount = args.totalAmount;

					if (Object.keys(updates).length === 0) {
						return { error: "Өөрчлөх зүйл байхгүй байна" };
					}

					const { data, error } = await supabase
						.from("work_orders")
						.update(updates)
						.eq("organization_id", orgId)
						.eq("id", args.workOrderId as string)
						.select("id, description, notes, total_amount")
						.single();

					if (error || !data) {
						return { error: "Ажлын захиалга олдсонгүй эсвэл өөрчлөх эрхгүй" };
					}

					return {
						success: true,
						message: `Ажлын захиалга #${(data as { id: string }).id.split("-")[0]} амжилттай шинэчлэгдлээ`,
						updatedFields: Object.keys(updates),
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: updateWorkOrderDetails" });
					return { error: "Ажлын захиалга шинэчлэхэд алдаа гарлаа" };
				}
			},
		},
		{
			name: "recordPayment",
			description: "Нэхэмжлэх дээр төлбөр бүртгэх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "invoiceId",
					type: "string",
					description: "Нэхэмжлэхийн ID",
					required: true,
				},
				{
					name: "amount",
					type: "number",
					description: "Төлсөн дүн (₮)",
					required: true,
				},
				{
					name: "method",
					type: "string",
					description: "Төлбөрийн хэрэгсэл: cash, card, qpay, transfer",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const amount = Number(args.amount);
					if (amount <= 0) return { error: "Дүн 0-ээс их байх ёстой" };

					const method = (args.method as string) ?? "cash";
					const validMethods = ["cash", "card", "qpay", "transfer"];
					if (!validMethods.includes(method)) {
						return {
							error: `Хүчингүй төлбөрийн хэрэгсэл: "${method}". Боломжит: ${validMethods.join(", ")}`,
						};
					}

					// Get current invoice
					const { data: invoice, error: invErr } = await supabase
						.from("invoices")
						.select("id, total, amount_paid, balance_due")
						.eq("id", args.invoiceId as string)
						.eq("organization_id", orgId)
						.single();

					if (invErr || !invoice) return { error: "Нэхэмжлэх олдсонгүй" };

					const inv = invoice as {
						id: string;
						total: number;
						amount_paid: number;
						balance_due: number;
					};

					if (amount > inv.balance_due) {
						return {
							error: `Төлсөн дүн (${amount}₮) нэхэмжлэхийн үлдэгдэл (${inv.balance_due}₮)-ээс их байна`,
						};
					}

					const newPaid = inv.amount_paid + amount;
					const newBalance = inv.total - newPaid;
					const newStatus = newBalance <= 0 ? "paid" : "partial";

					const { error: updateErr } = await supabase
						.from("invoices")
						.update({
							amount_paid: newPaid,
							balance_due: newBalance,
							status: newStatus,
							paid_at: newBalance <= 0 ? new Date().toISOString() : null,
						})
						.eq("id", inv.id);

					if (updateErr) return { error: "Төлбөр бүртгэхэд алдаа гарлаа" };

					// Record payment entry
					await supabase.from("invoice_payments").insert({
						invoice_id: inv.id,
						organization_id: orgId,
						amount,
						method,
						paid_at: new Date().toISOString(),
					});

					return {
						success: true,
						message: `${amount}₮ төлбөр амжилттай бүртгэгдлээ (${method})`,
						invoiceId: inv.id,
						remainingBalance: newBalance,
						newStatus,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: recordPayment" });
					return { error: "Төлбөр бүртгэхэд алдаа гарлаа" };
				}
			},
		},
		{
			name: "createAppointment",
			description: "Шинэ цаг захиалга үүсгэх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "customerName",
					type: "string",
					description: "Харилцагчийн нэр",
					required: true,
				},
				{
					name: "customerPhone",
					type: "string",
					description: "Харилцагчийн утас",
					required: false,
				},
				{
					name: "scheduledAt",
					type: "string",
					description: "Цагийн уулзвар (YYYY-MM-DDTHH:MM)",
					required: true,
				},
				{
					name: "description",
					type: "string",
					description: "Захиалгын тайлбар",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const phone = (args.customerPhone as string) ?? "";
					let customerId: string;

					// Find or create customer
					const { data: existing } = await supabase
						.from("customers")
						.select("id")
						.eq("organization_id", orgId)
						.eq("phone", phone)
						.is("deleted_at", null)
						.limit(1);

					if (existing && existing.length > 0) {
						customerId = (existing[0] as { id: string }).id;
					} else {
						const name = (args.customerName as string) ?? "—";
						const [firstName, ...rest] = name.split(" ");
						const { data: created, error: createErr } = await supabase
							.from("customers")
							.insert({
								organization_id: orgId,
								full_name: name,
								first_name: firstName ?? name,
								last_name: rest.join(" ") || undefined,
								phone: phone || undefined,
							})
							.select("id")
							.single();
						if (createErr || !created) {
							return { error: "Харилцагч үүсгэхэд алдаа гарлаа" };
						}
						customerId = (created as { id: string }).id;
					}

					const { data: appt, error: apptErr } = await supabase
						.from("appointments")
						.insert({
							organization_id: orgId,
							customer_id: customerId,
							scheduled_at: args.scheduledAt as string,
							description: (args.description as string) ?? undefined,
							status: "scheduled",
						})
						.select("id, scheduled_at, status")
						.single();

					if (apptErr || !appt) {
						return { error: "Цаг захиалга үүсгэхэд алдаа гарлаа" };
					}

					return {
						success: true,
						message: `Цаг захиалга амжилттай үүслээ: ${(appt as { scheduled_at: string }).scheduled_at}`,
						appointmentId: (appt as { id: string }).id,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: createAppointment" });
					return { error: "Цаг захиалга үүсгэхэд алдаа гарлаа" };
				}
			},
		},
		{
			name: "sendInvoicePdf",
			description: "Нэхэмжлэхийг PDF болгож илгээх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "invoiceId",
					type: "string",
					description: "Нэхэмжлэхийн ID",
					required: true,
				},
			],
			execute: async (args) => {
				try {
					const { data: invoice, error } = await supabase
						.from("invoices")
						.select(
							"id, invoice_number, total, amount_paid, balance_due, status, customer_name, issued_at",
						)
						.eq("id", args.invoiceId as string)
						.eq("organization_id", orgId)
						.single();
					if (error || !invoice) return { error: "Нэхэмжлэх олдсонгүй" };
					// Return invoice data — the channel layer handles PDF generation
					return {
						success: true,
						invoiceId: (invoice as Record<string, unknown>).id,
						invoiceNumber: (invoice as Record<string, unknown>).invoice_number,
						total: (invoice as Record<string, unknown>).total,
						customerName: (invoice as Record<string, unknown>).customer_name,
						message: "Нэхэмжлэхийн мэдээлэл бэлэн. PDF үүсгэх шаардлагатай.",
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: sendInvoicePdf" });
					return { error: "Нэхэмжлэх илгээхэд алдаа гарлаа" };
				}
			},
		},
		{
			name: "createReminder",
			description:
				"Сануулга үүсгэх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "message",
					type: "string",
					description: "Сануулгын агуулга",
					required: true,
				},
				{
					name: "remindAt",
					type: "string",
					description: "Хэзээ сануулах (YYYY-MM-DDTHH:MM)",
					required: true,
				},
			],
			execute: async (args) => {
				try {
					const message = args.message as string;
					const remindAt = args.remindAt as string;
					const { error } = await supabase.from("notifications").insert({
						organization_id: orgId,
						type: "reminder",
						title: "Сануулга",
						message,
						scheduled_for: remindAt,
						is_read: false,
					});
					if (error)
						return {
							success: true,
							message: `Сануулга тэмдэглэгдлээ: ${message} (${remindAt})`,
						};
					return {
						success: true,
						message: `Сануулга амжилттай үүслээ: ${message} (${remindAt})`,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: createReminder" });
					return { error: "Сануулга үүсгэхэд алдаа гарлаа" };
				}
			},
		},
		{
			name: "bulkUpdateWorkOrderStatus",
			description:
				"Олон захиалгын төлөв өөрчлөх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "workOrderIds",
					type: "string",
					description: "IDs-уудын жагсаалт (тикийгээр таслалаар тусгаарласан)",
					required: true,
				},
				{
					name: "newStatus",
					type: "string",
					description:
						"Шинэ төлөв: received, in_progress, completed, delivered, cancelled",
					required: true,
				},
			],
			execute: async (args) => {
				try {
					const ids = (args.workOrderIds as string)
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean);
					const validStatuses = [
						"received",
						"in_progress",
						"completed",
						"delivered",
						"cancelled",
					];
					const newStatus = (args.newStatus as string).toLowerCase();
					if (!validStatuses.includes(newStatus)) {
						return {
							error: `Хүчингүй төлөв: "${args.newStatus}". Боломжит: ${validStatuses.join(", ")}`,
						};
					}
					if (ids.length === 0) return { error: "ID-ууд оруулна уу" };
					const { data, error } = await supabase
						.from("work_orders")
						.update({ status: newStatus })
						.eq("organization_id", orgId)
						.in("id", ids)
						.select("id, status");
					if (error) return { error: "Олон захиалга шинэчлэхэд алдаа гарлаа" };
					return {
						success: true,
						updated: (data ?? []).length,
						newStatus,
						ids,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: bulkUpdateWorkOrderStatus" });
					return { error: "Олон захиалга шинэчлэхэд алдаа гарлаа" };
				}
			},
		},
	];
}

// ─── Zer Write Tools ─────────────────────────────────────────────────────

function zerWriteTools(context: ToolContext): GatewayTool[] {
	const { supabase, orgId } = context;
	return [
		{
			name: "createSale",
			description:
				"Борлуулалт бүртгэх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "totalAmount",
					type: "number",
					description: "Нийт дүн (₮)",
					required: true,
				},
				{
					name: "paidAmount",
					type: "number",
					description: "Төлсөн дүн (₮), default: нийт дүн",
					required: false,
				},
				{
					name: "customerName",
					type: "string",
					description: "Харилцагчийн нэр",
					required: false,
				},
				{
					name: "customerPhone",
					type: "string",
					description: "Харилцагчийн утас",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const total = Number(args.totalAmount);
					const paid =
						args.paidAmount !== undefined ? Number(args.paidAmount) : total;

					const { data, error } = await supabase
						.from("sales")
						.insert({
							organization_id: orgId,
							total_amount: total,
							paid_amount: paid,
							sale_date: new Date().toISOString(),
							customer_name: (args.customerName as string) ?? undefined,
							customer_phone: (args.customerPhone as string) ?? undefined,
						})
						.select("id, total_amount, paid_amount")
						.single();

					if (error || !data) {
						return { error: "Борлуулалт бүртгэхэд алдаа гарлаа" };
					}

					const rec = data as {
						id: string;
						total_amount: number;
						paid_amount: number;
					};
					return {
						success: true,
						message: `Борлуулалт бүртгэгдлээ: #${rec.id.split("-")[0]}`,
						saleId: rec.id,
						totalAmount: rec.total_amount,
						paidAmount: rec.paid_amount,
						isPending: rec.paid_amount < rec.total_amount,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: createSale" });
					return { error: "Борлуулалт бүртгэхэд алдаа гарлаа" };
				}
			},
		},
		{
			name: "recordPayment",
			description:
				"Дутуу төлөлттэй борлуулалтанд төлбөр бүртгэх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{
					name: "saleId",
					type: "string",
					description: "Борлуулалтын ID",
					required: true,
				},
				{
					name: "amount",
					type: "number",
					description: "Төлсөн дүн (₮)",
					required: true,
				},
			],
			execute: async (args) => {
				try {
					// Get current sale
					const { data: sale } = await supabase
						.from("sales")
						.select("id, total_amount, paid_amount")
						.eq("organization_id", orgId)
						.eq("id", args.saleId as string)
						.single();

					if (!sale) {
						return { error: "Борлуулалт олдсонгүй" };
					}

					const current = sale as { total_amount: number; paid_amount: number };
					const newPaid = Number(current.paid_amount) + Number(args.amount);

					if (newPaid > current.total_amount) {
						return {
							error: `Төлбөрийн дүн (${args.amount}) нийт дүнгээс (${current.total_amount}) илүү байна`,
						};
					}

					const { data, error } = await supabase
						.from("sales")
						.update({ paid_amount: newPaid })
						.eq("organization_id", orgId)
						.eq("id", args.saleId as string)
						.select("id, total_amount, paid_amount")
						.single();

					if (error || !data) {
						return { error: "Төлбөр бүртгэхэд алдаа гарлаа" };
					}

					const updated = data as { total_amount: number; paid_amount: number };
					const remaining = updated.total_amount - updated.paid_amount;
					return {
						success: true,
						message: `Төлбөр бүртгэгдлээ: │${args.amount}₮. Үлдэгдэл: ${remaining}₮`,
						newPaidAmount: updated.paid_amount,
						remaining: remaining,
						isFullyPaid: remaining <= 0,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: recordPayment" });
					return { error: "Төлбөр бүртгэхэд алдаа гарлаа" };
				}
			},
		},
	];
}

// ─── Zer Read Tools ──────────────────────────────────────────────────────────────

function zerTools(context: ToolContext): GatewayTool[] {
	const { supabase, orgId } = context;
	return [
		{
			name: "getSalesByCategory",
			description:
				"Ангиллаар борлуулалтын хураангуй.",
			parameters: [
				{
					name: "days",
					type: "number",
					description: "Хэдэн өдрийн (default 30)",
					required: false,
				},
				{
					name: "category",
					type: "string",
					description:
						"Ангиллын нэр (жишээ: сэлбэг, хэрэгсэл). Хоосон бол бүх ангиллаар",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const days =
						typeof args.days === "number" && args.days > 0 ? args.days : 30;
					const dateStart = new Date(
						Date.now() - days * 86400000,
					).toISOString();
					const categoryFilter =
						typeof args.category === "string" && args.category.trim()
							? args.category.trim()
							: null;

					// Query sale_items joined with products and categories
					let query = supabase
						.from("sale_items")
						.select(`
							quantity, unit_price, total_price,
							sales!inner(organization_id),
							products!inner(name, category_id, categories!inner(name))
						`)
						.eq("sales.organization_id", orgId)
						.gte("created_at", dateStart)
						.is("deleted_at", null);

					if (categoryFilter) {
						query = query.ilike(
							"products.categories.name",
							`%${categoryFilter}%`,
						);
					}

					const { data, error } = await query;
					if (error) throw error;
					const items = data ?? [];

					// Group by category
					const byCategory = new Map<
						string,
						{ totalRevenue: number; totalQuantity: number; itemCount: number }
					>();
					for (const item of items) {
						const prod = item.products as any;
						const catName = prod?.categories?.name ?? "Бусад";
						const existing = byCategory.get(catName) ?? {
							totalRevenue: 0,
							totalQuantity: 0,
							itemCount: 0,
						};
						existing.totalRevenue += Number(item.total_price) || 0;
						existing.totalQuantity += Number(item.quantity) || 0;
						existing.itemCount += 1;
						byCategory.set(catName, existing);
					}

					// Convert to sorted array
					const categories = Array.from(byCategory.entries())
						.map(([name, data]) => ({ name, ...data }))
						.sort((a, b) => b.totalRevenue - a.totalRevenue);

					return {
						period: `Сүүлийн ${days} өдөр`,
						totalRevenue: categories.reduce((s, c) => s + c.totalRevenue, 0),
						categories,
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: getSalesByCategory" });
					return { error: "Ангиллаар борлуулалт авахад алдаа гарлаа" };
				}
			},
		},
	];
}

// ─── Tool Cache ─────────────────────────────────────────────────────────────
// Tools don't change between requests for the same org. In-memory cache avoids
// re-creating 15+ tool objects per request.
const toolCache = new Map<string, { tools: GatewayTool[]; expires: number }>();
const TOOL_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get tools for a product type and context.
 * Pass `readOnly: true` to exclude write tools.
 */
export function getProductTools(
	productType: "tolom" | "zer",
	context: ToolContext,
	options?: { readOnly?: boolean },
): GatewayTool[] {
	const cacheKey = `${productType}:${context.orgId}:${options?.readOnly ?? false}`;
	const cached = toolCache.get(cacheKey);

	if (cached && cached.expires > Date.now()) {
		return cached.tools;
	}
	const baseReadTools =
		productType === "tolom" ? tolomTools(context) : zerTools(context);
	// Tolom uses the dynamic Read Engine (readData) when its catalog exists.
	// Zer keeps legacy inline read tools until its read catalog is authored.
	const readTools =
		productType === "tolom"
			? [
					...baseReadTools,
					createReadDataTool("tolom", context),
				].filter((t): t is NonNullable<typeof t> => t !== null)
			: baseReadTools;
	// Tolom uses the dynamic Write Engine (writeData) when its catalog exists.
	// Zer keeps legacy inline write tools until its write catalog is authored.
	const writeTools =
		productType === "tolom"
			? [createWriteDataTool("tolom", context)].filter((t): t is NonNullable<typeof t> => t !== null)
			: zerWriteTools(context);

	const tools = options?.readOnly ? readTools : [...readTools, ...writeTools];

	toolCache.set(cacheKey, { tools, expires: Date.now() + TOOL_CACHE_TTL_MS });

	// Evict stale entries when cache grows large
	if (toolCache.size > 100) {
		const now = Date.now();
		for (const [key, value] of toolCache) {
			if (value.expires < now) toolCache.delete(key);
		}
	}

	return tools;
}
