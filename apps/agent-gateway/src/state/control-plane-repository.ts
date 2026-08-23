import "server-only";

import type { GatewayControlClient } from "@/lib/gateway-control-client";

export interface ControlTenant {
	id: string;
	product_type: "zer" | "tolom" | "zatly";
	external_organization_id: string;
	status: "active" | "disabled";
}

export interface ControlInboundEvent {
	id: string;
	provider: "meta";
	provider_event_id: string;
	external_endpoint_id: string;
	status:
		| "received"
		| "processing"
		| "ready_to_deliver"
		| "completed"
		| "retryable_failed"
		| "dead_letter";
	attempt_count: number;
	lease_expires_at: string | null;
	trace_id: string;
}

export interface ControlOutboundMessage {
	id: string;
	conversation_id: string;
	status:
		| "pending"
		| "sending"
		| "sent"
		| "retryable_failed"
		| "delivery_unknown"
		| "dead_letter";
	attempt_count: number;
	payload: Record<string, unknown>;
	provider_message_id: string | null;
	last_error_code: string | null;
	trace_id: string;
}

export interface PendingAction {
	id: string;
	conversation_id: string;
	tool_name: string;
	arguments: Record<string, unknown>;
	idempotency_key: string | null;
	nonce_digest: string;
	status:
		| "pending"
		| "executing"
		| "completed"
		| "rejected"
		| "expired"
		| "failed";
	expires_at: string;
}

export interface DailyUsage {
	id: string;
	tenant_id: string;
	usage_date: string;
	message_count: number;
	token_count: number;
}

export interface ControlPlaneRepository {
	consumeServiceNonce(input: {
		clientId: string;
		nonce: string;
		expiresAt: string;
	}): Promise<boolean>;
	ingestMetaEvent(input: {
		providerEventId: string;
		externalEndpointId: string;
		payload: Record<string, unknown>;
		traceId: string;
	}): Promise<string>;
	claimInboundEvent(
		eventId: string,
		leaseSeconds?: number,
	): Promise<ControlInboundEvent | null>;
	finishAgentRun(input: {
		runId: string;
		status: "running" | "completed" | "failed";
		response: unknown;
		usage: unknown;
		timings: unknown;
	}): Promise<unknown>;
	claimOutboundMessage(
		messageId: string,
		leaseSeconds?: number,
	): Promise<ControlOutboundMessage | null>;
	markOutboundResult(input: {
		messageId: string;
		status: ControlOutboundMessage["status"];
		providerMessageId?: string | null;
		errorCode?: string | null;
	}): Promise<ControlOutboundMessage | null>;
	stagePendingAction(input: {
		conversationId: string;
		toolName: string;
		arguments: Record<string, unknown>;
		idempotencyKey: string | null;
		nonceDigest: string;
		expiresAt: string;
		confirmationPayload: Record<string, unknown>;
		traceId: string;
	}): Promise<PendingAction>;
	claimPendingAction(input: {
		actionId: string;
		conversationId: string;
		nonceDigest: string;
		leaseSeconds?: number;
	}): Promise<PendingAction | null>;
	rejectPendingAction(
		actionId: string,
		conversationId: string,
		status?: "rejected" | "expired" | "failed",
	): Promise<PendingAction | null>;
	incrementDailyUsage(input: {
		tenantId: string;
		messageCount?: number;
		tokenCount?: number;
	}): Promise<DailyUsage>;
	upsertTenant(input: {
		productType: ControlTenant["product_type"];
		externalOrganizationId: string;
	}): Promise<ControlTenant>;
}

function unwrap<T>(
	data: T | null,
	error: { message: string } | null,
	operation: string,
): T {
	if (error) throw new Error(`${operation} failed: ${error.message}`);
	if (data === null) throw new Error(`${operation} returned no row`);
	return data;
}

export function createControlPlaneRepository(
	client: GatewayControlClient,
): ControlPlaneRepository {
	return {
		async consumeServiceNonce({ clientId, nonce, expiresAt }) {
			const { data, error } = await client.rpc("consume_service_nonce", {
				p_client_id: clientId,
				p_nonce: nonce,
				p_expires_at: expiresAt,
			});
			return unwrap(data as boolean | null, error, "consume_service_nonce");
		},
		async ingestMetaEvent({
			providerEventId,
			externalEndpointId,
			payload,
			traceId,
		}) {
			const { data, error } = await client.rpc("ingest_meta_event", {
				p_provider_event_id: providerEventId,
				p_external_endpoint_id: externalEndpointId,
				p_payload: payload,
				p_trace_id: traceId,
			});
			return unwrap(data as string | null, error, "ingest_meta_event");
		},
		async claimInboundEvent(eventId, leaseSeconds = 60) {
			const { data, error } = await client.rpc("claim_inbound_event", {
				p_event_id: eventId,
				p_lease_seconds: leaseSeconds,
			});
			if (error)
				throw new Error(`claim_inbound_event failed: ${error.message}`);
			return data as ControlInboundEvent | null;
		},
		async finishAgentRun({ runId, status, response, usage, timings }) {
			const { data, error } = await client.rpc("finish_agent_run", {
				p_run_id: runId,
				p_status: status,
				p_response: response,
				p_usage: usage,
				p_timings: timings,
			});
			return unwrap(data, error, "finish_agent_run");
		},
		async claimOutboundMessage(messageId, leaseSeconds = 60) {
			const { data, error } = await client.rpc("claim_outbound_message", {
				p_message_id: messageId,
				p_lease_seconds: leaseSeconds,
			});
			if (error)
				throw new Error(`claim_outbound_message failed: ${error.message}`);
			return data as ControlOutboundMessage | null;
		},
		async markOutboundResult({
			messageId,
			status,
			providerMessageId = null,
			errorCode = null,
		}) {
			const { data, error } = await client.rpc("mark_outbound_result", {
				p_message_id: messageId,
				p_status: status,
				p_provider_message_id: providerMessageId,
				p_error_code: errorCode,
			});
			if (error)
				throw new Error(`mark_outbound_result failed: ${error.message}`);
			return data as ControlOutboundMessage | null;
		},
		async stagePendingAction(input) {
			const { data, error } = await client.rpc("stage_pending_action", {
				p_conversation_id: input.conversationId,
				p_tool_name: input.toolName,
				p_arguments: input.arguments,
				p_idempotency_key: input.idempotencyKey,
				p_nonce_digest: input.nonceDigest,
				p_expires_at: input.expiresAt,
				p_confirmation_payload: input.confirmationPayload,
				p_trace_id: input.traceId,
			});
			return unwrap(
				data as PendingAction | null,
				error,
				"stage_pending_action",
			);
		},
		async claimPendingAction({
			actionId,
			conversationId,
			nonceDigest,
			leaseSeconds = 60,
		}) {
			const { data, error } = await client.rpc("claim_pending_action", {
				p_action_id: actionId,
				p_conversation_id: conversationId,
				p_nonce_digest: nonceDigest,
				p_lease_seconds: leaseSeconds,
			});
			if (error)
				throw new Error(`claim_pending_action failed: ${error.message}`);
			return data as PendingAction | null;
		},
		async rejectPendingAction(actionId, conversationId, status = "rejected") {
			const { data, error } = await client.rpc("reject_pending_action", {
				p_action_id: actionId,
				p_conversation_id: conversationId,
				p_status: status,
			});
			if (error)
				throw new Error(`reject_pending_action failed: ${error.message}`);
			return data as PendingAction | null;
		},
		async incrementDailyUsage({ tenantId, messageCount = 0, tokenCount = 0 }) {
			const { data, error } = await client.rpc("increment_daily_usage", {
				p_tenant_id: tenantId,
				p_message_count: messageCount,
				p_token_count: tokenCount,
			});
			return unwrap(data as DailyUsage | null, error, "increment_daily_usage");
		},
		async upsertTenant({ productType, externalOrganizationId }) {
			const { data, error } = await client
				.from("tenants")
				.upsert(
					{
						product_type: productType,
						external_organization_id: externalOrganizationId,
					},
					{ onConflict: "product_type,external_organization_id" },
				)
				.select("id, product_type, external_organization_id, status")
				.single();
			return unwrap(data as ControlTenant | null, error, "upsert tenant");
		},
	};
}
