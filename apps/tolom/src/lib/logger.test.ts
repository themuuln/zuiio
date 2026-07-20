import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger, logger } from "./logger";

describe("logger", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
  });

  it("exports a logger with all methods", () => {
    expect(logger).toHaveProperty("info");
    expect(logger).toHaveProperty("error");
    expect(logger).toHaveProperty("warn");
    expect(logger).toHaveProperty("debug");
    expect(logger).toHaveProperty("child");
  });

  it("each method is a function", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.child).toBe("function");
  });

  it("info call does not throw", () => {
    expect(() => logger.info("test message")).not.toThrow();
  });

  it("info with context does not throw", () => {
    expect(() =>
      logger.info({ userId: "123" }, "user action"),
    ).not.toThrow();
  });

  it("error call does not throw", () => {
    expect(() => logger.error("error occurred")).not.toThrow();
  });

  it("error with context does not throw", () => {
    expect(() =>
      logger.error({ err: new Error("fail"), route: "/api/test" }, "route error"),
    ).not.toThrow();
  });

  it("warn call does not throw", () => {
    expect(() => logger.warn("warning message")).not.toThrow();
  });

  it("debug call does not throw", () => {
    expect(() => logger.debug("debug message")).not.toThrow();
  });

  it("creates a child logger with merged context", () => {
    const child = createLogger({ app: "tolom", version: "1.0" });
    expect(typeof child.info).toBe("function");
    expect(typeof child.error).toBe("function");
    expect(() => child.info("from child")).not.toThrow();
  });

  it("child logger can have its own children", () => {
    const parent = createLogger({ app: "tolom" });
    const child = parent.child({ module: "api" });
    expect(typeof child.info).toBe("function");
    expect(() => child.info("nested child")).not.toThrow();
  });
});
