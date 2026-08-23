import type { SupabaseClient } from "@supabase/supabase-js";
import type { GatewayTool, ToolContext } from "@zuiio/gateway-core";
import { truncateResult } from "@/lib/sanitize";

interface AuditOptions {
	truncate?: boolean;
}

interface AuditDependencies {
	supabase: SupabaseClient;
	externalOrganizationId: string;
	channel: string;
	channelChatId: string;
	channelUserId: string;
}

interface LogToolCallParams {
	organizationId: string;
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

export async function logToolCall(
	supabase: SupabaseClient,
	params: LogToolCallParams,
): Promise<void> {
	try {
		await supabase.from("agent_audit_log").insert({
			organization_id: params.organizationId,
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
		// Audit logging is non-critical.
	}
}

function normalizeToolResult(result: unknown): unknown {
	if (result === null || typeof result !== "string") return result;
	try {
		return JSON.parse(result);
	} catch {
		return result;
	}
}

/** Add timing and audit logging without adding credentials to ToolContext. */
export function withAudit(
	tool: GatewayTool,
	dependencies: AuditDependencies,
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
				if (options?.truncate && typeof result === "string") {
					result = truncateResult(result);
				}
				void logToolCall(dependencies.supabase, {
					organizationId: dependencies.externalOrganizationId,
					userId: context.userId,
					channel: dependencies.channel,
					channelChatId: dependencies.channelChatId,
					channelUserId: dependencies.channelUserId,
					toolName: tool.name,
					toolArgs: args,
					toolResult: result,
					error: null,
					durationMs,
				});
				return result;
			} catch (error) {
				void logToolCall(dependencies.supabase, {
					organizationId: dependencies.externalOrganizationId,
					userId: context.userId,
					channel: dependencies.channel,
					channelChatId: dependencies.channelChatId,
					channelUserId: dependencies.channelUserId,
					toolName: tool.name,
					toolArgs: args,
					toolResult: null,
					error:
						error instanceof Error ? error.message : "Tool execution failed",
					durationMs: Math.round(performance.now() - start),
				});
				throw error;
			}
		},
	};
}
