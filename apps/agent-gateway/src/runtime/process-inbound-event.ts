import type { GatewayContext, OutboundIntent } from "@zuiio/gateway-core";
import { type AgentTurnResult, runAgentTurn } from "@/runtime/run-agent-turn";

export type ProcessInboundResult =
	| "completed"
	| "leased"
	| "retry"
	| "terminal";

export interface InboundEvent {
	id: string;
	provider: "meta";
	providerEventId: string;
	externalEndpointId: string;
	text: string;
	senderId: string;
	kind: "message" | "quick_reply" | "postback" | "referral";
	payload?: Record<string, unknown>;
	traceId: string;
}

export interface InboundProcessorRepository {
	claimInboundEvent(
		eventId: string,
		leaseSeconds: number,
	): Promise<InboundEvent | null>;
	resolveContext(event: InboundEvent): Promise<GatewayContext | null>;
	upsertConversation(context: GatewayContext): Promise<void>;
	appendInboundMessage(
		event: InboundEvent,
		context: GatewayContext,
	): Promise<void>;
	findAgentRun(
		eventId: string,
	): Promise<{ response: string; intents: OutboundIntent[] } | null>;
	startAgentRun(
		eventId: string,
		conversationId: string,
		traceId: string,
	): Promise<boolean>;
	finishAgentRun(
		eventId: string,
		result: AgentTurnResult,
		intents: OutboundIntent[],
	): Promise<void>;
	finishInboundEvent(eventId: string): Promise<void>;
	markRetryable(eventId: string, code: string): Promise<void>;
	markTerminal(eventId: string, code: string): Promise<void>;
}

export interface InboundProcessorDependencies {
	repository: InboundProcessorRepository;
	runAgent?: typeof runAgentTurn;
	runAgentDependencies: Parameters<typeof runAgentTurn>[1];
	processConfirmation?: (
		event: InboundEvent,
		context: GatewayContext,
	) => Promise<OutboundIntent[]>;
	processFlow?: (
		event: InboundEvent,
		context: GatewayContext,
	) => Promise<OutboundIntent[] | null>;
	// Delivery is deliberately downstream of persistence; a queue consumer owns it.
}

/**
 * Durable inbound application service. Every externally observable mutation is
 * represented by a repository operation, so retries can safely resume cold.
 */
export async function processInboundEvent(
	eventId: string,
	deps: InboundProcessorDependencies,
): Promise<ProcessInboundResult> {
	const claimed = await deps.repository.claimInboundEvent(eventId, 60);
	if (!claimed) return "leased";
	try {
		const context = await deps.repository.resolveContext(claimed);
		if (!context) {
			await deps.repository.markTerminal(eventId, "META_ENDPOINT_NOT_FOUND");
			return "terminal";
		}
		await deps.repository.upsertConversation(context);
		await deps.repository.appendInboundMessage(claimed, context);

		// finish_agent_run already inserted the outbound rows for the first
		// attempt; a redelivered event only replays delivery.
		const existing = await deps.repository.findAgentRun(eventId);
		if (existing) {
			await deps.repository.finishInboundEvent(eventId);
			return "completed";
		}

		let intents: OutboundIntent[] | null = null;
		if (claimed.kind === "quick_reply" || claimed.kind === "postback") {
			intents = (await deps.processConfirmation?.(claimed, context)) ?? null;
		}
		if (!intents && deps.processFlow)
			intents = await deps.processFlow(claimed, context);
		let turn: AgentTurnResult;
		if (intents) {
			turn = {
				response: intents.map((intent) => intent.text).join("\n"),
				messages: [],
				estimatedTokens: 0,
				usageTokens: 0,
				timings: {},
				pendingActionIds: [],
			};
		} else {
			turn = await (deps.runAgent ?? runAgentTurn)(
				{ context, text: claimed.text, images: [] },
				deps.runAgentDependencies,
			);
			intents = (turn.intents ?? []).map((intent) => ({
				...intent,
				conversationId: context.conversationId,
				sourceEventId: eventId,
				traceId: context.traceId,
			}));
		}
		await deps.repository.finishAgentRun(eventId, turn, intents);
		await deps.repository.finishInboundEvent(eventId);
		return "completed";
	} catch (error) {
		const code =
			error instanceof Error ? error.name : "INBOUND_PROCESSING_FAILED";
		await deps.repository.markRetryable(eventId, code);
		return "retry";
	}
}
