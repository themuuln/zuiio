import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PosPaymentDialog, type PosPaymentResult } from "./pos-payment-dialog";

function renderDialog(
  overrides: {
    total?: number;
    onConfirm?: (result: PosPaymentResult) => void;
    isSubmitting?: boolean;
    error?: string | null;
  } = {},
) {
  const onConfirm = overrides.onConfirm ?? vi.fn();
  const utils = render(
    <PosPaymentDialog
      open
      total={overrides.total ?? 10000}
      onOpenChange={() => {}}
      onConfirm={onConfirm}
      isSubmitting={overrides.isSubmitting ?? false}
      error={overrides.error ?? null}
    />,
  );
  return { onConfirm, ...utils };
}

describe("PosPaymentDialog", () => {
  it("shows the total and 0 change on open, never ₮ NaN", () => {
    renderDialog({ total: 10000 });
    expect(screen.getByText("₮ 10,000")).toBeInTheDocument();
    expect(screen.getByTestId("pos-change")).toHaveTextContent("₮ 0");
    expect(screen.getByTestId("pos-change").textContent).not.toContain("NaN");
  });

  it("computes change once tendered is typed", () => {
    renderDialog({ total: 10000 });
    for (const key of ["2", "0", "0", "0", "0"]) {
      fireEvent.click(screen.getByRole("button", { name: key }));
    }
    expect(screen.getByTestId("pos-change")).toHaveTextContent("₮ 10,000");
  });

  it("enables confirm when tendered equals the total", () => {
    const { onConfirm } = renderDialog({ total: 10000 });
    const confirm = screen.getByRole("button", { name: /Батлах/ });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Бүрэн дүн" }));
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({
      method: "cash",
      tendered: 10000,
    });
  });

  it("keeps confirm disabled when tendered is short", () => {
    renderDialog({ total: 10000 });
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    expect(screen.getByRole("button", { name: /Батлах/ })).toBeDisabled();
  });

  it("charges the total for non-cash methods without a keypad", () => {
    const { onConfirm } = renderDialog({ total: 10000 });
    fireEvent.click(screen.getByRole("button", { name: "Карт" }));
    const confirm = screen.getByRole("button", { name: /Батлах/ });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({ method: "card", tendered: 10000 });
  });

  it("passes customer fields through to the result", () => {
    const { onConfirm } = renderDialog({ total: 10000 });
    fireEvent.change(screen.getByLabelText(/Харилцагч/), {
      target: { value: "Бат" },
    });
    fireEvent.change(screen.getByLabelText(/Утас/), {
      target: { value: "99111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Бүрэн дүн" }));
    fireEvent.click(screen.getByRole("button", { name: /Батлах/ }));
    expect(onConfirm).toHaveBeenCalledWith({
      method: "cash",
      tendered: 10000,
      customerName: "Бат",
      customerPhone: "99111111",
    });
  });

  it("shows the server error and the submitting state", () => {
    renderDialog({ error: "Үлдэгдэл хүрэлцэхгүй байна", isSubmitting: true });
    expect(screen.getByText("Үлдэгдэл хүрэлцэхгүй байна")).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: /Хадгалж байна/ });
    expect(confirm).toBeDisabled();
  });
});
