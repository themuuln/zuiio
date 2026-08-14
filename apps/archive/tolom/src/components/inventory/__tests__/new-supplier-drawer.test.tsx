import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewSupplierDrawer } from "@/components/inventory/new-supplier-drawer";
import { render } from "@/test/test-utils";

vi.mock("@/components/inventory/supplier-form", () => ({
  SupplierForm: vi.fn(
    ({
      onSuccess,
      onCancel,
    }: {
      onSuccess?: (s: { id: string }) => void;
      onCancel?: () => void;
    }) => (
      <div data-testid="supplier-form-mock">
        <button
          type="button"
          onClick={() => onSuccess?.({ id: "new-supplier-id" })}
        >
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
    newSupplier: "Шинэ нийлүүлэгч",
    newSupplierDescription: "Create a new supplier",
  },
};

describe("NewSupplierDrawer", () => {
  it("renders with title when open", () => {
    render(<NewSupplierDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByText("Шинэ нийлүүлэгч")).toBeInTheDocument();
  });

  it("renders description when open", () => {
    render(<NewSupplierDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByText("Create a new supplier")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(<NewSupplierDrawer open={false} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.queryByText("Шинэ нийлүүлэгч")).not.toBeInTheDocument();
  });

  it("renders the supplier form", () => {
    render(<NewSupplierDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByTestId("supplier-form-mock")).toBeInTheDocument();
  });

  it("closes when supplier form succeeds", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<NewSupplierDrawer open={true} onOpenChange={onOpenChange} />, {
      messages,
    });
    await user.click(screen.getByText("Mock Success"));
    // onSuccess from the drawer has no onSuccess prop, so it only triggers onOpenChange
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when supplier form cancels", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<NewSupplierDrawer open={true} onOpenChange={onOpenChange} />, {
      messages,
    });
    await user.click(screen.getByText("Mock Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
