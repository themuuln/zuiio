import { capture } from "@zuiio/capture";
import { TelegramChannel } from "@zuiio/gateway-telegram";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/test/stream-draft?chatId=XXXXX
 *
 * DEV-ONLY endpoint for sendMessageDraft streaming.
 * Returns 404 outside development to prevent messaging arbitrary chats.
 */
export async function GET(request: Request) {
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const { searchParams } = new URL(request.url);
	const chatId = searchParams.get("chatId");

	if (!chatId) {
		return NextResponse.json(
			{ error: "Missing chatId parameter. Get it from webhook logs." },
			{ status: 400 },
		);
	}

	const tg = new TelegramChannel();
	const draftId = Math.floor(Math.random() * 2_147_483_647) + 1;
	const text =
		"Hello, this is a streaming test! 🚀 The tokens appear in batches, just like a real AI response. This proves sendMessageDraft works for live streaming in your Telegram bot.";

	let accumulated = "";
	let lastUpdateAt = 0;
	try {
		for (const token of text.split("")) {
			accumulated += token;
			if (Date.now() - lastUpdateAt >= 250) {
				lastUpdateAt = Date.now();
				const sent = await tg.sendMessageDraft(chatId, draftId, accumulated);
				if (!sent) throw new Error("Telegram draft API unavailable");
			}
			const { promise, resolve } = Promise.withResolvers<void>();
			setTimeout(resolve, 25);
			await promise;
		}

		// Finalize the ephemeral draft as a normal persistent message.
		await tg.sendMessage(chatId, text);

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
