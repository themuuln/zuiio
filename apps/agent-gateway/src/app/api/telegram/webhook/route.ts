import { NextResponse } from "next/server";
import type { TelegramUpdate } from "@/channels/types";
import { TelegramChannel } from "@/channels/telegram";
import { resolveOrgFromChatUser } from "@/gateway/mode-a";
import { DeepSeekProvider } from "@/providers/deepseek";
import { GptMiniProvider } from "@/providers/gpt-mini";
import { AiGateway, type GatewayTool, type ToolContext } from "@/providers/types";
import { stageAction, confirmAction, rejectAction } from "@/runtime/confirmation";
import { loadSession, saveSession, MAX_SESSION_MESSAGES } from "@/state/session";
import { checkDailyBudget, recordUsageAtomic, REQUEST_LIMITS } from "@/state/budget";
import { checkRateLimit, RATE_LIMITS } from "@/state/rate-limit";
import { withAudit } from "@/state/audit";
import { createServiceClient } from "@/lib/supabase";
import { deepSeekConfig, openAiConfig } from "@/lib/env";
import { sanitizeUserInput } from "@/lib/sanitize";
import { verifyLinkToken } from "@/lib/tokens";
import { transcribeVoice } from "@/stt/groq";

// ─── Lazy singletons ────────────────────────────────────────────────────────

let gateway: AiGateway | null = null;
let telegram: TelegramChannel | null = null;
let supabase: ReturnType<typeof createServiceClient> | null = null;

function getProviders(): AiGateway {
  if (!gateway) {
    gateway = new AiGateway(
      new DeepSeekProvider(deepSeekConfig()),
      new GptMiniProvider(openAiConfig()),
    );
  }
  return gateway;
}

function getTelegram(): TelegramChannel {
  if (!telegram) telegram = new TelegramChannel();
  return telegram;
}

function getSupabase() {
  if (!supabase) supabase = createServiceClient();
  return supabase;
}

// ─── System prompts ──────────────────────────────────────────────────────────

function systemPromptFor(productType: string, orgId: string, chatType: string): string {
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

// ─── Tools ───────────────────────────────────────────────────────────────────

function tolomTools(context: ToolContext): GatewayTool[] {
  const { supabase, orgId } = context;

  // Shared date helpers — computed once per call
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
  const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  return [
    // ── getDailySummary ──────────────────────────────────────────────────
    {
      name: "getDailySummary",
      description: "Өдрийн хураангуй: орлого, зарлага, идэвхтэй захиалга, шинэ харилцагч",
      parameters: [],
      execute: async () => {
        try {
          const [todayRevenueInv, todayRevenueLegacy, yesterdayRevenueInv, yesterdayRevenueLegacy,
            monthRevenueInv, monthRevenueLegacy, activeWO, expensesToday, newCustomers] =
            await Promise.all([
              supabase.from("invoice_payments").select("amount, invoices!inner(organization_id)")
                .eq("invoices.organization_id", orgId).gte("paid_at", todayStart),
              supabase.from("payments").select("amount").eq("organization_id", orgId)
                .gte("paid_at", todayStart).is("deleted_at", null),
              supabase.from("invoice_payments").select("amount, invoices!inner(organization_id)")
                .eq("invoices.organization_id", orgId)
                .gte("paid_at", yesterdayStart).lte("paid_at", yesterdayEnd),
              supabase.from("payments").select("amount").eq("organization_id", orgId)
                .gte("paid_at", yesterdayStart).lte("paid_at", yesterdayEnd).is("deleted_at", null),
              supabase.from("invoice_payments").select("amount, invoices!inner(organization_id)")
                .eq("invoices.organization_id", orgId)
                .gte("paid_at", monthStart).lte("paid_at", monthEnd),
              supabase.from("payments").select("amount").eq("organization_id", orgId)
                .gte("paid_at", monthStart).lte("paid_at", monthEnd).is("deleted_at", null),
              supabase.from("work_orders").select("id", { count: "exact", head: true })
                .eq("organization_id", orgId).is("deleted_at", null)
                .not("status", "in", '("Completed","Cancelled")'),
              supabase.from("expenses").select("amount").eq("organization_id", orgId)
                .gte("expense_date", todayStart).is("deleted_at", null),
              supabase.from("customers").select("id", { count: "exact", head: true })
                .eq("organization_id", orgId).is("deleted_at", null)
                .gte("created_at", monthStart),
            ]);

          const sum = (rows: { amount: unknown }[] | null) =>
            (rows ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0);

          return {
            revenueToday: sum(todayRevenueInv.data) + sum(todayRevenueLegacy.data),
            revenueYesterday: sum(yesterdayRevenueInv.data) + sum(yesterdayRevenueLegacy.data),
            revenueMonth: sum(monthRevenueInv.data) + sum(monthRevenueLegacy.data),
            activeWorkOrders: activeWO.count ?? 0,
            expensesToday: sum(expensesToday.data),
            newCustomersMonth: newCustomers.count ?? 0,
          };
        } catch (err) {
          return { error: "Өдрийн хураангуй авахад алдаа гарлаа" };
        }
      },
    },

    // ── getActiveWorkOrders ──────────────────────────────────────────────
    {
      name: "getActiveWorkOrders",
      description: "Идэвхтэй захиалгын жагсаалт: төлөв, харилцагч, улсын дугаар, дүн",
      parameters: [],
      execute: async () => {
        try {
          const { data: orders, error } = await supabase
            .from("work_orders")
            .select(`
              id, status, total, created_at, bay_number, description,
              customers:customer_id ( full_name, phone ),
              vehicles:vehicle_id ( plate_number, make, model )
            `)
            .eq("organization_id", orgId)
            .is("deleted_at", null)
            .not("status", "in", '("Completed","Cancelled")')
            .order("created_at", { ascending: false })
            .limit(20);

          if (error) return { error: "Захиалга авахад алдаа гарлаа" };

          return (orders ?? []).map((wo: Record<string, unknown>) => ({
            id: wo.id,
            status: wo.status,
            total: Number(wo.total) || 0,
            createdAt: wo.created_at,
            bayNumber: wo.bay_number,
            description: wo.description,
            customerName: (wo.customers as Record<string, unknown> | null)?.full_name ?? "—",
            customerPhone: (wo.customers as Record<string, unknown> | null)?.phone ?? "—",
            vehiclePlate: (wo.vehicles as Record<string, unknown> | null)?.plate_number ?? "—",
            vehicleInfo: [wo.vehicles as Record<string, unknown> | null]
              .filter(Boolean)
              .map((v) => [v!.make, v!.model].filter(Boolean).join(" "))
              .join("") || "—",
          }));
        } catch {
          return { error: "Идэвхтэй захиалга авахад алдаа гарлаа" };
        }
      },
    },

    // ── getCustomerHistory ───────────────────────────────────────────────
    {
      name: "getCustomerHistory",
      description: "Харилцагчийн түүх: дугаар эсвэл нэрээр хайх",
      parameters: [
        { name: "query", type: "string", description: "Улсын дугаар эсвэл харилцагчийн нэр", required: true },
      ],
      execute: async (args) => {
        const q = String(args.query ?? "").trim();
        if (!q) return { error: "Хайх утга оруулна уу" };

        try {
          // Try plate match first
          const { data: vehicles } = await supabase
            .from("vehicles")
            .select("customer_id, plate_number, make, model, year, total_visits, last_visit_at")
            .eq("organization_id", orgId)
            .ilike("plate_number", `%${q}%`)
            .is("deleted_at", null)
            .limit(5);

          if (vehicles && vehicles.length > 0) {
            const customerIds = [...new Set(vehicles.map((v) => v.customer_id).filter(Boolean))];
            const { data: customers } = customerIds.length > 0
              ? await supabase.from("customers").select("id, full_name, phone, total_visits, last_visit_at")
                .eq("organization_id", orgId).in("id", customerIds).is("deleted_at", null)
              : { data: [] };
            const custMap = new Map((customers ?? []).map((c) => [c.id, c]));
            return vehicles.map((v) => {
              const cust = v.customer_id ? custMap.get(v.customer_id) : null;
              return {
                matchType: "plate",
                plateNumber: v.plate_number,
                vehicle: [v.make, v.model].filter(Boolean).join(" ") + (v.year ? ` (${v.year})` : ""),
                customerName: (cust as Record<string, unknown> | null)?.full_name ?? "—",
                phone: (cust as Record<string, unknown> | null)?.phone ?? "—",
                totalVisits: v.total_visits ?? 0,
                lastVisit: v.last_visit_at ?? (cust as Record<string, unknown> | null)?.last_visit_at ?? null,
              };
            });
          }

          // Fallback: name search
          const { data: customers } = await supabase
            .from("customers")
            .select("id, full_name, first_name, last_name, phone, total_visits, last_visit_at")
            .eq("organization_id", orgId)
            .is("deleted_at", null)
            .or(`full_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`)
            .limit(5);

          if (!customers || customers.length === 0) return { error: "Харилцагч олдсонгүй" };

          const custIds = customers.map((c) => c.id);
          const { data: custVehicles } = await supabase
            .from("vehicles")
            .select("customer_id, plate_number, make, model, year, total_visits, last_visit_at")
            .eq("organization_id", orgId)
            .in("customer_id", custIds)
            .is("deleted_at", null);

          const vehByCust = new Map<string, typeof custVehicles>();
          for (const v of custVehicles ?? []) {
            const cid = v.customer_id as string;
            if (!vehByCust.has(cid)) vehByCust.set(cid, []);
            vehByCust.get(cid)!.push(v);
          }

          return customers.map((c) => {
            const vehs = vehByCust.get(c.id) ?? [];
            return {
              matchType: "name",
              customerName: (c.full_name ?? [c.first_name, c.last_name].filter(Boolean).join(" ")) || "—",
              phone: c.phone ?? "—",
              totalVisits: c.total_visits ?? 0,
              lastVisit: c.last_visit_at ?? null,
              vehicles: vehs.map((v) => ({
                plateNumber: v.plate_number,
                info: [v.make, v.model].filter(Boolean).join(" ") + (v.year ? ` (${v.year})` : ""),
              })),
            };
          });
        } catch {
          return { error: "Харилцагч хайхад алдаа гарлаа" };
        }
      },
    },

    // ── getInvoiceStatus ─────────────────────────────────────────────────
    {
      name: "getInvoiceStatus",
      description: "Тухайн сарын нэхэмжлэлийн хураангуй: нийт, төлөгдсөн, үлдэгдэл",
      parameters: [],
      execute: async () => {
        try {
          const { data: invoices, error } = await supabase
            .from("invoices")
            .select("total, amount_paid, balance_due, status")
            .eq("organization_id", orgId)
            .is("deleted_at", null)
            .gte("issued_at", monthStart)
            .lte("issued_at", monthEnd);

          if (error) return { error: "Нэхэмжлэл авахад алдаа гарлаа" };

          const rows = invoices ?? [];
          const totalInvoiced = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
          const totalPaid = rows.reduce((s, r) => s + (Number(r.amount_paid) || 0), 0);
          const totalUnpaid = rows.reduce((s, r) => s + (Number(r.balance_due) || 0), 0);
          const countByStatus: Record<string, number> = {};
          for (const r of rows) {
            const st = r.status ?? "unknown";
            countByStatus[st] = (countByStatus[st] ?? 0) + 1;
          }

          return {
            totalInvoiced,
            totalPaid,
            totalUnpaid,
            invoiceCount: rows.length,
            byStatus: countByStatus,
          };
        } catch {
          return { error: "Нэхэмжлэлийн хураангуй авахад алдаа гарлаа" };
        }
      },
    },

    // ── getExpensesSummary ───────────────────────────────────────────────
    {
      name: "getExpensesSummary",
      description: "Тухайн сарын зарлагын хураангуй, ангилалаар",
      parameters: [],
      execute: async () => {
        try {
          const { data: expenses, error } = await supabase
            .from("expenses")
            .select(`
              amount, category_id, expense_date,
              expense_categories:category_id ( name )
            `)
            .eq("organization_id", orgId)
            .is("deleted_at", null)
            .gte("expense_date", monthStart)
            .lte("expense_date", monthEnd);

          if (error) return { error: "Зарлага авахад алдаа гарлаа" };

          const rows = expenses ?? [];
          const byCategory: Record<string, number> = {};
          let total = 0;
          for (const r of rows) {
            const amount = Number(r.amount) || 0;
            total += amount;
            const catName = ((r.expense_categories as unknown as { name?: string } | null)?.name) ?? "Бусад";
            byCategory[catName] = (byCategory[catName] ?? 0) + amount;
          }

          return { total, byCategory, expenseCount: rows.length };
        } catch {
          return { error: "Зарлагын хураангуй авахад алдаа гарлаа" };
        }
      },
    },

    // ── getAppointments ──────────────────────────────────────────────────
    {
      name: "getAppointments",
      description: "Өнөөдрийн болон ирэх цагийн хуваариуд",
      parameters: [],
      execute: async () => {
        try {
          const { data: appointments, error } = await supabase
            .from("appointments")
            .select(`
              id, title, scheduled_at, end_at, status, notes,
              customers:customer_id ( full_name, phone ),
              vehicles:vehicle_id ( plate_number, make, model )
            `)
            .eq("organization_id", orgId)
            .is("deleted_at", null)
            .gte("scheduled_at", todayStart)
            .order("scheduled_at", { ascending: true })
            .limit(30);

          if (error) return { error: "Хуваарь авахад алдаа гарлаа" };

          return (appointments ?? []).map((a: Record<string, unknown>) => ({
            id: a.id,
            title: a.title,
            scheduledAt: a.scheduled_at,
            endAt: a.end_at,
            status: a.status,
            notes: a.notes,
            customerName: (a.customers as Record<string, unknown> | null)?.full_name ?? "—",
            customerPhone: (a.customers as Record<string, unknown> | null)?.phone ?? "—",
            vehiclePlate: (a.vehicles as Record<string, unknown> | null)?.plate_number ?? "—",
            vehicleInfo: [a.vehicles as Record<string, unknown> | null]
              .filter(Boolean)
              .map((v) => [v!.make, v!.model].filter(Boolean).join(" "))
              .join("") || "—",
          }));
        } catch {
          return { error: "Хуваарь авахад алдаа гарлаа" };
        }
      },
    },
  ];
}

function zerTools(context: ToolContext): GatewayTool[] {
  const { supabase, orgId } = context;
  return [
    {
      name: "getSalesSummary",
      description: "Сүүлийн N өдрийн борлуулалтын хураангуй.",
      parameters: [
        { name: "days", type: "number", description: "Хэдэн өдрийн (default 7)", required: false },
      ],
      execute: async (args) => {
        const days = typeof args.days === "number" && args.days > 0 ? args.days : 7;
        const dateStart = new Date(Date.now() - days * 86400000).toISOString();
        const { data: salesAgg } = await supabase
          .from("sales")
          .select("total_amount, paid_amount")
          .eq("organization_id", orgId)
          .gte("sale_date", dateStart);
        const rows = salesAgg ?? [];
        return {
          period: `Сүүлийн ${days} өдөр`,
          totalAmount: rows.reduce((s, r) => s + Number(r.total_amount), 0),
          totalPaid: rows.reduce((s, r) => s + (r.paid_amount != null ? Number(r.paid_amount) : 0), 0),
          saleCount: rows.length,
        };
      },
    },
    {
      name: "getPendingSales",
      description: "Дутуу төлөлттэй борлуулалтууд.",
      parameters: [],
      execute: async () => {
        const { data: sales } = await supabase
          .from("sales")
          .select("id, sale_date, total_amount, paid_amount")
          .eq("organization_id", orgId)
          .or("paid_amount.is.null,paid_amount.lt.total_amount")
          .order("sale_date", { ascending: false })
          .limit(10);
        return (sales ?? []).map((s) => ({
          id: s.id, saleDate: s.sale_date,
          totalAmount: Number(s.total_amount),
          paidAmount: s.paid_amount != null ? Number(s.paid_amount) : 0,
        }));
      },
    },
    {
      name: "getTodaySales",
      description: "Өнөөдрийн борлуулалтын хураангуй.",
      parameters: [],
      execute: async () => {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const { data: salesAgg } = await supabase
          .from("sales")
          .select("total_amount, paid_amount")
          .eq("organization_id", orgId)
          .gte("sale_date", dayStart.toISOString());
        const rows = salesAgg ?? [];
        return {
          date: dayStart.toISOString(),
          totalAmount: rows.reduce((s, r) => s + Number(r.total_amount), 0),
          totalPaid: rows.reduce((s, r) => s + (r.paid_amount != null ? Number(r.paid_amount) : 0), 0),
          saleCount: rows.length,
        };
      },
    },
  ];
}

// ─── Webhook handler ─────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const update: TelegramUpdate = await request.json();

    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    const msg = update.message;
    if (!msg?.text && !msg?.voice) {
      return NextResponse.json({ ok: true });
    }

    const chatId = msg.chat.id;
    const userId = msg.from?.id ?? 0;
    const chatType = msg.chat.type;
    const text = msg.text ?? "";

    if (text.startsWith("/start")) {
      await handleStartCommand(chatId, userId, text);
      return NextResponse.json({ ok: true });
    }
    if (msg.voice) {
      const tg = getTelegram();
      await tg.sendMessage(chatId, "Аудио хүлээн авлаа. Бичлэг тайлж байна...");

      try {
        const fileInfo = await tg.getFile(msg.voice.file_id);
        const fileBuffer = await tg.downloadFile(fileInfo.file_path);
        const transcribed = await transcribeVoice(fileBuffer, "voice.ogg");

        if (transcribed) {
          await handleUserMessage(chatId, userId, transcribed, chatType);
        } else {
          await tg.sendMessage(chatId, "Уучлаарай, дууны бичлэгийг тайлж чадсангүй. Дахин оролдоно уу.");
        }
      } catch (err) {
        console.error("Voice processing error:", err);
        await tg.sendMessage(chatId, "Уучлаарай, дууны бичлэг боловсруулахад алдаа гарлаа.");
      }

      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/switch")) {
      await handleSwitchCommand(chatId, userId);
      return NextResponse.json({ ok: true });
    }

    await handleUserMessage(chatId, userId, text, chatType);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleStartCommand(chatId: number, userId: number, text: string): Promise<void> {
  const tg = getTelegram();
  const parts = text.split(" ");
  const token = parts[1];

  if (!token) {
    await tg.sendMessage(chatId, "👋 Тавтай морилно уу! Холбогдохын тулд QR код уншуулна уу.");
    return;
  }

  // Verify the signed token
  const payload = verifyLinkToken(token);
  if (!payload) {
    await tg.sendMessage(chatId, "❌ Холбох токен буруу эсвэл хугацаа дууссан байна. Дахин QR код уншуулна уу.");
    return;
  }

  const sb = getSupabase();

  try {
    // Deactivate any existing active link for this chat+user
    await sb
      .from("telegram_links")
      .update({ is_active: false })
      .eq("telegram_chat_id", chatId)
      .eq("telegram_user_id", userId)
      .eq("is_active", true);

    // Create the new link
    const { error: linkErr } = await sb
      .from("telegram_links")
      .insert({
        organization_id: payload.orgId,
        user_id: payload.userId,
        telegram_chat_id: chatId,
        telegram_user_id: userId,
        is_active: true,
        notification_preferences: { productType: payload.productType },
      });

    if (linkErr) {
      console.error("Link error:", linkErr);
      await tg.sendMessage(chatId, "❌ Холболт үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.");
      return;
    }

    const productName = payload.productType === "tolom" ? "Tolom" : "Zer";
    await tg.sendMessage(
      chatId,
      `✅ Амжилттай холбогдлоо! Та ${productName} системдээ нэвтэрлээ.\n\nОдоо асуултаа бичнэ үү. Жишээ нь:\n- "Өнөөдрийн борлуулалт хэд вэ?"\n- "Сүүлийн 7 хоногийн хураангуй"`,
    );
  } catch (err) {
    console.error("Start handler error:", err);
    await tg.sendMessage(chatId, "❌ Холболт амжилтгүй боллоо. Дахин оролдоно уу.");
  }
}

async function handleSwitchCommand(chatId: number, userId: number): Promise<void> {
  const tg = getTelegram();
  const sb = getSupabase();

  // Find all links for this chat+user
  const { data: links } = await sb
    .from("telegram_links")
    .select("organization_id, is_active, notification_preferences")
    .eq("telegram_chat_id", chatId)
    .eq("telegram_user_id", userId)
    .order("updated_at", { ascending: false });

  if (!links || links.length === 0) {
    await tg.sendMessage(chatId, "❌ Та ямар ч байгууллагад холбогдоогүй байна. /start командаар холбогдоно уу.");
    return;
  }

  // Get org names
  const orgIds = links.map((l) => l.organization_id);
  const { data: orgs } = await sb
    .from("organizations")
    .select("id, name")
    .in("id", orgIds);

  const orgMap = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  // Build inline keyboard
  const keyboard = links.map((l) => {
    const orgName = orgMap.get(l.organization_id) ?? l.organization_id;
    const active = l.is_active ? " ✅" : "";
    return [{
      text: `${orgName}${active}`,
      callbackData: `switch:${l.organization_id}`,
    }];
  });

  await tg.sendInlineKeyboard(chatId, "🏢 Байгууллагаа сонгоно уу:", keyboard);
}


async function handleUserMessage(chatId: number, userId: number, text: string, chatType: string): Promise<void> {
  const tg = getTelegram();
  const sb = getSupabase();

  let context: ToolContext;
  let productType: "tolom" | "zer";

  try {
    const resolved = await resolveOrgFromChatUser(sb, chatId, userId);
    context = { orgId: resolved.context.orgId, userId: resolved.context.userId, supabase: sb };
    productType = resolved.context.productType;

    await sb.from("telegram_links").update({ updated_at: new Date().toISOString() })
      .eq("telegram_chat_id", chatId)
      .eq("telegram_user_id", userId)
      .eq("is_active", true);
  } catch (err) {
    await tg.sendMessage(chatId, err instanceof Error ? err.message : "Таны Telegram холбогдоогүй байна. Эхлээд QR код уншуулна уу.");
    return;
  }

  // Check budget
  const budget = await checkDailyBudget(sb, context.orgId);
  if (!budget.allowed) {
    await tg.sendMessage(chatId, budget.reason!);
    return;
  }

  // Rate limiting — check per-org message frequency
  const rateLimit = checkRateLimit(context.orgId, RATE_LIMITS.messagesPerMinute);
  if (!rateLimit.allowed) {
    await tg.sendMessage(chatId, `⏳ Хэт олон хүсэлт илгээсэн байна. ${Math.ceil(rateLimit.resetInMs / 1000)} секундын дараа дахин оролдоно уу.`);
    return;
  }


  // Select tools
  const rawTools = productType === "tolom" ? tolomTools(context) : zerTools(context);
  const tools = rawTools.map((t) => withAudit(t, chatId, userId));

  await tg.sendMessage(chatId, "⏳ Түр хүлээнэ үү...");

  try {
    // Load prior conversation for context-aware responses
    const session = await loadSession(sb, context.orgId, chatId, userId);

    const sanitizedText = sanitizeUserInput(text);
    const response = await getProviders().runWithTools({
      system: systemPromptFor(productType, context.orgId, chatType),
      userMessage: sanitizedText,
      tools,
      context,
      maxRounds: REQUEST_LIMITS.maxToolRounds,
      conversationHistory: session.messages.length > 0 ? session.messages : undefined,
    });

    await tg.sendMessage(chatId, response);

    // Build updated message list and trim before saving
    const updatedMessages = [
      ...session.messages,
      { role: "user" as const, content: sanitizedText },
      { role: "assistant" as const, content: response },
    ];
    const trimmed = updatedMessages.length > MAX_SESSION_MESSAGES
      ? updatedMessages.slice(updatedMessages.length - MAX_SESSION_MESSAGES)
      : updatedMessages;
    await saveSession(sb, context.orgId, chatId, userId, trimmed, session.tokenCount + 500);
    await recordUsageAtomic(sb, context.orgId, 500);
  } catch (err) {
    console.error("Agent error:", err);
    await tg.sendMessage(chatId, "Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.");
  }
}

async function handleCallbackQuery(cq: NonNullable<TelegramUpdate["callback_query"]>): Promise<void> {
  const tg = getTelegram();
  const data = cq.data ?? "";
  const chatId = cq.message?.chat.id ?? 0;
  const messageId = cq.message?.message_id ?? 0;
  const userId = cq.from.id;
  const [action, nonce] = data.split(":");

  if (action === "switch") {
    const orgId = nonce;
    if (!orgId) {
      await tg.answerCallbackQuery(cq.id, "❌ Алдаа гарлаа.");
      return;
    }

    const sb = getSupabase();

    // Deactivate all active links for this chat+user
    await sb
      .from("telegram_links")
      .update({ is_active: false })
      .eq("telegram_chat_id", chatId)
      .eq("telegram_user_id", userId)
      .eq("is_active", true);

    // Activate the selected one
    const { error } = await sb
      .from("telegram_links")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("telegram_chat_id", chatId)
      .eq("telegram_user_id", userId)
      .eq("organization_id", orgId);

    if (error) {
      console.error("Switch error:", error);
      await tg.answerCallbackQuery(cq.id, "❌ Солиход алдаа гарлаа.");
      return;
    }

    // Get org name for confirmation
    const { data: org } = await sb
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();

    await tg.editMessageText(
      chatId,
      messageId,
      `✅ "${org?.name ?? orgId}" байгууллагад шилжлээ.`,
    );
    await tg.answerCallbackQuery(cq.id, "✅ Амжилттай.");
  } else if (action === "confirm") {
    const staged = confirmAction(nonce, chatId, userId);
    if (!staged) {
      await tg.answerCallbackQuery(cq.id, "Энэ үйлдлийн хугацаа дууссан.");
      return;
    }
    await tg.editMessageText(chatId, messageId, `✅ Баталгаажууллаа: ${staged.summary}`);
    await tg.answerCallbackQuery(cq.id, "✅ Амжилттай.");
  } else if (action === "reject") {
    rejectAction(nonce);
    await tg.editMessageText(chatId, messageId, "❌ Цуцаллаа.");
    await tg.answerCallbackQuery(cq.id, "❌ Цуцаллаа.");
  }
}
