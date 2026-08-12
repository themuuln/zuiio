import { describe, expect, it } from "vitest";
import { sha1Hex } from "@/lib/sha1";

describe("sha1Hex", () => {
  it("matches the RFC 3174 empty-string vector", () => {
    expect(sha1Hex("")).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
  });

  it("matches the RFC 3174 'abc' vector", () => {
    expect(sha1Hex("abc")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });

  it("derives the org verification token prefix used by domain-verify", () => {
    // bujin-beauty org id — the live token published as zer-verify=216ddbaae4ad
    const orgId = "5a60b8f8-0daf-47df-8a10-c172c60e16bd";
    expect(sha1Hex(orgId).slice(0, 12)).toBe("216ddbaae4ad");
  });

  it("handles unicode input consistently with node:crypto", async () => {
    const { createHash } = await import("node:crypto");
    const input = "Бужин дэлгүүр 🏬";
    expect(sha1Hex(input)).toBe(createHash("sha1").update(input).digest("hex"));
  });
});
