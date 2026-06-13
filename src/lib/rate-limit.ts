/**
 * Rate limiter with Upstash Redis backend for production,
 * falling back to in-memory storage when Upstash env vars are not set (local dev).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Rate Limiter Types ──────────────────────────────────────────

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
  check: (ip: string) => RateLimiterResult | Promise<RateLimiterResult>;
}

// ── In-memory fallback (same interface as Upstash) ───────────────

interface MemEntry {
  count: number;
  resetAt: number;
}

const memStore = new Map<string, MemEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memStore) {
    if (now > entry.resetAt) memStore.delete(key);
  }
}, 300_000);

function createMemLimiter(maxRequests: number, windowMs: number): RateLimiter {
  return {
    check(ip: string): RateLimiterResult {
      const now = Date.now();
      const entry = memStore.get(ip);

      if (!entry || now > entry.resetAt) {
        memStore.set(ip, { count: 1, resetAt: now + windowMs });
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetAt: now + windowMs,
        };
      }

      entry.count++;

      if (entry.count > maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetAt: entry.resetAt,
      };
    },
  };
}

// ── Upstash Redis limiter factory ───────────────────────────────

function createUpstashLimiter(
  maxRequests: number,
  windowMs: number,
): RateLimiter {
  const redis = Redis.fromEnv();
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
    analytics: true,
    prefix: "tolom",
  });

  return {
    async check(ip: string): Promise<RateLimiterResult> {
      try {
        const { success, limit, remaining, reset } = await limiter.limit(ip);
        return {
          allowed: success,
          remaining,
          resetAt: Date.now() + reset,
        };
      } catch {
        // Redis unavailable — fail open (allow the request through)
        return {
          allowed: true,
          remaining: 1,
          resetAt: Date.now() + windowMs,
        };
      }
    },
  };
}

// ── Factory that picks backend based on env ─────────────────────

function createRateLimiter(config?: RateLimiterConfig): RateLimiter {
  const maxRequests = config?.maxRequests ?? 5;
  const windowMs = config?.windowMs ?? 60_000;

  const hasUpstash =
    typeof process !== "undefined" &&
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL);

  if (hasUpstash) {
    return createUpstashLimiter(maxRequests, windowMs);
  }

  return createMemLimiter(maxRequests, windowMs);
}

// ── Named Limiters ────────────────────────────────────────────

/** 5 req / 60s — auth endpoints */
export const authRateLimiter = createRateLimiter();

/** 30 req / 60s — general API */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 30,
});

/** 60 req / 60s — mutation-heavy endpoints (parts, services, etc.) */
export const mutationRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
});
