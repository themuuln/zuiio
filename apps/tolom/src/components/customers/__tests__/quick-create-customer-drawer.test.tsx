import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuickCreateCustomerDrawer } from "@/components/customers/quick-create-customer-drawer";
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

describe("QuickCreateCustomerDrawer", () => {
  it("renders with title when open", () => {
    render(
      <QuickCreateCustomerDrawer
        open={true}
        onOpenChange={vi.fn()}
        orgId="org-1"
      />,
    );
    expect(screen.getByText("New customer")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(
      <QuickCreateCustomerDrawer
        open={false}
        onOpenChange={vi.fn()}
        orgId="org-1"
      />,
    );
    expect(screen.queryByText("New customer")).not.toBeInTheDocument();
  });

  it("renders the customer form", () => {
    render(
      <QuickCreateCustomerDrawer
        open={true}
        onOpenChange={vi.fn()}
        orgId="org-1"
      />,
    );
    expect(screen.getByTestId("customer-form-mock")).toBeInTheDocument();
  });

  it("calls onCreated when customer form succeeds", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(
      <QuickCreateCustomerDrawer
        open={true}
        onOpenChange={vi.fn()}
        onCreated={onCreated}
        orgId="org-1"
      />,
    );
    await user.click(screen.getByText("Mock Success"));
    expect(onCreated).toHaveBeenCalledWith({ id: "new-customer-id" });
  });

  it("calls onOpenChange(false) when customer form cancels", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <QuickCreateCustomerDrawer
        open={true}
        onOpenChange={onOpenChange}
        orgId="org-1"
      />,
    );
    await user.click(screen.getByText("Mock Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
