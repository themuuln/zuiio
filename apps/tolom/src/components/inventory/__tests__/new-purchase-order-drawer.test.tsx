import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewPurchaseOrderDrawer } from "@/components/inventory/new-purchase-order-drawer";
import { render } from "@/test/test-utils";

vi.mock("@/components/inventory/purchase-order-form", () => ({
  PurchaseOrderForm: vi.fn(
    ({
      onSuccess,
      onCancel,
    }: {
      onSuccess?: (po: { id: string }) => void;
      onCancel?: () => void;
    }) => (
      <div data-testid="purchase-order-form-mock">
        <button type="button" onClick={() => onSuccess?.({ id: "new-po-id" })}>
          Mock Success
        </button>
        <button type="button" onClick={onCancel}>
          Mock Cancel
        </button>
      </div>
    ),
  ),
}));

const messages = {
  inventory: {
    newPurchaseOrder: "Шинэ захиалга",
  },
};

describe("NewPurchaseOrderDrawer", () => {
  it("renders with title when open", () => {
    render(<NewPurchaseOrderDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByText("Шинэ захиалга")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(<NewPurchaseOrderDrawer open={false} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.queryByText("Шинэ захиалга")).not.toBeInTheDocument();
  });

  it("renders the purchase order form", () => {
    render(<NewPurchaseOrderDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByTestId("purchase-order-form-mock")).toBeInTheDocument();
  });

  it("closes when purchase order form succeeds", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<NewPurchaseOrderDrawer open={true} onOpenChange={onOpenChange} />, {
      messages,
    });
    await user.click(screen.getByText("Mock Success"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when purchase order form cancels", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<NewPurchaseOrderDrawer open={true} onOpenChange={onOpenChange} />, {
      messages,
    });
    await user.click(screen.getByText("Mock Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
