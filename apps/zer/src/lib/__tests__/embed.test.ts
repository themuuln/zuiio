import { beforeEach, describe, expect, it, vi } from "vitest";

// embed.ts is server-only; vitest has no RSC condition, so stub the guard
// (same pattern as contact-utils.test.ts).
vi.mock("server-only", () => ({}));
vi.mock("@zuiio/capture", () => ({}));

import {
  DEFAULT_EMBED_EXPIRY_DAYS,
  EMBED_SCOPE_REPORTS,
  embedExpiryFromDays,
  generateEmbedToken,
  hashToken,
  isTokenUsable,
} from "../embed";

describe("hashToken", () => {
  it("is deterministic for the same token", () => {
    const token = "abc123";
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("produces a 64-char hex digest", () => {
    expect(hashToken("abc123")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for different tokens", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("never contains the raw token itself", () => {
    const token = "super-secret-raw-token";
    expect(hashToken(token)).not.toContain(token);
  });
});

describe("generateEmbedToken", () => {
  it("returns a 43-char base64url string (32 bytes)", () => {
    const token = generateEmbedToken();
    expect(token).toHaveLength(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("is unique across calls", () => {
    const seen = new Set(
      Array.from({ length: 100 }, () => generateEmbedToken()),
    );
    expect(seen.size).toBe(100);
  });
});

describe("isTokenUsable", () => {
  const future = new Date(Date.now() + 86_400_000).toISOString(); // +1 day
  const past = new Date(Date.now() - 86_400_000).toISOString(); // -1 day

  const usable = {
    scopes: [EMBED_SCOPE_REPORTS],
    expires_at: future,
    revoked_at: null,
  };

  it("accepts a live, unrevoked reports token", () => {
    expect(isTokenUsable(usable)).toBe(true);
  });

  it("rejects an expired token", () => {
    expect(isTokenUsable({ ...usable, expires_at: past })).toBe(false);
  });

  it("rejects a revoked token even when unexpired", () => {
    expect(
      isTokenUsable({ ...usable, revoked_at: new Date().toISOString() }),
    ).toBe(false);
  });

  it("rejects a token without the reports scope", () => {
    expect(isTokenUsable({ ...usable, scopes: ["invoices"] })).toBe(false);
    expect(isTokenUsable({ ...usable, scopes: [] })).toBe(false);
  });

  it("rejects an unparseable expires_at", () => {
    expect(isTokenUsable({ ...usable, expires_at: "not-a-date" })).toBe(false);
  });
});

describe("embedExpiryFromDays", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T12:00:00.000Z"));
  });

  it("adds the given number of days", () => {
    const expiry = embedExpiryFromDays(7);
    expect(expiry.toISOString()).toBe("2026-08-10T12:00:00.000Z");
  });

  it("default constant is exported for form options", () => {
    expect(DEFAULT_EMBED_EXPIRY_DAYS).toBe(30);
  });
});
