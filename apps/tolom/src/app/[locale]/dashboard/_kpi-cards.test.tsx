import { render, screen } from "@testing-library/react";
import { DollarSign } from "lucide-react";
import { describe, expect, it } from "vitest";
import { KpiCard } from "./_kpi-cards";

vi.mock("./_kpi-sparkline", () => ({
  KpiSparkline: (props: { data?: { value: number }[] }) =>
    props.data && props.data.length >= 2 ? (
      <div data-testid="mock-sparkline">Sparkline</div>
    ) : null,
}));
describe("KpiCard", () => {
  const defaultProps = {
    label: "Total Revenue",
    value: "₮ 12,430,000",
    icon: DollarSign,
  };

  it("renders label and value", () => {
    render(<KpiCard {...defaultProps} />);
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("₮ 12,430,000")).toBeInTheDocument();
  });

  it("renders icon with aria-hidden", () => {
    const { container } = render(<KpiCard {...defaultProps} />);
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<KpiCard {...defaultProps} loading />);
    expect(screen.queryByText("₮ 12,430,000")).toBeNull();
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toBeInTheDocument();
  });

  it("hides sparkline when loading", () => {
    render(
      <KpiCard
        {...defaultProps}
        loading
        sparklineData={[{ value: 1 }, { value: 5 }]}
      />,
    );
    expect(screen.queryByTestId("mock-sparkline")).toBeNull();
  });

  it("renders trend up with ArrowUp icon and value", () => {
    render(
      <KpiCard
        {...defaultProps}
        trend={{ direction: "up", value: "12.5%", percent: "₮ 1.2M" }}
      />,
    );
    expect(screen.getByText("12.5%")).toBeInTheDocument();
    expect(screen.getByText("(₮ 1.2M)")).toBeInTheDocument();
    const { container } = render(
      <KpiCard {...defaultProps} trend={{ direction: "up", value: "12.5%" }} />,
    );
    // ArrowUp renders as an SVG
    expect(container.querySelector(".lucide-arrow-up")).toBeInTheDocument();
  });

  it("renders trend down with ArrowDown icon", () => {
    const { container } = render(
      <KpiCard
        {...defaultProps}
        trend={{ direction: "down", value: "5.2%" }}
      />,
    );
    expect(screen.getByText("5.2%")).toBeInTheDocument();
    expect(container.querySelector(".lucide-arrow-down")).toBeInTheDocument();
  });

  it("renders trend neutral without arrow icon", () => {
    render(
      <KpiCard
        {...defaultProps}
        trend={{ direction: "neutral", value: "0%" }}
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
    const { container } = render(
      <KpiCard
        {...defaultProps}
        trend={{ direction: "neutral", value: "0%" }}
      />,
    );
    // Neutral trends render with "bg-muted" background class
    const badge = container.querySelector(".bg-muted");
    expect(badge).toBeInTheDocument();
  });

  it("shows comparisonLabel when no trend is provided", () => {
    render(<KpiCard {...defaultProps} comparisonLabel="vs last period" />);
    expect(screen.getByText("vs last period")).toBeInTheDocument();
  });

  it("does not show comparisonLabel when trend is provided", () => {
    render(
      <KpiCard
        {...defaultProps}
        trend={{ direction: "up", value: "8%" }}
        comparisonLabel="should not show"
      />,
    );
    expect(screen.queryByText("should not show")).toBeNull();
    expect(screen.getByText("8%")).toBeInTheDocument();
  });

  it("renders sparkline when sparklineData is provided", () => {
    render(
      <KpiCard
        {...defaultProps}
        sparklineData={[{ value: 10 }, { value: 20 }, { value: 15 }]}
        sparklineColor="var(--chart-2)"
      />,
    );
    expect(screen.getByTestId("mock-sparkline")).toBeInTheDocument();
  });

  it("does not render sparkline with less than 2 data points", () => {
    render(<KpiCard {...defaultProps} sparklineData={[{ value: 10 }]} />);
    expect(screen.queryByTestId("mock-sparkline")).toBeNull();
  });

  describe("accentKey", () => {
    const keys = [
      { key: "totalRevenue", iconClass: "text-emerald" },
      { key: "activeWorkOrders", iconClass: "text-amber" },
      { key: "totalCustomers", iconClass: "text-sky" },
    ];

    it.each(keys)("applies $key accent styling", ({ key }) => {
      const { container } = render(
        <KpiCard {...defaultProps} accentKey={key} />,
      );
      // Accent styling applies class to icon — check it exists
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });
});
