import { capture } from "@zuiio/capture";
import type { TelegramUpdate } from "@zuiio/gateway-telegram";
import { TelegramChannel } from "@zuiio/gateway-telegram";
import { NextResponse } from "next/server";
import {
	createTelegramResponseStream,
	startTypingLoop,
} from "@/channels/typing-loop";
import { handleAgentMessage } from "@/gateway/agent-handler";
import { resolveOrgFromBotKey } from "@/gateway/mode-b";
import { toToolContext, toToolDependencies } from "@/gateway/tool-dependencies";
import {
	getProductTools,
	getRawWriteTool,
	systemPromptFor,
} from "@/gateway/webhook-helpers";
import { createServiceClient } from "@/lib/supabase";
import { resolveDurablePostback } from "@/runtime/confirmation";
import { runAgentWithFallback } from "@/state/async-job";
import { enqueueJob } from "@/state/job-queue";
import { pendingActionRepository } from "@/state/pending-action-repository";
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

			if (action === "confirm" || action === "reject") {
				const orgCtx = await resolveOrgFromBotKey(sb, botKey);
				if (!orgCtx) {
					await tg.answerCallbackQuery(cq.id, "Энэ бот идэвхгүй байна.");
					return NextResponse.json({ ok: true });
				}
				const deps = toToolDependencies(
					{
						...orgCtx,
						conversationId: `legacy:telegram:${botKey}:${chatId}:${userId}`,
						channelChatId: String(chatId),
						channelUserId: String(userId),
						traceId: crypto.randomUUID(),
					},
					sb,
				);
				const outcome = await resolveDurablePostback({
					payload: data,
					conversationId: deps.conversationId,
					traceId: deps.traceId,
					repository: pendingActionRepository(),
					executeTool:
						action === "confirm"
							? async (toolName, args) => {
									const tool = getRawWriteTool(
										orgCtx.productType,
										deps,
										toolName,
									);
									if (!tool) throw new Error("CONFIRM_TOOL_NOT_FOUND");
									return tool.execute(args, toToolContext(deps));
								}
							: async () => null,
				});
				await tg.editMessageText(
					chatId,
					messageId,
					outcome.reply ||
						(action === "confirm" ? "✅ Баталгаажууллаа." : "❌ Цуцаллаа."),
				);
				await tg.answerCallbackQuery(cq.id, outcome.reply ? "✅" : "❌");
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
		const ctx = {
			...orgCtx,
			conversationId: `legacy:telegram:${botKey}:${chatId}:${userId}`,
			channelChatId: String(chatId),
			channelUserId: String(userId),
			traceId: crypto.randomUUID(),
		};

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
			let agentInBackground = false;

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

				const responseStream = createTelegramResponseStream(
					tg,
					chatId,
					chatType,
					{ onFirstToken: stopTyping },
				);
				const agentPromise = handleAgentMessage(ctx, transcribed, chatType, {
					getSystemPrompt: systemPromptFor,
					getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
					onToken: responseStream.onToken,
				});

				agentInBackground = true;
				runAgentWithFallback(agentPromise, {
					enqueueDurable: () => enqueueJob(sb, ctx, transcribed, chatType),
					onAsyncFallback: () => {
						return userMessageId
							? tg.setReaction(
									chatId,
									userMessageId,
									TelegramChannel.REACTIONS.processing,
								)
							: Promise.resolve();
					},
					onResult: async (response) => {
						stopTyping();
						if (userMessageId) {
							tg.setReaction(
								chatId,
								userMessageId,
								TelegramChannel.REACTIONS.done,
							);
						}
						return responseStream.finish(response);
					},
					onError: async (message) => {
						stopTyping();
						if (userMessageId) {
							tg.setReaction(
								chatId,
								userMessageId,
								TelegramChannel.REACTIONS.error,
							);
						}
						return responseStream.fail(message);
					},
				});

				return NextResponse.json({ ok: true });
			} finally {
				if (!agentInBackground) stopTyping();
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

		// Private chats use native drafts; groups/channels use edit-in-place.
		const stopTyping = startTypingLoop(tg, chatId);
		const responseStream = createTelegramResponseStream(tg, chatId, chatType, {
			onFirstToken: stopTyping,
		});

		const agentPromise = handleAgentMessage(ctx, text, chatType, {
			getSystemPrompt: systemPromptFor,
			getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
			onToken: responseStream.onToken,
		});

		runAgentWithFallback(agentPromise, {
			enqueueDurable: () => enqueueJob(sb, ctx, text, chatType),
			onAsyncFallback: () => {
				return userMessageId
					? tg.setReaction(
							chatId,
							userMessageId,
							TelegramChannel.REACTIONS.processing,
						)
					: Promise.resolve();
			},
			onResult: async (response) => {
				stopTyping();
				if (userMessageId) {
					tg.setReaction(chatId, userMessageId, TelegramChannel.REACTIONS.done);
				}
				return responseStream.finish(response);
			},
			onError: async (message) => {
				stopTyping();
				if (userMessageId) {
					tg.setReaction(
						chatId,
						userMessageId,
						TelegramChannel.REACTIONS.error,
					);
				}
				return responseStream.fail(message);
			},
		});

		return NextResponse.json({ ok: true });
	} catch (err) {
		capture(err, { context: "agent-gateway: custom bot webhook" });
		return NextResponse.json({ ok: true });
	}
}
