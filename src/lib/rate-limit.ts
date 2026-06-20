/**
 * Simple in-memory sliding window rate limiter for server actions.
 *
 * Resets on process restart (not persisted). Suitable for per-instance
 * rate limiting in server actions to prevent accidental abuse.
 *
 * Usage:
 * ```ts
 * import { rateLimit } from "@/lib/rate-limit";
 *
 * export async function createSale(...) {
 *   const { error } = rateLimit(`sale:${userId}`, 30, 60_000);
 *   if (error) return { error };
 *   // ...
 * }
 * ```
 */

const stores = new Map<string, number[]>();

/**
 * Check if an action is rate-limited.
 *
 * @param key - Unique identifier (e.g. `action:userId` or `action:ip`)
 * @param limit - Max number of requests allowed within the window
 * @param windowMs - Window duration in milliseconds (default: 60s)
 * @returns `{ error }` if rate-limited, or `{}` if allowed
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): { error?: string } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let timestamps = stores.get(key);
  if (!timestamps) {
    timestamps = [];
    stores.set(key, timestamps);
  }

  // Prune expired entries
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    const retryAfterMs =
      recent.length > 0
        ? Math.ceil((recent[0] + windowMs - now) / 1000)
        : Math.ceil(windowMs / 1000);
    return {
      error: `Хэт олон хүсэлт. ${limit} хүсэлт / ${windowMs / 1000}сек. ${retryAfterMs}сек дараа дахин оролдоно уу.`,
    };
  }

  recent.push(now);
  stores.set(key, recent);

  return {};
}

/**
 * Reset the rate limit store for a specific key (useful in tests).
 */
export function resetRateLimit(key: string): void {
  stores.delete(key);
}

/**
 * Clear all rate limit stores (useful in tests).
 */
export function clearAllRateLimits(): void {
  stores.clear();
}
