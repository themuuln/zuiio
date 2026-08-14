import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  BRANCH_TABLE_COLUMNS,
  BranchComparisonTable,
} from "@/components/branch-comparison-table";
import type { BranchComparisonData, BranchKpiSummary } from "@/lib/types";

function makeBranch(overrides: Partial<BranchKpiSummary>): BranchKpiSummary {
  return {
    branchId: "b-1",
    branchName: "Central",
    isMain: false,
    totalRevenue: 1_000_000,
    serviceRevenue: 600_000,
    partsRevenue: 400_000,
    grossProfit: 300_000,
    marginPercent: 12,
    activeWorkOrders: 5,
    completedWorkOrders: 42,
    totalCustomers: 30,
    avgRepairOrderValue: 250_000,
    serviceMix: 60,
    ...overrides,
  };
}

const data: BranchComparisonData = {
  branches: [
    makeBranch({
      branchId: "b-1",
      branchName: "Central",
      isMain: true,
      totalRevenue: 1_000_000,
      completedWorkOrders: 42,
      marginPercent: 12,
    }),
    makeBranch({
      branchId: "b-2",
      branchName: "North",
      isMain: false,
      totalRevenue: 2_000_000,
      completedWorkOrders: 60,
      marginPercent: 24,
    }),
  ],
  totals: {
    totalRevenue: 3_000_000,
    serviceRevenue: 1_800_000,
    partsRevenue: 1_200_000,
    grossProfit: 900_000,
    marginPercent: 18,
    activeWorkOrders: 12,
    completedWorkOrders: 102,
    totalCustomers: 80,
    avgRepairOrderValue: 270_000,
    serviceMix: 58,
  },
  periodLabel: "Last 30 days",
};

describe("BranchComparisonTable", () => {
  it("renders branch rows with the Main badge and formatted values", () => {
    render(<BranchComparisonTable data={data} />);
    expect(screen.getByText("Branch Performance")).toBeInTheDocument();
    expect(screen.getByText("Central")).toBeInTheDocument();
    expect(screen.getByText("North")).toBeInTheDocument();
    expect(screen.getByText("Main")).toBeInTheDocument();
    // Number-formatted column
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("scales the revenue performance bar to the best branch", () => {
    const { container } = render(<BranchComparisonTable data={data} />);
    const bars = container.querySelectorAll<HTMLElement>(
      "div.rounded-full.bg-primary\\/60",
    );
    expect(bars).toHaveLength(2);
    // Central is half of North's revenue
    expect(bars[0].style.width).toBe("50%");
    expect(bars[1].style.width).toBe("100%");
  });

  it("renders the totals row with aggregated values", () => {
    render(<BranchComparisonTable data={data} />);
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
    expect(screen.getByText("102")).toBeInTheDocument();
    expect(screen.getByText(/₮ 3,000,000/)).toBeInTheDocument();
  });

  it("renders only the requested columns and a custom title", () => {
    render(
      <BranchComparisonTable
        data={data}
        columns={[...BRANCH_TABLE_COLUMNS.reports]}
        title="My Report"
      />,
    );
    expect(screen.getByText("My Report")).toBeInTheDocument();
    expect(screen.getByText("Gross Profit")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.queryByText("Active WOs")).not.toBeInTheDocument();
    // Percent-formatted margin column is part of the reports preset
    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("24%")).toBeInTheDocument();
  });

  it("shows the skeleton while loading", () => {
    const { container } = render(<BranchComparisonTable data={null} loading />);
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(3);
    expect(screen.queryByText("Central")).not.toBeInTheDocument();
  });

  it("renders nothing when there is no data or branches", () => {
    const { container, rerender } = render(
      <BranchComparisonTable data={null} />,
    );
    expect(container.firstChild).toBeNull();
    rerender(<BranchComparisonTable data={{ ...data, branches: [] }} />);
    expect(container.firstChild).toBeNull();
  });
});
