import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTableChart } from "@/components/_data-table-chart";

vi.mock("recharts", async () => await import("@/test/mocks/recharts"));

function propsOf(el: Element): Record<string, unknown> {
  return JSON.parse(el.getAttribute("data-props") ?? "{}");
}

describe("DataTableChart", () => {
  it("renders the area chart with all six months of data", () => {
    render(<DataTableChart />);
    const chart = screen.getByTestId("recharts-area-chart");
    const data = propsOf(chart).data as { month: string }[];
    expect(data).toHaveLength(6);
    expect(data[0].month).toBe("January");
    expect(data[5].month).toBe("June");
  });

  it("renders stacked areas for desktop and mobile", () => {
    render(<DataTableChart />);
    const areas = screen.getAllByTestId("recharts-area");
    expect(areas).toHaveLength(2);
    expect(propsOf(areas[0]).dataKey).toBe("mobile");
    expect(propsOf(areas[1]).dataKey).toBe("desktop");
    expect(propsOf(areas[0]).stackId).toBe("a");
    expect(propsOf(areas[1]).stackId).toBe("a");
  });

  it("renders the trending-up summary text", () => {
    render(<DataTableChart />);
    expect(
      screen.getByText("Trending up by 5.2% this month"),
    ).toBeInTheDocument();
  });
});
