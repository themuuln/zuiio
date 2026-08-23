import "server-only";

import type { GatewayTool } from "@zuiio/gateway-core";
import { TelegramChannel } from "@zuiio/gateway-telegram";
import { WhatsAppChannel } from "@zuiio/gateway-whatsapp";
import type { ToolDependencies } from "@/gateway/tool-dependencies";
import { confirmButtons, stageAction } from "./confirmation";

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

/** Legacy non-Meta confirmation gate. Meta uses durable pending actions. */
export function gateWriteTool(
	tool: GatewayTool,
	dependencies: ToolDependencies,
): GatewayTool {
	return {
		...tool,
		execute: async (args, executionContext) => {
			const summary = summarizeWriteAction(tool.name, args);
			const staged = stageAction(
				tool.name,
				args,
				dependencies.channel,
				dependencies.channelChatId,
				dependencies.channelUserId,
				summary,
				undefined,
				undefined,
				(actionArgs) => tool.execute(actionArgs, executionContext),
			);

			try {
				if (dependencies.channel === "telegram") {
					await new TelegramChannel().sendInlineKeyboard(
						dependencies.channelChatId,
						`⚡ Баталгаажуулах үйлдэл: ${summary}`,
						confirmButtons(staged.nonce),
					);
				} else if (dependencies.channel === "whatsapp") {
					await new WhatsAppChannel().sendInlineKeyboard(
						dependencies.channelUserId,
						`⚡ Баталгаажуулах үйлдэл: ${summary}`,
						confirmButtons(staged.nonce),
					);
				} else {
					return "Энэ сувгаар бичих үйлдэл дэмжигдээгүй байна.";
				}
			} catch {
				return "Баталгаажуулах санал илгээхэд алдаа гарлаа. Дахин оролдоно уу.";
			}

			return "Хэрэглэгчид баталгаажуулах санал илгээгдлээ. Тэдний хариултыг хүлээнэ үү. Үйлдлийг бүү давтаарай.";
		},
	};
}
