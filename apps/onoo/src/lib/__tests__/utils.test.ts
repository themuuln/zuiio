import { describe, expect, it } from "vitest";
import { cn, decodeEscapedUnicode } from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b", false && "c", "d")).toBe("a b d");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("decodeEscapedUnicode", () => {
  it("decodes \\uXXXX sequences", () => {
    expect(decodeEscapedUnicode("\\u0421\\u044d\\u043d\\u0441")).toBe("Сэнс");
  });

  it("returns plain text unchanged", () => {
    expect(decodeEscapedUnicode("hello")).toBe("hello");
  });

  it("handles mixed content", () => {
    expect(decodeEscapedUnicode("\\u0048ello")).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(decodeEscapedUnicode("")).toBe("");
  });
});
