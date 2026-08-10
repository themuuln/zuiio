import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ExpenseDetailView } from "../_expense-detail-view";

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

const PAID_EXPENSE = {
  amount: 120000,
  tax_amount: 10000,
  category: { name: "Fuel" },
  paid_at: "2026-08-02T10:00:00Z",
  expense_date: "2026-08-01",
  due_date: null,
  vendor_name: "Fuel Station",
  payment_method: "bank_transfer",
  reference_number: "INV-123",
  notes: "Office van refill",
};

describe("ExpenseDetailView", () => {
  it("renders amount, badges and all detail rows", () => {
    render(<ExpenseDetailView expense={PAID_EXPENSE} />);

    expect(screen.getByText(/₮\s*120,000/)).toBeInTheDocument();
    expect(screen.getByText("Fuel")).toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();
    // Tax row only when tax_amount > 0
    expect(screen.getByText(/₮\s*10,000/)).toBeInTheDocument();
    expect(screen.getByText("Fuel Station")).toBeInTheDocument();
    expect(screen.getByText("INV-123")).toBeInTheDocument();
    expect(screen.getByText("Office van refill")).toBeInTheDocument();
    // Payment method label
    expect(screen.getByText("bank_transfer")).toBeInTheDocument();
  });

  it("marks an unpaid expense with a past due date as overdue", () => {
    render(
      <ExpenseDetailView
        expense={{
          ...PAID_EXPENSE,
          paid_at: null,
          due_date: "2020-01-01T00:00:00Z",
        }}
      />,
    );
    expect(screen.getByText("overdue")).toBeInTheDocument();
  });

  it("marks an unpaid expense without a past due date as unpaid", () => {
    render(
      <ExpenseDetailView
        expense={{ ...PAID_EXPENSE, paid_at: null, due_date: null }}
      />,
    );
    expect(screen.getByText("unpaid")).toBeInTheDocument();
  });

  it("hides tax row and optional details when absent", () => {
    render(
      <ExpenseDetailView
        expense={{
          amount: 5000,
          tax_amount: 0,
          category: null,
          paid_at: null,
          expense_date: null,
          due_date: null,
          vendor_name: null,
          payment_method: null,
          reference_number: null,
          notes: null,
        }}
      />,
    );
    expect(screen.getByText(/₮\s*5,000/)).toBeInTheDocument();
    expect(screen.getByText("unpaid")).toBeInTheDocument();
    expect(screen.queryByText("Fuel")).not.toBeInTheDocument();
    expect(screen.queryByText("INV-123")).not.toBeInTheDocument();
  });
});
