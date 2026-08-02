import "server-only";

import {
	type LoopHistoryMessage,
	runOpenAiCompatibleLoop,
} from "./openai-compatible-loop";
import type { AiProvider, GatewayTool, ToolContext } from "./types";

/**
 * OpenCodeGo provider (OpenAI-compatible endpoint).
 * Primary provider — streams tokens via the shared OpenAI-compatible loop,
 * so Telegram draft/edit streaming works on the primary path.
 */
export class OpenCodeGoProvider implements AiProvider {
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
			baseUrl: this.options.baseUrl ?? "https://opencode.ai/zen/go/v1",
			model: this.options.model ?? "deepseek-v4-flash",
			system: params.system,
			userMessage: params.userMessage,
			images: params.images,
			tools: params.tools,
			context: params.context,
			maxRounds: params.maxRounds,
			onToken: params.onToken,
			conversationHistory: params.conversationHistory,
			label: "OpenCodeGo",
		});
	}
}
