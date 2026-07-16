import type { Tool } from "@zuiio/ai-agent";
import { runWithTools } from "@zuiio/ai-agent";
import type { AiProvider, GatewayTool, ToolContext } from "./types";

/**
 * Converts a gateway tool (which takes context) into an @zuiio/ai-agent Tool
 * (which doesn't) by closing over the context.
 */
function wrapTool(tool: GatewayTool, context: ToolContext): Tool {
	return {
		name: tool.name,
		description: tool.description,
		parameters: tool.parameters,
		execute: (args: Record<string, unknown>) => tool.execute(args, context),
	};
}

/**
 * OpenCodeGo provider (OpenAI-compatible endpoint).
 * Wraps the existing @zuiio/ai-agent runWithTools function.
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
	conversationHistory?: Array<{
		role: string;
		content: string | null;
		tool_calls?: Array<{
			id: string;
			type: "function";
			function: { name: string; arguments: string };
		}>;
		tool_call_id?: string;
	}>;
}): Promise<string> {
		const {
			system,
			userMessage,
			tools,
			context,
			maxRounds = 5,
			conversationHistory,
		} = params;

		// Wrap gateway tools to close over context
		const wrappedTools = tools.map((t) => wrapTool(t, context));

return runWithTools({
	apiKey: this.options.apiKey,
	baseUrl: this.options.baseUrl ?? "https://opencode.ai/zen/go/v1",
	model: this.options.model ?? "mimo-v2.5",
	systemPrompt: system,
	userMessage,
	images: params.images,
	tools: wrappedTools,
	maxRounds,
	conversationHistory: conversationHistory as
		| Array<{
				role: "system" | "user" | "assistant" | "tool";
				content: string | null;
				tool_calls?: Array<{
					id: string;
					type: "function";
					function: { name: string; arguments: string };
				}>;
				tool_call_id?: string;
		  }>
		| undefined,
});
	}
}
