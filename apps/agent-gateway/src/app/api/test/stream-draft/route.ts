import { NextResponse } from "next/server";
import { TelegramChannel } from "@/channels/telegram";
import { capture } from "@zuiio/capture";

export const dynamic = "force-dynamic";

/**
 * GET /api/test/stream-draft?chatId=XXXXX
 *
 * Test endpoint for sendMessageDraft streaming.
 * Sends a draft that streams "Hello, this is a streaming test! 🚀" token by token.
 *
 * Usage:
 * 1. Message your bot with any text
 * 2. Note your chatId from the webhook logs
 * 3. Visit: https://your-domain.com/api/test/stream-draft?chatId=YOUR_CHAT_ID
 * 4. Watch the draft appear and stream in your Telegram chat
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const chatId = searchParams.get("chatId");

	if (!chatId) {
		return NextResponse.json(
			{ error: "Missing chatId parameter. Get it from webhook logs." },
			{ status: 400 },
		);
	}

	const tg = new TelegramChannel();
	const draftId = `test_draft_${Date.now()}`;
	const text = "Hello, this is a streaming test! 🚀 The tokens appear one by one, just like a real AI response. This proves sendMessageDraft works for live streaming in your Telegram bot.";

	// Stream tokens one by one
	const tokens = text.split("");
	let accumulated = "";

	try {
		for (let i = 0; i < tokens.length; i++) {
			accumulated += tokens[i];
			await tg.sendMessageDraft(chatId, draftId, accumulated);
			// Small delay to simulate token streaming
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		return NextResponse.json({
			status: "ok",
			message: "Draft streamed successfully. Check your Telegram chat.",
			draftId,
			totalChars: text.length,
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: test stream-draft" });
		return NextResponse.json(
			{ status: "error", error: "Failed to stream draft" },
			{ status: 500 },
		);
	}
}
