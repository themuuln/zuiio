import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolParam } from "@zuiio/ai-agent";

/**
 * Context injected into every tool execution by the gateway layer.
 * orgId is resolved from the (chat_id, user_id) mapping — NEVER from LLM output.
 */
export interface ToolContext {
 orgId: string;
 userId: string;
 supabase: SupabaseClient;
}

/**
 * Enhanced tool for the gateway.
 * Same parameter format as @zuiio/ai-agent Tool, but execute() receives
 * context (orgId, userId, supabase) from the gateway layer.
 *
 * The tool MUST filter database queries by context.orgId.
 * The gateway guarantees this value is the resolved tenant.
 */
export interface GatewayTool {
 name: string;
 description: string;
 parameters: ToolParam[];
 execute: (args: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

/**
 * Options for the LLM provider API call.
 */
export interface ProviderOptions {
 apiKey: string;
 baseUrl?: string;
 model?: string;
}

/**
 * AI Provider interface.
 * Each provider OWNS the multi-turn tool-calling loop.
 * The gateway is a thin dispatcher with fallback.
 */
export interface AiProvider {
 /**
  * Multi-turn tool-calling conversation.
  * Provider sends messages, parses tool calls, executes tools with context,
  * appends results, repeats until no more tool calls or maxRounds reached.
  */
 runWithTools(params: {
  system: string;
  userMessage: string;
  tools: GatewayTool[];
  context: ToolContext;
  maxRounds?: number;
  conversationHistory?: Array<{
   role: "system" | "user" | "assistant" | "tool";
   content: string | null;
   tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
   }>;
   tool_call_id?: string;
  }>;
 }): Promise<string>;
}

/**
 * Gateway-level dispatcher with fallback.
 * If primary provider fails, retries on fallback provider.
 */
export class AiGateway {
 constructor(
  private primary: AiProvider,
  private fallback?: AiProvider,
 ) { }

 async runWithTools(
  params: Parameters<AiProvider["runWithTools"]>[0],
 ): Promise<string> {
  try {
   return await this.primary.runWithTools(params);
  } catch (err) {
   if (this.fallback) {
    console.error("Primary provider failed, falling back", err);
    return await this.fallback.runWithTools(params);
   }
   throw err;
  }
 }
}
