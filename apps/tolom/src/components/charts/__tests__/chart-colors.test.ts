import { describe, expect, it } from "vitest";
import { CHART_COLORS, STATUS_COLORS } from "@/components/charts/chart-colors";

describe("CHART_COLORS", () => {
  it("exposes ten themed CSS variable colors", () => {
    expect(CHART_COLORS).toHaveLength(10);
    expect(CHART_COLORS[0]).toBe("var(--chart-1)");
    expect(CHART_COLORS[9]).toBe("var(--chart-10)");
    for (const color of CHART_COLORS) {
      expect(color).toMatch(/^var\(--chart-\d+\)$/);
    }
  });

  it("uses unique chart variables", () => {
    expect(new Set(CHART_COLORS).size).toBe(CHART_COLORS.length);
  });
});

describe("STATUS_COLORS", () => {
  it("maps every work order status to a hex color", () => {
    expect(STATUS_COLORS).toEqual({
      New: "#3b82f6",
      Diagnosing: "#f59e0b",
      "In Progress": "#8b5cf6",
      "Ready for Pickup": "#06b6d4",
      Completed: "#22c55e",
      Cancelled: "#ef4444",
    });
  });
});
