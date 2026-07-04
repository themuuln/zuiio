// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { HANDLE_COLORS, getHandleStyle } from "./HandleColors";

describe("HandleColors", () => {
  it("exports all four handle color variants", () => {
    expect(HANDLE_COLORS.standard).toEqual({ background: "#3b82f6", border: "#3b82f6" });
    expect(HANDLE_COLORS.success).toEqual({ background: "#22c55e", border: "#22c55e" });
    expect(HANDLE_COLORS.failure).toEqual({ background: "#ef4444", border: "#ef4444" });
    expect(HANDLE_COLORS.button).toEqual({ background: "#a855f7", border: "#a855f7" });
  });

  it("getHandleStyle returns style object with correct color and size", () => {
    const style = getHandleStyle("standard");
    expect(style.background).toBe("#3b82f6");
    expect(style.border).toBe("2px solid #3b82f6");
    expect(style.width).toBe(12);
    expect(style.height).toBe(12);
    expect(style.color).toBe("#3b82f6");
  });

  it("getHandleStyle returns correct style for success handles", () => {
    const style = getHandleStyle("success");
    expect(style.background).toBe("#22c55e");
    expect(style.border).toBe("2px solid #22c55e");
    expect(style.color).toBe("#22c55e");
  });

  it("getHandleStyle returns correct style for failure handles", () => {
    const style = getHandleStyle("failure");
    expect(style.background).toBe("#ef4444");
    expect(style.border).toBe("2px solid #ef4444");
    expect(style.color).toBe("#ef4444");
  });

  it("getHandleStyle returns correct style for button handles", () => {
    const style = getHandleStyle("button");
    expect(style.background).toBe("#a855f7");
    expect(style.border).toBe("2px solid #a855f7");
    expect(style.color).toBe("#a855f7");
  });
});
