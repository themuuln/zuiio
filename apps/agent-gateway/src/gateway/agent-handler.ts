import "server-only";

import type { GatewayContext, GatewayTool } from "@zuiio/gateway-core";
import { AiGateway, type AiProvider } from "@zuiio/gateway-core";
import type { ToolDependencies } from "@/gateway/tool-dependencies";
import { openAiConfig, openCodeGoConfig, validateConfig } from "@/lib/env";
import { sanitizeUserInput } from "@/lib/sanitize";
import { createServiceClient, type ServiceClient } from "@/lib/supabase";
import { GptMiniProvider } from "@/providers/gpt-mini";
import { OpenCodeGoProvider } from "@/providers/opencode-go";
import { type AgentTurnInput, runAgentTurn } from "@/runtime/run-agent-turn";
import { recordUsageAtomic } from "@/state/budget";
import { loadSession, type SessionMessage, saveSession } from "@/state/session";

export {
	type AgentTurnDependencies,
	type AgentTurnInput,
	type AgentTurnResult,
	runAgentTurn,
} from "@/runtime/run-agent-turn";

let _sb: ServiceClient | null = null;
function getSb(): ServiceClient {
	_sb ??= createServiceClient();
	return _sb;
}

export interface AgentHandlerOptions {
	getSystemPrompt: (
		productType: string,
		orgId: string,
		chatType: string,
		lang?: string,
	) => Promise<string>;
	getTools: (
		context: ToolDependencies,
	) => GatewayTool[] | Promise<GatewayTool[]>;
	dataClient?: ServiceClient;
	/** Accepted for legacy call sites; the durable runtime does not stream. */
	onToken?: (token: string) => void;
}

/**
 * Legacy entry point shared by the Telegram/Webchat/WhatsApp webhooks.
 * Credential-free: the product database client stays inside ToolDependencies
 * and is never placed on the provider context.
 */
export async function handleAgentMessage(
	ctx: GatewayContext,
	text: string,
	chatType: string,
	opts: AgentHandlerOptions,
	images?: string[],
): Promise<string> {
	const sb = opts.dataClient ?? getSb();
	const toolDependencies: ToolDependencies = {
		supabase: sb,
		externalOrganizationId: ctx.externalOrganizationId,
		userId: ctx.userId,
		productType: ctx.productType,
		audience: ctx.audience,
		channel: ctx.channel,
		channelChatId: ctx.channelChatId,
		channelUserId: ctx.channelUserId,
		conversationId: ctx.conversationId,
		traceId: ctx.traceId,
	};

	const session = await loadSession(
		sb,
		ctx.externalOrganizationId,
		ctx.channelChatId,
		ctx.channelUserId,
		ctx.channel,
	);
	const sanitizedText = sanitizeUserInput(text);
	const detectedLang = /[\u0400-\u04FF]/.test(sanitizedText) ? "mn" : "en";

	let _gateway: AiGateway | null = null;
	function getGateway(): AiGateway {
		_gateway ??= (() => {
			validateConfig();
			const primary: AiProvider = new OpenCodeGoProvider(openCodeGoConfig());
			const fallbackConfig = openAiConfig();
			return fallbackConfig
				? new AiGateway(primary, new GptMiniProvider(fallbackConfig))
				: new AiGateway(primary);
		})();
		return _gateway;
	}

	const turn = await runAgentTurn(
		{
			context: ctx,
			text: sanitizedText,
			images,
			conversationHistory:
				session.messages.length > 0
					? (session.messages as AgentTurnInput["conversationHistory"])
					: undefined,
		},
		{
			getSystemPrompt: () =>
				opts.getSystemPrompt(
					ctx.productType,
					ctx.externalOrganizationId,
					chatType,
					detectedLang,
				),
			getTools: () => opts.getTools(toolDependencies),
			runWithTools: (input) =>
				getGateway().runWithTools({
					system: input.system,
					userMessage: input.userMessage,
					images: input.images,
					tools: input.tools,
					context: input.context,
					onToken: opts.onToken,
					conversationHistory: input.conversationHistory?.map((message) => ({
						role: message.role,
						content: message.content,
					})),
				}),
		},
	);

	const updatedMessages: SessionMessage[] = [
		...session.messages,
		{ role: "user", content: sanitizedText },
		{ role: "assistant", content: turn.response },
	];
	await saveSession(
		sb,
		ctx.externalOrganizationId,
		ctx.channelChatId,
		ctx.channelUserId,
		updatedMessages,
		turn.estimatedTokens,
		ctx.channel,
	);
	await recordUsageAtomic(sb, ctx.externalOrganizationId, turn.usageTokens);

	return turn.response;
}
