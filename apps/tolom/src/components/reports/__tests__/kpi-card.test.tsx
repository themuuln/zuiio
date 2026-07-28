import { render, screen } from "@testing-library/react";
import { DollarSign } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { ReportKpiCard } from "@/components/reports/kpi-card";

// next-intl is used by DeltaIndicator internally (not by ReportKpiCard directly,
// but the render wraps with NextIntlClientProvider).
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("ReportKpiCard", () => {
  it("renders label and value", () => {
    render(<ReportKpiCard label="Revenue" value="$12,500" icon={DollarSign} />);
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("$12,500")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    const { container } = render(
      <ReportKpiCard label="Revenue" value="$12,500" icon={DollarSign} />,
    );
    expect(container.querySelector(".lucide-dollar-sign")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading is true", () => {
    const { container } = render(
      <ReportKpiCard
        label="Revenue"
        value="$12,500"
        icon={DollarSign}
        loading
      />,
    );
    expect(container.querySelector(".lucide-dollar-sign")).toBeInTheDocument();
    // Skeleton replaces the value
    expect(container.querySelector(".h-8.w-24")).toBeInTheDocument();
    expect(screen.queryByText("$12,500")).not.toBeInTheDocument();
  });

  it("shows subtitle when provided", () => {
    render(
      <ReportKpiCard
        label="Revenue"
        value="$12,500"
        icon={DollarSign}
        subtitle="vs last month"
      />,
    );
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("applies extra class to the value", () => {
    const { container } = render(
      <ReportKpiCard
        label="Revenue"
        value="$12,500"
        icon={DollarSign}
        cls="text-green-500"
      />,
    );
    const valueEl = container.querySelector(".tabular-nums");
    expect(valueEl?.className).toContain("text-green-500");
  });

  it("shows delta indicator when delta is provided", () => {
    render(
      <ReportKpiCard
        label="Revenue"
        value="$12,500"
        icon={DollarSign}
        delta={15}
      />,
    );
    expect(screen.getByText("+15.0%")).toBeInTheDocument();
  });

  it("shows no delta indicator when delta is undefined", () => {
    render(<ReportKpiCard label="Revenue" value="$12,500" icon={DollarSign} />);
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("handles delta of zero with neutral styling", () => {
    render(
      <ReportKpiCard
        label="Revenue"
        value="$12,500"
        icon={DollarSign}
        delta={0}
      />,
    );
    // zero delta renders a muted-colored "0.0%"
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("inverts delta colors when deltaInvert is true", () => {
    // With invert, a positive delta (normally green) becomes red
    const { container } = render(
      <ReportKpiCard
        label="Expenses"
        value="$5,000"
        icon={DollarSign}
        delta={10}
        deltaInvert
      />,
    );
    expect(screen.getByText("+10.0%")).toBeInTheDocument();
    // DeltaIndicator should have text-red-500 when inverted with positive delta
    const deltaEl = screen.getByText("+10.0%");
    expect(deltaEl.className).toContain("text-red-500");
  });

  it("renders without subtitle when not provided", () => {
    render(<ReportKpiCard label="Revenue" value="$12,500" icon={DollarSign} />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });
});
