import { capture } from "@zuiio/capture";

import "server-only";

import type { GatewayTool, ToolContext } from "@/providers/types";

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
	// Fetch organization name for better context
	let orgName = "";
	try {
		const { createServiceClient } = await import("@/lib/supabase");
		const sb = createServiceClient();
		const { data } = await sb
			.from("organizations")
			.select("name")
			.eq("id", orgId)
			.single();
		if (data?.name) orgName = data.name;
	} catch {
		// If we can't fetch org name, continue without it
	}

	if (productType === "tolom") {
		if (lang === "en") {
			return `You are an AI business agent for "${orgName || "This auto repair shop"}", a Tolom-powered auto repair business.

## IDENTITY
- Your name is: ${orgName || "This auto repair shop"}
- You are a PROACTIVE business agent
- You take initiative: query data, analyze, and provide insights WITHOUT being asked

## RESPONSE FORMAT
- Use HTML formatting ONLY: <b>Bold</b>, <i>Italic</i>, <code>Code</code>
- Keep responses SHORT — 1-2 sentences maximum

## AGENT BEHAVIOR RULES
1. NEVER say "I don't have that data" — you have tools to query ANY business data
2. ALWAYS use tools when the user asks about business data
3. Query with the right date range based on what the user asks
4. Be proactive — after showing data, offer relevant next steps

## TOOL USAGE
You have flexible query tools for all business data. Use getVehicleAnalytics for vehicle questions, getFinancialSummary for financial questions, queryData for any table query. For write operations, describe what you'll do first.

## MULTI-STEP WIZARDS
When users want to do complex operations, guide them step by step:
- "Create work order" → Start work order wizard: ask customer name, plate, description
- "Book appointment" → Start appointment wizard: ask customer, date/time, description
- "Create invoice" → Start invoice wizard: ask customer, amount, description
- Keep each step to ONE question at a time
- After collecting all data, confirm with the user before submitting
Organization ID: ${orgId}${groupWarning}`;
		}
		return `You are an AI business agent for "${orgName || "This auto repair shop"}", a Tolom-powered auto repair business.

## IDENTITY
- Your name is: ${orgName || "This auto repair shop"}
- You are a PROACTIVE business agent — not just a chatbot
- You take initiative: query data, analyze, and provide insights WITHOUT being asked for each detail
- You are friendly, professional, and concise

## LANGUAGE RULES (NON-NEGOTIABLE — HIGHEST PRIORITY)
- CRITICAL: You MUST respond ONLY in Mongolian (Монгол хэл) — NO EXCEPTIONS
- Even if the user writes in English, Russian, or any other language — your response MUST be in Mongolian
- NEVER output English words, sentences, or phrases in your responses
- Translate everything to Mongolian before responding

## RESPONSE FORMAT
- Use HTML formatting ONLY: <b>Bold</b>, <i>Italic</i>, <code>Code</code>
- NEVER use Markdown formatting (no **bold**, no # headers, no | tables)
- NEVER generate markdown tables (| col | col |) — they don't render in Telegram
- When showing tabular data, use a simple list format instead
- Keep responses SHORT — 1-2 sentences maximum
- Be warm but brief, not verbose

## GREETINGS & CASUAL CHAT
When users say hello, goodbye, thanks, or ask casual questions:
- Respond briefly in Mongolian with a warm tone
- Example: User says "hi" → You say: "Сайн байна уу! Танд ямар тус хэрэгтэй вэ?"
- Example: "say hi please" → "Сайн байна уу! 👋"
- Example: "thanks" → "Танд талархалаа! Бусад зүйл байна уу?"
- Do NOT say "Welcome to [org name]" for every greeting — just greet warmly

## AGENT BEHAVIOR RULES (CRITICAL)
You are a BUSINESS AGENT with full database access. Follow these rules:

1. **NEVER say "I don't have that data" or "би тухайн мэдээлэлгүй байна"** — You have tools to query ANY business data. Use them.
2. **ALWAYS use tools when the user asks about business data** — revenue, expenses, work orders, customers, vehicles, appointments, invoices, parts, mechanics. Even for vague questions, query the data first.
3. **Query with the right date range** — If the user says "last year", set date_from to 1 year ago. If "this month", use month start. If "all time", omit date filters.
4. **Be proactive** — After showing requested data, offer relevant next steps. Example: if showing unpaid invoices, mention total outstanding.
5. **Use queryData for ANY table query** — It works with: work_orders, customers, vehicles, appointments, invoices, invoice_items, invoice_payments, expenses, suppliers, profiles, parts_catalog, service_catalog, sales, sales_items, cash_register_sessions, work_order_parts, work_order_services, mechanic_daily_reports.
6. **Use getVehicleAnalytics for vehicle-specific questions** — "Which car had the most repairs?", "Show me repair history for plate 1234AB"
7. **Use getFinancialSummary for financial questions** — "How much revenue this quarter?", "Show expenses by category"
8. **Use getDailySummary for today's quick overview**
9. **Use getActiveWorkOrders for current active jobs**
10. **For write operations** (create work order, update status, record payment, create appointment) — describe what you'll do, then call the tool. The system will ask for confirmation.

## TOOL USAGE
You have access to these tools. Use them proactively:
- <b>queryData</b> — Flexible query for ANY table with date ranges, filters, sorting, aggregation
- <b>getVehicleAnalytics</b> — Vehicle repair stats (which car most repairs, total revenue per vehicle)
- <b>getFinancialSummary</b> — Revenue, expenses, payments over any period
- <b>getDailySummary</b> — Today's quick overview
- <b>getActiveWorkOrders</b> — Current active jobs
- <b>getCustomerHistory</b> — Customer search by name/phone
- <b>getInvoiceStatus</b> — Current month invoice summary
- <b>getExpensesSummary</b> — Current month expenses by category
- <b>getAppointments</b> — Upcoming appointments
- <b>getMechanics</b> — Staff/mechanic list
- <b>getWorkOrderDetails</b> — Detailed work order with parts
- <b>getSuppliers</b> — Supplier list
- <b>createWorkOrder</b> — Create new work order (requires confirmation)
- <b>updateWorkOrderStatus</b> — Change work order status (requires confirmation)
- <b>updateWorkOrderDetails</b> — Update description/notes/amount (requires confirmation)
- <b>createInvoice</b> — Create invoice (requires confirmation)
- <b>recordPayment</b> — Record payment against invoice (requires confirmation)
- <b>createAppointment</b> — Book appointment (requires confirmation)

For general questions (greetings, "who are you", etc.), respond WITHOUT tools.

## AVAILABLE DATA
You can query ALL business data including:
- Work orders (all statuses, full history, parts, services)
- Customers and their vehicles
- Vehicles (plate, make, model, year, repair history)
- Invoices and payments
- Expenses by category
- Appointments
- Employees/mechanics (name, phone, active status)
- Suppliers
- Parts catalog and pricing
- Service catalog and pricing
- Sales history
- Cash register sessions
- Mechanic daily reports

## MULTI-STEP WIZARDS
When users want to do complex operations, guide them step by step:
- "Захиалга үүсгэе" → Start work order wizard: ask customer name, plate, description
- "Цаг захиалга үүсгэе" → Start appointment wizard: ask customer, date/time, description
- "Нэхэмжлэх үүсгэе" → Start invoice wizard: ask customer, amount, description
- Keep each step to ONE question at a time
- After collecting all data, confirm with the user before submitting
Organization ID: ${orgId}${groupWarning}`;
	}

	if (lang === "en") {
		return `You are an AI assistant for "${orgName || "This store"}", a Zer-powered retail/accounting business.

## IDENTITY
- Your name is: ${orgName || "This store"}
- You are a PROACTIVE business agent
- You take initiative: query data, analyze, and provide insights WITHOUT being asked

## RESPONSE FORMAT
- Use HTML formatting ONLY: <b>Bold</b>, <i>Italic</i>, <code>Code</code>
- Keep responses SHORT — 1-2 sentences maximum

## AGENT BEHAVIOR RULES
1. NEVER say "I don't have that data" — you have tools to query ANY business data
2. ALWAYS use tools when the user asks about business data
3. Query with the right date range based on what the user asks
4. Be proactive — after showing data, offer relevant next steps

## TOOL USAGE
You have flexible query tools for all business data.
- For sales by product category (e.g. "spare parts sales"), use getSalesByCategory
- For general sales summaries, use getTodaySales or getSalesSummary

Organization ID: ${orgId}${groupWarning}`;
	}
	return `You are an AI assistant for "${orgName || "This store"}", a Zer-powered retail/accounting business.

## IDENTITY
- Your name is: ${orgName || "This store"}
- You are friendly, professional, and concise
- You help customers with retail and accounting questions

## LANGUAGE RULES (NON-NEGOTIABLE — HIGHEST PRIORITY)
- CRITICAL: You MUST respond ONLY in Mongolian (Монгол хэл) — NO EXCEPTIONS
- Even if the user writes in English, Russian, or any other language — your response MUST be in Mongolian
- NEVER output English words, sentences, or phrases in your responses
- Translate everything to Mongolian before responding

## RESPONSE FORMAT
- Use HTML formatting ONLY: <b>Bold</b>, <i>Italic</i>, <code>Code</code>
- NEVER use Markdown formatting (no **bold**, no # headers, no | tables)
- NEVER generate markdown tables (| col | col |) — they don't render in Telegram
- When showing tabular data, use a simple list format instead
- Keep responses SHORT — 1-2 sentences maximum
- Be warm but brief, not verbose

## GREETINGS & CASUAL CHAT
When users say hello, goodbye, thanks, or ask casual questions:
- Respond briefly in Mongolian with a warm tone
- Example: User says "hi" → You say: "Сайн байна уу! Танд ямар тус хэрэгтэй вэ?"
- Example: User says "say hi please" → You say: "Сайн байна уу! 👋"
- Example: User says "thanks" → You say: "Танд талархалаа! Бусад зүйл байна уу?"
- Do NOT say "Welcome to [org name]" for every greeting — just greet warmly

## TOOL USAGE
you have access to business tools. Use them when users ask about sales, inventory, customers, or accounting.
- For sales by product category (жишээ: "сэлбэгийн борлуулалт", "ангиллаар орлого"), use getSalesByCategory
- For general sales summaries, use getTodaySales or getSalesSummary
For general questions (greetings, "who are you", etc.), respond WITHOUT tools.

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
			name: "getActiveWorkOrders",
			description:
				"Идэвхтэй ажлын захиалгын жагсаалт, харилцагчийн нэр, утас, төлөв",
			parameters: [],
			execute: async () => {
				try {
					const { data } = await supabase
						.from("work_orders")
						.select(
							"id, status, total_amount, plate_number, customers(full_name, phone)",
						)
						.eq("organization_id", orgId)
						.is("deleted_at", null)
						.not("status", "in", '("delivered","cancelled","completed")')
						.order("created_at", { ascending: false })
						.limit(20);
					return (data ?? []).map((wo: any) => ({
						id: wo.id,
						status: wo.status,
						total: Number(wo.total_amount) || 0,
						plate: wo.plate_number ?? "—",
						customerName: (wo.customers as any)?.full_name ?? "—",
						phone: (wo.customers as any)?.phone ?? "—",
					}));
			} catch (err) {
				capture(err, { context: "agent-gateway: getActiveWorkOrders" });
				return { error: "Ажлын жагсаалт авахад алдаа гарлаа" };
			}
			},
		},
		{
			name: "getCustomerHistory",
			description: "Харилцагчийн түүх: утас эсвэл нэрээр хайх",
			parameters: [
				{
					name: "query",
					type: "string",
					description: "Харилцагчийн нэр эсвэл утасны дугаар",
					required: true,
				},
			],
			execute: async (args) => {
				try {
					const q = args.query as string;
					const { data } = await supabase
						.from("customers")
						.select(
							"id, full_name, phone, first_name, last_name, total_visits, last_visit_at",
						)
						.eq("organization_id", orgId)
						.is("deleted_at", null)
						.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
						.limit(5);

					if (!data || data.length === 0)
						return { message: "Харилцагч олдсонгүй" };

					const customerIds = data.map((c: any) => c.id);
					const { data: vehicles } = await supabase
						.from("vehicles")
						.select("plate_number, make, model, year, customer_id")
						.eq("organization_id", orgId)
						.in("customer_id", customerIds)
						.is("deleted_at", null);

					const vehByCust = new Map<string, any[]>();
					for (const v of vehicles ?? []) {
						const list = vehByCust.get(v.customer_id) ?? [];
						list.push(v);
						vehByCust.set(v.customer_id, list);
					}

					return data.map((c: any) => {
						const vehs = vehByCust.get(c.id) ?? [];
						return {
							matchType: "name",
							customerName:
								(c.full_name ??
									[c.first_name, c.last_name].filter(Boolean).join(" ")) ||
								"—",
							phone: c.phone ?? "—",
							totalVisits: c.total_visits ?? 0,
							lastVisit: c.last_visit_at ?? null,
							vehicles: vehs.map((v: any) => ({
								plateNumber: v.plate_number,
								info:
									[v.make, v.model].filter(Boolean).join(" ") +
									(v.year ? ` (${v.year})` : ""),
							})),
						};
					});
			} catch (err) {
				capture(err, { context: "agent-gateway: getCustomerHistory" });
				return { error: "Харилцагч хайхад алдаа гарлаа" };
			}
			},
		},
		{
			name: "getInvoiceStatus",
			description: "Тухайн сарын нэхэмжлэлийн хураангуй",
			parameters: [],
			execute: async () => {
				try {
					const { data } = await supabase
						.from("invoices")
						.select("total, amount_paid, balance_due, status")
						.eq("organization_id", orgId)
						.is("deleted_at", null)
						.gte("issued_at", monthStart)
						.lte("issued_at", monthEnd);

					const rows = data ?? [];
					return {
						totalInvoiced: rows.reduce(
							(s, r: any) => s + (Number(r.total) || 0),
							0,
						),
						totalPaid: rows.reduce(
							(s, r: any) => s + (Number(r.amount_paid) || 0),
							0,
						),
						totalUnpaid: rows.reduce(
							(s, r: any) => s + (Number(r.balance_due) || 0),
							0,
						),
						invoiceCount: rows.length,
					};
			} catch (err) {
				capture(err, { context: "agent-gateway: getInvoiceStatus" });
				return { error: "Нэхэмжлэлийн хураангуй авахад алдаа гарлаа" };
			}
			},
		},
		{
			name: "getExpensesSummary",
			description: "Тухайн сарын зарлагын хураангуй, категориор",
			parameters: [],
			execute: async () => {
				try {
					const { data } = await supabase
						.from("expenses")
						.select("amount, expense_categories(name)")
						.eq("organization_id", orgId)
						.is("deleted_at", null)
						.gte("expense_date", monthStart)
						.lte("expense_date", monthEnd);

					const rows = data ?? [];
					const byCategory: Record<string, number> = {};
					let total = 0;
					for (const r of rows) {
						const amount = Number((r as any).amount) || 0;
						total += amount;
						const catName =
							((r as any).expense_categories as any)?.name ?? "Бусад";
						byCategory[catName] = (byCategory[catName] ?? 0) + amount;
					}
					return { total, byCategory, expenseCount: rows.length };
			} catch (err) {
				capture(err, { context: "agent-gateway: getExpensesSummary" });
				return { error: "Зарлагын хураангуй авахад алдаа гарлаа" };
			}
			},
		},
		{
			name: "getAppointments",
			description: "Өнөөдрийн болон ирэх цагууд",
			parameters: [],
			execute: async () => {
				try {
					const { data } = await supabase
						.from("appointments")
						.select(
							"id, scheduled_at, status, customers(full_name, phone), vehicles(plate_number, make, model)",
						)
						.eq("organization_id", orgId)
						.is("deleted_at", null)
						.gte("scheduled_at", today)
						.order("scheduled_at", { ascending: true })
						.limit(15);
					return (data ?? []).map((a: any) => ({
						id: a.id,
						scheduledAt: a.scheduled_at,
						status: a.status,
						customerName: (a.customers as any)?.full_name ?? "—",
						phone: (a.customers as any)?.phone ?? "—",
						plate: (a.vehicles as any)?.plate_number ?? "—",
						vehicle: [(a.vehicles as any)?.make, (a.vehicles as any)?.model]
							.filter(Boolean)
							.join(" "),
					}));
			} catch (err) {
				capture(err, { context: "agent-gateway: getAppointments" });
				return { error: "Цагийн жагсаалт авахад алдаа гарлаа" };
			}
			},
		},
		{
			name: "getMechanics",
			description: "Ажилтнууд/механикчдын жагсаалт: нэр, утас, идэвхтэй эсэх",
			parameters: [],
			execute: async () => {
				try {
					const { data } = await supabase
						.from("profiles")
						.select("id, full_name, phone, is_active, username")
						.eq("organization_id", orgId)
						.order("full_name");
					return (data ?? []).map((p: any) => ({
						name: p.full_name ?? "—",
						phone: p.phone ?? "—",
						isActive: p.is_active,
						username: p.username ?? "—",
					}));
				} catch (err) {
					capture(err, { context: "agent-gateway: getMechanics" });
					return { error: "Ажилтнуудын жагсаалт авахад алдаа гарлаа" };
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
							.select("*, customers(full_name, phone), vehicles(plate_number, make, model, year)")
							.eq("id", woId)
							.eq("organization_id", orgId)
							.single(),
						supabase
							.from("work_order_parts")
							.select("part_name, part_number, quantity, unit_price, final_price")
							.eq("work_order_id", woId)
							.eq("organization_id", orgId),
					]);
					if (woRes.error || !woRes.data) return { error: "Ажлын захиалга олдсонгүй" };
					const wo = woRes.data;
					return {
						id: wo.id,
						status: wo.status,
						total: Number(wo.total_amount) || 0,
						plate: wo.plate_number ?? (wo.vehicles as any)?.plate_number ?? "—",
						vehicle: [(wo.vehicles as any)?.make, (wo.vehicles as any)?.model].filter(Boolean).join(" "),
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
			name: "getSuppliers",
			description: "Нийлүүлэгчдийн жагсаалт: нэр, холбоо барих",
			parameters: [],
			execute: async () => {
				try {
					const { data } = await supabase
						.from("suppliers")
						.select("name, contact_person, phone, email, is_active")
						.eq("organization_id", orgId)
						.is("deleted_at", null)
						.order("name");
					return (data ?? []).map((s: any) => ({
						name: s.name,
						contactPerson: s.contact_person ?? "—",
						phone: s.phone ?? "—",
						email: s.email ?? "—",
						isActive: s.is_active,
					}));
				} catch (err) {
					capture(err, { context: "agent-gateway: getSuppliers" });
					return { error: "Нийлүүлэгчдийн жагсаалт авахад алдаа гарлаа" };
				}
			},
		},
		// ─── Flexible Query Tools ────────────────────────────────────────
		{
			name: "queryData",
			description:
				"Бүх төрлийн бизнес өгөгдлийг уян хатан хугацааны хязгаартайгаар асуух. Хүсэлтийг шүүх, эрэмбэлэх, бүлэглэх боломжтой. Баганууд: work_orders, customers, vehicles, appointments, invoices, invoice_items, invoice_payments, expenses, suppliers, profiles, parts_catalog, service_catalog, sales, sales_items, cash_register_sessions.",
			parameters: [
				{
					name: "table",
					type: "string",
					description: "Өгөгдлийн сан (жагсаалтыг үз)",
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
				{
					name: "filters",
					type: "string",
					description:
						'Шүүлтүүр JSON форматаар. Жишээ: {"status":"in_progress"} эсвэл {"plate_number":"1234AB"}',
					required: false,
				},
				{
					name: "sort_by",
					type: "string",
					description: "Эрэмбэлэх багана (default: created_at)",
					required: false,
				},
				{
					name: "sort_order",
					type: "string",
					description: "Эрэмбэлэх чиглэл: asc эсвэл desc (default: desc)",
					required: false,
				},
				{
					name: "limit",
					type: "number",
					description: "Хамгийн их тоо (default: 20, макс 100)",
					required: false,
				},
				{
					name: "aggregate",
					type: "string",
					description: 'Нэгтгэх: "count", "sum:<column>", "avg:<column>" эсвэл "group:<column>"',
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const table = (args.table as string)?.toLowerCase();
					const allowedTables: Record<string, { dateCol: string }> = {
						work_orders: { dateCol: "created_at" },
						customers: { dateCol: "created_at" },
						vehicles: { dateCol: "created_at" },
						appointments: { dateCol: "scheduled_at" },
						invoices: { dateCol: "issued_at" },
						invoice_items: { dateCol: "created_at" },
						invoice_payments: { dateCol: "paid_at" },
						expenses: { dateCol: "expense_date" },
						suppliers: { dateCol: "created_at" },
						profiles: { dateCol: "created_at" },
						parts_catalog: { dateCol: "created_at" },
						service_catalog: { dateCol: "created_at" },
						sales: { dateCol: "sale_date" },
						sales_items: { dateCol: "created_at" },
						cash_register_sessions: { dateCol: "date" },
						work_order_parts: { dateCol: "created_at" },
						work_order_services: { dateCol: "created_at" },
						mechanic_daily_reports: { dateCol: "report_date" },
					};
					if (!table || !allowedTables[table]) {
						return {
							error: `Хүчингүй багана: "${args.table}". Зөвшөөрөгдсөн: ${Object.keys(allowedTables).join(", ")}`,
						};
					}

					const dateCol = allowedTables[table].dateCol;
					const limit = Math.min(
						typeof args.limit === "number" ? args.limit : 20,
						100,
					);

					let query = supabase.from(table).select("*").eq("organization_id", orgId);

					if (!["profiles"].includes(table)) {
						query = query.is("deleted_at", null);
					}

					// Date filters
					if (args.date_from && typeof args.date_from === "string") {
						query = query.gte(dateCol, args.date_from);
					}
					if (args.date_to && typeof args.date_to === "string") {
						const endDate = args.date_to.includes("T")
							? args.date_to
							: `${args.date_to}T23:59:59Z`;
						query = query.lte(dateCol, endDate);
					}

					// Custom filters
					if (args.filters && typeof args.filters === "string") {
						try {
							const parsed = JSON.parse(args.filters) as Record<string, string>;
							for (const [key, value] of Object.entries(parsed)) {
								query = query.eq(key, value);
							}
						} catch {
							return { error: "Шүүлтүүрийн формат буруу байна" };
						}
					}

					// Sorting
					const sortCol =
						typeof args.sort_by === "string" ? args.sort_by : dateCol;
					const sortAsc = args.sort_order === "asc";
					query = query.order(sortCol, { ascending: sortAsc });

					// Aggregate
					const aggregate =
						typeof args.aggregate === "string" ? args.aggregate : undefined;

					if (aggregate === "count") {
						const { data, error } = await query.select("id").limit(10000);
						if (error) return { error: "Тоолох алдаа гарлаа" };
						return { table, count: (data ?? []).length };
					}

					if (aggregate?.startsWith("sum:")) {
						const col = aggregate.split(":")[1];
						const { data, error } = await query.select(col).limit(1000);
						if (error) return { error: "Нэмэх алдаа гарлаа" };
						const total = (data ?? []).reduce(
							(s: number, r: any) => s + (Number(r[col]) || 0),
							0,
						);
						return { table, column: col, total, rowCount: data?.length ?? 0 };
					}

					if (aggregate?.startsWith("avg:")) {
						const col = aggregate.split(":")[1];
						const { data, error } = await query.select(col).limit(1000);
						if (error) return { error: "Дундаж тооцох алдаа гарлаа" };
						const rows = data ?? [];
						const total = rows.reduce(
							(s: number, r: any) => s + (Number(r[col]) || 0),
							0,
						);
						return {
							table,
							column: col,
							average: rows.length > 0 ? total / rows.length : 0,
							rowCount: rows.length,
						};
					}

					if (aggregate?.startsWith("group:")) {
						const col = aggregate.split(":")[1];
						const { data, error } = await query.select(`*, ${col}`).limit(
							1000,
						);
						if (error) return { error: "Бүлэглэх алдаа гарлаа" };
						const groups: Record<string, number> = {};
						for (const r of data ?? []) {
							const row = r as unknown as Record<string, unknown>;
							const key = String(row[col] ?? "—");
							groups[key] = (groups[key] ?? 0) + 1;
						}
						return { table, groupBy: col, groups };
					}

					// Default: return rows
					const { data, error } = await query.limit(limit);
					if (error) {
						console.error("[queryData]", error);
						return { error: "Өгөгдөл авахад алдаа гарлаа" };
					}
					return { table, rows: data ?? [], count: (data ?? []).length };
				} catch (err) {
					capture(err, { context: "agent-gateway: queryData" });
					return { error: "Өгөгдөл авахад алдаа гарлаа" };
				}
			},
		},
		{
			name: "getVehicleAnalytics",
			description:
				"Машин бүрийн засварын тоо, нийт орлого, сүүлийн засварын огноо гэх мэт аналитик. Хугацааны хязгаар нэмж болно.",
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
					description: "Эрэмбэлэх: repair_count, total_revenue, last_repair (default: repair_count)",
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

					let vehicles = Array.from(vehicleMap.values());
					const sortBy = typeof args.sort_by === "string" ? args.sort_by : "repair_count";
					if (sortBy === "total_revenue") {
						vehicles.sort((a, b) => b.totalRevenue - a.totalRevenue);
					} else if (sortBy === "last_repair") {
						vehicles.sort((a, b) =>
							b.lastRepair.localeCompare(a.lastRepair),
						);
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
				"Орлого, зарлага, төлбөрийн хураангуй тодорхой хугацаанд. Тухайн сар, улирал, жилээр асууж болно.",
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
						const cat =
							((r as any).expense_categories as any)?.name ?? "Бусад";
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
			description: "Өгөгдлийг CSV болгож экспортлох. Хүснэгт, хугацааны хязгаартай.",
			parameters: [
				{ name: "table", type: "string", description: "Хүснэгтийн нэр (work_orders, invoices, customers, expenses, sales)", required: true },
				{ name: "date_from", type: "string", description: "Эхлэх огноо (YYYY-MM-DD)", required: false },
				{ name: "date_to", type: "string", description: "Дуусах огноо (YYYY-MM-DD)", required: false },
			],
			execute: async (args) => {
				try {
					const table = (args.table as string)?.toLowerCase();
					const allowedTables: Record<string, { dateCol: string; select: string }> = {
						work_orders: { dateCol: "created_at", select: "id, status, description, total_amount, created_at" },
						invoices: { dateCol: "issued_at", select: "id, invoice_number, status, total, amount_paid, balance_due, issued_at" },
						customers: { dateCol: "created_at", select: "id, full_name, phone, email, total_visits" },
						expenses: { dateCol: "expense_date", select: "id, amount, description, expense_date" },
						sales: { dateCol: "sale_date", select: "id, total_amount, paid_amount, sale_date, customer_name" },
					};
					if (!table || !allowedTables[table]) {
						return { error: `Экспортлох боломжгүй хүснэгт: "${args.table}"` };
					}
					const cfg = allowedTables[table];
					let query = supabase.from(table).select(cfg.select).eq("organization_id", orgId).is("deleted_at", null);
					if (args.date_from && typeof args.date_from === "string") query = query.gte(cfg.dateCol, args.date_from);
					if (args.date_to && typeof args.date_to === "string") query = query.lte(cfg.dateCol, `${args.date_to}T23:59:59Z`);
					const { data, error } = await query.order(cfg.dateCol, { ascending: false }).limit(500);
					if (error) return { error: "Өгөгдөл татахад алдаа гарлаа" };
					const rows = data ?? [];
					if (rows.length === 0) return { message: "Өгөгдөл олдсонгүй", csv: "" };
					const headers = Object.keys((rows[0] ?? {}) as unknown as Record<string, unknown>);
					const csvRows = (rows as unknown as Record<string, unknown>[]).map((r) =>
						headers.map((h) => {
							const val = r[h];
							if (val === null || val === undefined) return "";
							if (typeof val === "object") return JSON.stringify(val);
							const str = String(val);
							return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
						}).join(",")
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
			description: "Сэлбэгийн үнийн мэдээлэл хайх. Дотоод каталог болон түүхэн үнэ.",
			parameters: [
				{ name: "query", type: "string", description: "Сэлбэгийн нэр, дугаар эсвэл тодорхойлолт", required: true },
			],
			execute: async (args) => {
				try {
					const q = args.query as string;
					const { data: internalParts } = await supabase
						.from("parts_catalog")
						.select("id, name, part_number, unit_price, category")
						.eq("organization_id", orgId)
						.is("deleted_at", null)
						.or(`name.ilike.%${q}%,part_number.ilike.%${q}%`)
						.limit(10);
					const { data: historicalParts } = await supabase
						.from("work_order_parts")
						.select("part_name, part_number, unit_price, final_price, created_at")
						.eq("organization_id", orgId)
						.or(`part_name.ilike.%${q}%,part_number.ilike.%${q}%`)
						.order("created_at", { ascending: false })
						.limit(10);
					return {
						query: q,
						internalCatalog: (internalParts ?? []).map((p: Record<string, unknown>) => ({
							name: p.name, partNumber: p.part_number, price: Number(p.unit_price) || 0, category: p.category,
						})),
						historicalPricing: (historicalParts ?? []).map((p: Record<string, unknown>) => ({
							name: p.part_name, partNumber: p.part_number, unitPrice: Number(p.unit_price) || 0, date: p.created_at,
						})),
					};
				} catch (err) {
					capture(err, { context: "agent-gateway: partsLookup" });
					return { error: "Сэлбэг хайхад алдаа гарлаа" };
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
				"Шинэ ажлын захиалга үүсгэх. Харилцагч, улсын дугаар, тайлбар, нийт дүн зэргийг оруулна. БАТАЛГААЖУУЛАЛТЫН багаж — гүйцэтгэхийн өмнө хэрэглэгчээс зөвшөөрөл авах шаардлагатай.",
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
				"Ажлын захиалгын төлөвийг өөрчлөх. Боломжит: received, in_progress, completed, delivered, cancelled. БАТАЛГААЖУУЛАЛТЫН багаж.",
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
				"Шинэ нэхэмжлэх үүсгэх. Харилцагч, дүн, тайлбар оруулна. БАТАЛГААЖУУЛАЛТЫН багаж.",
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
				"Ажлын захиалгын дэлгэрэнгүйг засах: тайлбар, тэмдэглээ, нийт дүн. БАТАЛГААЖУУЛАЛТЫН багаж.",
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
			description:
				"Нэхэмжлэх дээр төлбөр бүртгэх. БАТАЛГААЖУУЛАЛТЫН багаж.",
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
						return { error: `Хүчингүй төлбөрийн хэрэгсэл: "${method}". Боломжит: ${validMethods.join(", ")}` };
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
			description:
				"Шинэ цаг захиалга үүсгэх. БАТАЛГААЖУУЛАЛТЫН багаж.",
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
			description:
				"Нэхэмжлэхийг PDF болгож илгээх. БАТАЛГААЖУУЛАЛТЫН багаж.",
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
			description: "Сануулга үүсгэх. Тодорхой хугацааны дараа мессеж илгээнэ. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{ name: "message", type: "string", description: "Сануулгын агуулга", required: true },
				{ name: "remindAt", type: "string", description: "Хэзээ сануулах (YYYY-MM-DDTHH:MM)", required: true },
			],
			execute: async (args) => {
				try {
					const message = args.message as string;
					const remindAt = args.remindAt as string;
					const { error } = await supabase.from("notifications").insert({
						organization_id: orgId, type: "reminder", title: "Сануулга",
						message, scheduled_for: remindAt, is_read: false,
					});
					if (error) return { success: true, message: `Сануулга тэмдэглэгдлээ: ${message} (${remindAt})` };
					return { success: true, message: `Сануулга амжилттай үүслээ: ${message} (${remindAt})` };
				} catch (err) {
					capture(err, { context: "agent-gateway: createReminder" });
					return { error: "Сануулга үүсгэхэд алдаа гарлаа" };
				}
			},
		},
		{
			name: "bulkUpdateWorkOrderStatus",
			description: "Олон ажлын захиалгын төлөвийг нэгэн зэрэг өөрчлөх. БАТАЛГААЖУУЛАЛТЫН багаж.",
			parameters: [
				{ name: "workOrderIds", type: "string", description: "IDs-уудын жагсаалт (тикийгээр таслалаар тусгаарласан)", required: true },
				{ name: "newStatus", type: "string", description: "Шинэ төлөв: received, in_progress, completed, delivered, cancelled", required: true },
			],
			execute: async (args) => {
				try {
					const ids = (args.workOrderIds as string).split(",").map(s => s.trim()).filter(Boolean);
					const validStatuses = ["received", "in_progress", "completed", "delivered", "cancelled"];
					const newStatus = (args.newStatus as string).toLowerCase();
					if (!validStatuses.includes(newStatus)) {
						return { error: `Хүчингүй төлөв: "${args.newStatus}". Боломжит: ${validStatuses.join(", ")}` };
					}
					if (ids.length === 0) return { error: "ID-ууд оруулна уу" };
					const { data, error } = await supabase
						.from("work_orders")
						.update({ status: newStatus })
						.eq("organization_id", orgId)
						.in("id", ids)
						.select("id, status");
					if (error) return { error: "Олон захиалга шинэчлэхэд алдаа гарлаа" };
					return { success: true, updated: (data ?? []).length, newStatus, ids };
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
				"Шинэ борлуулалт бүртгэх. Дүн, төлсөн дүн, төлбөрийн арга зэргийг оруулна. БАТАЛГААЖУУЛАЛТЫН багаж.",
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
			name: "getSalesSummary",
			description: "Сүүлийн N өдрийн борлуулалтын хураангуй",
			parameters: [
				{
					name: "days",
					type: "number",
					description: "Хэдэн өдрийн (default 7)",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const days =
						typeof args.days === "number" && args.days > 0 ? args.days : 7;
					const dateStart = new Date(
						Date.now() - days * 86400000,
					).toISOString();
					const { data } = await supabase
						.from("sales")
						.select("total_amount, paid_amount")
						.eq("organization_id", orgId)
						.gte("sale_date", dateStart);
					const rows = data ?? [];
					return {
						period: `Сүүлийн ${days} өдөр`,
						totalAmount: rows.reduce(
							(s, r: any) => s + Number(r.total_amount),
							0,
						),
						totalPaid: rows.reduce(
							(s, r: any) =>
								s + (r.paid_amount != null ? Number(r.paid_amount) : 0),
							0,
						),
						saleCount: rows.length,
					};
			} catch (err) {
				capture(err, { context: "agent-gateway: getSalesSummary" });
				return { error: "Борлуулалтын хураангуй авахад алдаа гарлаа" };
			}
			},
		},
		{
			name: "getPendingSales",
			description: "Дутуу төлөлттэй борлуулалтууд",
			parameters: [],
			execute: async () => {
				try {
					const { data } = await supabase
						.from("sales")
						.select("id, sale_date, total_amount, paid_amount")
						.eq("organization_id", orgId)
						.or("paid_amount.is.null,paid_amount.lt.total_amount")
						.order("sale_date", { ascending: false })
						.limit(10);
					return (data ?? []).map((s: any) => ({
						id: s.id,
						saleDate: s.sale_date,
						totalAmount: Number(s.total_amount),
						paidAmount: s.paid_amount != null ? Number(s.paid_amount) : 0,
					}));
			} catch (err) {
				capture(err, { context: "agent-gateway: getPendingSales" });
				return { error: "Дутуу төлөлт авахад алдаа гарлаа" };
			}
			},
		},
		{
			name: "getTodaySales",
			description: "Өнөөдрийн борлуулалтын хураангуй",
			parameters: [],
			execute: async () => {
				try {
					const dayStart = new Date();
					dayStart.setHours(0, 0, 0, 0);
					const { data } = await supabase
						.from("sales")
						.select("total_amount, paid_amount")
						.eq("organization_id", orgId)
						.gte("sale_date", dayStart.toISOString());
					const rows = data ?? [];
					return {
						date: dayStart.toISOString(),
						totalAmount: rows.reduce(
							(s, r: any) => s + Number(r.total_amount),
							0,
						),
						totalPaid: rows.reduce(
							(s, r: any) =>
								s + (r.paid_amount != null ? Number(r.paid_amount) : 0),
							0,
						),
						saleCount: rows.length,
					};
			} catch (err) {
				capture(err, { context: "agent-gateway: getTodaySales" });
				return { error: "Өнөөдрийн борлуулалт авахад алдаа гарлаа" };
			}
			},
		},
		{
			name: "getSalesByCategory",
			description: "Бүтээгдэхүүний ангиллаар борлуулалтын хураангуй. Жишээ: сэлбэг, хэрэгсэл гэх мэт",
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
					description: "Ангиллын нэр (жишээ: сэлбэг, хэрэгсэл). Хоосон бол бүх ангиллаар",
					required: false,
				},
			],
			execute: async (args) => {
				try {
					const days = typeof args.days === "number" && args.days > 0 ? args.days : 30;
					const dateStart = new Date(Date.now() - days * 86400000).toISOString();
					const categoryFilter = typeof args.category === "string" && args.category.trim() ? args.category.trim() : null;

					// Query sale_items joined with products and categories
					let query = supabase
						.from("sale_items")
						.select(`
							quantity, unit_price, total_price,
							products!inner(name, category_id, categories!inner(name))
						`)
						.gte("created_at", dateStart)
						.is("deleted_at", null);

					if (categoryFilter) {
						query = query.ilike("products.categories.name", `%${categoryFilter}%`);
					}

					const { data, error } = await query;
					if (error) throw error;
					const items = data ?? [];

					// Group by category
					const byCategory = new Map<string, { totalRevenue: number; totalQuantity: number; itemCount: number }>();
					for (const item of items) {
						const prod = item.products as any;
						const catName = prod?.categories?.name ?? "Бусад";
						const existing = byCategory.get(catName) ?? { totalRevenue: 0, totalQuantity: 0, itemCount: 0 };
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

/**
 * Get tools for a product type and context.
 * Pass `readOnly: true` to exclude write tools.
 */
export function getProductTools(
	productType: "tolom" | "zer",
	context: ToolContext,
	options?: { readOnly?: boolean },
): GatewayTool[] {
	const readTools =
		productType === "tolom" ? tolomTools(context) : zerTools(context);
	const writeTools =
		productType === "tolom" ? tolomWriteTools(context) : zerWriteTools(context);

	if (options?.readOnly) return readTools;
	return [...readTools, ...writeTools];
}
