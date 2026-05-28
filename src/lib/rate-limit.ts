/**
 * Simple in-memory rate limiter with configurable params.
 * Production recommendation: Replace with Redis-based limiter (Upstash/Vercel KV).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 300_000);

// ── Rate Limiter Config ────────────────────────────────────────

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
  check: (ip: string) => RateLimiterResult;
}

// ── Factory ───────────────────────────────────────────────────

export function createRateLimiter(config?: RateLimiterConfig): RateLimiter {
  const windowMs = config?.windowMs ?? 60_000;
  const maxRequests = config?.maxRequests ?? 5;

  function check(ip: string): RateLimiterResult {
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
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
  }

  return { check };
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
