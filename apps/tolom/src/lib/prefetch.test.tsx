import { describe, expect, it } from "vitest";
import { onLinkHover } from "./prefetch";

describe("onLinkHover", () => {
  it("returns a function", () => {
    const handler = onLinkHover("/dashboard");
    expect(typeof handler).toBe("function");
  });

  it("returned function does not throw when called", () => {
    const handler = onLinkHover("/dashboard");
    expect(() => handler()).not.toThrow();
  });
});
