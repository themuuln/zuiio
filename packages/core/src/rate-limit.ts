/**
 * In-memory rate limiter with optional Upstash integration.
 *
 * Usage:
 *   import { createRateLimiter } from "@zuiio/core";
 *   const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });
 *   const { allowed, remaining } = await limiter.check(ip);
 */

export interface RateLimiterConfig {
  windowMs?: number;
  maxRequests?: number;
}

export interface RateLimiterResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimiter {
  check: (key: string) => RateLimiterResult | Promise<RateLimiterResult>;
}

// ── In-memory store ──────────────────────────────────────────

interface MemEntry {
  count: number;
  resetAt: number;
}

const memStore = new Map<string, MemEntry>();

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memStore) {
      if (now > entry.resetAt) memStore.delete(key);
    }
  }, 300_000);
}

function createMemLimiter(maxRequests: number, windowMs: number): RateLimiter {
  return {
    check(key: string): RateLimiterResult {
      const now = Date.now();
      const entry = memStore.get(key);

      if (!entry || now > entry.resetAt) {
        memStore.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
      }

      entry.count++;

      if (entry.count > maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
    },
  };
}

// ── Upstash limiter (lazy-loaded) ────────────────────────────

async function createUpstashLimiter(maxRequests: number, windowMs: number): Promise<RateLimiter> {
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  const redis = Redis.fromEnv();
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
    analytics: true,
    prefix: "zuiio",
  });

  return {
    async check(key: string): Promise<RateLimiterResult> {
      try {
        const { success, remaining, reset } = await limiter.limit(key);
        return { allowed: success, remaining, resetAt: Date.now() + reset };
      } catch {
        return { allowed: true, remaining: 1, resetAt: Date.now() + windowMs };
      }
    },
  };
}

// ── Factory ──────────────────────────────────────────────────

function hasUpstashEnv(): boolean {
  return (
    typeof process !== "undefined" &&
    Boolean(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL)
  );
}

export function createRateLimiter(config?: RateLimiterConfig): RateLimiter {
  const maxRequests = config?.maxRequests ?? 5;
  const windowMs = config?.windowMs ?? 60_000;

  if (hasUpstashEnv()) {
    // Return a wrapper that lazy-loads Upstash on first check
    let upstash: RateLimiter | null = null;
    return {
      async check(key: string): Promise<RateLimiterResult> {
        if (!upstash) {
          upstash = await createUpstashLimiter(maxRequests, windowMs);
        }
        return upstash.check(key);
      },
    };
  }

  return createMemLimiter(maxRequests, windowMs);
}

/** Auth endpoints — 5 requests/minute by default. */
export const authRateLimiter = createRateLimiter();

/** General API — 30 requests/minute. */
export const apiRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

/** Mutation endpoints — 60 requests/minute. */
export const mutationRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

// ── Zer-compatible simple API ────────────────────────────────

const simpleStore = new Map<string, number[]>();

/**
 * Simple rate-limit check (Zer-compatible).
 * Returns { error?: string } — empty object = allowed, error message = denied.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): { error?: string } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let timestamps = simpleStore.get(key);
  if (!timestamps) {
    timestamps = [];
    simpleStore.set(key, timestamps);
  }

  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    const retryAfterMs =
      recent.length > 0
        ? Math.ceil((recent[0]! + windowMs - now) / 1000)
        : Math.ceil(windowMs / 1000);
    return {
      error: `Хэт олон хүсэлт. ${limit} хүсэлт / ${windowMs / 1000}сек. ${retryAfterMs}сек дараа дахин оролдоно уу.`,
    };
  }

  recent.push(now);
  simpleStore.set(key, recent);

  return {};
}

/** Reset a specific rate-limit key. */
export function resetRateLimit(key: string): void {
  simpleStore.delete(key);
}

/** Clear all rate limits. */
export function clearAllRateLimits(): void {
  simpleStore.clear();
}
