import { beforeEach, describe, expect, it, vi } from "vitest";

describe("logger production mode", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    vi.restoreAllMocks();
  });

  it("logs info as JSON via console.log", async () => {
    vi.resetModules();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { logger } = await import("../logger");
    logger.info({ userId: "u1" }, "test message");
    // biome-ignore lint/suspicious/noConsole: testing structured logger output via console
    expect(JSON.parse(vi.mocked(console.log).mock.calls[0][0]).level).toBe(
      "info",
    );
  });

  it("redacts sensitive fields", async () => {
    vi.resetModules();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { logger } = await import("../logger");
    logger.info({ password: "s3cret", token: "abc" }, "login");
    // biome-ignore lint/suspicious/noConsole: testing structured logger output via console
    const msg = JSON.parse(vi.mocked(console.log).mock.calls[0][0]);
    expect(msg.password).toBe("[REDACTED]");
    expect(msg.token).toBe("[REDACTED]");
  });

  it("logs warn via console.warn", async () => {
    vi.resetModules();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { logger } = await import("../logger");
    logger.warn({ code: 429 }, "rate limited");
    expect(JSON.parse(vi.mocked(console.warn).mock.calls[0][0]).level).toBe(
      "warn",
    );
  });

  it("logs error via console.error", async () => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { logger } = await import("../logger");
    logger.error({}, "failed");
    expect(JSON.parse(vi.mocked(console.error).mock.calls[0][0]).level).toBe(
      "error",
    );
  });

  it("logs string-only message", async () => {
    vi.resetModules();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { logger } = await import("../logger");
    logger.info("hello");
    // biome-ignore lint/suspicious/noConsole: testing structured logger output via console
    expect(JSON.parse(vi.mocked(console.log).mock.calls[0][0]).msg).toBe(
      "hello",
    );
  });

  it("child logger merges base context", async () => {
    vi.resetModules();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { logger } = await import("../logger");
    const child = logger.child({ orgId: "org-1" });
    child.info({}, "test");
    // biome-ignore lint/suspicious/noConsole: testing structured logger output via console
    const msg = JSON.parse(vi.mocked(console.log).mock.calls[0][0]);
    expect(msg.orgId).toBe("org-1");
  });
});
