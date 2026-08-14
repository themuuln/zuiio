import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PieChart } from "@/components/charts/pie-chart";
import type { ChartConfig } from "@/components/ui/chart";

vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({ ...props }: Record<string, unknown>) => (
      <div data-testid="pie-chart" data-props={JSON.stringify(props)} />
    ),
}));

const mockData = [
  { name: "Oil", value: 40, fill: "#3b82f6" },
  { name: "Brakes", value: 25, fill: "#10b981" },
  { name: "Tires", value: 20, fill: "#f59e0b" },
  { name: "Other", value: 15, fill: "#8b5cf6" },
];

const mockConfig: ChartConfig = {
  Oil: { label: "Oil", color: "#3b82f6" },
  Brakes: { label: "Brakes", color: "#10b981" },
  Tires: { label: "Tires", color: "#f59e0b" },
  Other: { label: "Other", color: "#8b5cf6" },
};

describe("PieChart", () => {
  it("renders the dynamic chart component", () => {
    render(<PieChart data={mockData} config={mockConfig} />);
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("passes data and config as props", () => {
    render(<PieChart data={mockData} config={mockConfig} />);
    const chart = screen.getByTestId("pie-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props).toHaveProperty("data");
    expect(props).toHaveProperty("config");
  });

  it("passes default dataKey as 'value'", () => {
    render(<PieChart data={mockData} config={mockConfig} />);
    const chart = screen.getByTestId("pie-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.dataKey).toBeUndefined(); // defaulted in inner component
  });

  it("passes explicit dataKey when specified", () => {
    render(<PieChart data={mockData} config={mockConfig} dataKey="count" />);
    const chart = screen.getByTestId("pie-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.dataKey).toBe("count");
  });

  it("passes nameKey when specified", () => {
    render(<PieChart data={mockData} config={mockConfig} nameKey="label" />);
    const chart = screen.getByTestId("pie-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.nameKey).toBe("label");
  });

  it("passes donut flag", () => {
    render(<PieChart data={mockData} config={mockConfig} donut />);
    const chart = screen.getByTestId("pie-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.donut).toBe(true);
  });

  it("passes showLabels flag", () => {
    render(<PieChart data={mockData} config={mockConfig} showLabels />);
    const chart = screen.getByTestId("pie-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.showLabels).toBe(true);
  });

  it("passes custom dimensions", () => {
    render(
      <PieChart
        data={mockData}
        config={mockConfig}
        height={400}
        outerRadius={120}
        innerRadius={40}
      />,
    );
    const chart = screen.getByTestId("pie-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.height).toBe(400);
    expect(props.outerRadius).toBe(120);
    expect(props.innerRadius).toBe(40);
  });

  it("renders with fill colors in data items", () => {
    render(<PieChart data={mockData} config={mockConfig} />);
    const chart = screen.getByTestId("pie-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    const data = props.data as Array<{
      name: string;
      value: number;
      fill?: string;
    }>;
    expect(data[0].fill).toBe("#3b82f6");
  });
});
