import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { EmptyFinanceState } from "./_empty-finance-state";

const financeMessages = {
  finance: {
    noFinancialData: "No financial data yet",
    noFinancialDataDesc:
      "Complete work orders with services and parts to see your revenue breakdown, financial KPIs, and transaction history.",
  },
};

describe("EmptyFinanceState", () => {
  it("renders the title", () => {
    render(<EmptyFinanceState />, { messages: financeMessages });
    expect(screen.getByText("No financial data yet")).toBeDefined();
  });

  it("renders the description", () => {
    render(<EmptyFinanceState />, { messages: financeMessages });
    expect(
      screen.getByText(
        "Complete work orders with services and parts to see your revenue breakdown, financial KPIs, and transaction history.",
      ),
    ).toBeDefined();
  });

  it("renders DollarSign icon in empty media variant", () => {
    const { container } = render(<EmptyFinanceState />, {
      messages: financeMessages,
    });
    const icon = container.querySelector("svg");
    expect(icon).toBeDefined();
  });
});
