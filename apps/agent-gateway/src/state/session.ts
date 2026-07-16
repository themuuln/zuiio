import "server-only";

import { debug } from "@/lib/debug";
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

export const MAX_SESSION_MESSAGES = 50;
const SESSION_TTL_HOURS = 24;

/**
 * Load session for a tenant+chat+user compound key.
 * Returns existing messages or empty array.
 */
export async function loadSession(
	supabase: SupabaseClient,
	orgId: string,
	channelChatId: string,
	channelUserId: string,
	_channel = "telegram",
): Promise<SessionState> {
	const { data, error } = await supabase
		.from("agent_sessions")
		.select("messages, token_count")
		.eq("organization_id", orgId)
		.eq("telegram_chat_id", channelChatId)
		.eq("telegram_user_id", channelUserId)
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
 * Tries insert first; falls back to update on duplicate key.
 */
export async function saveSession(
	supabase: SupabaseClient,
	orgId: string,
	channelChatId: string,
	channelUserId: string,
	messages: SessionMessage[],
	tokenCount: number,
	_channel = "telegram",
): Promise<void> {
	// Trim old messages if exceeding limit
	if (messages.length > MAX_SESSION_MESSAGES) {
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

	const now = new Date().toISOString();
	const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600000).toISOString();
	const serialized = JSON.parse(JSON.stringify(messages)) as never;
	const row = {
		organization_id: orgId,
		telegram_chat_id: channelChatId,
		telegram_user_id: channelUserId,
		messages: serialized,
		token_count: tokenCount,
		updated_at: now,
		expires_at: expiresAt,
	};

	// Try insert first
	debug("session", "saveSession insert", { orgId, chatId: channelChatId, userId: channelUserId, messageCount: messages.length });
	const { error } = await supabase.from("agent_sessions").insert(row);

	if (error) {
		if (error.code === "23505") {
			debug("session", "session exists, updating", { orgId, chatId: channelChatId });
			await supabase
				.from("agent_sessions")
				.update({
					messages: serialized,
					token_count: tokenCount,
					updated_at: now,
					expires_at: expiresAt,
				})
				.eq("organization_id", orgId)
				.eq("telegram_chat_id", channelChatId)
				.eq("telegram_user_id", channelUserId);
		} else {
			console.error("[session] save failed:", error.message);
		}
	} else {
		debug("session", "new session inserted", { orgId, chatId: channelChatId });
	}
}

/**
 * Append a user message and an assistant response to the session.
 */
export async function appendToSession(
	supabase: SupabaseClient,
	orgId: string,
	channelChatId: string,
	channelUserId: string,
	userMessage: string,
	assistantResponse: string,
	tokenCount: number,
	channel = "telegram",
): Promise<void> {
	const session = await loadSession(supabase, orgId, channelChatId, channelUserId, channel);

	session.messages.push({ role: "user", content: userMessage });
	session.messages.push({ role: "assistant", content: assistantResponse });
	session.tokenCount += tokenCount;

	await saveSession(
		supabase,
		orgId,
		channelChatId,
		channelUserId,
		session.messages,
		session.tokenCount,
		channel,
	);
}
