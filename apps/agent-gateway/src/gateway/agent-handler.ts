import "server-only";

import { AiGateway, type GatewayTool, type ToolContext } from "@/providers/types";
import { DeepSeekProvider } from "@/providers/deepseek";
import { GptMiniProvider } from "@/providers/gpt-mini";
import { loadSession, saveSession, MAX_SESSION_MESSAGES } from "@/state/session";
import { checkDailyBudget, recordUsageAtomic, REQUEST_LIMITS } from "@/state/budget";
import { checkRateLimit, RATE_LIMITS } from "@/state/rate-limit";
import { withAudit } from "@/state/audit";
import { deepSeekConfig, openAiConfig } from "@/lib/env";
import { sanitizeUserInput } from "@/lib/sanitize";
import { createServiceClient } from "@/lib/supabase";
import type { GatewayContext } from "@/gateway/types";

/** Shared gateway instance (lazy singleton). */
let _gateway: AiGateway | null = null;
function getGateway(): AiGateway {
 if (!_gateway) {
  const primary = new DeepSeekProvider(deepSeekConfig());
  const fallback = new GptMiniProvider(openAiConfig());
  _gateway = new AiGateway(primary, fallback);
 }
 return _gateway;
}

let _sb: ReturnType<typeof createServiceClient> | null = null;
function getSb() {
 if (!_sb) _sb = createServiceClient();
 return _sb;
}

export interface AgentHandlerOptions {
 /** Get system prompt for the product type and chat type. */
 getSystemPrompt: (productType: string, orgId: string, chatType: string) => string;
 /** Get tools for the product type and context. */
 getTools: (context: ToolContext) => GatewayTool[];
}

/**
 * Handle a text or voice-transcribed message from any bot mode.
 * Requires a pre-resolved GatewayContext (orgId, userId, productType already known).
 */
export async function handleAgentMessage(
 ctx: GatewayContext,
 text: string,
 chatType: string,
 opts: AgentHandlerOptions,
): Promise<string> {
 const sb = getSb();
 const gateway = getGateway();
 const context: ToolContext = { orgId: ctx.orgId, userId: ctx.userId, supabase: sb };

 // Check budget
 const budget = await checkDailyBudget(sb, ctx.orgId);
 if (!budget.allowed) return budget.reason!;

 // Rate limiting
 const rateLimit = checkRateLimit(ctx.orgId, RATE_LIMITS.messagesPerMinute);
 if (!rateLimit.allowed) {
  return `⏳ Хэт олон хүсэлт илгээсэн байна. ${Math.ceil(rateLimit.resetInMs / 1000)} секундын дараа дахин оролдоно уу.`;
 }

 // Select tools
 const rawTools = opts.getTools(context);
 const tools = rawTools.map((t) => withAudit(t, ctx.chatId, ctx.telegramUserId));

 // Load conversation history
 const session = await loadSession(sb, ctx.orgId, ctx.chatId, ctx.telegramUserId);

 const sanitizedText = sanitizeUserInput(text);
 const response = await gateway.runWithTools({
  system: opts.getSystemPrompt(ctx.productType, ctx.orgId, chatType),
  userMessage: sanitizedText,
  tools,
  context,
  maxRounds: REQUEST_LIMITS.maxToolRounds,
  conversationHistory: session.messages.length > 0 ? session.messages : undefined,
 });

 // Save session
 const updatedMessages = [
  ...session.messages,
  { role: "user" as const, content: sanitizedText },
  { role: "assistant" as const, content: response },
 ];
 const trimmed = updatedMessages.length > MAX_SESSION_MESSAGES
  ? updatedMessages.slice(updatedMessages.length - MAX_SESSION_MESSAGES)
  : updatedMessages;
 await saveSession(sb, ctx.orgId, ctx.chatId, ctx.telegramUserId, trimmed, session.tokenCount + 500);
 await recordUsageAtomic(sb, ctx.orgId, 500);

 return response;
}
