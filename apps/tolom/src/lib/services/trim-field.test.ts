import { describe, expect, it } from "vitest";
import { trimField } from "./trim-field";

describe("trimField", () => {
  it("trims whitespace from a string", () => {
    expect(trimField("  Hello  ")).toBe("Hello");
  });

  it("returns null for empty string after trim", () => {
    expect(trimField("")).toBe(null);
  });

  it("returns null for whitespace-only string", () => {
    expect(trimField("   ")).toBe(null);
  });

  it("returns null for null input", () => {
    expect(trimField(null)).toBe(null);
  });

  it("returns null for undefined input", () => {
    expect(trimField(undefined)).toBe(null);
  });

  it("converts non-string values to string", () => {
    expect(trimField(123)).toBe("123");
  });

  it("trims and returns string with content", () => {
    expect(trimField("abc")).toBe("abc");
  });
});
