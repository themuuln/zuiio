import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RadarChart } from "@/components/charts/radar-chart";
import type { ChartConfig } from "@/components/ui/chart";

vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({ ...props }: Record<string, unknown>) => (
      <div data-testid="radar-chart" data-props={JSON.stringify(props)} />
    ),
}));

const mockData = [
  { skill: "Brakes", score: 80 },
  { skill: "Engine", score: 90 },
];

const mockConfig: ChartConfig = {
  score: { label: "Score", color: "#3b82f6" },
};

describe("RadarChart", () => {
  it("renders the dynamic chart component", () => {
    render(
      <RadarChart
        data={mockData}
        config={mockConfig}
        xKey="skill"
        series={[{ key: "score" }]}
      />,
    );
    expect(screen.getByTestId("radar-chart")).toBeInTheDocument();
  });

  it("passes data, config and xKey as props", () => {
    render(
      <RadarChart
        data={mockData}
        config={mockConfig}
        xKey="skill"
        series={[{ key: "score" }]}
      />,
    );
    const props = JSON.parse(
      screen.getByTestId("radar-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.data).toEqual(mockData);
    expect(props.config).toEqual(mockConfig);
    expect(props.xKey).toBe("skill");
  });

  it("passes series with colors", () => {
    render(
      <RadarChart
        data={mockData}
        config={mockConfig}
        xKey="skill"
        series={[{ key: "score", color: "#10b981" }]}
      />,
    );
    const props = JSON.parse(
      screen.getByTestId("radar-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.series).toEqual([{ key: "score", color: "#10b981" }]);
  });

  it("passes height and showGrid flags", () => {
    render(
      <RadarChart
        data={mockData}
        config={mockConfig}
        xKey="skill"
        series={[{ key: "score" }]}
        height={280}
        showGrid={false}
      />,
    );
    const props = JSON.parse(
      screen.getByTestId("radar-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.height).toBe(280);
    expect(props.showGrid).toBe(false);
  });
});
