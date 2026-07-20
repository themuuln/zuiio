import { beforeEach, describe, expect, it } from "vitest";
import { hasMultipleBranches, setCookie } from "./utils";

describe("hasMultipleBranches", () => {
  it("returns true when branches length > 1", () => {
    expect(hasMultipleBranches(["a", "b"])).toBe(true);
  });

  it("returns false when branches length is 1", () => {
    expect(hasMultipleBranches(["a"])).toBe(false);
  });

  it("returns false when branches is empty", () => {
    expect(hasMultipleBranches([])).toBe(false);
  });

  it("returns false when branches is null", () => {
    expect(hasMultipleBranches(null)).toBe(false);
  });

  it("returns false when branches is undefined", () => {
    expect(hasMultipleBranches(undefined)).toBe(false);
  });
});

describe("setCookie", () => {
  beforeEach(() => {
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  it("sets a cookie with expiration", () => {
    setCookie("test_key", "test_value", 7);
    expect(document.cookie).toContain("test_key=test_value");
    expect(document.cookie).toContain("path=/");
  });

  it("sets a cookie with 1 day expiration", () => {
    setCookie("key", "val", 1);
    expect(document.cookie).toContain("key=val");
  });
});
