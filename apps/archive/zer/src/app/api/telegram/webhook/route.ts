import { runWithTools } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createAllAgentTools } from "@/lib/agent-tools";
import {
  bindBuyerSession,
  getBuyerOrg,
  getBuyerSession,
  runBuyerAgent,
  touchBuyerSession,
} from "@/lib/bot-commerce";
import { createServiceClient } from "@/lib/supabase/server-service";

const WELCOME_MESSAGE = `Сайн байна уу! 👋 Би таны Zer-ийн AI туслах.

Би дараах зүйлсийг хийж чадна:
• Барааны нөөц, үнэ харах
• Бага нөөцтэй барааг шалгах
• Борлуулалтын тайлан харах
• Дутуу төлөлт шалгах

Эхлэхийн тулд Zer апп-д нэвтэрч Тохиргоо → Telegram холбох хэсгээс бүртгэлээ холбоно уу.`;

const NO_TEXT_MESSAGE = "Уучлаарай, зөвхөн текст мессеж хүлээн авна.";

const NOT_BOUND_MESSAGE = `Сайн байна уу! 👋

Энэ ботыг ашиглан дэлгүүрээс захиалга хийх боломжтой. Эхлүүлэхийн тулд дэлгүүрийн вэб хуудаснаас "Telegram-ээр захиалах" товчийг дарна уу.`;

const UNKNOWN_SHOP_MESSAGE = "Дэлгүүр олдсонгүй. Холбоосыг шалгана уу.";

const SYSTEM_PROMPT =
  "Та Монголын жижиг дунд бизнесийн AI туслах. Хариултаа Монгол хэлээр, товч, ойлгомжтой өгнө үү. Хэрэглэгчийн асуултанд хариулахдаа боломжтой бол багажуудыг ашиглана уу.";

const ERROR_MESSAGE =
  "Уучлаарай, хүсэлтийг боловсруулахад алдаа гарлаа. Дахин оролдоно уу.";

/**
 * POST /api/telegram/webhook
 *
 * Telegram bot webhook entry point with two modes:
 *
 * 1. Merchant mode — sender is linked via telegram_agent_links: runs the
 *    merchant AI tools (inventory/sales) and REPLIES with the answer.
 * 2. Buyer mode (AI chat commerce) — the buyer deep-links from the
 *    storefront ("Telegram-ээр захиалах" → t.me/<bot>?start=<slug>), which
 *    arrives as "/start <slug>" and binds the chat to the shop in
 *    bot_buyer_sessions. Subsequent messages run the buyer agent (public
 *    catalog + place_order) against that shop.
 *
 * Always returns 200 — Telegram retries if it sees non-200,
 * and business errors are sent as reply messages instead.
 */
export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────
  // Telegram delivers setWebhook secret_token as the
  // X-Telegram-Bot-Api-Secret-Token header; the Authorization Bearer form
  // is kept for curl/testing and agent-gateway-proxied webhooks.
  const authHeader = request.headers.get("authorization");
  const telegramSecretHeader = request.headers.get(
    "x-telegram-bot-api-secret-token",
  );
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const authorized =
    webhookSecret != null &&
    (authHeader === `Bearer ${webhookSecret}` ||
      telegramSecretHeader === webhookSecret);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (e) {
    capture(e, { context: "telegram: parse webhook body" });
    return NextResponse.json({ ok: true });
  }

  const message = body.message as Record<string, unknown> | undefined;
  const chat = message?.chat as Record<string, unknown> | undefined;
  const chatId = chat?.id as number | undefined;
  const text = message?.text as string | undefined;

  if (!chatId) {
    return NextResponse.json({ ok: true });
  }

  // ── No text ───────────────────────────────────────────────────────
  if (!text) {
    await sendTelegramMessage(chatId, NO_TEXT_MESSAGE);
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceClient();
  const chatIdStr = chatId.toString();
  const origin = new URL(request.url).origin;

  // Bot token — global (single bot serves all shops; shop context comes
  // from the buyer session, not from per-shop tokens).
  const { data: botTokenRow } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "telegram_bot_token")
    .maybeSingle();
  const rawToken = botTokenRow?.value;
  const botToken =
    rawToken && typeof rawToken === "object" && "token" in rawToken
      ? String(rawToken.token)
      : undefined;

  if (!botToken) {
    await sendTelegramMessage(
      chatId,
      "Уучлаарай, системийн тохиргоо дутуу байна. Админтай холбогдоно уу.",
    );
    return NextResponse.json({ ok: true });
  }

  // ── /start: merchant welcome OR buyer deep-link bind ──────────────
  if (text === "/start" || text.startsWith("/start ")) {
    const payload = text.split(/\s+/)[1]?.trim() ?? "";

    // Deep link with a shop slug → bind this chat to that shop.
    if (payload) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("slug", payload)
        .maybeSingle();

      if (org) {
        await bindBuyerSession(supabase, "telegram", chatIdStr, org.id);
        await sendTelegramMessage(
          chatId,
          `Сайн байна уу! 👋 Би "${org.name}" дэлгүүрийн AI туслах.\n\nБи бүтээгдэхүүн хайж, үнэ хэлж, захиалга авч чадна. Юу хайж байна вэ?`,
          botToken,
        );
        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessage(chatId, UNKNOWN_SHOP_MESSAGE, botToken);
      return NextResponse.json({ ok: true });
    }

    // Plain /start — buyer already bound gets the shop welcome again.
    const existing = await getBuyerSession(supabase, "telegram", chatIdStr);
    if (existing) {
      const org = await getBuyerOrg(supabase, existing.organization_id);
      await sendTelegramMessage(
        chatId,
        org
          ? `Сайн байна уу! 👋 Би "${org.name}" дэлгүүрийн AI туслах. Юу хайж байна вэ?`
          : WELCOME_MESSAGE,
        botToken,
      );
      return NextResponse.json({ ok: true });
    }

    await sendTelegramMessage(chatId, WELCOME_MESSAGE, botToken);
    return NextResponse.json({ ok: true });
  }

  // ── Merchant mode ─────────────────────────────────────────────────
  const { data: link } = await supabase
    .from("telegram_agent_links")
    .select("organization_id, user_id")
    .eq("telegram_chat_id", chatIdStr)
    .maybeSingle();

  if (link) {
    await supabase
      .from("telegram_agent_links")
      .update({ last_active_at: new Date().toISOString() })
      .eq("telegram_chat_id", chatIdStr);

    try {
      const tools = createAllAgentTools(supabase, link.organization_id);
      const deepseekKey = process.env.DEEPSEEK_API_KEY;

      if (!deepseekKey) {
        await sendTelegramMessage(
          chatId,
          "Уучлаарай, AI үйлчилгээ түр идэвхгүй байна. Дахин оролдоно уу.",
          botToken,
        );
        return NextResponse.json({ ok: true });
      }

      const response = await runWithTools({
        apiKey: deepseekKey,
        systemPrompt: SYSTEM_PROMPT,
        userMessage: text,
        tools,
      });

      await sendTelegramMessage(chatId, response, botToken);
    } catch (e) {
      capture(e, { context: "telegram: AI agent error" });
      await sendTelegramMessage(chatId, ERROR_MESSAGE, botToken);
    }

    return NextResponse.json({ ok: true });
  }

  // ── Buyer mode ────────────────────────────────────────────────────
  const session = await getBuyerSession(supabase, "telegram", chatIdStr);

  if (!session) {
    await sendTelegramMessage(chatId, NOT_BOUND_MESSAGE, botToken);
    return NextResponse.json({ ok: true });
  }

  const org = await getBuyerOrg(supabase, session.organization_id);
  if (!org) {
    await sendTelegramMessage(chatId, UNKNOWN_SHOP_MESSAGE, botToken);
    return NextResponse.json({ ok: true });
  }

  await touchBuyerSession(supabase, session.id);

  try {
    const reply = await runBuyerAgent({
      supabase,
      org,
      text,
      baseUrl: origin,
    });
    await sendTelegramMessage(chatId, reply, botToken);
  } catch (e) {
    capture(e, { context: "telegram: buyer agent error" });
    await sendTelegramMessage(chatId, ERROR_MESSAGE, botToken);
  }

  return NextResponse.json({ ok: true });
}

// ── Helpers ──────────────────────────────────────────────────────────

async function sendTelegramMessage(
  chatId: number,
  text: string,
  botToken?: string,
): Promise<void> {
  const token = botToken ?? process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    capture(new Error("TELEGRAM_BOT_TOKEN not set"), {
      context: "telegram sendMessage",
    });
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      },
    );

    if (!res.ok) {
      capture(
        new Error(
          `Telegram sendMessage failed: ${res.status} ${res.statusText}`,
        ),
        { context: "telegram sendMessage" },
      );
    }
  } catch (err) {
    capture(err, { context: "telegram sendMessage" });
  }
}
