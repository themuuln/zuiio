import { afterEach, describe, expect, it } from "vitest";

describe("isInternalDemo", () => {
  const OOOO = process.env.ONOO_INTERNAL_DEMO;

  afterEach(() => {
    process.env.ONOO_INTERNAL_DEMO = OOOO;
  });

  it("returns false when env var is unset", async () => {
    delete process.env.ONOO_INTERNAL_DEMO;
    const { isInternalDemo } = await import("@/lib/feature-flags");
    expect(isInternalDemo()).toBe(false);
  });

  it.each(["1", "true", "yes"])("returns true for '%s'", async (val) => {
    process.env.ONOO_INTERNAL_DEMO = val;
    const { isInternalDemo } = await import("@/lib/feature-flags");
    expect(isInternalDemo()).toBe(true);
  });

  it.each(["0", "false", "no", "anything"])(
    "returns false for '%s'",
    async (val) => {
      process.env.ONOO_INTERNAL_DEMO = val;
      const { isInternalDemo } = await import("@/lib/feature-flags");
      expect(isInternalDemo()).toBe(false);
    },
  );
});
