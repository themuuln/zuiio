import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GatewayTool, ToolContext } from "@/providers/types";

/**
 * Generate system prompt for a product type.
 * Shared between Mode A and Mode B webhooks.
 */
export function systemPromptFor(
 productType: string,
 orgId: string,
 chatType: string,
): string {
 const groupWarning = chatType !== "private"
  ? "\n\nАНХААРУУЛГА: Та group чат-д байна. Хэрэглэгчийн хувийн өгөгдлийг group-д бичиж болохгүй. Зөвхөн ерөнхий мэдээлэл өгнө үү."
  : "";

 if (productType === "tolom") {
  return `Та Tolom auto repair shop-ийн AI туслах бот юм.
Та Монгол хэлээр хариулна.
Та зөвхөн өгөгдсөн багаж (tool) ашиглан хариулна.
Байгууллагын ID: ${orgId}
${groupWarning}`;
 }

 return `Та Zer retail/accounting-ийн AI туслах бот юм.
Та Монгол хэлээр хариулна.
Та зөвхөн өгөгдсөн багаж (tool) ашиглан хариулна.
Байгууллагын ID: ${orgId}
${groupWarning}`;
}

// ─── Tolom Tools ───────────────────────────────────────────────────────────

function tolomTools(context: ToolContext): GatewayTool[] {
 const { supabase, orgId } = context;
 const now = new Date();
 const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
 const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
 const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
 const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
 const monthStartDate = monthStart.split("T")[0]!;

 return [
  {
   name: "getDailySummary",
   description: "Өнөөдрийн болон өчигдрийн хураангуй: орлого, идэвхтэй ажлын тоо, шинэ харилцагч",
   parameters: [],
   execute: async () => {
    try {
     const [workOrders, invoices, customers] = await Promise.all([
      supabase.from("work_orders").select("status, total_amount").eq("organization_id", orgId).is("deleted_at", null),
      supabase.from("invoices").select("total, amount_paid").eq("organization_id", orgId).is("deleted_at", null).gte("issued_at", monthStart),
      supabase.from("customers").select("id").eq("organization_id", orgId).is("deleted_at", null).gte("created_at", monthStartDate),
     ]);

     const activeWO = (workOrders.data ?? []).filter((wo: any) =>
      !["delivered", "cancelled", "completed"].includes(wo.status),
     );

     return {
      today: today.split("T")[0],
      activeWorkOrders: activeWO.length,
      totalWorkOrders: (workOrders.data ?? []).length,
      monthlyInvoices: (invoices.data ?? []).reduce((s: number, r: any) => s + (Number(r.total) || 0), 0),
      monthlyInvoicesPaid: (invoices.data ?? []).reduce((s: number, r: any) => s + (Number(r.amount_paid) || 0), 0),
      newCustomersThisMonth: (customers.data ?? []).length,
     };
    } catch { return { error: "Өдрийн хураангуй авахад алдаа гарлаа" }; }
   },
  },
  {
   name: "getActiveWorkOrders",
   description: "Идэвхтэй ажлын захиалгын жагсаалт, харилцагчийн нэр, утас, төлөв",
   parameters: [],
   execute: async () => {
    try {
     const { data } = await supabase
      .from("work_orders")
      .select("id, status, total_amount, plate_number, customers(full_name, phone)")
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
    } catch { return { error: "Ажлын жагсаалт авахад алдаа гарлаа" }; }
   },
  },
  {
   name: "getCustomerHistory",
   description: "Харилцагчийн түүх: утас эсвэл нэрээр хайх",
   parameters: [
    { name: "query", type: "string", description: "Харилцагчийн нэр эсвэл утасны дугаар", required: true },
   ],
   execute: async (args) => {
    try {
     const q = args.query as string;
     const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone, first_name, last_name, total_visits, last_visit_at")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(5);

     if (!data || data.length === 0) return { message: "Харилцагч олдсонгүй" };

     const customerIds = data.map((c: any) => c.id);
     const { data: vehicles } = await supabase
      .from("vehicles")
      .select("plate_number, make, model, year, customer_id")
      .eq("organization_id", orgId)
      .in("customer_id", customerIds)
      .is("deleted_at", null);

     const vehByCust = new Map<string, any[]>();
     for (const v of (vehicles ?? [])) {
      const list = vehByCust.get(v.customer_id) ?? [];
      list.push(v);
      vehByCust.set(v.customer_id, list);
     }

     return data.map((c: any) => {
      const vehs = vehByCust.get(c.id) ?? [];
      return {
       matchType: "name",
       customerName: (c.full_name ?? [c.first_name, c.last_name].filter(Boolean).join(" ")) || "—",
       phone: c.phone ?? "—",
       totalVisits: c.total_visits ?? 0,
       lastVisit: c.last_visit_at ?? null,
       vehicles: vehs.map((v: any) => ({
        plateNumber: v.plate_number,
        info: [v.make, v.model].filter(Boolean).join(" ") + (v.year ? ` (${v.year})` : ""),
       })),
      };
     });
    } catch { return { error: "Харилцагч хайхад алдаа гарлаа" }; }
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
      totalInvoiced: rows.reduce((s, r: any) => s + (Number(r.total) || 0), 0),
      totalPaid: rows.reduce((s, r: any) => s + (Number(r.amount_paid) || 0), 0),
      totalUnpaid: rows.reduce((s, r: any) => s + (Number(r.balance_due) || 0), 0),
      invoiceCount: rows.length,
     };
    } catch { return { error: "Нэхэмжлэлийн хураангуй авахад алдаа гарлаа" }; }
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
      const catName = (((r as any).expense_categories as any)?.name) ?? "Бусад";
      byCategory[catName] = (byCategory[catName] ?? 0) + amount;
     }
     return { total, byCategory, expenseCount: rows.length };
    } catch { return { error: "Зарлагын хураангуй авахад алдаа гарлаа" }; }
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
      .select("id, scheduled_at, status, customers(full_name, phone), vehicles(plate_number, make, model)")
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
      vehicle: [(a.vehicles as any)?.make, (a.vehicles as any)?.model].filter(Boolean).join(" "),
     }));
    } catch { return { error: "Цагийн жагсаалт авахад алдаа гарлаа" }; }
   },
  },
 ];
}

// ─── Zer Tools ──────────────────────────────────────────────────────────────

function zerTools(context: ToolContext): GatewayTool[] {
 const { supabase, orgId } = context;
 return [
  {
   name: "getSalesSummary",
   description: "Сүүлийн N өдрийн борлуулалтын хураангуй",
   parameters: [
    { name: "days", type: "number", description: "Хэдэн өдрийн (default 7)", required: false },
   ],
   execute: async (args) => {
    try {
     const days = typeof args.days === "number" && args.days > 0 ? args.days : 7;
     const dateStart = new Date(Date.now() - days * 86400000).toISOString();
     const { data } = await supabase
      .from("sales")
      .select("total_amount, paid_amount")
      .eq("organization_id", orgId)
      .gte("sale_date", dateStart);
     const rows = data ?? [];
     return {
      period: `Сүүлийн ${days} өдөр`,
      totalAmount: rows.reduce((s, r: any) => s + Number(r.total_amount), 0),
      totalPaid: rows.reduce((s, r: any) => s + ((r.paid_amount != null ? Number(r.paid_amount) : 0)), 0),
      saleCount: rows.length,
     };
    } catch { return { error: "Борлуулалтын хураангуй авахад алдаа гарлаа" }; }
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
    } catch { return { error: "Дутуу төлөлт авахад алдаа гарлаа" }; }
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
      totalAmount: rows.reduce((s, r: any) => s + Number(r.total_amount), 0),
      totalPaid: rows.reduce((s, r: any) => s + ((r.paid_amount != null ? Number(r.paid_amount) : 0)), 0),
      saleCount: rows.length,
     };
    } catch { return { error: "Өнөөдрийн борлуулалт авахад алдаа гарлаа" }; }
   },
  },
 ];
}

/**
 * Get tools for a product type and context.
 * Shared between Mode A and Mode B webhooks.
 */
export function getProductTools(
 productType: "tolom" | "zer",
 context: ToolContext,
): GatewayTool[] {
 return productType === "tolom" ? tolomTools(context) : zerTools(context);
}
