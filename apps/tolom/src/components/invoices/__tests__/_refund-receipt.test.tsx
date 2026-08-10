import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { RefundReceipt } from "../_refund-receipt";

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

const REFUND = {
  id: "abc12345refund1",
  amount: 45000,
  method: "cash",
  reason: "Customer returned item",
  reference: "TXN-998",
  notes: "Refunded at counter",
  refunded_at: "2026-08-05T09:30:00Z",
};

const INVOICE = {
  invoice_number: "2026-0042",
  total: 45000,
  customer_name: "Bat Erdene",
};

describe("RefundReceipt", () => {
  it("renders org, invoice, refund details and amount", () => {
    render(
      <RefundReceipt
        refund={REFUND}
        invoice={INVOICE}
        orgName="UB Auto Service"
      />,
    );

    expect(screen.getByText("UB Auto Service")).toBeInTheDocument();
    expect(screen.getByText("#2026-0042")).toBeInTheDocument();
    expect(screen.getByText("Bat Erdene")).toBeInTheDocument();
    // Receipt number = REF- + first 8 chars of the refund id, uppercased
    expect(screen.getByText("REF-ABC12345")).toBeInTheDocument();
    expect(screen.getByText("payment.cash")).toBeInTheDocument();
    expect(screen.getByText("Customer returned item")).toBeInTheDocument();
    expect(screen.getByText("TXN-998")).toBeInTheDocument();
    expect(screen.getByText("Refunded at counter")).toBeInTheDocument();
    expect(screen.getByText(/₮\s*45,000/)).toBeInTheDocument();
    expect(screen.getByText("refund.statusCompleted")).toBeInTheDocument();
  });

  it("falls back to a dash for missing customer name and omits optional rows", () => {
    render(
      <RefundReceipt
        refund={{ ...REFUND, reason: null, reference: null, notes: null }}
        invoice={{ ...INVOICE, customer_name: null }}
        orgName="UB Auto Service"
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(
      screen.queryByText("Customer returned item"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("TXN-998")).not.toBeInTheDocument();
  });

  it("prints a receipt window with the invoice content", () => {
    const printMock = vi.fn();
    const documentMock = { write: vi.fn(), close: vi.fn() };
    const openMock = vi.spyOn(window, "open").mockReturnValue({
      document: documentMock,
      print: printMock,
    } as unknown as Window);

    render(
      <RefundReceipt
        refund={REFUND}
        invoice={INVOICE}
        orgName="UB Auto Service"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "common.print" }));

    expect(openMock).toHaveBeenCalledWith("", "_blank");
    expect(printMock).toHaveBeenCalledTimes(1);
    expect(documentMock.close).toHaveBeenCalledTimes(1);
    const written = documentMock.write.mock.calls[0][0] as string;
    expect(written).toContain("UB Auto Service");
    expect(written).toContain("#2026-0042");
    expect(written).toContain("Bat Erdene");
  });
});
