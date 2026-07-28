import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RetentionCard } from "@/components/reports/retention-card";
import type { CustomerRetentionData } from "@/lib/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockRetentionData: CustomerRetentionData = {
  total_customers: 120,
  returning_customers: 75,
  new_customers: 45,
  retention_rate: 62.5,
  avg_visits_per_customer: 3.2,
  avg_lifetime_value: 45000,
  top_customers: [
    {
      customer_id: "c1",
      customer_name: "Batbold D.",
      total_revenue: 250000,
      visit_count: 12,
    },
    {
      customer_id: "c2",
      customer_name: "Sukhbat O.",
      total_revenue: 180000,
      visit_count: 8,
    },
    {
      customer_id: "c3",
      customer_name: "Tuya N.",
      total_revenue: 125000,
      visit_count: 6,
    },
  ],
};

describe("RetentionCard", () => {
  it("renders the customer retention title", () => {
    render(<RetentionCard data={mockRetentionData} />);
    expect(screen.getByText("customerRetention")).toBeInTheDocument();
  });

  it("displays retention rate, returning, and new customers counts", () => {
    render(<RetentionCard data={mockRetentionData} />);
    expect(screen.getByText("62.5%")).toBeInTheDocument();
    expect(screen.getByText("retention")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("returning")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("newCustomers")).toBeInTheDocument();
  });

  it("displays average visits per customer", () => {
    render(<RetentionCard data={mockRetentionData} />);
    expect(screen.getByText("avgVisitsPerCustomer")).toBeInTheDocument();
    expect(screen.getByText("3.2")).toBeInTheDocument();
  });

  it("displays average lifetime value", () => {
    render(<RetentionCard data={mockRetentionData} />);
    expect(screen.getByText("avgLifetimeValue")).toBeInTheDocument();
    // formatCurrency(45000) renders as formatted number
  });

  it("shows top customers section when top_customers is non-empty", () => {
    render(<RetentionCard data={mockRetentionData} />);
    expect(screen.getByText("topCustomers")).toBeInTheDocument();
    expect(screen.getByText("Batbold D.")).toBeInTheDocument();
    expect(screen.getByText("Sukhbat O.")).toBeInTheDocument();
    expect(screen.getByText("Tuya N.")).toBeInTheDocument();
  });

  it("limits top customers to 3 entries", () => {
    const fourthCustomer = {
      customer_id: "c4",
      customer_name: "Extra C.",
      total_revenue: 100000,
      visit_count: 4,
    };
    const manyCustomers = {
      ...mockRetentionData,
      top_customers: [...mockRetentionData.top_customers, fourthCustomer],
    };
    render(<RetentionCard data={manyCustomers} />);
    // The component slices top_customers to 3, so "Extra C." should not appear
    expect(screen.getByText("topCustomers")).toBeInTheDocument();
    expect(screen.getByText("Batbold D.")).toBeInTheDocument();
    expect(screen.getByText("Sukhbat O.")).toBeInTheDocument();
    expect(screen.getByText("Tuya N.")).toBeInTheDocument();
    expect(screen.queryByText("Extra C.")).not.toBeInTheDocument();
  });

  it("hides top customers section when empty", () => {
    const noTopCustomers: CustomerRetentionData = {
      ...mockRetentionData,
      top_customers: [],
    };
    render(<RetentionCard data={noTopCustomers} />);
    expect(screen.queryByText("topCustomers")).not.toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<RetentionCard data={null} loading />);
    expect(container.querySelector(".h-\\[200px\\]")).toBeInTheDocument();
  });

  it("shows no data message when data is null", () => {
    render(<RetentionCard data={null} />);
    expect(screen.getByText("noDataForPeriod")).toBeInTheDocument();
  });

  it("shows no data message when total_customers is 0", () => {
    const emptyData: CustomerRetentionData = {
      ...mockRetentionData,
      total_customers: 0,
      returning_customers: 0,
      new_customers: 0,
    };
    render(<RetentionCard data={emptyData} />);
    expect(screen.getByText("noDataForPeriod")).toBeInTheDocument();
  });
});
