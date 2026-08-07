import { describe, expect, it, vi } from "vitest";

const sentryCapture = vi.hoisted(() => vi.fn());

vi.mock("@sentry/nextjs", () => ({
  captureException: sentryCapture,
}));

import { captureError } from "@/lib/errors";

describe("captureError", () => {
  it("formats Error instances", () => {
    const error = new Error("test error");
    captureError("test-context", error);
    expect(sentryCapture).toHaveBeenCalledWith(error, {
      tags: { context: "test-context" },
      level: "error",
    });
  });

  it("formats non-Error values as strings", () => {
    captureError("string-context", "some string");
    expect(sentryCapture).toHaveBeenCalledWith("some string", {
      tags: { context: "string-context" },
      level: "error",
    });
  });

  it("formats null/undefined", () => {
    captureError("null-context", null);
    expect(sentryCapture).toHaveBeenCalledWith(null, {
      tags: { context: "null-context" },
      level: "error",
    });
  });
});
