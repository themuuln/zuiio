import { runWithTools } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createAllAgentTools } from "@/lib/agent-tools";
import { createServiceClient } from "@/lib/supabase/server-service";

const WELCOME_MESSAGE = `Сайн байна уу! 👋 Би таны Zer-ийн AI туслах.

Би дараах зүйлсийг хийж чадна:
• Барааны нөөц, үнэ харах
• Бага нөөцтэй барааг шалгах
• Борлуулалтын тайлан харах
• Дутуу төлөлт шалгах

Эхлэхийн тулд Zer апп-д нэвтэрч Тохиргоо → Telegram холбох хэсгээс бүртгэлээ холбоно уу.`;

const NO_LINK_MESSAGE =
  "Таны Telegram бүртгэл холбогдоогүй байна. Zer апп-д нэвтэрч Тохиргоо → Telegram холбох хэсгээс холбоно уу.";

const NO_TEXT_MESSAGE = "Уучлаарай, зөвхөн текст мессеж хүлээн авна.";

const SYSTEM_PROMPT =
  "Та Монголын жижиг дунд бизнесийн AI туслах. Хариултаа Монгол хэлээр, товч, ойлгомжтой өгнө үү. Хэрэглэгчийн асуултанд хариулахдаа боломжтой бол багажуудыг ашиглана уу.";

const ERROR_MESSAGE =
  "Уучлаарай, хүсэлтийг боловсруулахад алдаа гарлаа. Дахин оролдоно уу.";

/**
 * POST /api/telegram/webhook
 *
 * Telegram bot webhook entry point. Resolves the user's organization
 * via telegram_agent_links, runs curated AI agent tools against their
 * shop data, and replies in Mongolian via the Telegram sendMessage API.
 *
 * Always returns 200 — Telegram retries if it sees non-200,
 * and business errors are sent as reply messages instead.
 */
export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
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

  // ── /start command ────────────────────────────────────────────────
  if (text === "/start") {
    await sendTelegramMessage(chatId, WELCOME_MESSAGE);
    return NextResponse.json({ ok: true });
  }

  // ── Resolve organization ──────────────────────────────────────────
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from("telegram_agent_links")
    .select("organization_id, user_id")
    .eq("telegram_chat_id", chatId.toString())
    .maybeSingle();

  if (!link) {
    await sendTelegramMessage(chatId, NO_LINK_MESSAGE);
    return NextResponse.json({ ok: true });
  }

  // Update last_active_at
  await supabase
    .from("telegram_agent_links")
    .update({ last_active_at: new Date().toISOString() })
    .eq("telegram_chat_id", chatId.toString());

  const orgId = link.organization_id;

  // ── Bot token ─────────────────────────────────────────────────────
  const { data: botTokenRow } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "telegram_bot_token")
    .maybeSingle();

  const botToken = (botTokenRow?.value as { token?: string })?.token;

  if (!botToken) {
    await sendTelegramMessage(
      chatId,
      "Уучлаарай, системийн тохиргоо дутуу байна. Админтай холбогдоно уу.",
    );
    return NextResponse.json({ ok: true });
  }

  // ── Org name ──────────────────────────────────────────────────────
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();

  const _orgName = (org?.name as string) ?? "Таны бизнес";

  // ── Run AI agent ──────────────────────────────────────────────────
  try {
    const tools = createAllAgentTools(supabase, orgId);
    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    if (!deepseekKey) {
      await sendTelegramMessage(
        chatId,
        "Уучлаарай, AI үйлчилгээ түр идэвхгүй байна. Дахин оролдоно уу.",
        botToken,
      );
      return NextResponse.json({ ok: true });
    }

    const result = await runWithTools({
      apiKey: deepseekKey,
      systemPrompt: SYSTEM_PROMPT,
      userMessage: text,
      tools,
    });

    await sendTelegramMessage(chatId, result, botToken);
  } catch {
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
