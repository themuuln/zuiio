import type { FlowContext, NodeResult, OutboundMessage } from "../types";

/**
 * AI Reply node — delegates to the AI provider for an intelligent response.
 * Uses the flow-configured system prompt, model, and temperature.
 * This is the bridge between deterministic flow execution and the LLM.
 *
 * The AI provider is injected via FlowContext.aiProvider by the gateway.
 * If no provider is available, returns a fallback message.
 */
export async function handleAiReply(
	ctx: FlowContext,
	node: {
		data: {
			systemPrompt: string;
			model: string;
			contextSize: number;
			temperature: number;
		};
	},
): Promise<NodeResult> {
	const { systemPrompt, contextSize, temperature } = node.data;

	if (!ctx.aiProvider) {
		return {
			action: { type: "next" },
			messages: [{ text: "Уучлаарай, одоогоор AI үйлчилгээ боломжгүй байна." }],
		};
	}

	// Build conversation context from recent messages in the run
	const contextMessages = Object.entries(ctx.run.fields)
		.filter(([k]) => !k.startsWith("_"))
		.map(([k, v]) => `${k}: ${v}`)
		.join("\n");

	const userMessage = contextMessages
		? `User info:\n${contextMessages}\n\nUser message: ${ctx.userMessage}`
		: ctx.userMessage;

	try {
		const response = await ctx.aiProvider.runWithTools({
			system: systemPrompt,
			userMessage,
			maxRounds: 1, // AI Reply is single-turn, no tool calling
		});

		const messages: OutboundMessage[] = [{ text: response }];

		return {
			action: { type: "next" },
			messages,
		};
	} catch (error) {
		console.error("[flow-executor:ai-reply] Provider error:", error);
		return {
			action: { type: "next" },
			messages: [{ text: "Уучлаарай, AI алдаа гарлаа. Дахин оролдоно уу." }],
		};
	}
}
