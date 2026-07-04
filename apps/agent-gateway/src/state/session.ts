import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** A single message in the conversation history (OpenAI-compatible format). */
export interface SessionMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

/** Loaded session state. */
export interface SessionState {
  messages: SessionMessage[];
  tokenCount: number;
}

const MAX_SESSION_MESSAGES = 50;
const SESSION_TTL_HOURS = 24;

/**
 * Load session for a tenant+chat+user compound key.
 * Returns existing messages or empty array.
 */
export async function loadSession(
  supabase: SupabaseClient,
  orgId: string,
  chatId: number,
  userId: number,
): Promise<SessionState> {
  const { data, error } = await supabase
    .from("agent_sessions")
    .select("messages, token_count")
    .eq("organization_id", orgId)
    .eq("telegram_chat_id", chatId)
    .eq("telegram_user_id", userId)
    .single();

  if (error || !data) {
    return { messages: [], tokenCount: 0 };
  }

  return {
    messages: (data.messages as SessionMessage[]) ?? [],
    tokenCount: (data.token_count as number) ?? 0,
  };
}

/**
 * Save session state to Supabase.
 * Upserts by the compound key (orgId, chatId, userId).
 */
export async function saveSession(
  supabase: SupabaseClient,
  orgId: string,
  chatId: number,
  userId: number,
  messages: SessionMessage[],
  tokenCount: number,
): Promise<void> {
  // Trim old messages if exceeding limit
  if (messages.length > MAX_SESSION_MESSAGES) {
    // Keep system prompt + last N-1 messages
    const systemIdx = messages.findIndex((m) => m.role === "system");
    if (systemIdx >= 0) {
      messages = [
        messages[systemIdx]!,
        ...messages.slice(messages.length - MAX_SESSION_MESSAGES + 1),
      ];
    } else {
      messages = messages.slice(messages.length - MAX_SESSION_MESSAGES);
    }
  }

  const { error } = await supabase.from("agent_sessions").upsert(
    {
      organization_id: orgId,
      telegram_chat_id: chatId,
      telegram_user_id: userId,
      messages: JSON.parse(JSON.stringify(messages)) as never,
      token_count: tokenCount,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SESSION_TTL_HOURS * 3600000).toISOString(),
    },
    {
      onConflict: "organization_id,telegram_chat_id,telegram_user_id",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    console.error("Failed to save session:", error.message);
  }
}

/**
 * Append a user message and an assistant response to the session.
 */
export async function appendToSession(
  supabase: SupabaseClient,
  orgId: string,
  chatId: number,
  userId: number,
  userMessage: string,
  assistantResponse: string,
  tokenCount: number,
): Promise<void> {
  const session = await loadSession(supabase, orgId, chatId, userId);

  session.messages.push({ role: "user", content: userMessage });
  session.messages.push({ role: "assistant", content: assistantResponse });
  session.tokenCount += tokenCount;

  await saveSession(
    supabase,
    orgId,
    chatId,
    userId,
    session.messages,
    session.tokenCount,
  );
}
