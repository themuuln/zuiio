const stores = new Map<string, number[]>();

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

export function resetRateLimit(key: string): void {
  stores.delete(key);
}

export function clearAllRateLimits(): void {
  stores.clear();
}
