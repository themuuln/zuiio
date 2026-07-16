/**
 * Redis session cache layer using Upstash Redis.
 * Provides sub-millisecond reads for active sessions.
 * Falls back gracefully when Redis is not configured.
 */
import { Redis } from "@upstash/redis";
import { redisConfig } from "@/lib/env";
import { debug } from "@/lib/debug";

/** Lazy singleton — only connects when env vars are set. */
let _redis: Redis | null = null;

function getRedis(): Redis | null {
	if (_redis) return _redis;
	const config = redisConfig();
	if (!config) return null;
	_redis = new Redis({ url: config.url, token: config.token });
	return _redis;
}

/** Cache key for session data. */
function sessionKey(orgId: string, chatId: string, userId: string): string {
	return `session:${orgId}:${chatId}:${userId}`;
}

/** TTL for cached sessions — matches SESSION_TTL_HOURS in session.ts. */
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Get cached session from Redis.
 * Returns null if not cached or Redis is unavailable.
 */
export async function getCachedSession<T>(orgId: string, chatId: string, userId: string): Promise<T | null> {
	const redis = getRedis();
	if (!redis) return null;
	try {
		const data = await redis.get<T>(sessionKey(orgId, chatId, userId));
		if (data) {
			debug("cache", "Redis HIT", { orgId, chatId: chatId.slice(0, 8) });
		}
		return data;
	} catch (err) {
		debug("cache", "Redis GET failed", { error: err instanceof Error ? err.message : String(err) });
		return null;
	}
}

/**
 * Set session data in Redis cache.
 * Fire-and-forget — never throws.
 */
export async function setCachedSession(
	orgId: string,
	chatId: string,
	userId: string,
	data: unknown,
): Promise<void> {
	const redis = getRedis();
	if (!redis) return;
	try {
		await redis.set(sessionKey(orgId, chatId, userId), data, { ex: CACHE_TTL_SECONDS });
		debug("cache", "Redis SET", { orgId, chatId: chatId.slice(0, 8) });
	} catch (err) {
		debug("cache", "Redis SET failed", { error: err instanceof Error ? err.message : String(err) });
	}
}

/**
 * Invalidate cached session.
 */
export async function invalidateCachedSession(orgId: string, chatId: string, userId: string): Promise<void> {
	const redis = getRedis();
	if (!redis) return;
	try {
		await redis.del(sessionKey(orgId, chatId, userId));
	} catch {
		// Ignore — cache invalidation is best-effort
	}
}
