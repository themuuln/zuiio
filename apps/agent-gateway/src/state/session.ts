import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { chatCompletion } from "@zuiio/ai-agent";
import { getCachedSession, setCachedSession } from "@/lib/cache";
import { debug } from "@/lib/debug";
import { openCodeGoConfig } from "@/lib/env";

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
 * Checks Redis hot cache first, falls back to Supabase.
 * Returns existing messages or empty array.
 */
export async function loadSession(
	supabase: SupabaseClient,
	orgId: string,
	channelChatId: string,
	channelUserId: string,
	channel = "telegram",
): Promise<SessionState> {
	// Step 1: Check Redis hot cache
	const cached = await getCachedSession<SessionState>(
		orgId,
		channel,
		channelChatId,
		channelUserId,
	);
	if (cached) {
		return cached;
	}

	// Step 2: Fall back to Supabase
	const { data, error } = await supabase
		.from("agent_sessions")
		.select("messages, token_count")
		.eq("organization_id", orgId)
		.eq("channel", channel)
		.eq("channel_chat_id", channelChatId)
		.eq("channel_user_id", channelUserId)
		.single();

	if (error || !data) {
		return { messages: [], tokenCount: 0 };
	}

	const session: SessionState = {
		messages: (data.messages as SessionMessage[]) ?? [],
		tokenCount: (data.token_count as number) ?? 0,
	};

	// Step 3: Populate Redis cache for next read
	await setCachedSession(orgId, channel, channelChatId, channelUserId, session);

	return session;
}

/**
 * Save session state to Supabase using a single upsert.
 */
export async function saveSession(
	supabase: SupabaseClient,
	orgId: string,
	channelChatId: string,
	channelUserId: string,
	messages: SessionMessage[],
	tokenCount: number,
	channel = "telegram",
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
	const expiresAt = new Date(
		Date.now() + SESSION_TTL_HOURS * 3600000,
	).toISOString();
	const serialized = JSON.parse(JSON.stringify(messages)) as never;

	debug("session", "saveSession upsert", {
		orgId,
		chatId: channelChatId,
		userId: channelUserId,
		messageCount: messages.length,
	});
	const { error } = await supabase.from("agent_sessions").upsert(
		{
			organization_id: orgId,
			channel,
			channel_chat_id: channelChatId,
			channel_user_id: channelUserId,
			// Keep legacy columns in sync for pre-007 consumers and backfills
			telegram_chat_id: channelChatId,
			telegram_user_id: channelUserId,
			messages: serialized,
			token_count: tokenCount,
			updated_at: now,
			expires_at: expiresAt,
		},
		{
			onConflict: "organization_id,channel,channel_chat_id,channel_user_id",
			ignoreDuplicates: false,
		},
	);

	if (error) {
		console.error("[session] save failed:", error.message);
	} else {
		debug("session", "session saved", { orgId, chatId: channelChatId });
	}

	// Update Redis hot cache
	const sessionState: SessionState = { messages, tokenCount };
	await setCachedSession(
		orgId,
		channel,
		channelChatId,
		channelUserId,
		sessionState,
	);
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
	const session = await loadSession(
		supabase,
		orgId,
		channelChatId,
		channelUserId,
		channel,
	);

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

/** Threshold: compress when messages exceed this count */
const SUMMARIZE_THRESHOLD_MESSAGES = 20;
/** Keep this many recent turns verbatim after summarization */
const VERBATIM_WINDOW = 10;
/** Max tokens for the summarization response */
const SUMMARIZE_MAX_TOKENS = 512;

/**
 * Summarize old messages to compress conversation history.
 * Takes messages beyond the verbatim window, calls a cheap model to summarize,
 * and returns a new messages array with a summary replacing the old messages.
 *
 * Returns null if no summarization is needed (below threshold).
 */
export async function summarizeIfNeeded(
	messages: SessionMessage[],
): Promise<SessionMessage[] | null> {
	if (messages.length <= SUMMARIZE_THRESHOLD_MESSAGES) {
		return null;
	}

	// Split: summary candidates (old) + verbatim window (recent)
	const splitIdx = messages.length - VERBATIM_WINDOW;
	const oldMessages = messages.slice(0, splitIdx);
	const recentMessages = messages.slice(splitIdx);

	// Skip if old messages are too short to summarize meaningfully
	const oldContent = oldMessages
		.filter((m) => m.role === "user" || m.role === "assistant")
		.map((m) => `${m.role}: ${m.content ?? ""}`)
		.join("\n");

	if (oldContent.length < 200) {
		return null;
	}

	try {
		const config = openCodeGoConfig();
		const summary = await chatCompletion({
			apiKey: config.apiKey,
			baseUrl: config.baseUrl,
			model: config.model,
			temperature: 0.3,
			maxTokens: SUMMARIZE_MAX_TOKENS,
			systemPrompt:
				"Та ярианы товч бичээч. Дараах харилцааны тэмдэглэлийг нэг хэсэг болгон товчло. Монгол хэлээр бичнэ үү. Зүйл бүрийг хадгал: хэрэглэгчийн хүсэлт, шийдвэр, үр дүн. 3-5 өгүүлбэр бичнэ.",
			messages: [{ role: "user", content: oldContent }],
		});

		debug("session", "summarized old messages", {
			oldCount: oldMessages.length,
			summaryLen: summary.length,
		});

		// Replace old messages with a single summary
		const summaryMessage: SessionMessage = {
			role: "system",
			content: `[Ярианы товч]\n${summary}`,
		};

		return [summaryMessage, ...recentMessages];
	} catch (err) {
		debug("session", "summarization failed, falling back to trim", {
			error: err instanceof Error ? err.message : String(err),
		});
		// Fallback: just keep the recent window
		return recentMessages;
	}
}
