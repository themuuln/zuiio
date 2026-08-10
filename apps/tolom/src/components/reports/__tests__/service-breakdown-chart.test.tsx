import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ServiceBreakdownChart } from "@/components/reports/service-breakdown-chart";
import type { ServiceBreakdown } from "@/lib/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      revenueByService: "Revenue by service",
      revenue: "Revenue",
      noDataForPeriod: "No data for this period",
    };
    return messages[key] ?? key;
  },
}));

vi.mock("@/components/charts", () => ({
  BarChart: ({ ...props }: Record<string, unknown>) => (
    <div data-testid="bar-chart" data-props={JSON.stringify(props)} />
  ),
}));

const longName = "Ultra Premium Full Service Package Deluxe";
const services: ServiceBreakdown[] = [
  { service_name: "Oil Change", service_count: 10, total_revenue: 200000 },
  { service_name: longName, service_count: 2, total_revenue: 600000 },
  { service_name: "Brakes", service_count: 5, total_revenue: 300000 },
];

describe("ServiceBreakdownChart", () => {
  it("shows a skeleton while loading", () => {
    const { container } = render(<ServiceBreakdownChart data={[]} loading />);
    expect(
      container.querySelector("[data-slot='skeleton']"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
  });

  it("renders the card title", () => {
    render(<ServiceBreakdownChart data={services} />);
    expect(screen.getByText("Revenue by service")).toBeInTheDocument();
  });

  it("passes the chart data with truncated long names", () => {
    render(<ServiceBreakdownChart data={services} />);
    const props = JSON.parse(
      screen.getByTestId("bar-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.data).toHaveLength(3);
    expect(props.data[0]).toEqual({ name: "Oil Change", revenue: 200000 });
    expect(props.data[1]).toEqual({
      name: "Ultra Premium Full…",
      revenue: 600000,
    });
    expect(props.height).toBe(200);
  });

  it("limits the chart to 6 services", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      service_name: `Service ${i}`,
      service_count: i,
      total_revenue: 1000 * i,
    }));
    render(<ServiceBreakdownChart data={many} />);
    const props = JSON.parse(
      screen.getByTestId("bar-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.data).toHaveLength(6);
  });

  it("shows the empty message when there is no data", () => {
    render(<ServiceBreakdownChart data={[]} />);
    expect(screen.getByText("No data for this period")).toBeInTheDocument();
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
  });
});
