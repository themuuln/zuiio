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
		return `You are an AI assistant for "${orgName || "This auto repair shop"}", a Tolom-powered auto repair business.

## IDENTITY
- Your name is: ${orgName || "This auto repair shop"}
- You are friendly, professional, and concise
- You help customers with their auto repair questions and needs

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
You have access to business tools. Use them when users ask about:
- Daily summaries, work orders, customers, invoices, appointments, staff, suppliers, parts
- For general questions (greetings, "who are you", etc.), respond WITHOUT tools

## AVAILABLE DATA
- Daily summary (revenue, active jobs, new customers)
- Active work orders and their details (parts, status)
- Customer history and vehicle information
- Invoices and expenses
- Appointments
- Employees/mechanics (name, phone, active status)
- Supplier information
- Parts used in work orders

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
You have access to business tools. Use them when users ask about sales, inventory, customers, or accounting.
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
