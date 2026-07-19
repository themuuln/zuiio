import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Environment ──────────────────────────────────────────────────
let TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
let TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

let commandsRegistered = false;

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

// ── Telegram API Helpers ─────────────────────────────────────────

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

async function answerCallbackQuery(
  callback_query_id: string,
  opts: { text?: string; show_alert?: boolean } = {},
) {
  return fetch(`${tgApi(TELEGRAM_BOT_TOKEN)}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id, ...opts }),
  });
}

async function registerBotCommands(): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    const res = await fetch(`${tgApi(TELEGRAM_BOT_TOKEN)}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          {
            command: "start",
            description: "🔗 TOLOM-тэй холбох (токен хамт)",
          },
          { command: "status", description: "📊 Орлогын хураангуй харах" },
          {
            command: "link",
            description: "📱 Утасны дугаараар холбогдох (харилцагч)",
          },
          {
            command: "unlink",
            description: "🛑 Сануулгын холболтыг салгах (харилцагч)",
          },
          { command: "stop", description: "🔕 Мэдэгдлийг зогсоох" },
        ],
      }),
    });
    if (res.ok) {
      commandsRegistered = true;
      console.log("Bot commands registered successfully");
    } else {
      console.error("Failed to register commands:", await res.text());
    }
  } catch (e) {
    console.error("Failed to register commands:", e);
  }
}

// ── Types ────────────────────────────────────────────────────────

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
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: { id: number; type: string };
      text?: string;
    };
    data?: string;
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
      {
        reply_markup: inlineKeyboard([
          [{ text: "🔗 Хэрхэн холбогдох?", callback_data: "how_to_link" }],
        ]),
      },
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
      "❌ Токен хүчингүй эсвэл хугацаа нь дууссан байна.\n\n" +
        "Системээс шинэ токен үүсгэнэ үү.",
      {
        reply_markup: inlineKeyboard([
          [
            {
              text: "🔄 Шинэ токен авах",
              url: "https://app.tolom.mn/settings",
            },
          ],
        ]),
      },
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
      `📊 Өдөр тутмын хураангуй (22:00)\n` +
      `📈 Долоо хоногийн тайлан (Даваа 22:00)\n` +
      `🔔 Яаралтай үйлчилгээний сануулга\n\n` +
      `Тушаалуудыг ашиглахдаа / дарж эсвэл доорх товчнуудыг ашиглана уу.`,
    {
      reply_markup: inlineKeyboard([
        [
          { text: "📊 Хураангуй", callback_data: "status" },
          { text: "🔔 Сануулга", callback_data: "reminders" },
        ],
        [{ text: "❌ Мэдэгдэл зогсоох", callback_data: "stop" }],
      ]),
    },
  );
}

/**
 * /status
 * Sends a daily business summary for the linked org.
 */
async function handleStatus(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
) {
  const link = await getActiveLink(supabase, chatId);
  if (!link) return;

  const today = await computeDailySummary(supabase, link.organization_id);

  const lines = [
    `📊 *Өдрийн хураангуй — ${link.org_name}*`,
    `📅 ${new Date().toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
    `💰 *Орлого:* ${formatMoney(today.revenue)}`,
    `💸 *Зарлага:* ${formatMoney(today.expenses)}`,
    today.netProfit >= 0
      ? `📈 *Цэвэр ашиг:* ${formatMoney(today.netProfit)}`
      : `📉 *Цэвэр алдагдал:* ${formatMoney(today.netProfit)}`,
    "",
    `🔧 *Идэвхтэй захиалга:* ${today.activeJobs}`,
    `   📋 Шинэ: ${today.newJobs} | 🔍 Онош: ${today.diagnosing} | ⚙️ Хийж буй: ${today.inProgress}`,
    `✅ Өнөөдөр гүйцэтгэсэн: ${today.completedToday}`,
    "",
    `🚗 Нийт үйлчлүүлэгч: ${today.totalCustomers}`,
    `📅 Ойрын 7 хоногт дуусах: ${today.upcomingServices}`,
    today.unpaidInvoices > 0
      ? `💳 Төлөгдөөгүй нэхэмжлэх: ${today.unpaidInvoices} (${formatMoney(today.unpaidAmount)})`
      : `💳 Төлөгдөөгүй нэхэмжлэх: 0`,
  ];

  await sendMessage(chatId, lines.filter(Boolean).join("\n"), {
    reply_markup: inlineKeyboard([
      [
        { text: "🔄 Сэргээх", callback_data: "refresh_status" },
        { text: "🔕 Зогсоох", callback_data: "stop" },
      ],
    ]),
  });
}

/**
 * /link <phone>
 * Links this Telegram chat to a customer record by phone number.
 */
async function handleLink(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
  phone: string,
) {
  if (!phone) {
    await sendMessage(
      chatId,
      "📱 *Утасны дугаараа илгээнэ үү*\n\n" +
        "Жишээ: /link 99112233\n\n" +
        "Таны утасны дугаар системд бүртгэлтэй байх шаардлагатай.",
      {
        reply_markup: inlineKeyboard([
          [
            {
              text: "ℹ️ Хэрхэн холбогдох?",
              callback_data: "how_to_link_customer",
            },
          ],
        ]),
      },
    );
    return;
  }

  // Normalize phone: remove spaces, dashes, leading 976/+
  let normalized = phone.replace(/[\s-]/g, "");
  if (normalized.startsWith("+976")) normalized = normalized.slice(4);
  else if (normalized.startsWith("976")) normalized = normalized.slice(3);
  else if (normalized.startsWith("+")) normalized = normalized.slice(1);

  // Find customer by phone across all orgs
  const { data: customers, error: customerError } = await supabase
    .from("customers")
    .select("id, organization_id, first_name, last_name, full_name")
    .or(`phone.eq.${normalized},phone.eq.+976${normalized}`)
    .is("deleted_at", null);

  if (customerError || !customers?.length) {
    console.error("Customer lookup failed:", customerError);
    await sendMessage(
      chatId,
      "❌ Таны утасны дугаар системд олдсонгүй.\n\n" +
        "Танай үйлчилгээний газрын админаас утасны дугаараа шалгуулна уу.",
    );
    return;
  }

  // If multiple orgs matched, use the most recently created customer
  const customer = customers[0];
  const name = customer.full_name || customer.first_name || "Харилцагч";

  // Store telegram_chat_id on the customer record
  const { error: updateError } = await supabase
    .from("customers")
    .update({ telegram_chat_id: chatId })
    .eq("id", customer.id);

  if (updateError) {
    console.error("Failed to link customer:", updateError);
    await sendMessage(
      chatId,
      "❌ Холболт амжилтгүй боллоо. Дараа дахин оролдоно уу.",
    );
    return;
  }

  await sendMessage(
    chatId,
    `✅ *Амжилттай холбогдлоо!*\n\n` +
      `Сайн байна уу ${name}? Та үйлчилгээний сануулгыг Телеграмаар хүлээн авах болно.\n\n` +
      `🔔 Үйлчилгээний хугацаа ойртоход энэ чатаар мэдэгдэл ирнэ.\n\n` +
      `/unlink — Холболтыг салгах\n` +
      `/status — Одоогийн үзүүлэлтүүд`,
    {
      reply_markup: inlineKeyboard([
        [{ text: "📊 Миний үйлчилгээ", callback_data: "customer_status" }],
        [{ text: "🛑 Холболт салгах", callback_data: "unlink_customer" }],
      ]),
    },
  );

  // Also handle orgs with multiple customers matching
  if (customers.length > 1) {
    for (let i = 1; i < customers.length; i++) {
      await supabase
        .from("customers")
        .update({ telegram_chat_id: chatId })
        .eq("id", customers[i].id);
    }
  }
}

/**
 * /unlink
 * Removes Telegram chat_id from the customer record.
 */
async function handleUnlink(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
) {
  const { data: customers } = await supabase
    .from("customers")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .is("deleted_at", null);

  if (!customers?.length) {
    await sendMessage(
      chatId,
      "❓ Таны Телеграм холбогдоогүй байна.\n\n/link 99112233 — утасны дугаараа илгээнэ үү.",
    );
    return;
  }

  for (const c of customers) {
    await supabase
      .from("customers")
      .update({ telegram_chat_id: null })
      .eq("id", c.id);
  }

  await sendMessage(
    chatId,
    "🛑 Холболт салгагдлаа.\n\n" +
      "Дахин холбохын тулд /link командыг утасны дугаарын хамт илгээнэ үү.",
    {
      reply_markup: inlineKeyboard([
        [{ text: "🔗 Дахин холбох", callback_data: "prompt_link" }],
      ]),
    },
  );
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
    {
      reply_markup: inlineKeyboard([
        [{ text: "🔄 Дахин идэвхжүүлэх", callback_data: "reactivate" }],
      ]),
    },
  );
}

// ── Callback Query Handler ───────────────────────────────────────

async function handleCallbackQuery(
  supabase: ReturnType<typeof createClient>,
  cb: NonNullable<TelegramUpdate["callback_query"]>,
) {
  const chatId = cb.message?.chat.id;
  const data = cb.data;
  const callbackId = cb.id;

  if (!chatId || !data) {
    await answerCallbackQuery(callbackId, { text: "Алдаа гарлаа" });
    return;
  }

  // Acknowledge the button press immediately (dismiss loading spinner)
  await answerCallbackQuery(callbackId, {});

  switch (data) {
    case "status":
    case "refresh_status":
      await handleStatus(supabase, chatId);
      break;

    case "stop":
      await handleStop(supabase, chatId);
      break;

    case "reminders":
      await sendMessage(
        chatId,
        "🔔 *Сануулгын түүх*\n\n" +
          "Таны сануулгын бүртгэлийг харахыг хүсвэл системд нэвтрэх: https://app.tolom.mn",
      );
      break;

    case "how_to_link":
      await sendMessage(
        chatId,
        "🔗 *Хэрхэн холбогдох вэ?*\n\n" +
          "1. TOLOM системд нэвтрэх\n" +
          "2. Тохиргоо → Telegram хэсэгт орох\n" +
          '3. "Холбох" товчийг дарж токен үүсгэх\n' +
          "4. Энэ чатад /start командыг токены хамт илгээх\n\n" +
          "Токен 15 минутын хугацаанд хүчинтэй.",
      );
      break;

    case "how_to_link_customer":
      await sendMessage(
        chatId,
        "📱 *Харилцагч хэрхэн холбогдох вэ?*\n\n" +
          "Өөрийн утасны дугаараа /link командын хамт илгээнэ үү.\n\n" +
          "Жишээ: `/link 99112233`\n\n" +
          "Дугаараа олон янзаар бичиж болно:\n" +
          "• 99112233\n" +
          "• +97699112233\n" +
          "• 97699112233\n" +
          "• 99-11-22-33",
      );
      break;

    case "customer_status":
      await handleCustomerStatus(supabase, chatId);
      break;

    case "unlink_customer":
      await handleUnlink(supabase, chatId);
      break;

    case "prompt_link":
      await sendMessage(
        chatId,
        "📱 Утасны дугаараа илгээнэ үү.\n\n" + "Жишээ: /link 99112233",
      );
      break;

    case "reactivate":
      await sendMessage(
        chatId,
        "🔄 *Дахин идэвхжүүлэх*\n\n" +
          "TOLOM системээс шинэ токен үүсгэн /start командыг илгээнэ үү.",
      );
      break;

    default:
      await answerCallbackQuery(callbackId, {
        text: "Танигдаагүй үйлдэл",
        show_alert: true,
      });
  }
}

/**
 * Shows a customer their current service information.
 */
async function handleCustomerStatus(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
) {
  // Find customer by telegram_chat_id
  const { data: customer } = await supabase
    .from("customers")
    .select("id, first_name, full_name")
    .eq("telegram_chat_id", chatId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!customer) {
    await sendMessage(
      chatId,
      "❓ Таны холбоотой харилцагчийн бүртгэл олдсонгүй.\n\n/link 99112233 — утасны дугаараа илгээнэ үү.",
    );
    return;
  }

  const name = customer.full_name || customer.first_name || "Харилцагч";

  // Find upcoming services for vehicles owned by this customer
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: schedules } = await supabase
    .from("vehicle_service_schedules")
    .select(
      `
      service_name,
      next_due_date,
      vehicle:vehicles!inner(plate_number)
    `,
    )
    .eq("vehicle:vehicles.customer_id", customer.id)
    .eq("reminder_enabled", true)
    .is("deleted_at", null)
    .gte("next_due_date", today)
    .lte("next_due_date", thirtyDaysFromNow)
    .order("next_due_date", { ascending: true })
    .limit(10);

  let message = `📊 *Сайн байна уу ${name}?*\n\n`;

  if (!schedules || schedules.length === 0) {
    message +=
      "✅ Таньд ойрын 30 хоногт дуусах үйлчилгээ байхгүй байна.\n\n" +
      "Шинэ үйлчилгээ нэмэхийг хүсвэл үйлчилгээний газартай холбогдоно уу.";
  } else {
    message += `🔔 Таньд **${schedules.length}** үйлчилгээ дуусах хугацаа ойртож байна:\n\n`;
    for (const s of schedules) {
      const svc = s as unknown as {
        service_name: string;
        next_due_date: string;
        vehicle: { plate_number: string };
      };
      const dueDate = new Date(svc.next_due_date).toLocaleDateString("mn-MN");
      message += `• *${svc.service_name}* — ${svc.vehicle.plate_number}\n  ⏰ ${dueDate}\n\n`;
    }
  }

  await sendMessage(chatId, message, {
    reply_markup: inlineKeyboard([
      [{ text: "🛑 Холболт салгах", callback_data: "unlink_customer" }],
    ]),
  });
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

interface DailySummary {
  revenue: number; // today's completed work orders total
  expenses: number; // today's expenses total
  netProfit: number; // revenue - expenses
  activeJobs: number; // In Progress + Diagnosing
  newJobs: number; // New work orders
  diagnosing: number; // Diagnosing
  inProgress: number; // In Progress
  completedToday: number; // completed today
  totalCustomers: number; // unique customers this period
  upcomingServices: number; // due in next 7 days
  unpaidInvoices: number; // unpaid invoice count
  unpaidAmount: number; // total unpaid amount
}

async function computeDailySummary(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  period: "daily" | "weekly" = "daily",
): Promise<DailySummary> {
  const now = new Date();
  const periodDays = period === "daily" ? 1 : 7;
  const periodStart = new Date(
    now.getTime() - periodDays * 24 * 60 * 60 * 1000,
  );
  const periodStartStr = periodStart.toISOString();
  const todayStr = now.toISOString().split("T")[0];
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // 1. Revenue from work orders completed in the period
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
    .gte("expense_date", todayStr);

  const totalExpenses =
    expenses?.reduce((sum, e) => sum + (e.amount ?? 0), 0) ?? 0;

  // 3. Active jobs (In Progress, Diagnosing)
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

  // 4. Unique customers this period
  const { data: customers } = await supabase
    .from("work_orders")
    .select("customer_id", { head: false, count: "exact" })
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .gte("created_at", periodStartStr);

  const uniqueCustomers = customers
    ? new Set(customers.map((c) => c.customer_id)).size
    : 0;

  // 5. Upcoming services (next 7 days)
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

  // Register commands on first invocation
  if (!commandsRegistered && TELEGRAM_BOT_TOKEN) {
    await registerBotCommands();
  }

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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Handle callback queries (inline button presses)
  if (update.callback_query) {
    await handleCallbackQuery(supabase, update.callback_query);
    return new Response("OK");
  }

  // Ignore non-message updates (channel posts, etc.)
  if (!update.message?.text) {
    return new Response("OK");
  }

  const msg = update.message;
  const chatId = msg.chat.id;

  // Only handle private chats for security
  if (msg.chat.type !== "private") {
    return new Response("OK");
  }

  const text = msg.text.trim();
  const fromId = msg.from?.id ?? 0;
  const username = msg.chat.username;
  const firstName = msg.chat.first_name;
  const lastName = msg.chat.last_name;

  try {
    if (text.startsWith("/start")) {
      const args = text.slice(6).trim();
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
    } else if (text.startsWith("/link ") || text === "/link") {
      const args = text === "/link" ? "" : text.slice(6).trim();
      await handleLink(supabase, chatId, args);
    } else if (text === "/unlink") {
      await handleUnlink(supabase, chatId);
    } else if (text === "/stop") {
      await handleStop(supabase, chatId);
    } else {
      await sendMessage(
        chatId,
        "❓ *Танигдаагүй тушаал*\n\n" + "Дараах тушаалуудыг ашиглана уу:",
        {
          reply_markup: inlineKeyboard([
            [{ text: "📊 Хураангуй", callback_data: "status" }],
            [{ text: "🔗 Хэрхэн холбогдох?", callback_data: "how_to_link" }],
            [
              {
                text: "📱 Харилцагч холбох",
                callback_data: "how_to_link_customer",
              },
            ],
          ]),
        },
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
