import type { SupabaseClient } from "@supabase/supabase-js";
import type { GatewayTool, ToolContext } from "@/providers/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogToolCallParams {
  orgId: string;
  userId: string;
  chatId: number;
  telegramUserId: number;
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
      chat_id: params.chatId,
      telegram_user_id: params.telegramUserId,
      tool_name: params.toolName,
      tool_args: params.toolArgs,
      tool_result: params.toolResult != null
        ? (typeof params.toolResult === "string" ? params.toolResult : JSON.stringify(params.toolResult))
        : null,
      error: params.error,
      duration_ms: params.durationMs,
    });
  } catch {
    // Audit logging is non-critical — silently drop on failure
  }
}

// ─── Wrapper ─────────────────────────────────────────────────────────────────

/**
 * Wraps a GatewayTool's execute with timing and audit logging.
 * Pure wrapper: preserves original behavior, adds invisible audit trail.
 */
export function withAudit(
  tool: GatewayTool,
  chatId: number,
  telegramUserId: number,
): GatewayTool {
  const originalExecute = tool.execute;

  return {
    ...tool,
    execute: async (args: Record<string, unknown>, context: ToolContext) => {
      const start = performance.now();
      try {
        const result = await originalExecute(args, context);
        const durationMs = Math.round(performance.now() - start);
        logToolCall(context.supabase, {
          orgId: context.orgId,
          userId: context.userId,
          chatId,
          telegramUserId,
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
          chatId,
          telegramUserId,
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
