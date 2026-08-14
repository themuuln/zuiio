import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Static import is impossible here: ./client throws at module load when
// RESEND_API_KEY is absent, and its module-level state is set once. These
// tests intentionally exercise the module-loading boundary, so each case
// re-imports the module with vi.resetModules().

describe("email client", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it("throws at import time when RESEND_API_KEY is missing", async () => {
    await expect(import("../client")).rejects.toThrow(
      "Missing RESEND_API_KEY environment variable",
    );
  });

  it("exports a Resend client and the default sender when configured", async () => {
    process.env.RESEND_API_KEY = "re_test-key";
    const { resend, EMAIL_FROM } = await import("../client");

    expect(resend).toBeDefined();
    expect(EMAIL_FROM).toBe("TOLOM <noreply@zuiiotech.com>");
  });

  it("honors the EMAIL_FROM override", async () => {
    process.env.RESEND_API_KEY = "re_test-key";
    process.env.EMAIL_FROM = "TOLOM <hello@zuiiotech.com>";
    const { EMAIL_FROM } = await import("../client");

    expect(EMAIL_FROM).toBe("TOLOM <hello@zuiiotech.com>");
  });
});
