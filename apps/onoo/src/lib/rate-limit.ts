/**
 * Simple in-memory sliding window rate limiter.
 *
 * Each instance tracks its own windows — on Vercel each function instance
 * independently tracks limits. Sufficient for abuse prevention, not for
 * exact global accounting.
 */

export const RATE_LIMIT_HEADERS = {
  limit: "X-RateLimit-Limit",
  remaining: "X-RateLimit-Remaining",
  reset: "X-RateLimit-Reset",
  retryAfter: "Retry-After",
} as const;

interface RateLimitEntry {
  /** Timestamps of requests within the current window, in ms. */
  timestamps: number[];
  /** The window this entry was created for (epoch ms, floored to windowMs). */
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Sweep stale entries every 60 seconds
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

function sweep(): void {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of store) {
    const windowEnd =
      entry.windowStart + entry.timestamps.length > 0
        ? Math.max(...entry.timestamps)
        : entry.windowStart;
    if (now - windowEnd > SWEEP_INTERVAL_MS * 2) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms when the window resets
}

export interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

/**
 * Check whether `key` has exceeded its rate limit.
 *
 * @param key - Unique identifier (typically the client IP).
 * @param opts - Optional overrides.
 * @returns Result with `success` (false = rate-limited), `remaining`, and
 *          `reset` (epoch ms) suitable for response headers.
 */
export function rateLimit(
  key: string,
  opts?: RateLimitOptions,
): RateLimitResult {
  const limit = opts?.limit ?? 100;
  const windowMs = opts?.windowMs ?? 60_000;

  sweep();

  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;

  let entry = store.get(key);

  // Stale or missing entry — start a new window
  if (!entry || entry.windowStart < windowStart) {
    entry = { timestamps: [], windowStart };
    store.set(key, entry);
  }

  // Prune timestamps older than the current window
  entry.timestamps = entry.timestamps.filter((t) => t >= windowStart);

  const count = entry.timestamps.length;

  if (count >= limit) {
    const reset = entry.windowStart + windowMs;
    return { success: false, remaining: 0, reset };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    remaining: limit - count - 1,
    reset: entry.windowStart + windowMs,
  };
}
