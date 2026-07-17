/**
 * API key rotation via Upstash Redis.
 *
 * Store keys in Redis: SET opencode:keys "key1,key2,key3"
 * Update in Upstash dashboard — no redeploy needed.
 *
 * Falls back to OPENCODE_API_KEY env var when Redis is unavailable.
 */
import "server-only";

import { getRedis } from "@/lib/redis";
import { debug } from "@/lib/debug";

const REDIS_KEY = "opencode:keys";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // refresh from Redis every 5 min

let cachedKeys: string[] = [];
let currentIndex = 0;
let lastRefresh = 0;

/** Parse comma-separated keys string into array. */
function parseKeys(raw: string): string[] {
	return raw
		.split(",")
		.map((k) => k.trim())
		.filter(Boolean);
}

/**
 * Refresh keys from Redis. Falls back to env var.
 * Called on init and periodically.
 */
async function refreshKeys(): Promise<void> {
	// Primary: env var
	const envKeys = process.env.OPENCODE_API_KEY;
	if (envKeys) {
		cachedKeys = parseKeys(envKeys);
		lastRefresh = Date.now();
		debug("key-rotation", `Loaded ${cachedKeys.length} keys from env`);
		return;
	}

	// Fallback: Redis
	const redis = getRedis();
	if (redis) {
		try {
			const raw = await redis.get<string>(REDIS_KEY);
			if (raw && typeof raw === "string" && raw.trim()) {
				const keys = parseKeys(raw);
				if (keys.length > 0) {
					cachedKeys = keys;
					lastRefresh = Date.now();
					debug("key-rotation", `Loaded ${keys.length} keys from Redis`);
					return;
				}
			}
		} catch {
			// Redis unavailable
		}
	}
}

/**
 * Get the current API key.
 * Refreshes from Redis periodically (every 5 min).
 */
export async function getCurrentKey(): Promise<string> {
	// Refresh periodically
	if (Date.now() - lastRefresh > REFRESH_INTERVAL_MS || cachedKeys.length === 0) {
		await refreshKeys();
	}
	const key = cachedKeys[currentIndex] ?? cachedKeys[0] ?? "";
	debug("key-rotation", "getCurrentKey", { hasKey: !!key, keyLength: key.length });
	return key;
}

/**
 * Mark current key as failed (rate limited).
 * Rotates to next key on next call.
 */
export function markKeyFailed(): void {
	if (cachedKeys.length > 1) {
		const prev = currentIndex;
		currentIndex = (currentIndex + 1) % cachedKeys.length;
		debug("key-rotation", `Rotated key ${prev} → ${currentIndex}`);
	}
}

/**
 * Get all keys (for debugging/status).
 */
export async function getKeyStatus(): Promise<{
	total: number;
	current: number;
	source: string;
}> {
	if (cachedKeys.length === 0) await refreshKeys();
	return {
		total: cachedKeys.length,
		current: currentIndex,
		source: getRedis() ? "redis" : "env",
	};
}
