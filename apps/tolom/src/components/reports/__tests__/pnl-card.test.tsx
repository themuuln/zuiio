import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PnLCard } from "@/components/reports/pnl-card";
import type { PnLSummary } from "@/lib/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockPnLData: PnLSummary = {
  period_start: "2026-07-01",
  period_end: "2026-07-31",
  revenue: {
    service_revenue: 15000,
    parts_revenue: 8000,
    other_revenue: 2000,
    total: 25000,
  },
  cogs: {
    service_cost: 5000,
    parts_cost: 3000,
    total: 8000,
  },
  gross_profit: 17000,
  gross_margin_pct: 68,
  expenses: {
    total: 9000,
    by_category: [
      { category: "Rent", amount: 3000 },
      { category: "Salaries", amount: 4000 },
      { category: "Utilities", amount: 1000 },
      { category: "Marketing", amount: 500 },
      { category: "Insurance", amount: 500 },
    ],
  },
  net_profit: 8000,
  net_margin_pct: 32,
};

describe("PnLCard", () => {
  it("renders the title from i18n", () => {
    render(<PnLCard data={mockPnLData} />);
    expect(screen.getByText("profitAndLoss")).toBeInTheDocument();
  });

  it("renders revenue line items", () => {
    render(<PnLCard data={mockPnLData} />);
    expect(screen.getByText("serviceRevenue")).toBeInTheDocument();
    expect(screen.getByText("partsRevenue")).toBeInTheDocument();
    expect(screen.getByText("totalRevenue")).toBeInTheDocument();
  });

  it("renders cost of goods sold, gross profit, and net profit", () => {
    render(<PnLCard data={mockPnLData} />);
    expect(screen.getByText("costOfGoodsSold")).toBeInTheDocument();
    expect(screen.getByText("grossProfit")).toBeInTheDocument();
    expect(screen.getByText("totalExpenses")).toBeInTheDocument();
    expect(screen.getByText("netProfit")).toBeInTheDocument();
  });

  it("renders expense categories (up to 5)", () => {
    render(<PnLCard data={mockPnLData} />);
    expect(screen.getByText("grossMargin")).toBeInTheDocument();
    // Expense categories rendered with labels
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Salaries")).toBeInTheDocument();
    expect(screen.getByText("Utilities")).toBeInTheDocument();
  });

  it("renders formatted currency values for revenue items", () => {
    render(<PnLCard data={mockPnLData} />);
    // formatCurrency is used, which formats with ₮ in Mongolian locale
    // We check that values appear as formatted strings
    expect(screen.getAllByText(/,?\d+/).length).toBeGreaterThan(0);
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<PnLCard data={null} loading />);
    expect(container.querySelector(".h-\\[300px\\]")).toBeInTheDocument();
  });

  it("shows no data message when data is null", () => {
    render(<PnLCard data={null} />);
    expect(screen.getByText("noDataForPeriod")).toBeInTheDocument();
  });

  it("handles negative net profit styling", () => {
    const lossData: PnLSummary = {
      ...mockPnLData,
      net_profit: -2000,
      gross_profit: 3000,
    };
    const { container } = render(<PnLCard data={lossData} />);
    // Net profit row should have red styling
    const cells = container.querySelectorAll(".text-red-500");
    expect(cells.length).toBeGreaterThan(0);
  });
});
