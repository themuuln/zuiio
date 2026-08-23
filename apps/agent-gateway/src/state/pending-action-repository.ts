import "server-only";

import type { GatewayControlClient } from "@/lib/gateway-control-client";
import { createGatewayControlClient } from "@/lib/gateway-control-client";
import type {
	PendingActionRecord,
	PendingActionRepository,
} from "@/runtime/confirmation";

interface PendingActionRow {
	id: string;
	conversation_id: string;
	tool_name: string;
	arguments: Record<string, unknown>;
	idempotency_key: string;
	status: PendingActionRecord["status"];
	expires_at: string;
}

function toPendingAction(row: PendingActionRow): PendingActionRecord {
	return {
		id: row.id,
		conversationId: row.conversation_id,
		toolName: row.tool_name,
		arguments: row.arguments,
		idempotencyKey: row.idempotency_key,
		status: row.status,
		expiresAt: row.expires_at,
	};
}

function firstRow(data: unknown): PendingActionRow | null {
	const value = Array.isArray(data) ? data[0] : data;
	return value && typeof value === "object"
		? (value as PendingActionRow)
		: null;
}

export function createPendingActionRepository(
	client: GatewayControlClient,
): PendingActionRepository {
	return {
		async stage(input) {
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
			const row = firstRow(data);
			if (error || !row) throw new Error("PENDING_ACTION_STAGE_FAILED");
			return toPendingAction(row);
		},
		async claim(input) {
			const { data, error } = await client.rpc("claim_pending_action", {
				p_conversation_id: input.conversationId,
				p_nonce_digest: input.nonceDigest,
				p_lease_seconds: 60,
			});
			if (error) throw new Error("PENDING_ACTION_CLAIM_FAILED");
			const row = firstRow(data);
			return row ? toPendingAction(row) : null;
		},
		async reject(input) {
			const { data, error } = await client.rpc("reject_pending_action", {
				p_conversation_id: input.conversationId,
				p_nonce_digest: input.nonceDigest,
				p_response_payload: input.payload,
				p_trace_id: input.traceId,
				p_status: input.status ?? "rejected",
			});
			if (error) throw new Error("PENDING_ACTION_REJECT_FAILED");
			return firstRow(data) !== null;
		},
		async complete(input) {
			const { data, error } = await client.rpc("complete_pending_action", {
				p_action_id: input.actionId,
				p_conversation_id: input.conversationId,
				p_status: input.status,
				p_result: input.result,
				p_error_code: input.errorCode,
				p_response_payload: input.payload,
				p_trace_id: input.traceId,
			});
			if (error || data !== true) {
				throw new Error("PENDING_ACTION_COMPLETE_FAILED");
			}
		},
	};
}

let _repository: PendingActionRepository | null = null;
/** Process-wide singleton backed by the gateway control plane. */
export function pendingActionRepository(): PendingActionRepository {
	_repository ??= createPendingActionRepository(createGatewayControlClient());
	return _repository;
}
