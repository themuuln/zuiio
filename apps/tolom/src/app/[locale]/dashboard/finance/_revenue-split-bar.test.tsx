import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { RevenueSplitBar } from "./_revenue-split-bar";

const messages = {
  finance: {
    revenueBreakdown: "Revenue Breakdown",
    noRevenueDataYet: "No revenue data yet",
  },
  dashboard: {
    serviceRevenue: "Service Revenue",
    partsRevenue: "Parts Revenue",
  },
};

describe("RevenueSplitBar", () => {
  const defaultProps = {
    total: 1000000,
    service: 700000,
    parts: 300000,
  };

  it("renders service and parts revenue with percentages", () => {
    render(<RevenueSplitBar {...defaultProps} />, { messages });
    expect(screen.getByText("Revenue Breakdown")).toBeInTheDocument();
    expect(screen.getByText("₮ 700,000")).toBeInTheDocument();
    expect(screen.getByText("(70%)")).toBeInTheDocument();
    expect(screen.getByText("(30%)")).toBeInTheDocument();
  });

  it("returns null when total is zero", () => {
    const { container } = render(
      <RevenueSplitBar total={0} service={0} parts={0} />,
      { messages },
    );
    expect(container.querySelector('[class*="card"]')).toBeNull();
    expect(screen.queryByText("Revenue Breakdown")).toBeNull();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(
      <RevenueSplitBar {...defaultProps} loading />,
      { messages },
    );
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toBeDefined();
    expect(screen.queryByText("Revenue Breakdown")).toBeNull();
  });

  it("handles 100% service, 0% parts", () => {
    render(<RevenueSplitBar total={500000} service={500000} parts={0} />, {
      messages,
    });
    expect(screen.getByText("(100%)")).toBeDefined();
    expect(screen.getByText("(0%)")).toBeDefined();
  });

  it("handles 0% service, 100% parts", () => {
    render(<RevenueSplitBar total={500000} service={0} parts={500000} />, {
      messages,
    });
    expect(screen.getByText("(0%)")).toBeDefined();
    expect(screen.getByText("(100%)")).toBeDefined();
  });
});
