import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BayCardProvider } from "../_bay-card-context";
import { BayCardFooter } from "../_bay-card-footer";
import type { BayCardWorkOrder } from "../_bay-card-types";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

function makeWorkOrder(status: string): BayCardWorkOrder {
  return {
    id: "wo-1",
    bay_number: 1,
    mechanic_id: null,
    status,
    started_at: "2026-08-09T09:00:00Z",
    vehicle: null,
    mechanic: null,
    helpers: [],
    customer_name: null,
  };
}

function renderFooter(
  workOrder: BayCardWorkOrder,
  overrides: Partial<Parameters<typeof BayCardProvider>[0]["value"]> = {},
) {
  const value = {
    woId: workOrder.id,
    status: workOrder.status,
    isPending: false,
    isKanbanMode: false,
    mechanics: [],
    onStatusChange: vi.fn(),
    onRemoveFromBay: vi.fn(),
    onOpenDetail: vi.fn(),
    ...overrides,
  };
  return {
    value,
    ...render(
      <BayCardProvider value={value}>
        <BayCardFooter
          workOrder={workOrder}
          isPending={overrides.isPending ?? false}
        />
      </BayCardProvider>,
    ),
  };
}

describe("BayCardFooter", () => {
  it("shows only the transition button matching the current status", () => {
    renderFooter(makeWorkOrder("New"));
    expect(screen.getByRole("button", { name: "Start" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Repair" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ready" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Complete" })).toBeNull();
  });

  it("shows the Complete button for Ready for Pickup", () => {
    renderFooter(makeWorkOrder("Ready for Pickup"));
    expect(screen.getByRole("button", { name: "Complete" })).toBeTruthy();
  });

  it("calls onStatusChange with the target status", () => {
    const { value } = renderFooter(makeWorkOrder("Diagnosing"));
    fireEvent.click(screen.getByRole("button", { name: "Repair" }));
    expect(value.onStatusChange).toHaveBeenCalledWith("wo-1", "In Progress");
  });

  it("opens the drawer with the add-service action", () => {
    const { value } = renderFooter(makeWorkOrder("New"));
    fireEvent.click(screen.getByRole("button", { name: "addService" }));
    expect(value.onOpenDetail).toHaveBeenCalledWith("wo-1", "add-service");
  });

  it("opens the drawer with the add-part action", () => {
    const { value } = renderFooter(makeWorkOrder("New"));
    fireEvent.click(screen.getByRole("button", { name: "addPart" }));
    expect(value.onOpenDetail).toHaveBeenCalledWith("wo-1", "add-part");
  });

  it("opens the drawer from the note and mechanic buttons", () => {
    const { value } = renderFooter(makeWorkOrder("New"));
    fireEvent.click(screen.getByRole("button", { name: "addNote" }));
    expect(value.onOpenDetail).toHaveBeenCalledWith("wo-1");
    fireEvent.click(screen.getByRole("button", { name: "selectMechanic" }));
    expect(value.onOpenDetail).toHaveBeenCalledTimes(2);
  });

  it("removes the work order from the bay after confirmation", () => {
    const { value } = renderFooter(makeWorkOrder("New"));
    fireEvent.click(screen.getByRole("button", { name: "removeFromBay" }));
    // Trigger + confirm action share the same label once the dialog opens
    const buttons = screen.getAllByRole("button", { name: "removeFromBay" });
    fireEvent.click(buttons[buttons.length - 1]);
    expect(value.onRemoveFromBay).toHaveBeenCalledWith("wo-1");
  });

  it("hides the remove button for completed work orders", () => {
    renderFooter(makeWorkOrder("Completed"));
    expect(screen.queryByRole("button", { name: "removeFromBay" })).toBeNull();
  });

  it("disables footer actions while pending", () => {
    const { value } = renderFooter(makeWorkOrder("New"), { isPending: true });
    expect(
      (screen.getByRole("button", { name: "Start" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "addService" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(value.onStatusChange).not.toHaveBeenCalled();
  });
});
