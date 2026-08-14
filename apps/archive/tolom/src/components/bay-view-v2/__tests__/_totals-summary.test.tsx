import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { TotalsSummary } from "../_totals-summary";

const t = (key: string) => key;

describe("TotalsSummary", () => {
  const baseProps = {
    servicesTotal: 60000,
    partsTotal: 40000,
    grandTotal: 100000,
    discountTotal: 0,
    taxRate: 0,
    nuatEnabled: false,
    t,
  };

  it("renders the grand total and hides the breakdown by default", () => {
    render(<TotalsSummary {...baseProps} />);
    // Header + breakdown grand-total row both render the same amount
    expect(screen.getAllByText("₮ 100,000").length).toBeGreaterThan(0);
    // Breakdown labels are still in the DOM but visually collapsed
    expect(screen.getByText("services")).toBeTruthy();
    expect(screen.getByText("parts")).toBeTruthy();
  });

  it("expands the breakdown on click showing services and parts", () => {
    const { container } = render(<TotalsSummary {...baseProps} />);
    const toggle = screen.getByRole("button");
    expect(toggle.className).not.toContain("rotate-180");
    fireEvent.click(toggle);
    expect(container.querySelector(".rotate-180")).toBeTruthy();
    expect(screen.getByText("₮ 60,000")).toBeTruthy();
    expect(screen.getByText("₮ 40,000")).toBeTruthy();
  });

  it("shows the discount row and adjusted total when a discount exists", () => {
    render(<TotalsSummary {...baseProps} discountTotal={10000} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("discount")).toBeTruthy();
    expect(screen.getByText("-₮ 10,000")).toBeTruthy();
    expect(screen.getByText("totalToPay")).toBeTruthy();
    expect(screen.getAllByText("₮ 90,000").length).toBeGreaterThan(0);
  });

  it("shows the VAT row and total with tax when nuat is enabled", () => {
    render(
      <TotalsSummary
        {...baseProps}
        nuatEnabled
        taxRate={10}
        grandTotal={110000}
        servicesTotal={70000}
        partsTotal={40000}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("vatAbbr (10%)")).toBeTruthy();
    // tax = round(110000 * 10) / 100 = 11000
    expect(screen.getByText("₮ 11,000")).toBeTruthy();
    expect(screen.getAllByText("₮ 121,000").length).toBeGreaterThan(0);
  });

  it("shows the unadjusted total in the header when there are no adjustments", () => {
    render(<TotalsSummary {...baseProps} />);
    expect(screen.getAllByText("₮ 100,000").length).toBeGreaterThan(0);
  });
});
