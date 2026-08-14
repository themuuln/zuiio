import { describe, expect, it } from "vitest";
import {
  capture,
  captureDbError,
  captureRedirectLoop,
  setCaptureHandler,
  withDbCapture,
} from "./capture";

// Re-export barrel test — verify imported symbols are real functions
describe("@zuiio/capture barrel", () => {
  it("re-exports setCaptureHandler", () => {
    expect(setCaptureHandler).toBeDefined();
    expect(typeof setCaptureHandler).toBe("function");
  });

  it("re-exports capture", () => {
    expect(capture).toBeDefined();
    expect(typeof capture).toBe("function");
  });

  it("re-exports captureDbError", () => {
    expect(captureDbError).toBeDefined();
    expect(typeof captureDbError).toBe("function");
  });

  it("re-exports captureRedirectLoop", () => {
    expect(captureRedirectLoop).toBeDefined();
    expect(typeof captureRedirectLoop).toBe("function");
  });

  it("re-exports withDbCapture", () => {
    expect(withDbCapture).toBeDefined();
    expect(typeof withDbCapture).toBe("function");
  });
});
