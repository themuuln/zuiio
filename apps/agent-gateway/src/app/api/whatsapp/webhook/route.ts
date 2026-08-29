import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { WhatsAppChannel } from "@/channels/whatsapp";
import { handleFlowMessage } from "@/flow-executor";
import { handleAgentMessage } from "@/gateway/agent-handler";
import { resolveOrgFromBotKey } from "@/gateway/mode-b";
import type { LinkRecord } from "@/gateway/types";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { decryptSecret } from "@/lib/crypto";
import { formatWriteResult } from "@/lib/format-result";
import { sanitizeUserInput } from "@/lib/sanitize";
import { createServiceClient } from "@/lib/supabase";
import { confirmAction, rejectAction } from "@/runtime/confirmation";

export const dynamic = "force-dynamic";

// ─── WhatsApp webhook types ────────────────────────────────────────────────

interface WhatsAppMessage {
	from: string;
	id: string;
	timestamp: string;
	text?: { body: string };
	interactive?: {
		type: string;
		button_reply?: { id: string };
		list_reply?: { id: string };
	};
}

interface WhatsAppEntry {
	id: string;
	changes: Array<{
		value: {
			messaging_product: string;
			metadata: {
				display_phone_number: string;
				phone_number_id: string;
			};
			messages?: WhatsAppMessage[];
		};
	}>;
}

interface WrappedContext {
	context: import("@/gateway/types").GatewayContext;
	link: LinkRecord;
}

// ─── Lazy singletons ──────────────────────────────────────────────────────

let waChannel: WhatsAppChannel | null = null;

function getWhatsApp(): WhatsAppChannel {
	if (!waChannel) {
		waChannel = new WhatsAppChannel();
	}
	return waChannel;
}

// ─── Mode B bot key ────────────────────────────────────────────────────────

function extractBotKey(request: Request): string | null {
	const url = new URL(request.url);
	return url.searchParams.get("botKey") ?? null;
}

// ─── Webhook verification (GET) ────────────────────────────────────────────

export async function GET(request: Request) {
	const url = new URL(request.url);
	const mode = url.searchParams.get("hub.mode");
	const token = url.searchParams.get("hub.verify_token");
	const challenge = url.searchParams.get("hub.challenge");

	const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
	if (!verifyToken) {
		return NextResponse.json({ error: "Not configured" }, { status: 500 });
	}

	if (mode === "subscribe" && token === verifyToken) {
		return new Response(challenge, { status: 200 });
	}

	return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// ─── Webhook handler (POST) ────────────────────────────────────────────────

export async function POST(request: Request) {
	let body: { entry?: WhatsAppEntry[] };
	try {
		body = (await request.json()) as { entry?: WhatsAppEntry[] };
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const entries = body.entry ?? [];
	const botKey = extractBotKey(request);
	const sb = createServiceClient();

	for (const entry of entries) {
		for (const change of entry.changes ?? []) {
			const value = change.value;
			const messages = value.messages ?? [];

			for (const msg of messages) {
				// Per-message channel (env singleton by default; per-org in Mode B)
				let channelForMsg: WhatsAppChannel = getWhatsApp();
				try {
					const text =
						msg.text?.body ?? msg.interactive?.button_reply?.id ?? "";

					if (!text) continue;

					let ctx: WrappedContext | null = null;

					if (botKey) {
						const resolved = await resolveOrgFromBotKey(sb, botKey);
						if (!resolved) continue;
						// Per-org WhatsApp credentials come from the connection row
						// (token is at-rest encrypted) — fall back to env channel.
						let channelForSend = getWhatsApp();
						const { data: waConn } = await sb
							.from("channel_connections")
							.select("channel_user_id, page_access_token, token_encrypted")
							.eq("bot_key", botKey)
							.eq("channel", "whatsapp")
							.eq("is_active", true)
							.maybeSingle();
						if (waConn?.channel_user_id) {
							const token = waConn.token_encrypted
								? decryptSecret(String(waConn.page_access_token ?? ""))
								: String(waConn.page_access_token ?? "");
							if (token) {
								channelForSend = new WhatsAppChannel(
									String(waConn.channel_user_id),
									token,
								);
							}
						}
						ctx = {
							context: {
								...resolved,
								channel: "whatsapp",
								chatId: parseInt(msg.from, 10) || 0,
								telegramUserId: parseInt(msg.from, 10) || 0,
								channelChatId: String(parseInt(msg.from, 10) || 0),
								channelUserId: String(parseInt(msg.from, 10) || 0),
							},
							link: {
								id: "",
								organization_id: resolved.orgId,
								user_id: resolved.userId,
								telegram_chat_id: parseInt(msg.from, 10) || 0,
								telegram_user_id: parseInt(msg.from, 10) || 0,
								is_active: true,
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString(),
							},
						};
						// Remember the per-org channel for this message's sends
						channelForMsg = channelForSend;
					} else {
						const wa = getWhatsApp();
						await wa.sendMessage(
							msg.from,
							"Сайн уу! 👋 Та WhatsApp-аар холбогдохын тулд эхлээд Telegram-аар /start дарж бүртгүүлнэ үү. 🔗",
						);
						continue;
					}

					if (!ctx) continue;

					// Handle confirmation callbacks
					if (text.startsWith("confirm:") || text.startsWith("reject:")) {
						const isConfirm = text.startsWith("confirm:");
						const nonce = text.split(":")[1] ?? "";

						if (isConfirm) {
							const action = confirmAction(
								nonce,
								String(ctx.context.chatId),
								String(ctx.context.telegramUserId),
							);
							const wa = channelForMsg;
							if (action) {
								await wa.sendMessage(
									msg.from,
									`✅ Баталгаажлаа: ${action.summary}`,
								);
								// Re-execute the staged action deterministically.
								if (action.execute) {
									try {
										const result = await action.execute(action.args);
										await wa.sendMessage(msg.from, formatWriteResult(result));
									} catch (err) {
										capture(err, {
											context:
												"agent-gateway: confirm staged action (whatsapp)",
										});
										await wa.sendMessage(
											msg.from,
											"Уучлаарай, үйлдлийг гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.",
										);
									}
								}
							} else {
								await wa.sendMessage(
									msg.from,
									"Энэ үйлдлийн хугацаа дууссан эсвэл буруу байна.",
								);
							}
						} else {
							rejectAction(nonce);
							const wa = channelForMsg;
							await wa.sendMessage(msg.from, "❌ Цуцлагдлаа.");
						}
						continue;
					}

					// Try flow routing first — if a flow is active or triggered, handle it
					const wa = channelForMsg;
					const flowResult = await handleFlowMessage(
						ctx.context,
						sanitizeUserInput(text),
						sb,
						wa,
					);

					if (flowResult) {
						continue; // Flow handled the message — next message
					}

					// No flow matched — fall through to the AI agent handler
					// Capture QPay QR output and deliver it as a native image.
					let capturedQpayImage: string | null = null;
					const response = await handleAgentMessage(
						ctx.context,
						sanitizeUserInput(text),
						"private",
						{
							getSystemPrompt: systemPromptFor,
							getTools: (toolCtx) =>
								getProductTools(ctx?.context.productType, toolCtx),
							onToolResult: (toolName, result) => {
								if (
									capturedQpayImage ||
									(toolName !== "placeOrderWithQpay" &&
										toolName !== "checkoutCartWithQpay") ||
									!result ||
									typeof result !== "object" ||
									typeof (result as Record<string, unknown>).qpay_qr_image !==
										"string"
								)
									return;
								capturedQpayImage = (result as Record<string, string>)
									.qpay_qr_image;
							},
						},
					);

					await wa.sendMessage(msg.from, response);
					if (capturedQpayImage) {
						try {
							await wa.sendImage(msg.from, capturedQpayImage);
						} catch (error) {
							capture(error, { context: "whatsapp: qpay qr sendImage" });
						}
					}
				} catch (err) {
					capture(err, {
						context: "agent-gateway: whatsapp webhook message error",
					});
				}
			}
		}
	}

	return NextResponse.json({ status: "ok" });
}
