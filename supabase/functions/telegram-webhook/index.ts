import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Environment ──────────────────────────────────────────────────
let TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
let TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ── Config loader (env var → DB fallback) ────────────────────────
async function loadAppConfig(): Promise<void> {
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_WEBHOOK_SECRET) return;
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: rows } = await supabase
      .from("app_config")
      .select("key, value");
    if (!rows) return;
    for (const row of rows) {
      if (row.key === "telegram_bot_token" && !TELEGRAM_BOT_TOKEN) {
        TELEGRAM_BOT_TOKEN = row.value;
      } else if (
        row.key === "telegram_webhook_secret" &&
        !TELEGRAM_WEBHOOK_SECRET
      ) {
        TELEGRAM_WEBHOOK_SECRET = row.value;
      }
    }
  } catch (e) {
    console.error("Failed to load app config from DB:", e);
  }
}

function tgApi(token: string): string {
  return `https://api.telegram.org/bot${token}`;
}

async function sendMessage(
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

// ── Types ────────────────────────────────────────────────────────

/** Telegram Update object — only the fields we care about. */
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    from?: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    text?: string;
    entities?: { type: string; offset: number; length: number }[];
  };
}

// ── Command Handlers ─────────────────────────────────────────────

/**
 * /start <token>
 * Verifies a one-time link token and creates a telegram_links subscription.
 */
async function handleStart(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
  fromId: number,
  username: string | undefined,
  firstName: string | undefined,
  lastName: string | undefined,
  args: string,
) {
  if (!args) {
    await sendMessage(
      chatId,
      "👋 *TOLOM-д тавтай морил!*\n\n" +
        "Энэ ботыг ашиглахын тулд TOLOM системээсээ холбох токен үүсгэнэ үү.\n\n" +
        "1. TOLOM системд нэвтрэх\n" +
        "2. Тохиргоо → Telegram хэсэгт орох\n" +
        '3. "Холбох" товчийг дарж токен үүсгэх\n' +
        "4. Энэ чатад /start командыг токены хамт илгээх",
    );
    return;
  }

  const token = args.trim();
  const tokenHash = await crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(token))
    .then((h) => {
      const bytes = new Uint8Array(h);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    });

  // Find unexpired, unused token
  const { data: tokenRecord, error: tokenError } = await supabase
    .from("telegram_link_tokens")
    .select("id, organization_id, user_id")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  if (tokenError || !tokenRecord) {
    console.error("Token lookup failed:", tokenError);
    await sendMessage(
      chatId,
      "❌ Токен хүчингүй эсвэл хугацаа нь дууссан байна. Системээс шинэ токен үүсгэнэ үү.",
    );
    return;
  }

  // Mark token as used
  await supabase
    .from("telegram_link_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRecord.id);

  // Upsert telegram link (upsert by unique constraint)
  const { error: linkError } = await supabase.from("telegram_links").upsert(
    {
      organization_id: tokenRecord.organization_id,
      user_id: tokenRecord.user_id,
      telegram_chat_id: chatId,
      telegram_user_id: fromId,
      telegram_username: username ?? null,
      first_name: firstName ?? null,
      last_name: lastName ?? null,
      is_active: true,
    },
    {
      onConflict: "organization_id, user_id, telegram_chat_id",
      ignoreDuplicates: false,
    },
  );

  if (linkError) {
    console.error("Failed to create telegram link:", linkError);
    await sendMessage(
      chatId,
      "❌ Холболт амжилтгүй боллоо. Та дахин оролдоно уу.",
    );
    return;
  }

  // Get org name for the welcome message
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", tokenRecord.organization_id)
    .single();

  await sendMessage(
    chatId,
    `✅ *Амжилттай холбогдлоо!*\n\n` +
      `Таны TOLOM данс \`${org?.name ?? "байгууллага"}\`-тай холбогдлоо.\n\n` +
      `Энэ чатаар та дараах мэдэгдлүүдийг хүлээн авах болно:\n` +
      `📊 Өдөр тутмын хураангуй\n` +
      `📈 Долоо хоногийн тайлан\n` +
      `🔔 Яаралтай үйлчилгээний сануулга\n\n` +
      `Тушаалууд:\n` +
      `/status — Одоогийн үзүүлэлтүүд\n` +
      `/stop — Мэдэгдлийг зогсоох`,
  );
}

/**
 * /status
 * Sends a quick money-impact summary for the linked org.
 */
async function handleStatus(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
) {
  const link = await getActiveLink(supabase, chatId);
  if (!link) return;

  const summary = await computeOrgSummary(supabase, link.organization_id);

  const lines = [
    `📊 *Тайлан — ${link.org_name}*`,
    "",
    `📨 Илгээгдсэн сануулга: **${summary.remindersSent}**`,
    `👥 Буцаж ирсэн үйлчлүүлэгч: **${summary.customersReturned}**`,
    `💰 Орлого: **${formatMoney(summary.revenueRecovered)}**`,
    `📅 Долоо хоногт дуусах үйлчилгээ: **${summary.upcomingDueServices}**`,
    `💵 Ашиглагдаагүй боломж: **${formatMoney(summary.missedOpportunityValue)}**`,
  ];

  await sendMessage(chatId, lines.join("\n"));
}

/**
 * /stop
 * Deactivates the link for this chat.
 */
async function handleStop(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
) {
  const { error } = await supabase
    .from("telegram_links")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("telegram_chat_id", chatId)
    .eq("is_active", true);

  if (error) {
    console.error("Failed to deactivate link:", error);
    await sendMessage(chatId, "❌ Алдаа гарлаа. Та дахин оролдоно уу.");
    return;
  }

  await sendMessage(
    chatId,
    "🛑 Мэдэгдэл зогслоо.\n\n" +
      "Мэдэгдлийг дахин идэвхжүүлэхийн тулд TOLOM системээс шинэ токен үүсгэн /start командыг илгээнэ үү.",
  );
}

// ── Helpers ──────────────────────────────────────────────────────

interface ActiveLink {
  organization_id: string;
  org_name: string;
}

async function getActiveLink(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
): Promise<ActiveLink | null> {
  const { data: raw } = await supabase
    .from("telegram_links")
    .select("organization_id, organizations!inner(name)")
    .eq("telegram_chat_id", chatId)
    .eq("is_active", true)
    .maybeSingle();

  if (!raw) {
    await sendMessage(
      chatId,
      "❌ Таны холбоотой данс олдсонгүй.\n\n" +
        "TOLOM системээс токен үүсгэн /start командыг илгээнэ үү.",
    );
    return null;
  }

  const link = raw as unknown as {
    organization_id: string;
    organizations: { name: string };
  };

  return {
    organization_id: link.organization_id,
    org_name: link.organizations.name,
  };
}

interface OrgSummary {
  remindersSent: number;
  customersReturned: number;
  revenueRecovered: number;
  upcomingDueServices: number;
  estimatedUpcomingRevenue: number;
  missedOpportunityValue: number;
}

async function computeOrgSummary(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
): Promise<OrgSummary> {
  const now = new Date();
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const sixtyDaysAgo = new Date(
    now.getTime() - 60 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // 1. Reminders sent in last 7 days
  const { count: remindersSent } = await supabase
    .from("reminder_logs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "sent")
    .gte("sent_at", sevenDaysAgo);

  // 2. Upcoming due services (next 7 days)
  const { data: upcomingSchedules } = await supabase
    .from("vehicle_service_schedules")
    .select("id, service_catalog_id")
    .eq("organization_id", orgId)
    .eq("reminder_enabled", true)
    .is("deleted_at", null)
    .gte("next_due_date", today)
    .lte("next_due_date", sevenDaysFromNow);

  const upcomingDueServices = upcomingSchedules?.length ?? 0;

  // 3. Estimated upcoming revenue — use service_catalog.default_price when available
  let estimatedUpcomingRevenue = 0;
  if (upcomingSchedules && upcomingSchedules.length > 0) {
    const catalogIds = upcomingSchedules
      .filter((s) => s.service_catalog_id)
      .map((s) => s.service_catalog_id);

    if (catalogIds.length > 0) {
      const { data: prices } = await supabase
        .from("service_catalog")
        .select("id, default_price")
        .in("id", catalogIds);

      const priceMap = new Map(
        prices?.map((p) => [p.id, p.default_price]) ?? [],
      );
      const withPrice = upcomingSchedules.filter(
        (s) => s.service_catalog_id && priceMap.has(s.service_catalog_id),
      );
      const withoutPrice = upcomingSchedules.filter(
        (s) => !s.service_catalog_id,
      );

      for (const s of withPrice) {
        estimatedUpcomingRevenue += priceMap.get(s.service_catalog_id!) ?? 0;
      }

      // For schedules without a catalog price, use org average work order total
      if (withoutPrice.length > 0) {
        const { data: avgResult } = await supabase
          .from("work_orders")
          .select("total")
          .eq("organization_id", orgId)
          .eq("status", "Completed")
          .is("deleted_at", null)
          .order("completed_at", { ascending: false })
          .limit(100);

        const avgTotal =
          avgResult && avgResult.length > 0
            ? avgResult.reduce((sum, wo) => sum + wo.total, 0) /
              avgResult.length
            : 0;

        estimatedUpcomingRevenue += withoutPrice.length * avgTotal;
      }
    }
  }

  // 4. Customers returned after reminder (sent reminder → completed work order within 60 days)
  const { data: sentReminders } = await supabase
    .from("reminder_logs")
    .select("customer_id, sent_at")
    .eq("organization_id", orgId)
    .eq("status", "sent")
    .gte("sent_at", sixtyDaysAgo)
    .not("customer_id", "is", null);

  const customersReturned = 0;
  let revenueRecovered = 0;

  if (sentReminders && sentReminders.length > 0) {
    const customerIds = [
      ...new Set(sentReminders.map((r) => r.customer_id)),
    ] as string[];

    // Find completed work orders for these customers after reminder was sent
    for (const reminder of sentReminders) {
      if (!reminder.customer_id) continue;
      const reminderSentAt = reminder.sent_at;

      const { data: completedWOs } = await supabase
        .from("work_orders")
        .select("id, total, completed_at")
        .eq("organization_id", orgId)
        .eq("customer_id", reminder.customer_id)
        .eq("status", "Completed")
        .gte("completed_at", reminderSentAt)
        .lte(
          "completed_at",
          new Date(
            new Date(reminderSentAt).getTime() + 60 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        )
        .is("deleted_at", null);

      if (completedWOs && completedWOs.length > 0) {
        customersReturned++;
        for (const wo of completedWOs) {
          revenueRecovered += wo.total;
        }
      }
    }
  }

  // 5. Missed opportunity value (overdue schedules × avg service value)
  const { count: overdueCount } = await supabase
    .from("vehicle_service_schedules")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("reminder_enabled", true)
    .is("deleted_at", null)
    .lt("next_due_date", today);

  // Use org average work order total for missed opportunity
  const { data: recentCompleted } = await supabase
    .from("work_orders")
    .select("total")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .is("deleted_at", null)
    .order("completed_at", { ascending: false })
    .limit(50);

  const avgOrderValue =
    recentCompleted && recentCompleted.length > 0
      ? recentCompleted.reduce((sum, wo) => sum + wo.total, 0) /
        recentCompleted.length
      : 0;

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

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return `₮${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₮${(amount / 1_000).toFixed(0)}K`;
  }
  return `₮${Math.round(amount).toLocaleString()}`;
}

// ── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Load app config from env vars or DB fallback
  await loadAppConfig();

  // Verify webhook secret token
  const secretToken = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (TELEGRAM_WEBHOOK_SECRET && secretToken !== TELEGRAM_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse incoming update
  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // Ignore non-message updates (channel posts, callback queries, etc.)
  if (!update.message?.text) {
    return new Response("OK");
  }

  const msg = update.message;
  const chatId = msg.chat.id;

  // Only handle private chats for security
  if (msg.chat.type !== "private") {
    return new Response("OK");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const text = msg.text.trim();
  const fromId = msg.from?.id ?? 0;
  const username = msg.chat.username;
  const firstName = msg.chat.first_name;
  const lastName = msg.chat.last_name;

  try {
    if (text.startsWith("/start")) {
      const args = text.slice(6).trim(); // "/start " or "/start<token>"
      await handleStart(
        supabase,
        chatId,
        fromId,
        username,
        firstName,
        lastName,
        args,
      );
    } else if (text === "/status") {
      await handleStatus(supabase, chatId);
    } else if (text === "/stop") {
      await handleStop(supabase, chatId);
    } else {
      await sendMessage(
        chatId,
        "❓ Танигдаагүй тушаал.\n\n" +
          `Боломжтой тушаалууд:\n` +
          `/start [токен] — TOLOM-тэй холбох\n` +
          `/status — Одоогийн үзүүлэлтүүд\n` +
          `/stop — Мэдэгдлийг зогсоох`,
      );
    }
  } catch (err) {
    console.error("Error handling update:", err);
    try {
      await sendMessage(chatId, "❌ Алдаа гарлаа. Дараа дахин оролдоно уу.");
    } catch {
      // Best-effort
    }
  }

  return new Response("OK");
});
