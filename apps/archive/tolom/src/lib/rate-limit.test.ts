import { describe, expect, it } from "vitest";
import {
  apiRateLimiter,
  authRateLimiter,
  clearAllRateLimits,
  createRateLimiter,
  mutationRateLimiter,
  rateLimit,
  resetRateLimit,
} from "./rate-limit";

// Re-export barrel test — verify re-exported symbols are real
describe("@zuiio/core rate-limit barrel", () => {
  it("re-exports createRateLimiter", () => {
    expect(createRateLimiter).toBeDefined();
    expect(typeof createRateLimiter).toBe("function");
  });

  it("re-exports rateLimit", () => {
    expect(rateLimit).toBeDefined();
    expect(typeof rateLimit).toBe("function");
  });

  it("re-exports resetRateLimit", () => {
    expect(resetRateLimit).toBeDefined();
    expect(typeof resetRateLimit).toBe("function");
  });

  it("re-exports clearAllRateLimits", () => {
    expect(clearAllRateLimits).toBeDefined();
    expect(typeof clearAllRateLimits).toBe("function");
  });

  it("re-exports apiRateLimiter", () => {
    expect(apiRateLimiter).toBeDefined();
    expect(apiRateLimiter.check).toBeDefined();
  });

  it("re-exports authRateLimiter", () => {
    expect(authRateLimiter).toBeDefined();
    expect(authRateLimiter.check).toBeDefined();
  });

  it("re-exports mutationRateLimiter", () => {
    expect(mutationRateLimiter).toBeDefined();
    expect(mutationRateLimiter.check).toBeDefined();
  });
});
