import "server-only";

/**
 * Distributed sliding-window rate limiter.
 * Uses Redis for multi-process consistency when available,
 * falls back to in-memory when Redis is unavailable.
 */

import { getRedis } from "@/lib/redis";

interface WindowEntry {
	timestamps: number[];
}

/** In-memory store — used only when Redis is unavailable. */
const store = new Map<string, WindowEntry>();

/** Clean up stale entries periodically (every 5 minutes). */
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(): void {
	if (cleanupTimer) return;
	cleanupTimer = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			entry.timestamps = entry.timestamps.filter((t) => now - t < 60_000);
			if (entry.timestamps.length === 0) {
				store.delete(key);
			}
		}
	}, CLEANUP_INTERVAL);
}

/**
 * Redis-backed sliding window rate limiter.
 * Uses a sorted set with timestamp scores for O(log n) operations.
 */
async function checkRedisRateLimit(
	key: string,
	maxRequests: number,
	windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetInMs: number }> {
	const redis = getRedis();
	if (!redis) {
		return checkInMemoryRateLimit(key, maxRequests, windowMs);
	}

	try {
		const now = Date.now();
		const windowStart = now - windowMs;
		const redisKey = `ratelimit:${key}`;

		const pipeline = redis.pipeline();
		// Remove entries outside the window
		pipeline.zremrangebyscore(redisKey, 0, windowStart);
		// Count remaining entries
		pipeline.zcard(redisKey);
		// Add current request
		pipeline.zadd(redisKey, {
			score: now,
			member: `${now}:${Math.random().toString(36).slice(2, 8)}`,
		});
		// Set expiry on the key
		pipeline.expire(redisKey, Math.ceil(windowMs / 1000));

		const results = await pipeline.exec();
		// results[1] is the zcard count (before adding current request)
		const count = (results?.[1] as number) ?? 0;

		if (count >= maxRequests) {
			// Remove the request we just added since it's over limit
			await redis.zrem(
				redisKey,
				`${now}:${Math.random().toString(36).slice(2, 8)}`,
			);
			const oldest = await redis.zrange(redisKey, 0, 0, { withScores: true });
			const oldestScore =
				Array.isArray(oldest) && oldest.length >= 2 ? Number(oldest[1]) : now;
			const resetInMs = Math.max(0, windowMs - (now - oldestScore));
			return { allowed: false, remaining: 0, resetInMs };
		}

		return {
			allowed: true,
			remaining: maxRequests - count - 1,
			resetInMs: windowMs,
		};
	} catch {
		// Redis failure — fall back to in-memory
		return checkInMemoryRateLimit(key, maxRequests, windowMs);
	}
}

/**
 * In-memory sliding window rate limiter (fallback when Redis is unavailable).
 */
function checkInMemoryRateLimit(
	key: string,
	maxRequests: number,
	windowMs: number,
): { allowed: boolean; remaining: number; resetInMs: number } {
	ensureCleanup();

	const now = Date.now();
	let entry = store.get(key);

	if (!entry) {
		entry = { timestamps: [] };
		store.set(key, entry);
	}

	// Remove expired timestamps
	entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

	const current = entry.timestamps.length;

	if (current >= maxRequests) {
		const oldestTimestamp = entry.timestamps[0]!;
		const resetInMs = windowMs - (now - oldestTimestamp);
		return { allowed: false, remaining: 0, resetInMs: Math.max(0, resetInMs) };
	}

	// Record this request
	entry.timestamps.push(now);

	return {
		allowed: true,
		remaining: maxRequests - current - 1,
		resetInMs: windowMs - (now - (entry.timestamps[0] ?? now)),
	};
}

/**
 * Check if a request is allowed under the rate limit.
 * Uses Redis sliding window for distributed consistency,
 * falls back to in-memory when Redis is unavailable.
 *
 * @param key — unique identifier (e.g., orgId)
 * @param maxRequests — max allowed in the window
 * @param windowMs — window size in milliseconds (default 60s)
 * @returns { allowed: boolean; remaining: number; resetInMs: number }
 */
export async function checkRateLimit(
	key: string,
	maxRequests: number,
	windowMs = 60_000,
): Promise<{ allowed: boolean; remaining: number; resetInMs: number }> {
	return checkRedisRateLimit(key, maxRequests, windowMs);
}

/**
 * Synchronous rate limit check (in-memory only).
 * Use this when an async check is not possible.
 */
export function checkRateLimitSync(
	key: string,
	maxRequests: number,
	windowMs = 60_000,
): { allowed: boolean; remaining: number; resetInMs: number } {
	return checkInMemoryRateLimit(key, maxRequests, windowMs);
}

/**
 * Rate limit configuration per product type.
 */
export const RATE_LIMITS = {
	/** Max messages per org per 60-second window */
	messagesPerMinute: 20,
	/** Max link requests per org per 60-second window */
	linksPerMinute: 10,
} as const;
