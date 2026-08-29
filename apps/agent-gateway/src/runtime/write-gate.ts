import "server-only";

import { capture } from "@zuiio/capture";
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
	if (
		toolName === "placeOrderWithQpay" ||
		toolName === "checkoutCartWithQpay"
	) {
		const items = Array.isArray(args.items)
			? `${args.items.length} төрлийн бараа`
			: "сагсны бараа";
		const name =
			typeof args.contact_name === "string" ? args.contact_name.trim() : "";
		const delivery =
			args.delivery_type === "delivery" ? "хүргэлт" : "дэлгүүрээс авах";
		return `QPay захиалга — ${items}, ${name || "хэрэглэгч"}, ${delivery}`;
	}
	const dataset = args.dataset ? ` "${args.dataset}"` : "";
	const operation = args.operation ? ` — ${args.operation}` : "";
	const id = args.id ? ` #${args.id}` : "";
	const data = args.data && typeof args.data === "object" ? args.data : null;
	const fieldCount = data ? Object.keys(data as object).length : 0;
	const fields = fieldCount > 0 ? ` (${fieldCount} талбар)` : "";
	return `${toolName}${dataset}${operation}${id}${fields}`;
}

/**
 * Wrap a write tool so its action is staged for user confirmation.
 * Legacy internal actions keep an in-memory closure; customer checkout actions
 * persist their arguments and replay by tool name, so webhook failover does
 * not lose the confirmation.
 *
 * Channel identity is read from the per-call context, so the five-minute tool
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

			// QPay checkout must also go through confirmation — even customer-initiated
			// "захиалах" is just a message that triggers the LLM; a hallucinated
			// tool call with name/phone would otherwise create a real Zer order.
			// Stage the action and require explicit confirm button press.
			// Preserve field validation for clearer repair prompt before staging.
			if (
				(tool.name === "placeOrderWithQpay" ||
					tool.name === "checkoutCartWithQpay") &&
				(typeof args.contact_name !== "string" ||
					!args.contact_name.trim() ||
					typeof args.contact_phone !== "string" ||
					!args.contact_phone.trim())
			) {
				return "Захиалгыг баталгаажуулахын тулд нэр болон утас дутуу байна. Нэр, утас, хаягаа бичнэ үү (ж: Temuulen 99111234 10-р хороолол).";
			}

			if (!channel || !channelChatId || !channelUserId || ctx.replaying) {
				return tool.execute(args, ctx);
			}

			const summary = summarizeWriteAction(tool.name, args);
			let staged: {
				nonce: string;
				buttons: Array<Array<{ text: string; callbackData: string }>>;
			};
			try {
				staged = stageAction(
					tool.name,
					args,
					channel,
					channelChatId,
					channelUserId,
					summary,
					pageId,
					pageAccessToken,
					(a) => tool.execute(a, ctx),
				);
			} catch (error) {
				capture(error, { context: "gateway: stage confirmation" });
				return "Баталгаажуулах үйлдлийг хадгалахад алдаа гарлаа.";
			}
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
