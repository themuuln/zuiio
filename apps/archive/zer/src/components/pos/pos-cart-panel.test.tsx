import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PosLine } from "@/lib/pos";
import { PosCartPanel } from "./pos-cart-panel";

const line = (overrides: Partial<PosLine> = {}): PosLine => ({
  productId: "p1",
  productName: "Талх",
  unitPrice: 5000,
  quantity: 2,
  stock: 10,
  imageUrl: null,
  unit: "ш",
  ...overrides,
});

function renderPanel(
  lines: PosLine[] = [],
  callbacks: Partial<{
    onIncrement: (index: number) => void;
    onDecrement: (index: number) => void;
    onRemove: (index: number) => void;
    onEditPrice: (index: number, unitPrice: number) => void;
    onClear: () => void;
    onCharge: () => void;
  }> = {},
) {
  const defaults = {
    onIncrement: vi.fn(),
    onDecrement: vi.fn(),
    onRemove: vi.fn(),
    onEditPrice: vi.fn(),
    onClear: vi.fn(),
    onCharge: vi.fn(),
    ...callbacks,
  };
  return render(
    <PosCartPanel
      lines={lines}
      onIncrement={defaults.onIncrement}
      onDecrement={defaults.onDecrement}
      onRemove={defaults.onRemove}
      onEditPrice={defaults.onEditPrice}
      onClear={defaults.onClear}
      onCharge={defaults.onCharge}
    />,
  );
}

describe("PosCartPanel", () => {
  it("shows the empty hint and a disabled charge action", () => {
    const onCharge = vi.fn();
    renderPanel([], { onCharge });
    expect(screen.getByText("Бүтээгдэхүүн нэмээрэй")).toBeInTheDocument();
    const charge = screen.getByRole("button", { name: "Төлбөр авах" });
    expect(charge).toBeDisabled();
    fireEvent.click(charge);
    expect(onCharge).not.toHaveBeenCalled();
  });

  it("renders lines with quantity, unit price and line total", () => {
    renderPanel([line({ quantity: 2, unitPrice: 5000 })]);
    expect(screen.getByText("Талх")).toBeInTheDocument();
    expect(screen.getAllByText("2")).toHaveLength(2); // qty stepper + count badge
    expect(screen.getByText("₮ 5,000")).toBeInTheDocument(); // unit price
    expect(screen.getAllByText("₮ 10,000")).toHaveLength(2); // line total + subtotal
  });

  it("fires increment, decrement and remove with the line index", () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();
    const onRemove = vi.fn();
    renderPanel([line()], { onIncrement, onDecrement, onRemove });

    fireEvent.click(screen.getByRole("button", { name: "Талх тоо нэмэх" }));
    expect(onIncrement).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByRole("button", { name: "Талх тоо хасах" }));
    expect(onDecrement).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByRole("button", { name: "Талх хасах" }));
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it("edits the line price through the keypad dialog", () => {
    const onEditPrice = vi.fn();
    renderPanel([line()], { onEditPrice });

    fireEvent.click(screen.getByRole("button", { name: "Талх үнэ засах" }));
    expect(screen.getByText("Талх — үнэ")).toBeInTheDocument();

    // Keypad is prefilled with the current price — clear before keying.
    const backspace = screen.getByRole("button", { name: "Устгах" });
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(backspace);
    }
    for (const key of ["4", "0", "0", "0"]) {
      fireEvent.click(screen.getByRole("button", { name: key }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Хадгалах" }));
    expect(onEditPrice).toHaveBeenCalledWith(0, 4000);
  });

  it("clears the cart and charges", () => {
    const onClear = vi.fn();
    const onCharge = vi.fn();
    renderPanel([line()], { onClear, onCharge });

    fireEvent.click(screen.getByRole("button", { name: /Цэвэрлэх/ }));
    expect(onClear).toHaveBeenCalled();

    const charge = screen.getByRole("button", { name: "Төлбөр авах" });
    expect(charge).toBeEnabled();
    fireEvent.click(charge);
    expect(onCharge).toHaveBeenCalled();
  });
});
