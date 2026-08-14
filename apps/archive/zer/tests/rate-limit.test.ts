import assert from "node:assert/strict";
import test from "node:test";
import { clearAllRateLimits, rateLimit, resetRateLimit } from "@zuiio/core";

// Reset state before each test to avoid cross-test leakage
test.beforeEach(() => {
  clearAllRateLimits();
});

test("allows requests within the limit", () => {
  const result = rateLimit("test:ok", 3, 60_000);
  assert.equal(result.error, undefined, "first request should pass");
});

test("blocks the (N+1)th request when limit is reached", () => {
  // Exhaust the limit
  rateLimit("test:block", 2, 60_000);
  rateLimit("test:block", 2, 60_000);

  const result = rateLimit("test:block", 2, 60_000);
  assert.ok(result.error, "third request should be blocked");
  assert.match(
    result.error!,
    /Хэт олон хүсэлт/,
    "error should be in Mongolian",
  );
});

test("window reset allows new requests after expiry", async () => {
  const windowMs = 50;
  rateLimit("test:window", 1, windowMs);
  const blocked = rateLimit("test:window", 1, windowMs);
  assert.ok(blocked.error, "should be blocked immediately");

  // Wait for window to expire
  await new Promise((r) => setTimeout(r, windowMs + 10));

  const after = rateLimit("test:window", 1, windowMs);
  assert.equal(after.error, undefined, "should pass after window expires");
});

test("different keys are independent", () => {
  rateLimit("key:a", 1, 60_000);
  const blocked = rateLimit("key:a", 1, 60_000);
  assert.ok(blocked.error, "key:a should be blocked");

  const allowed = rateLimit("key:b", 1, 60_000);
  assert.equal(allowed.error, undefined, "key:b should still be allowed");
});

test("resetRateLimit clears only the specified key", () => {
  rateLimit("rl:only", 1, 60_000);
  rateLimit("rl:other", 1, 60_000);

  resetRateLimit("rl:only");

  const afterOnly = rateLimit("rl:only", 1, 60_000);
  assert.equal(afterOnly.error, undefined, "reset key should be cleared");

  const afterOther = rateLimit("rl:other", 1, 60_000);
  assert.ok(afterOther.error, "non-reset key should remain blocked");
});

test("clearAllRateLimits resets all keys", () => {
  rateLimit("c:a", 1, 60_000);
  rateLimit("c:b", 1, 60_000);

  clearAllRateLimits();

  assert.equal(rateLimit("c:a", 1, 60_000).error, undefined);
  assert.equal(rateLimit("c:b", 1, 60_000).error, undefined);
});

test("default window is 60 seconds", () => {
  // Use default window (60s) — 2 requests with limit 2 should succeed
  const r1 = rateLimit("test:default", 2);
  const r2 = rateLimit("test:default", 2);
  assert.equal(r1.error, undefined);
  assert.equal(r2.error, undefined);

  const r3 = rateLimit("test:default", 2);
  assert.ok(r3.error, "third request should block with default 60s window");
});
