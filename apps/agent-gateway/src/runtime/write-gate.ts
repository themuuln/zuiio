import "server-only";

import { FacebookChannel } from "@/channels/facebook";
import { TelegramChannel } from "@/channels/telegram";
import { WhatsAppChannel } from "@/channels/whatsapp";
import type { GatewayTool, ToolContext } from "@/providers/types";
import { confirmButtons, stageAction } from "./confirmation";

/**
 * Human-readable summary of a write action for the confirmation prompt.
 */
export function summarizeWriteAction(
	toolName: string,
	args: Record<string, unknown>,
): string {
	const dataset = args.dataset ? ` "${args.dataset}"` : "";
	const operation = args.operation ? ` — ${args.operation}` : "";
	const id = args.id ? ` #${args.id}` : "";
	const data = args.data && typeof args.data === "object" ? args.data : null;
	const fieldCount = data ? Object.keys(data as object).length : 0;
	const fields = fieldCount > 0 ? ` (${fieldCount} талбар)` : "";
	return `${toolName}${dataset}${operation}${id}${fields}`;
}

/**
 * Wrap a write tool so its action is STAGED for user confirmation instead of
 * executing immediately. The confirm/reject buttons are pushed on the channel
 * directly from the tool, and the original execute is stored on the staged
 * action for deterministic re-execution on confirm (never via LLM re-prompt).
 *
 * Channel identity is read from the per-call context, so the 5-minute tool
 * cache can safely serve multiple chats.
 */
export function gateWriteTool(
	tool: GatewayTool,
	context: ToolContext,
): GatewayTool {
	return {
		...tool,
		execute: async (args, execContext) => {
			const ctx = execContext ?? context;
			const { channel, channelChatId, channelUserId, pageId, pageAccessToken } =
				ctx;

			if (!channel || !channelChatId || !channelUserId) {
				// No channel context (tests, non-messaging callers) — execute directly.
				return tool.execute(args, ctx);
			}

			const summary = summarizeWriteAction(tool.name, args);
			const staged = stageAction(
				tool.name,
				args,
				channel,
				channelChatId,
				channelUserId,
				summary,
				pageId,
				pageAccessToken,
				// Re-execution closure uses the same per-request context.
				(a) => tool.execute(a, ctx),
			);

			// Push the confirmation UI on the channel, then tell the LLM the
			// user is being asked. The final write happens only on confirm.
			let sent = false;
			try {
				if (channel === "telegram") {
					const tg = new TelegramChannel();
					await tg.sendInlineKeyboard(
						channelChatId,
						`⚡ Баталгаажуулах үйлдэл: ${summary}`,
						confirmButtons(staged.nonce),
					);
					sent = true;
				} else if (channel === "messenger" || channel === "instagram") {
					const fb = new FacebookChannel({
						pageId: pageId ?? channelChatId,
						pageAccessToken,
					});
					await fb.sendInlineKeyboard(
						channelUserId,
						`⚡ Баталгаажуулах үйлдэл: ${summary}`,
						confirmButtons(staged.nonce),
					);
					sent = true;
				} else if (channel === "whatsapp") {
					const wa = new WhatsAppChannel();
					await wa.sendInlineKeyboard(
						channelUserId,
						`⚡ Баталгаажуулах үйлдэл: ${summary}`,
						confirmButtons(staged.nonce),
					);
					sent = true;
				}
			} catch {
				sent = false;
			}

			if (!sent) {
				return "Баталгаажуулах санал илгээхэд алдаа гарлаа. Дахин оролдоно уу.";
			}

			return "Хэрэглэгчид баталгаажуулах санал илгээгдлээ. Тэдний хариултыг хүлээнэ үү. Үйлдлийг бүү давтаарай.";
		},
	};
}
