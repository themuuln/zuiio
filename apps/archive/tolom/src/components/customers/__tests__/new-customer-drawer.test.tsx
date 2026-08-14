import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewCustomerDrawer } from "@/components/customers/new-customer-drawer";
import { render } from "@/test/test-utils";

vi.mock("@/components/customers/customer-form", () => ({
  CustomerForm: vi.fn(
    ({
      onSuccess,
      onCancel,
    }: {
      onSuccess?: (c: { id: string }) => void;
      onCancel?: () => void;
    }) => (
      <div data-testid="customer-form-mock">
        <button
          type="button"
          onClick={() => onSuccess?.({ id: "new-customer-id" })}
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
  customers: {
    addCustomer: "Add Customer",
    createSubtitle: "Create a new customer",
  },
};

describe("NewCustomerDrawer", () => {
  it("renders with title when open", () => {
    render(<NewCustomerDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByText("Add Customer")).toBeInTheDocument();
  });

  it("renders description when open", () => {
    render(<NewCustomerDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByText("Create a new customer")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(<NewCustomerDrawer open={false} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.queryByText("Add Customer")).not.toBeInTheDocument();
  });

  it("renders the customer form", () => {
    render(<NewCustomerDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByTestId("customer-form-mock")).toBeInTheDocument();
  });

  it("calls onSuccess when customer form succeeds", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(
      <NewCustomerDrawer
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
      />,
      { messages },
    );
    await user.click(screen.getByText("Mock Success"));
    expect(onSuccess).toHaveBeenCalledWith("new-customer-id");
  });

  it("closes when customer form cancels", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<NewCustomerDrawer open={true} onOpenChange={onOpenChange} />, {
      messages,
    });
    await user.click(screen.getByText("Mock Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
