const rateMap = new Map<string, { count: number; resetAt: number }>();
let cleanupCounter = 0;

/**
 * Remove stale entries from the in-memory rate-limit map.
 * Called periodically from checkRateLimit to avoid a module-level
 * setInterval (which leaks in serverless environments).
 */
function cleanupStaleEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateMap.entries()) {
    if (now > entry.resetAt) rateMap.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  // Periodic cleanup every 20 invocations instead of module-level setInterval
  cleanupCounter++;
  if (cleanupCounter % 20 === 0) {
    cleanupStaleEntries();
  }

  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}
