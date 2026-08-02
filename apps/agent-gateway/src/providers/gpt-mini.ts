import "server-only";

import {
	type LoopHistoryMessage,
	runOpenAiCompatibleLoop,
} from "./openai-compatible-loop";
import type { AiProvider, GatewayTool, ToolContext } from "./types";

/**
 * OpenAI-compatible provider (GPT-4o-mini fallback).
 * Delegates to the shared streaming-capable tool loop.
 */
export class GptMiniProvider implements AiProvider {
	constructor(
		private options: {
			apiKey: string;
			baseUrl?: string;
			model?: string;
		},
	) {}

	async runWithTools(params: {
		system: string;
		userMessage: string;
		images?: string[];
		tools: GatewayTool[];
		context: ToolContext;
		maxRounds?: number;
		onToken?: (token: string) => void;
		conversationHistory?: LoopHistoryMessage[];
	}): Promise<string> {
		return runOpenAiCompatibleLoop({
			apiKey: this.options.apiKey,
			baseUrl: this.options.baseUrl ?? "https://api.openai.com/v1",
			model: this.options.model ?? "gpt-4o-mini",
			system: params.system,
			userMessage: params.userMessage,
			images: params.images,
			tools: params.tools,
			context: params.context,
			maxRounds: params.maxRounds,
			onToken: params.onToken,
			conversationHistory: params.conversationHistory,
			label: "OpenAI",
		});
	}
}
