import { NextResponse } from "next/server";
import type { TelegramUpdate } from "@/channels/types";
import { TelegramChannel } from "@/channels/telegram";
import { resolveOrgFromBotKey } from "@/gateway/mode-b";
import { confirmAction, rejectAction } from "@/runtime/confirmation";
import { transcribeVoice } from "@/stt/groq";
import { handleAgentMessage } from "@/gateway/agent-handler";
import { systemPromptFor, getProductTools } from "@/gateway/webhook-helpers";
import { createServiceClient } from "@/lib/supabase";

// ─── Lazy singleton ─────────────────────────────────────────────────────────

let telegram: TelegramChannel | null = null;
function getTelegram(): TelegramChannel {
  if (!telegram) telegram = new TelegramChannel();
  return telegram;
}

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ botKey: string }> },
): Promise<NextResponse> {
  const { botKey } = await params;
  const tg = getTelegram();
  const sb = createServiceClient();

  try {
    const body = await request.json();
    const update = body as TelegramUpdate;

    // Handle callback queries
    if (update.callback_query) {
      const cq = update.callback_query;
      const data = cq.data ?? "";
      const chatId = cq.message?.chat.id ?? 0;
      const messageId = cq.message?.message_id ?? 0;
      const userId = cq.from.id;
      const [action, nonce] = data.split(":");

      if (action === "confirm") {
        const staged = confirmAction(nonce, chatId, userId);
        if (!staged) {
          await tg.answerCallbackQuery(cq.id, "Энэ үйлдлийн хугацаа дууссан.");
          return NextResponse.json({ ok: true });
        }
        await tg.editMessageText(chatId, messageId, `✅ Баталгаажууллаа: ${staged.summary}`);
        await tg.answerCallbackQuery(cq.id, "✅ Амжилттай.");
      } else if (action === "reject") {
        rejectAction(nonce);
        await tg.editMessageText(chatId, messageId, "❌ Цуцаллаа.");
        await tg.answerCallbackQuery(cq.id, "❌ Цуцаллаа.");
      }
      return NextResponse.json({ ok: true });
    }

    const msg = update.message;
    if (!msg?.text && !msg?.voice) {
      return NextResponse.json({ ok: true });
    }

    const chatId = msg.chat.id;
    const userId = msg.from?.id ?? 0;
    const chatType = msg.chat.type;

    // Resolve org from bot key
    const orgCtx = await resolveOrgFromBotKey(sb, botKey);
    if (!orgCtx) {
      await tg.sendMessage(chatId, "❌ Энэ бот идэвхгүй эсвэл олдсонгүй.");
      return NextResponse.json({ ok: true });
    }

    // Set per-message identity
    const ctx = { ...orgCtx, chatId, telegramUserId: userId };

    // Handle voice messages
    if (msg.voice) {
      await tg.sendMessage(chatId, "🎤 Аудио хүлээн авлаа. Бичлэг тайлж байна...");
      await tg.sendChatAction(chatId, "typing");

      const voice = msg.voice;
      const fileInfo = await tg.getFile(voice.file_id);
      const fileBuffer = await tg.downloadFile(fileInfo.file_path);
      const transcribed = await transcribeVoice(fileBuffer, `${voice.file_id}.ogg`);

      if (!transcribed) {
        await tg.sendMessage(chatId, "❌ Дууг таньж чадсангүй. Дахин оролдоно уу.");
        return NextResponse.json({ ok: true });
      }

      await tg.sendChatAction(chatId, "typing");
      const response = await handleAgentMessage(ctx, transcribed, chatType, {
        getSystemPrompt: systemPromptFor,
        getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
      });
      await tg.sendMessage(chatId, response);
      return NextResponse.json({ ok: true });
    }

    const text = msg.text ?? "";

    await tg.sendMessage(chatId, "⏳ Түр хүлээнэ үү...");
    await tg.sendChatAction(chatId, "typing");

    const response = await handleAgentMessage(ctx, text, chatType, {
      getSystemPrompt: systemPromptFor,
      getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
    });
    await tg.sendMessage(chatId, response);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Custom bot webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
