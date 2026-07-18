import type { FlowContext, FlowNode, NodeResult } from "../types";
import { handleSendMessage } from "./send-message";
import { handleAskQuestion } from "./ask-question";
import { handleCondition } from "./condition";
import { handleSetField } from "./set-field";
import { handleDelay } from "./delay";
import { handleAction } from "./action";
import { handleCardCarousel } from "./card-carousel";
import { handleAiReply } from "./ai-reply";
import { handleAbTest } from "./ab-test";

/**
 * Dispatch a node to its handler based on type.
 * The interpreter calls this for each node it visits.
 */
export async function executeNode(
	ctx: FlowContext,
	node: FlowNode,
): Promise<NodeResult> {
	switch (node.type) {
		case "sendMessage":
			return handleSendMessage(ctx, node as { data: { message: string; buttons?: Array<{ id: string; text: string; actionType?: string; actionValue?: string }> } });
		case "askQuestion":
			return handleAskQuestion(ctx, node as { data: { question: string; saveToField: string; buttons?: Array<{ id: string; text: string; actionValue?: string }> } });
		case "condition":
			return handleCondition(ctx, node as { data: { field: string; operator: "equals" | "contains" | "gt" | "lt" | "exists"; value: string } });
		case "setField":
			return handleSetField(ctx, node as { data: { field: string; value: string } });
		case "delay":
			return handleDelay(ctx, node as { data: { duration: number; unit: "seconds" | "minutes" | "hours" } });
		case "action":
			return handleAction(ctx, node as { data: { actionType: "tag" | "subscribe" | "unsubscribe" | "notify" | "webhook"; value: string } });
		case "cardCarousel":
			return handleCardCarousel(ctx, node as { data: { cards: Array<{ id: string; title: string; subtitle: string; imageUrl: string; buttons: Array<{ id: string; text: string; type: "postback" | "url"; value: string }> }> } });
		case "aiReply":
			return handleAiReply(ctx, node as { data: { systemPrompt: string; model: string; contextSize: number; temperature: number } });
		case "abTest":
			return handleAbTest(ctx, node as { id: string; data: { variants: Array<{ id: string; weight: number; message: string }> } });
		default:
			return {
				action: { type: "next" },
				messages: [],
			};
	}
}
