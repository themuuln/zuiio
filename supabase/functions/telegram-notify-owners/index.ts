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

function sendMessage(chat_id: number, text: string) {
  return fetch(`${tgApi(TELEGRAM_BOT_TOKEN)}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text, parse_mode: "Markdown" }),
  });
}

// ── Money Impact Metrics ─────────────────────────────────────────

interface MoneyImpactSummary {
  remindersSent: number;
  customersReturned: number;
  revenueRecovered: number;
  upcomingDueServices: number;
  estimatedUpcomingRevenue: number;
  missedOpportunityValue: number;
}

/**
 * Compute the service-reminder money impact summary for an org.
 * All numbers are scoped to the relevant time window (daily or weekly).
 */
async function computeMoneyImpact(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  period: "daily" | "weekly",
): Promise<MoneyImpactSummary> {
  const now = new Date();
  const periodDays = period === "daily" ? 1 : 7;

  // ── Time boundaries ──────────────────────────────────────────
  const lookbackStart = new Date(
    now.getTime() - periodDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const nextPeriodEnd = new Date(
    now.getTime() + periodDays * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .split("T")[0];
  const today = now.toISOString().split("T")[0];
  const reminderLookbackDays = 60;
  const reminderLookbackStart = new Date(
    now.getTime() - reminderLookbackDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  // ── 1. Reminders sent ────────────────────────────────────────
  const { count: remindersSent } = await supabase
    .from("reminder_logs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "sent")
    .gte("sent_at", lookbackStart);

  // ── 2. Upcoming due services ─────────────────────────────────
  const { data: upcomingSchedules } = await supabase
    .from("vehicle_service_schedules")
    .select("id, service_catalog_id, service_catalog!left(default_price)")
    .eq("organization_id", orgId)
    .eq("reminder_enabled", true)
    .is("deleted_at", null)
    .gte("next_due_date", tomorrow)
    .lte("next_due_date", nextPeriodEnd);

  const upcomingDueServices = upcomingSchedules?.length ?? 0;

  // ── 3. Estimated upcoming revenue ────────────────────────────
  let estimatedUpcomingRevenue = 0;
  if (upcomingSchedules && upcomingSchedules.length > 0) {
    for (const s of upcomingSchedules) {
      const svc = s as unknown as {
        service_catalog_id: string | null;
        service_catalog: { default_price: number } | null;
      };
      if (svc.service_catalog?.default_price) {
        estimatedUpcomingRevenue += svc.service_catalog.default_price;
      }
    }

    // Fallback: for services without catalog price, use org average
    const withoutPrice = upcomingSchedules.filter(
      (s) =>
        !(s as unknown as { service_catalog: { default_price: number } | null })
          .service_catalog?.default_price,
    );
    if (withoutPrice.length > 0) {
      const avgOrderValue = await getAvgOrderValue(supabase, orgId);
      estimatedUpcomingRevenue += withoutPrice.length * avgOrderValue;
    }
  }

  // ── 4. Customers returned + Revenue recovered ────────────────
  const { data: sentReminders } = await supabase
    .from("reminder_logs")
    .select("customer_id, sent_at")
    .eq("organization_id", orgId)
    .eq("status", "sent")
    .gte("sent_at", reminderLookbackStart)
    .not("customer_id", "is", null);

  let customersReturned = 0;
  let revenueRecovered = 0;
  const processedCustomers = new Set<string>();

  if (sentReminders && sentReminders.length > 0) {
    for (const reminder of sentReminders) {
      if (!reminder.customer_id || processedCustomers.has(reminder.customer_id))
        continue;
      processedCustomers.add(reminder.customer_id);

      const sentAt = new Date(reminder.sent_at).toISOString();
      const sentPlus60 = new Date(
        new Date(reminder.sent_at).getTime() + 60 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data: completedWOs } = await supabase
        .from("work_orders")
        .select("id, total")
        .eq("organization_id", orgId)
        .eq("customer_id", reminder.customer_id)
        .eq("status", "Completed")
        .gte("completed_at", sentAt)
        .lte("completed_at", sentPlus60)
        .is("deleted_at", null);

      if (completedWOs && completedWOs.length > 0) {
        customersReturned++;
        for (const wo of completedWOs) {
          revenueRecovered += wo.total;
        }
      }
    }
  }

  // ── 5. Missed opportunity value ─────────────────────────────
  const { count: overdueCount } = await supabase
    .from("vehicle_service_schedules")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("reminder_enabled", true)
    .is("deleted_at", null)
    .lt("next_due_date", today);

  const avgOrderValue = await getAvgOrderValue(supabase, orgId);
  const missedOpportunityValue = (overdueCount ?? 0) * avgOrderValue;

  return {
    remindersSent: remindersSent ?? 0,
    customersReturned,
    revenueRecovered,
    upcomingDueServices,
    estimatedUpcomingRevenue,
    missedOpportunityValue,
  };
}

async function getAvgOrderValue(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
): Promise<number> {
  const { data: recent } = await supabase
    .from("work_orders")
    .select("total")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .is("deleted_at", null)
    .order("completed_at", { ascending: false })
    .limit(100);

  if (!recent || recent.length === 0) return 0;
  return recent.reduce((sum, wo) => sum + wo.total, 0) / recent.length;
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

function buildDailySummary(orgName: string, m: MoneyImpactSummary): string {
  const lines = [
    `📊 *Өдрийн хураангуй — ${orgName}*`,
    `📅 ${formatDate(new Date().toISOString())}`,
    "",
    m.remindersSent > 0
      ? `📨 Өчигдөр илгээгдсэн сануулга: **${m.remindersSent}**`
      : `📨 Өчигдөр сануулга илгээгдээгүй`,
    m.customersReturned > 0
      ? `👥 Сануулга авсны дараа ирсэн үйлчлүүлэгч: **${m.customersReturned}**`
      : "",
    m.revenueRecovered > 0
      ? `💰 Сэргээгдсэн орлого: **${formatMoney(m.revenueRecovered)}**`
      : "",
    "",
    m.upcomingDueServices > 0
      ? `📅 Өнөөдөр дуусах үйлчилгээ: **${m.upcomingDueServices}**, тооцоолсон орлого: **${formatMoney(m.estimatedUpcomingRevenue)}**`
      : `📅 Өнөөдөр дуусах үйлчилгээ байхгүй`,
    m.missedOpportunityValue > 0
      ? `⚠️ Хугацаа хэтэрсэн үйлчилгээнээс алдсан орлого: **${formatMoney(m.missedOpportunityValue)}**`
      : "",
  ];

  return lines.filter(Boolean).join("\n");
}

function buildWeeklySummary(orgName: string, m: MoneyImpactSummary): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const summaryLine =
    m.upcomingDueServices > 0
      ? `│ **${m.upcomingDueServices}** үйлчлүүлэгч энэ долоо хоногт үйлчилгээнд дуусах хугацаатай. Тооцоолсон орлого: **${formatMoney(m.estimatedUpcomingRevenue)}**`
      : "";

  const lines = [
    `📊 *Долоо хоногийн хураангуй — ${orgName}*`,
    `📅 ${formatDate(weekAgo.toISOString())} → ${formatDate(weekEnd.toISOString())}`,
    "",
    `📨 Илгээгдсэн сануулга: **${m.remindersSent}**`,
    m.customersReturned > 0
      ? `👥 Буцаж ирсэн үйлчлүүлэгч: **${m.customersReturned}**`
      : `👥 Буцаж ирсэн үйлчлүүлэгч: **0**`,
    m.revenueRecovered > 0
      ? `💰 Сэргээгдсэн орлого: **${formatMoney(m.revenueRecovered)}**`
      : `💰 Сэргээгдсэн орлого: **₮0**`,
    `📅 Долоо хоногт дуусах үйлчилгээ: **${m.upcomingDueServices}**`,
    `💵 Ашиглагдаагүй боломж: **${formatMoney(m.missedOpportunityValue)}**`,
    "",
    summaryLine,
  ];

  return lines.filter(Boolean).join("\n");
}

// ── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Load bot token from env var or DB fallback
  await loadBotToken();

  // Determine notification type from request
  const url = new URL(req.url);
  const period =
    url.searchParams.get("period") === "weekly" ? "weekly" : "daily";

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
      const summary = await computeMoneyImpact(supabase, orgId, period);
      const message =
        period === "weekly"
          ? buildWeeklySummary(entry.name, summary)
          : buildDailySummary(entry.name, summary);

      for (const link of entry.links) {
        try {
          const res = await sendMessage(link.chat_id, message);
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
