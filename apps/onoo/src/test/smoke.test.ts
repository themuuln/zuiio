/**
 * Smoke test to verify vitest infrastructure is working.
 */
import { describe, expect, it } from "vitest";

describe("test infrastructure", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });
});
