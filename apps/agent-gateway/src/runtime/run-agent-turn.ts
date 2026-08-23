import type {
	GatewayContext,
	GatewayTool,
	OutboundIntent,
	ToolContext,
} from "@zuiio/gateway-core";
import { sanitizeUserInput } from "@/lib/sanitize";

export interface AgentTurnInput {
	context: GatewayContext;
	text: string;
	images?: string[];
	conversationHistory?: Array<{
		role: "system" | "user" | "assistant" | "tool";
		content: string | null;
	}>;
}

export interface AgentTurnResult {
	response: string;
	messages: Array<{ role: "user" | "assistant"; content: string }>;
	estimatedTokens: number;
	usageTokens: number;
	timings: Record<string, number>;
	pendingActionIds: string[];
	intents?: OutboundIntent[];
}

export interface AgentTurnDependencies {
	getSystemPrompt: (context: ToolContext) => Promise<string>;
	getTools: (context: ToolContext) => Promise<GatewayTool[]> | GatewayTool[];
	runWithTools: (input: {
		system: string;
		userMessage: string;
		images?: string[];
		tools: GatewayTool[];
		context: ToolContext;
		conversationHistory?: AgentTurnInput["conversationHistory"];
		signal?: AbortSignal;
	}) => Promise<string>;
	maxToolRounds?: number;
	signal?: AbortSignal;
}

const AGENT_TIMEOUT_MS = 45_000;

/** Execute one deterministic agent turn. It never receives channel credentials. */
export async function runAgentTurn(
	input: AgentTurnInput,
	deps: AgentTurnDependencies,
): Promise<AgentTurnResult> {
	const started = performance.now();
	const context: ToolContext = {
		externalOrganizationId: input.context.externalOrganizationId,
		userId: input.context.userId,
		productType: input.context.productType,
		audience: input.context.audience,
		conversationId: input.context.conversationId,
		traceId: input.context.traceId,
	};
	const text = sanitizeUserInput(input.text);
	const [system, tools] = await Promise.all([
		deps.getSystemPrompt(context),
		deps.getTools(context),
	]);
	const controller = new AbortController();
	const onAbort = () => controller.abort(deps.signal?.reason);
	deps.signal?.addEventListener("abort", onAbort, { once: true });
	const timer = setTimeout(
		() => controller.abort(new Error("AGENT_TIMEOUT")),
		AGENT_TIMEOUT_MS,
	);
	try {
		const llmStarted = performance.now();
		const response = await deps.runWithTools({
			system,
			userMessage: text,
			images: input.images,
			tools,
			context,
			conversationHistory: input.conversationHistory,
			signal: controller.signal,
		});
		const llmMs = Math.round(performance.now() - llmStarted);
		const safeResponse = response ?? "";
		const messages = [
			{ role: "user" as const, content: text },
			{ role: "assistant" as const, content: safeResponse },
		];
		const estimatedTokens = Math.ceil(
			messages.reduce((total, message) => total + message.content.length, 0) /
				4,
		);
		return {
			response: safeResponse,
			messages,
			estimatedTokens,
			usageTokens: estimatedTokens,
			timings: { llm: llmMs, total: Math.round(performance.now() - started) },
			pendingActionIds: [],
			intents: [
				{
					conversationId: input.context.conversationId,
					kind: "text",
					text: safeResponse,
					sourceEventId: null,
					traceId: input.context.traceId,
				},
			],
		};
	} finally {
		clearTimeout(timer);
		deps.signal?.removeEventListener("abort", onAbort);
	}
}
