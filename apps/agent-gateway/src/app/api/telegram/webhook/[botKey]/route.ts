import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { TelegramChannel } from "@/channels/telegram";
import type { TelegramUpdate } from "@/channels/types";
import { startTypingLoop } from "@/channels/typing-loop";
import { handleAgentMessage } from "@/gateway/agent-handler";
import { resolveOrgFromBotKey } from "@/gateway/mode-b";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { createServiceClient } from "@/lib/supabase";
import { confirmAction, rejectAction } from "@/runtime/confirmation";
import { runAgentWithFallback } from "@/state/async-job";
import { transcribeVoice } from "@/stt/groq";

// ─── Lazy singleton ─────────────────────────────────────────────────────────

let telegram: TelegramChannel | null = null;
function getTelegram(): TelegramChannel {
	if (!telegram) telegram = new TelegramChannel();
	return telegram;
}

export const dynamic = "force-dynamic";

function isAuthorizedTelegramRequest(request: Request): boolean {
	const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
	if (!expectedSecret) {
		capture(new Error("TELEGRAM_WEBHOOK_SECRET is not configured"), {
			context: "agent-gateway: custom webhook auth",
		});
		return false;
	}
	return (
		request.headers.get("x-telegram-bot-api-secret-token") === expectedSecret
	);
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ botKey: string }> },
): Promise<NextResponse> {
	const { botKey } = await params;
	const tg = getTelegram();
	const sb = createServiceClient();

	try {
		if (!isAuthorizedTelegramRequest(request)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

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
				const staged = confirmAction(nonce, String(chatId), String(userId));
				if (!staged) {
					await tg.answerCallbackQuery(cq.id, "Энэ үйлдлийн хугацаа дууссан.");
					return NextResponse.json({ ok: true });
				}
				await tg.editMessageText(
					chatId,
					messageId,
					`✅ Баталгаажууллаа: ${staged.summary}`,
				);
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
			const userMessageId = msg.message_id;

			// React with 👁️ to acknowledge receipt
			if (userMessageId) {
				await tg.setReaction(
					chatId,
					userMessageId,
					TelegramChannel.REACTIONS.received,
				);
			}

			await tg.sendMessage(
				chatId,
				"🎤 Аудио хүлээн авлаа. Бичлэг тайлж байна...",
			);

			const stopTyping = startTypingLoop(tg, chatId);

			try {
				const voice = msg.voice;
				const fileInfo = await tg.getFile(voice.file_id);
				const fileBuffer = await tg.downloadFile(fileInfo.file_path);
				const transcribed = await transcribeVoice(
					fileBuffer,
					`${voice.file_id}.ogg`,
				);

				if (!transcribed) {
					await tg.sendMessage(
						chatId,
						"❌ Дууг таньж чадсангүй. Дахин оролдоно уу.",
					);
					return NextResponse.json({ ok: true });
				}

				const agentPromise = handleAgentMessage(ctx, transcribed, chatType, {
					getSystemPrompt: systemPromptFor,
					getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
				});

				runAgentWithFallback(agentPromise, {
					onAsyncFallback: () => {
						return userMessageId
							? tg.setReaction(
									chatId,
									userMessageId,
									TelegramChannel.REACTIONS.processing,
								)
							: Promise.resolve();
					},
					onResult: (response) => {
						if (userMessageId) {
							tg.setReaction(
								chatId,
								userMessageId,
								TelegramChannel.REACTIONS.done,
							);
						}
						return tg.sendMessage(chatId, response);
					},
					onError: (message) => {
						if (userMessageId) {
							tg.setReaction(
								chatId,
								userMessageId,
								TelegramChannel.REACTIONS.error,
							);
						}
						return tg.sendMessage(chatId, message);
					},
				});

				return NextResponse.json({ ok: true });
			} finally {
				stopTyping();
			}
		}

		const text = msg.text ?? "";
		const userMessageId = msg.message_id;

		// React with 👁️ to acknowledge receipt
		if (userMessageId) {
			await tg.setReaction(
				chatId,
				userMessageId,
				TelegramChannel.REACTIONS.received,
			);
		}

		// Start typing indicator loop
		const stopTyping = startTypingLoop(tg, chatId);

		// Streaming: use sendMessageDraft for real-time token delivery
		const draftId = `draft_${chatId}_${Date.now()}`;
		let streamedText = "";
		const STREAM_UPDATE_INTERVAL = 400; // ms between draft updates
		let lastUpdateTime = 0;
		let typingStopped = false;

		const onToken = (token: string) => {
			streamedText += token;
			// Stop typing indicator once streaming starts
			if (!typingStopped) {
				typingStopped = true;
				stopTyping();
			}
			const now = Date.now();
			if (now - lastUpdateTime > STREAM_UPDATE_INTERVAL) {
				lastUpdateTime = now;
				tg.sendMessageDraft(chatId, draftId, streamedText);
			}
		};

		const agentPromise = handleAgentMessage(ctx, text, chatType, {
			getSystemPrompt: systemPromptFor,
			getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
			onToken,
		});

		runAgentWithFallback(agentPromise, {
			onAsyncFallback: () => {
				return userMessageId
					? tg.setReaction(
							chatId,
							userMessageId,
							TelegramChannel.REACTIONS.processing,
						)
					: Promise.resolve();
			},
			onResult: (response) => {
				stopTyping();
				if (userMessageId) {
					tg.setReaction(chatId, userMessageId, TelegramChannel.REACTIONS.done);
				}
				return tg.sendMessage(chatId, response);
			},
			onError: (message) => {
				stopTyping();
				if (userMessageId) {
					tg.setReaction(
						chatId,
						userMessageId,
						TelegramChannel.REACTIONS.error,
					);
				}
				return tg.sendMessage(chatId, message);
			},
		});

		return NextResponse.json({ ok: true });
	} catch (err) {
		capture(err, { context: "agent-gateway: custom bot webhook" });
		return NextResponse.json({ ok: true });
	}
}
