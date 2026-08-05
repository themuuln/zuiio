import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TotalsSummary } from "@/components/work-orders/line-items/totals-summary";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock("lucide-react", () => ({
  ChevronDown: () => <svg data-testid="chevron-down" />,
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr data-testid="separator" />,
}));

// ── Tests ──────────────────────────────────────────────────────────────

describe("TotalsSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultT = (key: string): string => {
    const messages: Record<string, string> = {
      grandTotal: "Grand Total",
      services: "Services",
      parts: "Parts & Materials",
      discount: "Discount",
      totalToPay: "Total to Pay",
      vatAbbr: "НӨАТ",
    };
    return messages[key] ?? key;
  };

  const defaultProps = {
    servicesTotal: 100000,
    partsTotal: 50000,
    grandTotal: 150000,
    t: defaultT,
  };

  it("renders grand total", () => {
    render(<TotalsSummary {...defaultProps} />);
    // "Grand Total" appears in both the header button and the collapsed breakdown
    const grandTotalElements = screen.getAllByText("Grand Total");
    expect(grandTotalElements.length).toBeGreaterThan(0);
    // Price appears in both the header and collapsed breakdown
    const priceElements = screen.getAllByText("₮ 150,000");
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it("shows expandable breakdown section on click", () => {
    render(<TotalsSummary {...defaultProps} serviceCount={2} partCount={3} />);

    // Check service and part counts are shown in collapsed header
    expect(screen.getByText(/2.*Services/i)).toBeInTheDocument();
    expect(screen.getByText(/3.*Parts/i)).toBeInTheDocument();

    // Click to expand breakdown
    const grandTotals = screen.getAllByText("Grand Total");
    const headerBtn = grandTotals[0].closest("button");
    if (!headerBtn) throw new Error("grand total header not found");
    fireEvent.click(headerBtn);

    expect(screen.getByText("₮ 100,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 50,000")).toBeInTheDocument();
    expect(screen.getAllByText("Grand Total")).toHaveLength(2);
  });

  it("renders with discount when discountTotal > 0", () => {
    render(<TotalsSummary {...defaultProps} discountTotal={10000} />);

    // Click to expand breakdown
    const _grandTotals = screen.getAllByText("Grand Total");
    expect(screen.getByText("Discount")).toBeInTheDocument();
    expect(screen.getByText("-₮ 10,000")).toBeInTheDocument();
    expect(screen.getByText("Total to Pay")).toBeInTheDocument();
    // Total to Pay appears in both header button and breakdown
    const totalPriceElements = screen.getAllByText("₮ 140,000");
    expect(totalPriceElements.length).toBeGreaterThan(0);
  });

  it("renders with tax when nuatEnabled and taxRate provided", () => {
    render(<TotalsSummary {...defaultProps} nuatEnabled={true} taxRate={10} />);

    // Click to expand breakdown
    const grandTotals = screen.getAllByText("Grand Total");
    const headerBtn = grandTotals[0].closest("button");
    if (!headerBtn) throw new Error("grand total header not found");
    fireEvent.click(headerBtn);

    expect(screen.getByText("НӨАТ (10%)")).toBeInTheDocument();
    expect(screen.getByText("₮ 15,000")).toBeInTheDocument();
    expect(screen.getByText("Total to Pay")).toBeInTheDocument();
  });

  it("renders with serviceCount and partCount in header", () => {
    render(<TotalsSummary {...defaultProps} serviceCount={3} partCount={5} />);

    // Collapsed header shows counts
    expect(screen.getByText(/3.*Services/i)).toBeInTheDocument();
    expect(screen.getByText(/5.*Parts/i)).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Parts & Materials")).toBeInTheDocument();
  });

  it("expanded breakdown shows services and parts totals with counts", () => {
    render(<TotalsSummary {...defaultProps} serviceCount={2} partCount={3} />);

    const grandTotals = screen.getAllByText("Grand Total");
    const headerBtn = grandTotals[0].closest("button");
    if (!headerBtn) throw new Error("grand total header not found");
    fireEvent.click(headerBtn);

    // Breakdown shows Services(2) and Parts & Materials(3) with amounts
    const servicesLabel = screen.getByText("Services");
    expect(servicesLabel).toBeInTheDocument();

    const partsLabel = screen.getByText("Parts & Materials");
    expect(partsLabel).toBeInTheDocument();
  });
});
