import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from "@/components/ui/chart";

vi.mock("recharts", async () => await import("@/test/mocks/recharts"));

const config: ChartConfig = {
  revenue: { label: "Revenue", color: "#3b82f6" },
  count: { label: "Count" },
};

function renderChart(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("ChartContainer", () => {
  it("renders a chart div with data-slot and generated chart id", () => {
    const { $ } = renderChart(
      <ChartContainer config={config}>content</ChartContainer>,
    );
    const chart = $("[data-slot='chart']");
    expect(chart).toBeInTheDocument();
    expect(chart?.getAttribute("data-chart")).toMatch(/^chart-/);
  });

  it("uses the provided id for the chart attribute", () => {
    const { $ } = renderChart(
      <ChartContainer id="my-chart" config={config}>
        content
      </ChartContainer>,
    );
    expect($("[data-slot='chart']")?.getAttribute("data-chart")).toBe(
      "chart-my-chart",
    );
  });

  it("renders children and applies className", () => {
    const { $ } = renderChart(
      <ChartContainer config={config} className="custom-chart">
        <span>child content</span>
      </ChartContainer>,
    );
    const chart = $("[data-slot='chart']");
    expect(chart?.className).toContain("custom-chart");
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("injects CSS variables for color configs (light + dark themes)", () => {
    const themedConfig: ChartConfig = {
      revenue: {
        label: "Revenue",
        theme: { light: "#3b82f6", dark: "#60a5fa" },
      },
    };
    const { $ } = renderChart(
      <ChartContainer id="vars" config={themedConfig}>
        content
      </ChartContainer>,
    );
    const style = $("style");
    expect(style).toBeInTheDocument();
    const css = style?.textContent ?? "";
    expect(css).toContain("[data-chart=chart-vars]");
    expect(css).toContain("--color-revenue: #3b82f6");
    expect(css).toContain(".dark [data-chart=chart-vars]");
    expect(css).toContain("--color-revenue: #60a5fa");
  });

  it("injects only the color (not theme) variant when color is used", () => {
    const { $ } = renderChart(
      <ChartContainer id="plain" config={config}>
        content
      </ChartContainer>,
    );
    const css = $("style")?.textContent ?? "";
    expect(css).toContain("--color-revenue: #3b82f6");
    // config entries without color/theme emit no variables
    expect(css).not.toContain("--color-count");
  });

  it("renders no style tag when no config entry has a color", () => {
    const { $ } = renderChart(
      <ChartContainer id="empty" config={{ count: { label: "Count" } }}>
        content
      </ChartContainer>,
    );
    expect($("style")).not.toBeInTheDocument();
  });
});

describe("ChartTooltipContent", () => {
  const payload = [
    {
      dataKey: "revenue",
      name: "revenue",
      value: 120,
      color: "#3b82f6",
      type: "line",
      payload: { month: "Jan", revenue: 120 },
    },
  ];

  it("renders nothing when inactive", () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active={false} payload={payload} />
      </ChartContainer>,
    );
    expect(screen.queryByText("Revenue")).not.toBeInTheDocument();
  });

  it("renders nothing when payload is empty", () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active payload={[]} />
      </ChartContainer>,
    );
    expect(screen.queryByText("Revenue")).not.toBeInTheDocument();
  });

  it("renders config label and formatted value when active", () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active payload={payload} />
      </ChartContainer>,
    );
    // tooltip label + series label both come from the config
    expect(screen.getAllByText("Revenue").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("uses the string label for the tooltip title", () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active payload={payload} label="Monthly" />
      </ChartContainer>,
    );
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });

  it("hides the label when hideLabel is set", () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active payload={payload} hideLabel />
      </ChartContainer>,
    );
    // only the series label remains, the tooltip label is gone
    expect(screen.getAllByText("Revenue")).toHaveLength(1);
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("hides the indicator when hideIndicator is set", () => {
    const { $ } = renderChart(
      <ChartContainer config={config}>
        <ChartTooltipContent active payload={payload} hideIndicator />
      </ChartContainer>,
    );
    expect($("[data-slot='chart']")?.textContent).toContain("Revenue");
  });

  it("calls formatter with value, name, item, index and payload", () => {
    const formatter = vi.fn(() => <strong>custom output</strong>);
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active
          payload={payload}
          formatter={formatter as never}
        />
      </ChartContainer>,
    );
    expect(screen.getByText("custom output")).toBeInTheDocument();
    expect(formatter).toHaveBeenCalledWith(
      120,
      "revenue",
      payload[0],
      0,
      payload[0].payload,
    );
  });

  it("renders item icon from config instead of indicator", () => {
    const iconConfig: ChartConfig = {
      revenue: { label: "Revenue", icon: () => <span>ICON</span> },
    };
    render(
      <ChartContainer config={iconConfig}>
        <ChartTooltipContent active payload={payload} />
      </ChartContainer>,
    );
    expect(screen.getByText("ICON")).toBeInTheDocument();
  });

  it("applies labelFormatter to the tooltip label", () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active
          payload={payload}
          label="raw"
          labelFormatter={(value) => `Formatted: ${String(value)}`}
        />
      </ChartContainer>,
    );
    expect(screen.getByText("Formatted: raw")).toBeInTheDocument();
  });
});

describe("ChartLegendContent", () => {
  const legendPayload = [
    { dataKey: "revenue", value: "Revenue", type: "line", color: "#3b82f6" },
    { dataKey: "count", value: "Count", type: "line", color: "#10b981" },
  ];

  it("renders labels from the chart config", () => {
    render(
      <ChartContainer config={config}>
        <ChartLegendContent payload={legendPayload} />
      </ChartContainer>,
    );
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Count")).toBeInTheDocument();
  });

  it("renders nothing when payload is empty", () => {
    render(
      <ChartContainer config={config}>
        <ChartLegendContent payload={[]} />
      </ChartContainer>,
    );
    expect(screen.queryByText("Revenue")).not.toBeInTheDocument();
  });

  it("renders legend icons from the config", () => {
    const iconConfig: ChartConfig = {
      revenue: { label: "Revenue", icon: () => <span>REV-ICON</span> },
    };
    render(
      <ChartContainer config={iconConfig}>
        <ChartLegendContent payload={legendPayload} />
      </ChartContainer>,
    );
    expect(screen.getByText("REV-ICON")).toBeInTheDocument();
  });

  it("hides icons when hideIcon is set", () => {
    const iconConfig: ChartConfig = {
      revenue: { label: "Revenue", icon: () => <span>REV-ICON</span> },
      count: { label: "Count" },
    };
    render(
      <ChartContainer config={iconConfig}>
        <ChartLegendContent payload={legendPayload} hideIcon />
      </ChartContainer>,
    );
    expect(screen.queryByText("REV-ICON")).not.toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
  });

  it("applies verticalAlign top className", () => {
    const { $ } = renderChart(
      <ChartContainer config={config}>
        <ChartLegendContent payload={legendPayload} verticalAlign="top" />
      </ChartContainer>,
    );
    const legend = $("[data-slot='chart']");
    expect(legend?.textContent).toContain("Revenue");
  });
});

describe("ChartTooltipContent outside ChartContainer", () => {
  it("throws when used outside a ChartContainer", () => {
    expect(() => render(<ChartTooltipContent active payload={[]} />)).toThrow(
      "useChart must be used within a <ChartContainer />",
    );
  });
});
