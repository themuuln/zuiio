/**
 * Redis cache layer using Upstash Redis.
 * Provides sub-millisecond reads for active sessions, budgets, and wizard state.
 * Falls back gracefully when Redis is not configured.
 */
import "server-only";

import { debug } from "@/lib/debug";
import { getRedis } from "@/lib/redis";

/** Cache key for session data — includes channel for multi-channel isolation. */
function sessionKey(
	orgId: string,
	channel: string,
	chatId: string,
	userId: string,
): string {
	return `session:${orgId}:${channel}:${chatId}:${userId}`;
}

/** TTL for cached sessions — matches SESSION_TTL_HOURS in session.ts. */
const SESSION_CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Get cached session from Redis.
 * Returns null if not cached or Redis is unavailable.
 */
export async function getCachedSession<T>(
	orgId: string,
	channel: string,
	chatId: string,
	userId: string,
): Promise<T | null> {
	const redis = getRedis();
	if (!redis) return null;
	try {
		const data = await redis.get<T>(sessionKey(orgId, channel, chatId, userId));
		if (data) {
			debug("cache", "Redis HIT", {
				orgId,
				channel,
				chatId: chatId.slice(0, 8),
			});
		}
		return data;
	} catch (err) {
		debug("cache", "Redis GET failed", {
			error: err instanceof Error ? err.message : String(err),
		});
		return null;
	}
}

/**
 * Set session data in Redis cache.
 * Fire-and-forget — never throws.
 */
export async function setCachedSession(
	orgId: string,
	channel: string,
	chatId: string,
	userId: string,
	data: unknown,
): Promise<void> {
	const redis = getRedis();
	if (!redis) return;
	try {
		await redis.set(sessionKey(orgId, channel, chatId, userId), data, {
			ex: SESSION_CACHE_TTL_SECONDS,
		});
		debug("cache", "Redis SET", { orgId, channel, chatId: chatId.slice(0, 8) });
	} catch (err) {
		debug("cache", "Redis SET failed", {
			error: err instanceof Error ? err.message : String(err),
		});
	}
}

/**
 * Invalidate cached session.
 */
export async function invalidateCachedSession(
	orgId: string,
	channel: string,
	chatId: string,
	userId: string,
): Promise<void> {
	const redis = getRedis();
	if (!redis) return;
	try {
		await redis.del(sessionKey(orgId, channel, chatId, userId));
	} catch {
		// Ignore — cache invalidation is best-effort
	}
}

// ─── Budget Cache ───────────────────────────────────────────────────────────────

/** Cache key for daily budget. */
function budgetKey(orgId: string, date: string): string {
	return `budget:${orgId}:${date}`;
}

/** TTL for budget cache — 5 minutes (balance between freshness and perf). */
const BUDGET_CACHE_TTL_SECONDS = 5 * 60;

export async function getCachedBudget(
	orgId: string,
): Promise<{ tokensUsed: number } | null> {
	const redis = getRedis();
	if (!redis) return null;
	try {
		const today = new Date().toISOString().split("T")[0]!;
		return await redis.get<{ tokensUsed: number }>(budgetKey(orgId, today));
	} catch {
		return null;
	}
}

export async function setCachedBudget(
	orgId: string,
	tokensUsed: number,
): Promise<void> {
	const redis = getRedis();
	if (!redis) return;
	try {
		const today = new Date().toISOString().split("T")[0]!;
		await redis.set(
			budgetKey(orgId, today),
			{ tokensUsed },
			{ ex: BUDGET_CACHE_TTL_SECONDS },
		);
	} catch {
		// Fire-and-forget
	}
}

// ─── Wizard Cache ───────────────────────────────────────────────────────────────

function wizardKey(
	orgId: string,
	chatId: string,
	userId: string,
	channel: string,
): string {
	return `wizard:${orgId}:${channel}:${chatId}:${userId}`;
}

/** 30 minutes — matches WIZARD_TTL_MS in wizard.ts. */
const WIZARD_CACHE_TTL_SECONDS = 30 * 60;

export async function getCachedWizard<T>(
	orgId: string,
	chatId: string,
	userId: string,
	channel: string,
): Promise<T | null> {
	const redis = getRedis();
	if (!redis) return null;
	try {
		return await redis.get<T>(wizardKey(orgId, chatId, userId, channel));
	} catch {
		return null;
	}
}

export async function setCachedWizard(
	orgId: string,
	chatId: string,
	userId: string,
	channel: string,
	data: unknown,
): Promise<void> {
	const redis = getRedis();
	if (!redis) return;
	try {
		await redis.set(wizardKey(orgId, chatId, userId, channel), data, {
			ex: WIZARD_CACHE_TTL_SECONDS,
		});
	} catch {
		// Fire-and-forget
	}
}

export async function invalidateCachedWizard(
	orgId: string,
	chatId: string,
	userId: string,
	channel: string,
): Promise<void> {
	const redis = getRedis();
	if (!redis) return;
	try {
		await redis.del(wizardKey(orgId, chatId, userId, channel));
	} catch {
		// Ignore
	}
}
