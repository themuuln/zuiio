import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Environment ──────────────────────────────────────────────────
let TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ── Token loader (env var → DB fallback) ─────────────────────────
async function loadBotToken(): Promise<string> {
  if (TELEGRAM_BOT_TOKEN) return TELEGRAM_BOT_TOKEN;
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "telegram_bot_token")
      .maybeSingle();
    if (data?.value) {
      TELEGRAM_BOT_TOKEN = data.value;
      return data.value;
    }
  } catch (e) {
    console.error("Failed to load bot token from DB:", e);
  }
  return "";
}

function tgApi(token: string): string {
  return `https://api.telegram.org/bot${token}`;
}

interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

function inlineKeyboard(rows: InlineButton[][]): {
  inline_keyboard: InlineButton[][];
} {
  return { inline_keyboard: rows };
}

function sendMessage(
  chat_id: number,
  text: string,
  opts: Record<string, unknown> = {},
) {
  return fetch(`${tgApi(TELEGRAM_BOT_TOKEN)}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text, parse_mode: "Markdown", ...opts }),
  });
}

// ── Daily Business Metrics ───────────────────────────────────────

interface DailySummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  activeJobs: number;
  newJobs: number;
  diagnosing: number;
  inProgress: number;
  completedToday: number;
  totalCustomers: number;
  upcomingServices: number;
  unpaidInvoices: number;
  unpaidAmount: number;
}

/**
 * Compute a practical daily/weekly business summary for an org.
 */
async function computeDailySummary(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  period: "daily" | "weekly" | "monthly",
): Promise<DailySummary> {
  const now = new Date();
  const periodDays = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
  const periodStart = new Date(
    now.getTime() - periodDays * 24 * 60 * 60 * 1000,
  );
  const periodStartStr = periodStart.toISOString();
  const todayStr = now.toISOString().split("T")[0];
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // 1. Revenue from completed work orders
  const { data: completedWOs } = await supabase
    .from("work_orders")
    .select("total")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .is("deleted_at", null)
    .gte("completed_at", periodStartStr);

  const revenue =
    completedWOs?.reduce((sum, wo) => sum + (wo.total ?? 0), 0) ?? 0;
  const completedToday = completedWOs?.length ?? 0;

  // 2. Expenses in the period
  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .gte("expense_date", periodStartStr);

  const totalExpenses =
    expenses?.reduce((sum, e) => sum + (e.amount ?? 0), 0) ?? 0;

  // 3. Active jobs
  const { data: activeJobsRaw } = await supabase
    .from("work_orders")
    .select("status")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .in("status", ["New", "Diagnosing", "In Progress"]);

  const newJobs = activeJobsRaw?.filter((j) => j.status === "New").length ?? 0;
  const diagnosing =
    activeJobsRaw?.filter((j) => j.status === "Diagnosing").length ?? 0;
  const inProgress =
    activeJobsRaw?.filter((j) => j.status === "In Progress").length ?? 0;
  const activeJobs = activeJobsRaw?.length ?? 0;

  // 4. Unique customers
  const { data: customers } = await supabase
    .from("work_orders")
    .select("customer_id")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .gte("created_at", periodStartStr);

  const uniqueCustomers = customers
    ? new Set(customers.map((c) => c.customer_id)).size
    : 0;

  // 5. Upcoming services
  const { count: upcomingServices } = await supabase
    .from("vehicle_service_schedules")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("reminder_enabled", true)
    .is("deleted_at", null)
    .gte("next_due_date", todayStr)
    .lte("next_due_date", sevenDaysFromNow);

  // 6. Unpaid invoices
  const { data: unpaidInvoices } = await supabase
    .from("invoices")
    .select("balance_due")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .neq("status", "paid")
    .neq("status", "cancelled");

  const unpaidCount = unpaidInvoices?.length ?? 0;
  const unpaidAmount =
    unpaidInvoices?.reduce((sum, inv) => sum + (inv.balance_due ?? 0), 0) ?? 0;

  return {
    revenue,
    expenses: totalExpenses,
    netProfit: revenue - totalExpenses,
    activeJobs,
    newJobs,
    diagnosing,
    inProgress,
    completedToday,
    totalCustomers: uniqueCustomers,
    upcomingServices: upcomingServices ?? 0,
    unpaidInvoices: unpaidCount,
    unpaidAmount,
  };
}

function formatMoney(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${sign}₮${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}₮${(abs / 1_000).toFixed(0)}K`;
  }
  return `${sign}₮${Math.round(abs).toLocaleString()}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Message Builders ─────────────────────────────────────────────

function buildDailyMessage(orgName: string, d: DailySummary): string {
  const lines = [
    `📊 *Өдрийн хураангуй — ${orgName}*`,
    `📅 ${formatDate(new Date().toISOString())}`,
    "",
    `💰 *Орлого:* ${formatMoney(d.revenue)}`,
    `💸 *Зарлага:* ${formatMoney(d.expenses)}`,
    d.netProfit >= 0
      ? `📈 *Цэвэр ашиг:* ${formatMoney(d.netProfit)}`
      : `📉 *Цэвэр алдагдал:* ${formatMoney(d.netProfit)}`,
    "",
    `🔧 *Идэвхтэй захиалга:* ${d.activeJobs}`,
    `   📋 Шинэ: ${d.newJobs} | 🔍 Онош: ${d.diagnosing} | ⚙️ Хийж буй: ${d.inProgress}`,
    `✅ Өнөөдөр гүйцэтгэсэн: ${d.completedToday}`,
    "",
    `🚗 Нийт үйлчлүүлэгч: ${d.totalCustomers}`,
    d.upcomingServices > 0
      ? `📅 Ойрын 7 хоногт дуусах: **${d.upcomingServices}** үйлчилгээ`
      : `📅 Ойрын 7 хоногт дуусах үйлчилгээ байхгүй`,
    d.unpaidInvoices > 0
      ? `💳 Төлөгдөөгүй нэхэмжлэх: ${d.unpaidInvoices} (${formatMoney(d.unpaidAmount)})`
      : `💳 Төлөгдөөгүй нэхэмжлэх: 0`,
  ];

  return lines.filter(Boolean).join("\n");
}

function buildWeeklyMessage(
  orgName: string,
  d: DailySummary,
  period: "weekly" | "monthly" = "weekly",
): string {
  const now = new Date();
  const periodDays = period === "weekly" ? 7 : 30;
  const periodStart = new Date(
    now.getTime() - periodDays * 24 * 60 * 60 * 1000,
  );
  const label = period === "weekly" ? "7 хоногт" : "сард";

  const lines = [
    `📊 *${period === "weekly" ? "Долоо хоногийн" : "Сарын"} хураангуй — ${orgName}*`,
    `📅 ${formatDate(periodStart.toISOString())} → ${formatDate(now.toISOString())}`,
    "",
    `💰 *Орлого:* ${formatMoney(d.revenue)}`,
    `💸 *Зарлага:* ${formatMoney(d.expenses)}`,
    d.netProfit >= 0
      ? `📈 *Цэвэр ашиг:* ${formatMoney(d.netProfit)}`
      : `📉 *Цэвэр алдагдал:* ${formatMoney(d.netProfit)}`,
    "",
    `🔧 *Идэвхтэй захиалга:* ${d.activeJobs}`,
    `   📋 Шинэ: ${d.newJobs} | 🔍 Онош: ${d.diagnosing} | ⚙️ Хийж буй: ${d.inProgress}`,
    `✅ Энэ ${label} гүйцэтгэсэн: ${d.completedToday}`,
    "",
    `🚗 Нийт үйлчлүүлэгч: ${d.totalCustomers}`,
    d.upcomingServices > 0
      ? `📅 Ойрын 7 хоногт дуусах: **${d.upcomingServices}** үйлчилгээ`
      : `📅 Ойрын 7 хоногт дуусах үйлчилгээ байхгүй`,
    d.unpaidInvoices > 0
      ? `💳 Төлөгдөөгүй нэхэмжлэх: ${d.unpaidInvoices} (${formatMoney(d.unpaidAmount)})`
      : `💳 Төлөгдөөгүй нэхэмжлэх: 0`,
  ];

  return lines.filter(Boolean).join("\n");
}

// ── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Load bot token from env var or DB fallback
  await loadBotToken();

  // Determine notification type from request
  const url = new URL(req.url);
  const periodParam = url.searchParams.get("period");
  const period: "daily" | "weekly" | "monthly" =
    periodParam === "weekly"
      ? "weekly"
      : periodParam === "monthly"
        ? "monthly"
        : "daily";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Find all orgs with active telegram links
  const { data: orgsWithLinks, error: orgError } = await supabase
    .from("telegram_links")
    .select("organization_id, telegram_chat_id, organizations!inner(name)")
    .eq("is_active", true);

  if (orgError) {
    console.error("Failed to fetch telegram links:", orgError);
    return new Response(JSON.stringify({ error: orgError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!orgsWithLinks || orgsWithLinks.length === 0) {
    console.log("No active telegram links found");
    return new Response(JSON.stringify({ checked: 0, sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Group by organization for efficient querying
  const orgMap = new Map<
    string,
    { links: { chat_id: number }[]; name: string }
  >();

  for (const raw of orgsWithLinks) {
    const link = raw as unknown as {
      organization_id: string;
      telegram_chat_id: number;
      organizations: { name: string };
    };
    if (!orgMap.has(link.organization_id)) {
      orgMap.set(link.organization_id, {
        links: [],
        name: link.organizations.name,
      });
    }
    orgMap
      .get(link.organization_id)!
      .links.push({ chat_id: link.telegram_chat_id });
  }

  let sentCount = 0;
  let orgCount = 0;

  for (const [orgId, entry] of orgMap) {
    try {
      const summary = await computeDailySummary(supabase, orgId, period);
      const message =
        period === "daily"
          ? buildDailyMessage(entry.name, summary)
          : buildWeeklyMessage(entry.name, summary, period);

      for (const link of entry.links) {
        try {
          const res = await sendMessage(link.chat_id, message, {
            reply_markup: inlineKeyboard([
              [
                { text: "📊 Хураангуй", callback_data: "status" },
                { text: "🔕 Зогсоох", callback_data: "stop" },
              ],
            ]),
          });
          if (!res.ok) {
            const body = await res.text();
            console.error(`Failed to send to chat ${link.chat_id}:`, body);

            // If chat not found / bot blocked, deactivate the link
            if (res.status === 403) {
              await supabase
                .from("telegram_links")
                .update({
                  is_active: false,
                  updated_at: new Date().toISOString(),
                })
                .eq("organization_id", orgId)
                .eq("telegram_chat_id", link.chat_id);
              console.log(`Deactivated telegram link for chat ${link.chat_id}`);
            }
          } else {
            sentCount++;
          }
        } catch (sendErr) {
          console.error(`Exception sending to chat ${link.chat_id}:`, sendErr);
        }
      }

      orgCount++;
    } catch (orgErr) {
      console.error(`Failed to compute summary for org ${orgId}:`, orgErr);
    }
  }

  console.log(
    `Sent ${period} notification to ${sentCount} chat(s) across ${orgCount} org(s)`,
  );
  return new Response(
    JSON.stringify({ orgs: orgCount, sent: sentCount, period }),
    { headers: { "Content-Type": "application/json" } },
  );
});
