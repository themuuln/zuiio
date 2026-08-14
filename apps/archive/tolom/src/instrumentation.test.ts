import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentryMock = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  captureRequestError: vi.fn(),
}));

const loggerMock = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  withScope: (
    fn: (scope: { setTag: () => void; setExtra: () => void }) => void,
  ) => fn({ setTag: vi.fn(), setExtra: vi.fn() }),
  captureException: sentryMock.captureException,
  captureMessage: sentryMock.captureMessage,
  captureRequestError: sentryMock.captureRequestError,
}));

vi.mock("../sentry.server.config", () => ({}));
vi.mock("../sentry.edge.config", () => ({}));
vi.mock("./lib/logger", () => ({ logger: loggerMock }));

import { onRequestError, register } from "./instrumentation";

// biome-ignore lint/suspicious/noConsole: capturing the real console to restore after register()
const originalLog = console.log;
const originalError = console.error;

describe("instrumentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // register() replaces console methods — restore the real ones.
    console.log = originalLog;
    console.error = originalError;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("onRequestError delegates to Sentry.captureRequestError", () => {
    expect(onRequestError).toBe(sentryMock.captureRequestError);
  });

  describe("nodejs runtime", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_RUNTIME", "nodejs");
    });

    it("patches console to swallow EPIPE errors", async () => {
      const logSpy = vi.spyOn(console, "log");
      const errorSpy = vi.spyOn(console, "error");

      await register();

      const epipe = new Error("write EPIPE");
      // biome-ignore lint/suspicious/noConsole: exercising the EPIPE console patch
      console.log(epipe);
      console.error(epipe);
      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();

      // biome-ignore lint/suspicious/noConsole: exercising the console patch passthrough
      console.log("hello");
      console.error(new Error("real problem"));
      expect(logSpy).toHaveBeenCalledWith("hello");
      expect(errorSpy).toHaveBeenCalledWith(new Error("real problem"));
    });

    it("installs process handlers and captures unhandled rejections", async () => {
      await register();

      const reason = new Error("db failure");
      process.emit("unhandledRejection", reason);

      expect(loggerMock.error).toHaveBeenCalledWith(
        { err: reason },
        "Process unhandledRejection",
      );
      expect(sentryMock.captureException).toHaveBeenCalledWith(reason);
    });

    it("captures a message for non-Error rejection reasons", async () => {
      await register();

      process.emit("unhandledRejection", "string reason");

      expect(sentryMock.captureMessage).toHaveBeenCalledWith(
        "Process unhandledRejection: string reason",
        "fatal",
      );
    });

    it("suppresses expected ECONNRESET/EPIPE uncaught exceptions", async () => {
      await register();

      process.emit(
        "uncaughtException",
        Object.assign(new Error("client gone"), { code: "ECONNRESET" }),
      );
      process.emit("uncaughtException", new Error("aborted"));

      expect(sentryMock.captureException).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });

    it("captures real uncaught exceptions and exits after flush", async () => {
      // No-op exit: a real exit would kill the test process, and a throwing
      // mock would re-enter the uncaughtException handler via setImmediate.
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});
      vi.useFakeTimers();

      await register();

      const boom = new Error("boom");
      process.emit("uncaughtException", boom);

      expect(sentryMock.captureException).toHaveBeenCalledWith(boom);
      vi.runAllTimers();
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("edge runtime", () => {
    it("loads the edge Sentry config and skips process patching", async () => {
      vi.stubEnv("NEXT_RUNTIME", "edge");
      const logSpy = vi.spyOn(console, "log");

      await register();

      expect(logSpy).not.toHaveBeenCalled();
    });
  });
});
