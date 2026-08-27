import "server-only";

import { capture } from "@zuiio/capture";

import { FacebookChannel } from "@/channels/facebook";
import type { MetaFeedChange, MetaFeedChangeValue } from "@/channels/types";
import { handleAgentMessage } from "@/gateway/agent-handler";
import type { GatewayContext } from "@/gateway/types";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { getRedis } from "@/lib/redis";
import { getSupabaseForProduct, type ServiceClient } from "@/lib/supabase";
/**
 * Page comment auto-reply agent.
 *
 * Trigger: Page webhook `feed` change where item=comment, verb=add.
 * Behavior per user comment:
 *  1. Public reply — AI-generated (customer audience, fail-closed tools),
 *     posted as the Page via POST /{comment-id}/comments.
 *  2. Private reply — one DM referencing the comment
 *     (POST /{page-id}/messages recipient.comment_id). Meta enforces a single
 *     private reply per comment within 7 days and it opens the 24h DM window.
 *
 * Loop / flood safety:
 *  - Comments authored by the Page itself are never processed.
 *  - Deterministic dedupe: before replying we check whether the Page already
 *    has a reply under that comment (webhook redelivery protection).
 *  - Best-effort per-commenter cooldown (in-memory; resets on cold start).
 *
 * Config lives in `channel_connections.metadata.comment_reply` (no migration
 * needed — metadata is a free-form JSON column):
 * { enabled, keywords: string[], publicReply, privateReply, fallbackReply }
 */

export interface CommentReplyConfig {
	enabled: boolean;
	/** Non-empty = only auto-reply to comments containing at least one keyword (case-insensitive). */
	keywords: string[];
	publicReply: boolean;
	privateReply: boolean;
	/** Static reply used when the AI call fails or returns nothing. */
	fallbackReply: string;
}

export const DEFAULT_COMMENT_REPLY_CONFIG: CommentReplyConfig = {
	enabled: true,
	keywords: [],
	publicReply: true,
	privateReply: true,
	fallbackReply:
		"Танд баярлалаа! Дэлгэрэнгүй мэдээллийн тулд Messenger-ээр бидэнтэй холбогдоно уу. 😊",
};

export function parseCommentReplyConfig(
	metadata: Record<string, unknown> | null | undefined,
): CommentReplyConfig {
	const raw = metadata?.comment_reply;
	if (typeof raw !== "object" || raw === null) {
		return DEFAULT_COMMENT_REPLY_CONFIG;
	}
	const cfg = raw as Partial<CommentReplyConfig>;
	return {
		enabled: cfg.enabled ?? DEFAULT_COMMENT_REPLY_CONFIG.enabled,
		keywords: Array.isArray(cfg.keywords)
			? cfg.keywords.filter((k): k is string => typeof k === "string")
			: [],
		publicReply: cfg.publicReply ?? DEFAULT_COMMENT_REPLY_CONFIG.publicReply,
		privateReply: cfg.privateReply ?? DEFAULT_COMMENT_REPLY_CONFIG.privateReply,
		fallbackReply:
			cfg.fallbackReply || DEFAULT_COMMENT_REPLY_CONFIG.fallbackReply,
	};
}

/** A validated user-authored comment extracted from a feed change. */
export interface UserCommentEvent {
	commentId: string;
	message: string;
	commenterId: string;
}

/**
 * Narrow a feed change value into a user comment worth answering.
 * Returns null for non-comment items, deletions/edits, empty messages, and
 * comments authored by the Page itself (loop protection).
 */
export function toUserComment(
	value: MetaFeedChangeValue,
	pageId: string,
): UserCommentEvent | null {
	if (value.item !== "comment" || value.verb !== "add") return null;
	if (typeof value.comment_id !== "string") return null;
	if (typeof value.message !== "string" || value.message.trim().length === 0) {
		return null;
	}
	if (typeof value.from?.id !== "string" || value.from.id === pageId) {
		return null;
	}
	return {
		commentId: value.comment_id,
		message: value.message,
		commenterId: value.from.id,
	};
}

export function matchesKeywords(message: string, keywords: string[]): boolean {
	if (keywords.length === 0) return true;
	const normalized = message.toLowerCase();
	return keywords.some(
		(keyword) =>
			keyword.length > 0 && normalized.includes(keyword.toLowerCase()),
	);
}

// Best-effort per-commenter cooldown. Serverless instances may recycle — the
// deterministic hasPageReplied() check remains the real redelivery guard.
// Durable Redis path survives cold starts; in-memory is fallback.
const COOLDOWN_MS = 60_000;
const lastReplyAt = new Map<string, number>();

export async function isCoolingDown(
	pageId: string,
	commenterId: string,
	now = Date.now(),
): Promise<boolean> {
	try {
		const redis = getRedis();
		if (redis) {
			const exists = await redis.get(`fb:comment:cooldown:${pageId}:${commenterId}`);
			if (exists) return true;
		}
	} catch {}
	const last = lastReplyAt.get(`${pageId}:${commenterId}`);
	return last !== undefined && now - last < COOLDOWN_MS;
}

export async function markReplied(
	pageId: string,
	commenterId: string,
	now = Date.now(),
): Promise<void> {
	try {
		const redis = getRedis();
		if (redis) {
			await redis.set(`fb:comment:cooldown:${pageId}:${commenterId}`, "1", {
				ex: Math.ceil(COOLDOWN_MS / 1000),
			});
		}
	} catch {}
	lastReplyAt.set(`${pageId}:${commenterId}`, now);
}

export function clearCommentCooldowns(): void {
	lastReplyAt.clear();
}

export interface CommentEventContext {
	pageId: string;
	pageAccessToken: string;
	orgId: string;
	/** Org-owner user id for audit/session attribution. */
	userId: string;
	productType: "tolom" | "zer" | "zatly";
	/** channel_connections row id (messenger connection for this page). */
	connectionId: string;
}

/**
 * Process one Page webhook feed change. Never throws — a comment failure
 * must not fail the webhook (Meta retries 5xx, which would double-process).
 */
export async function handleFeedChange(
	sb: ServiceClient,
	ctx: CommentEventContext,
	change: MetaFeedChange,
): Promise<void> {
	try {
		if (change.field !== "feed") return;
		const comment = toUserComment(change.value, ctx.pageId);
		if (!comment) return;

		const { data: connection } = await sb
			.from("channel_connections")
			.select("metadata")
			.eq("id", ctx.connectionId)
			.maybeSingle();
		const config = parseCommentReplyConfig(connection?.metadata);
		if (!config.enabled) return;
		if (!matchesKeywords(comment.message, config.keywords)) return;
		if (await isCoolingDown(ctx.pageId, comment.commenterId)) return;

		const channel = new FacebookChannel({
			pageId: ctx.pageId,
			pageAccessToken: ctx.pageAccessToken,
		});

		// Deterministic redelivery guard: if the Page already replied under
		// this comment, a webhook retry reached us — do nothing.
		if (
			config.publicReply &&
			(await channel.hasPageReplied(comment.commentId))
		) {
			return;
		}

		const dataClient =
			ctx.productType === "tolom" ? getSupabaseForProduct("tolom") : sb;

		const gatewayCtx = {
			supabase: dataClient,
			orgId: ctx.orgId,
			userId: ctx.userId,
			productType: ctx.productType,
			// Public comment surface — fail closed to the customer tool set.
			audience: "customer" as const,
			chatId: 0,
			telegramUserId: 0,
			channel: "messenger" as const,
			channelChatId: ctx.pageId,
			channelUserId: comment.commenterId,
			pageId: ctx.pageId,
			pageAccessToken: ctx.pageAccessToken,
		} satisfies GatewayContext & { supabase: ServiceClient };

		// chatType "comment" (≠ "private") makes the system prompt add the
		// public-chat warning: no private customer data in a public reply.
		let reply: string;
		try {
			reply = await handleAgentMessage(
				gatewayCtx,
				`${comment.message}\n\n(Энэ бол Facebook постын нийтэчдээ харагдах сэтгэгдэл. Богино, найрсаг, нийтэд тохиромжтой хариулна уу.)`,
				"comment",
				{
					getSystemPrompt: systemPromptFor,
					getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
					dataClient,
				},
			);
		} catch (err) {
			capture(err, { context: "agent-gateway: comment agent" });
			reply = "";
		}
		if (!reply.trim()) reply = config.fallbackReply;

		let publicOk = !config.publicReply;
		if (config.publicReply) {
			publicOk = await channel.replyToComment(comment.commentId, reply);
		}
		if (config.privateReply) {
			// Short CTA rather than the full answer — the public reply carries it.
			// Meta enforces one private reply per comment; failures are non-fatal.
			await channel.sendPrivateReply(
				comment.commentId,
				"Сайн байна уу? Таны сэтгэгдэлд хариулсан болно. 🙌 Энд мессежээр үргэлжлүүлэн холбогдож дэлгэрэнгүй мэдээлэл авна уу.",
			);
		}
		// Cooldown after attempt — durable guard is hasPageReplied; this is best-effort
		// flood control. Mark only when the public reply succeeded (or was disabled)
		// so a transient failure doesn't block a retry.
		if (publicOk) {
			await markReplied(ctx.pageId, comment.commenterId);
		}
	} catch (err) {
		capture(err, { context: "agent-gateway: handleFeedChange" });
	}
}
