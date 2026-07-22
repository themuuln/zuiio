import { describe, expect, it, vi } from "vitest";

const { mockCapture } = vi.hoisted(() => ({ mockCapture: vi.fn() }));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { logger } from "@/lib/logger";
import { reportServerError } from "./sentry-report-server";

describe("reportServerError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs and captures error with message", () => {
    const error = new Error("Database connection failed");
    reportServerError("Query failed", error, { route: "/api/test" });

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error, route: "/api/test" }),
      "Query failed",
    );
    expect(mockCapture).toHaveBeenCalledWith(error, {
      context: "[server] Query failed",
      route: "/api/test",
    });
  });

  it("logs and captures message-only", () => {
    reportServerError("Something happened");

    expect(logger.error).toHaveBeenCalledWith({}, "Something happened");
    expect(mockCapture).toHaveBeenCalledWith(new Error("Something happened"), {
      context: "[server] Something happened",
    });
  });

  it("derives context from error when message is generic", () => {
    const error = new Error("Cannot read property of undefined");
    reportServerError("Unexpected error", error);

    expect(mockCapture).toHaveBeenCalledWith(error, {
      context: "[server] Cannot read property of undefined",
    });
  });

  it("handles non-Error objects", () => {
    reportServerError("Oops", "string error", { code: 500 });

    expect(mockCapture).toHaveBeenCalledWith("string error", {
      context: "[server] Oops",
      code: 500,
    });
  });
});
