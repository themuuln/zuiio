import { describe, expect, it, vi } from "vitest";

const { mockCapture } = vi.hoisted(() => ({ mockCapture: vi.fn() }));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

import { reportError } from "../sentry-report";

describe("reportError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures error with default error-boundary context", () => {
    const error = new Error("Something went wrong");
    reportError(error);

    expect(mockCapture).toHaveBeenCalledWith(error, {
      context: "error-boundary",
    });
  });

  it("captures error with named boundary context", () => {
    const error = new Error("Widget crashed");
    reportError(error, "widget-boundary");

    expect(mockCapture).toHaveBeenCalledWith(error, {
      context: "[error-boundary] widget-boundary",
    });
  });

  it("handles string errors", () => {
    reportError("plain string error");

    expect(mockCapture).toHaveBeenCalledWith("plain string error", {
      context: "error-boundary",
    });
  });

  it("handles null/undefined error", () => {
    reportError(null);
    expect(mockCapture).toHaveBeenCalledWith(null, {
      context: "error-boundary",
    });
  });
});
