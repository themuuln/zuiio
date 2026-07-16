import "server-only";

/**
 * Simple in-memory sliding-window rate limiter.
 * Tracks requests per organization in a sliding window.
 * Production should use Redis for multi-process consistency.
 */

interface WindowEntry {
	timestamps: number[];
}

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
 * Check if a request is allowed under the rate limit.
 * Uses a sliding window approach.
 *
 * @param key — unique identifier (e.g., orgId)
 * @param maxRequests — max allowed in the window
 * @param windowMs — window size in milliseconds (default 60s)
 * @returns { allowed: boolean; remaining: number; resetInMs: number }
 */
export function checkRateLimit(
	key: string,
	maxRequests: number,
	windowMs = 60_000,
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
 * Rate limit configuration per product type.
 */
export const RATE_LIMITS = {
	/** Max messages per org per 60-second window */
	messagesPerMinute: 20,
	/** Max link requests per org per 60-second window */
	linksPerMinute: 10,
} as const;
