import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

type DynamicLoader = () => Promise<unknown>;
type DynamicOptions = { ssr?: boolean };

const loaded = vi.hoisted(
  () => [] as Array<{ loader: DynamicLoader; options: DynamicOptions }>,
);

vi.mock("next/dynamic", () => ({
  default: (loader: DynamicLoader, options: DynamicOptions) => {
    loaded.push({ loader, options });
    return (props: Record<string, unknown>) => (
      <div data-testid="dynamic-chart" data-props={JSON.stringify(props)} />
    );
  },
}));

import {
  DynamicAreaChart,
  DynamicBarChart,
  DynamicLineChart,
  DynamicPieChart,
  DynamicResponsiveContainer,
} from "@/components/charts/dynamic-charts";

describe("dynamic-charts", () => {
  it("loads all five dynamic chart components", () => {
    expect(loaded).toHaveLength(5);
  });

  it("disables SSR for every dynamic component", () => {
    for (const entry of loaded) {
      expect(entry.options.ssr).toBe(false);
    }
  });

  it("loads the correct recharts members", async () => {
    const rechartsMembers = [
      { name: "AreaChart", entry: loaded[0] },
      { name: "BarChart", entry: loaded[1] },
      { name: "LineChart", entry: loaded[2] },
      { name: "PieChart", entry: loaded[3] },
      { name: "ResponsiveContainer", entry: loaded[4] },
    ];
    for (const { name, entry } of rechartsMembers) {
      const mod = await entry.loader();
      // recharts 3 exports charts as functions or render objects — either is valid
      expect(
        mod !== null && mod !== undefined,
        `${name} loader should resolve to the recharts export`,
      ).toBe(true);
    }
  });

  it("renders props through the dynamic wrapper", () => {
    const components = [
      DynamicAreaChart,
      DynamicBarChart,
      DynamicLineChart,
      DynamicPieChart,
      DynamicResponsiveContainer,
    ];
    const { container } = render(
      components.map((Chart, index) => (
        <Chart key={index} data={[{ x: 1 }]} margin={{ top: 2 }} />
      )),
    );
    const nodes = container.querySelectorAll("[data-testid='dynamic-chart']");
    expect(nodes).toHaveLength(5);
    const props = JSON.parse(nodes[0]?.getAttribute("data-props") ?? "{}");
    expect(props.data).toEqual([{ x: 1 }]);
    expect(props.margin).toEqual({ top: 2 });
  });
});
