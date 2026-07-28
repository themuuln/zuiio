import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewVehicleDrawer } from "@/components/vehicles/new-vehicle-drawer";
import { render } from "@/test/test-utils";

vi.mock("@/components/vehicles/vehicle-form", () => ({
  VehicleForm: vi.fn(
    ({
      onSuccess,
      onCancel,
    }: {
      onSuccess?: (v: { id: string }) => void;
      onCancel?: () => void;
    }) => (
      <div data-testid="vehicle-form-mock">
        <button
          type="button"
          onClick={() => onSuccess?.({ id: "new-vehicle-id" })}
        >
          Mock Vehicle Success
        </button>
        <button type="button" onClick={onCancel}>
          Mock Vehicle Cancel
        </button>
      </div>
    ),
  ),
}));

const messages = {
  common: {
    cancel: "Cancel",
  },
  vehicles: {
    addVehicle: "Add Vehicle",
    createSubtitle: "Create a new vehicle",
  },
};

describe("NewVehicleDrawer", () => {
  it("renders with title when open", () => {
    render(<NewVehicleDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    // Title appears multiple times (heading + submit button)
    const titles = screen.getAllByText("Add Vehicle");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it("renders description when open", () => {
    render(<NewVehicleDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByText("Create a new vehicle")).toBeInTheDocument();
  });

  it("renders cancel button in footer", () => {
    render(<NewVehicleDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<NewVehicleDrawer open={false} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  it("renders the vehicle form", () => {
    render(<NewVehicleDrawer open={true} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.getByTestId("vehicle-form-mock")).toBeInTheDocument();
  });

  it("calls onSuccess when vehicle form succeeds", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(
      <NewVehicleDrawer
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
      />,
      { messages },
    );
    await user.click(screen.getByText("Mock Vehicle Success"));
    expect(onSuccess).toHaveBeenCalledWith("new-vehicle-id");
  });

  it("closes on cancel button click", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<NewVehicleDrawer open={true} onOpenChange={onOpenChange} />, {
      messages,
    });
    await user.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders with initialPlateNumber", () => {
    render(
      <NewVehicleDrawer
        open={true}
        onOpenChange={vi.fn()}
        initialPlateNumber="ABC123"
      />,
      { messages },
    );
    const titles = screen.getAllByText("Add Vehicle");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });
});
