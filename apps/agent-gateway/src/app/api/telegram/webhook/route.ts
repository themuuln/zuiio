import { NextResponse } from "next/server";
import type { TelegramUpdate } from "@/channels/types";
import { TelegramChannel } from "@/channels/telegram";
import { resolveOrgFromChatUser } from "@/gateway/mode-a";
import { DeepSeekProvider } from "@/providers/deepseek";
import { GptMiniProvider } from "@/providers/gpt-mini";
import { AiGateway, type GatewayTool, type ToolContext } from "@/providers/types";
import { stageAction, confirmAction, rejectAction } from "@/runtime/confirmation";
import { loadSession, appendToSession } from "@/state/session";
import { checkDailyBudget, recordUsageAtomic, REQUEST_LIMITS } from "@/state/budget";
import { createServiceClient } from "@/lib/supabase";
import { deepSeekConfig, openAiConfig } from "@/lib/env";
import { sanitizeUserInput } from "@/lib/sanitize";
import { verifyLinkToken } from "@/lib/tokens";

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

function tolomTools(_context: ToolContext): GatewayTool[] {
  return [
    {
      name: "getDailySummary",
      description: "Өдрийн борлуулалт, зарлага, идэвхтэй захиалга",
      parameters: [],
      execute: async () => ({ message: "Өдрийн хураангуй удахгүй бэлэн болно." }),
    },
    {
      name: "getActiveWorkOrders",
      description: "Идэвхтэй захиалгын жагсаалт + төлөв",
      parameters: [],
      execute: async () => ({ message: "Идэвхтэй захиалгын жагсаалт удахгүй бэлэн болно." }),
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
      await getTelegram().sendMessage(chatId, "🎤 Дууны мессеж хүлээн авлаа. Дуунаас текст рүү хөрвүүлэх удахгүй нэмэгдэнэ.");
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

  // Select tools
  const tools = productType === "tolom" ? tolomTools(context) : zerTools(context);

  await tg.sendMessage(chatId, "⏳ Түр хүлээнэ үү...");

  try {
    const response = await getProviders().runWithTools({
      system: systemPromptFor(productType, context.orgId, chatType),
      userMessage: sanitizeUserInput(text),
      tools,
      context,
      maxRounds: REQUEST_LIMITS.maxToolRounds,
    });

    await tg.sendMessage(chatId, response);
    await appendToSession(sb, context.orgId, chatId, userId, text, response, 500);
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

  if (action === "confirm") {
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
