import type { SupabaseClient } from "@supabase/supabase-js";
import { truncateResult } from "@/lib/sanitize";
import type { GatewayTool, ToolContext } from "@/providers/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditOptions {
	truncate?: boolean;
}

interface LogToolCallParams {
	orgId: string;
	userId: string;
	channel: string;
	channelChatId: string;
	channelUserId: string;
	toolName: string;
	toolArgs: Record<string, unknown>;
	toolResult: unknown;
	error: string | null;
	durationMs: number;
}

// ─── Logger ──────────────────────────────────────────────────────────────────

/**
 * Records a single tool execution in the audit log.
 * Fire-and-forget: the insert is awaited but errors are silently caught.
 * MUST never throw — callers never wait on this.
 */
export async function logToolCall(
	supabase: SupabaseClient,
	params: LogToolCallParams,
): Promise<void> {
	try {
		await supabase.from("agent_audit_log").insert({
			organization_id: params.orgId,
			user_id: params.userId,
			channel: params.channel,
			channel_chat_id: params.channelChatId,
			channel_user_id: params.channelUserId,
			tool_name: params.toolName,
			tool_args: params.toolArgs,
			tool_result: normalizeToolResult(params.toolResult),
			error: params.error,
			duration_ms: params.durationMs,
		});
	} catch {
		// Audit logging is non-critical — silently drop on failure
	}
}

/**
 * Normalizes a tool result for the jsonb audit column.
 *
 * Object/array results pass through as structured JSON. String results are
 * parsed back into JSON when possible (tools return `JSON.stringify`ed
 * payloads), falling back to a plain string — both are valid jsonb values.
 * Never double-encodes: a JSON object stored as a JSON *string* breaks
 * `tool_result ? 'error'` style queries and analytics.
 */
function normalizeToolResult(result: unknown): unknown {
	if (result === null || typeof result !== "string") return result;
	try {
		return JSON.parse(result);
	} catch {
		return result;
	}
}

// ─── Wrapper ─────────────────────────────────────────────────────────────────

/**
 * Wraps a GatewayTool's execute with timing and audit logging.
 * Pure wrapper: preserves original behavior, adds invisible audit trail.
 */
export function withAudit(
	tool: GatewayTool,
	channel: string,
	channelChatId: string,
	channelUserId: string,
	options?: AuditOptions,
): GatewayTool {
	const originalExecute = tool.execute;

	return {
		...tool,
		execute: async (args: Record<string, unknown>, context: ToolContext) => {
			const start = performance.now();
			try {
				let result = await originalExecute(args, context);
				const durationMs = Math.round(performance.now() - start);
				// Apply truncation if requested
				if (options?.truncate && typeof result === "string") {
					result = truncateResult(result);
				}
				logToolCall(context.supabase, {
					orgId: context.orgId,
					userId: context.userId,
					channel,
					channelChatId,
					channelUserId,
					toolName: tool.name,
					toolArgs: args,
					toolResult: result,
					error: null,
					durationMs,
				});
				return result;
			} catch (err) {
				const durationMs = Math.round(performance.now() - start);
				logToolCall(context.supabase, {
					orgId: context.orgId,
					userId: context.userId,
					channel,
					channelChatId,
					channelUserId,
					toolName: tool.name,
					toolArgs: args,
					toolResult: null,
					error: err instanceof Error ? err.message : String(err),
					durationMs,
				});
				throw err;
			}
		},
	};
}
