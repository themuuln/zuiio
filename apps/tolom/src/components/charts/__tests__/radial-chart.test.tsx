import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RadialChart } from "@/components/charts/radial-chart";
import type { ChartConfig } from "@/components/ui/chart";

vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({ ...props }: Record<string, unknown>) => (
      <div data-testid="radial-chart" data-props={JSON.stringify(props)} />
    ),
}));

const mockData = [
  { name: "completed", value: 60 },
  { name: "pending", value: 40 },
];

const mockConfig: ChartConfig = {
  completed: { label: "Completed", color: "#3b82f6" },
  pending: { label: "Pending", color: "#10b981" },
};

describe("RadialChart", () => {
  it("renders the dynamic chart component", () => {
    render(<RadialChart data={mockData} config={mockConfig} />);
    expect(screen.getByTestId("radial-chart")).toBeInTheDocument();
  });

  it("passes data and config as props", () => {
    render(<RadialChart data={mockData} config={mockConfig} />);
    const props = JSON.parse(
      screen.getByTestId("radial-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.data).toEqual(mockData);
    expect(props.config).toEqual(mockConfig);
  });

  it("passes dataKey, height and radius props", () => {
    render(
      <RadialChart
        data={mockData}
        config={mockConfig}
        dataKey="score"
        height={250}
        innerRadius="40%"
        outerRadius="90%"
        barSize={12}
      />,
    );
    const props = JSON.parse(
      screen.getByTestId("radial-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.dataKey).toBe("score");
    expect(props.height).toBe(250);
    expect(props.innerRadius).toBe("40%");
    expect(props.outerRadius).toBe("90%");
    expect(props.barSize).toBe(12);
  });

  it("passes entry-level fill colors through data", () => {
    const withFills = [{ name: "completed", value: 60, fill: "#22c55e" }];
    render(<RadialChart data={withFills} config={mockConfig} />);
    const props = JSON.parse(
      screen.getByTestId("radial-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.data).toEqual(withFills);
  });
});
