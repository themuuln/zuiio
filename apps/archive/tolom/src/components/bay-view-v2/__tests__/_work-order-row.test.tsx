import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { WorkOrderListHeader, WorkOrderRow } from "../_work-order-row";

vi.mock("@zuiio/ui", () => ({
  InlineEditableField: ({
    value,
    onSave,
    formatDisplay,
    className,
  }: {
    value: number;
    onSave: (v: number) => void;
    formatDisplay?: (v: number) => string;
    className?: string;
  }) => (
    <button type="button" className={className} onClick={() => onSave(value)}>
      {formatDisplay ? formatDisplay(value) : String(value)}
    </button>
  ),
}));

describe("WorkOrderListHeader", () => {
  it("renders the column labels", () => {
    render(<WorkOrderListHeader name="Item" qty="Qty" price="Price" />);
    expect(screen.getByText("Item")).toBeTruthy();
    expect(screen.getByText("Qty")).toBeTruthy();
    expect(screen.getByText("Price")).toBeTruthy();
  });
});

describe("WorkOrderRow", () => {
  const baseProps = {
    name: "Oil change",
    quantity: 2,
    price: 5000,
    onQtySave: vi.fn(),
    onPriceSave: vi.fn(),
    onDelete: vi.fn(),
  };

  it("renders name, quantity, price and the delete button", () => {
    render(<WorkOrderRow {...baseProps} />);
    expect(screen.getByText("Oil change")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("₮ 5,000")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();
  });

  it("renders subtitle and badge content", () => {
    render(
      <WorkOrderRow
        {...baseProps}
        subtitle={<span>in stock</span>}
        badge={<span>HOT</span>}
      />,
    );
    expect(screen.getByText("in stock")).toBeTruthy();
    expect(screen.getByText("HOT")).toBeTruthy();
  });

  it("saves quantity and price through the editable fields", () => {
    const onQtySave = vi.fn();
    const onPriceSave = vi.fn();
    render(
      <WorkOrderRow
        {...baseProps}
        onQtySave={onQtySave}
        onPriceSave={onPriceSave}
      />,
    );
    fireEvent.click(screen.getByText("2"));
    expect(onQtySave).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByText("₮ 5,000"));
    expect(onPriceSave).toHaveBeenCalledWith(5000);
  });

  it("calls onDelete when the delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<WorkOrderRow {...baseProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("uses the provided delete label", () => {
    render(<WorkOrderRow {...baseProps} deleteLabel="Устгах" />);
    expect(screen.getByRole("button", { name: "Устгах" })).toBeTruthy();
  });
});
