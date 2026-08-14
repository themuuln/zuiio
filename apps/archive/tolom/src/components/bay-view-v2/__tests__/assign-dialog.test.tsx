import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BayViewWorkOrder } from "@/lib/services/bay-view-service";
import type { Vehicle } from "@/lib/types";
import { formatPlateNumber } from "@/lib/utils";
import { render } from "@/test/test-utils";
import { AssignDialog } from "../assign-dialog";

vi.mock("@/lib/queries/use-vehicle-search", () => ({
  useVehicleSearch: (search: string) => ({
    data: search.trim() ? vehicleSearchMock.data : [],
    isFetching: false,
  }),
}));

const vehicleSearchMock = vi.hoisted(() => ({
  data: [] as {
    id: string;
    plate_number: string;
    make: string;
    model: string;
    year: number | null;
    color: string | null;
    customer: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    } | null;
  }[],
}));

const addVehicleToQueue = vi.fn();
vi.mock("@/lib/services/bay-view-actions", () => ({
  addVehicleToQueue: (...args: unknown[]) => addVehicleToQueue(...args),
}));

vi.mock("@/components/vehicles/new-vehicle-drawer", () => ({
  NewVehicleDrawer: () => null,
}));

vi.mock("@/components/customers/new-customer-drawer", () => ({
  NewCustomerDrawer: () => null,
}));

vi.mock("@/lib/sentry-report", () => ({
  reportError: vi.fn(),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const onAssign = vi.fn();
const onOpenChange = vi.fn();

const QUEUE_WO: BayViewWorkOrder & { vehicle: Vehicle | null } = {
  id: "wo1",
  vehicle_id: "v1",
  bay_number: null,
  mechanic_id: null,
  queue_order: 1,
  vehicle: {
    id: "v1",
    plate_number: "ABC1234",
    make: "Toyota",
    model: "Prius",
    year: 2020,
    color: null,
  } as Vehicle,
} as BayViewWorkOrder & { vehicle: Vehicle | null };

const MECHANICS = [
  { id: "m1", full_name: "Bat Erdene" },
  { id: "m2", full_name: "Saraa" },
];

function renderDialog(overrides?: {
  open?: boolean;
  queue?: (BayViewWorkOrder & { vehicle: Vehicle | null })[];
  mechanics?: { id: string; full_name: string | null }[];
}) {
  return render(
    <AssignDialog
      open={overrides?.open ?? true}
      onOpenChange={onOpenChange}
      bayNumber={3}
      queue={overrides?.queue ?? [QUEUE_WO]}
      mechanics={overrides?.mechanics ?? MECHANICS}
      onAssign={onAssign}
      branchId="b1"
    />,
  );
}

describe("AssignDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicleSearchMock.data = [];
    addVehicleToQueue.mockResolvedValue({ workOrderId: "wo9" });
    onAssign.mockResolvedValue(undefined);
  });

  it("renders nothing when closed", () => {
    renderDialog({ open: false });
    expect(screen.queryByText(/Assign to Bay/)).not.toBeInTheDocument();
  });

  it("lists queue vehicles and assigns the selected one to the bay", async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(
      screen.getByRole("heading", { name: "Assign to Bay #3" }),
    ).toBeInTheDocument();
    expect(screen.getByText(formatPlateNumber("ABC1234"))).toBeInTheDocument();

    await user.click(screen.getByText(formatPlateNumber("ABC1234")));
    const assignBtn = screen.getByRole("button", { name: /Assign to Bay #3/ });
    await waitFor(() => {
      expect(assignBtn).not.toBeDisabled();
    });
    await user.click(assignBtn);

    await waitFor(() => {
      expect(onAssign).toHaveBeenCalledWith("wo1", undefined);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("passes the lead mechanic id when one is toggled on", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(
      screen.getByRole("checkbox", { name: "Toggle Bat Erdene" }),
    );
    await user.click(screen.getByText(formatPlateNumber("ABC1234")));
    const assignBtn = screen.getByRole("button", { name: /Assign to Bay #3/ });
    await waitFor(() => {
      expect(assignBtn).not.toBeDisabled();
    });
    await user.click(assignBtn);

    await waitFor(() => {
      expect(onAssign).toHaveBeenCalledWith("wo1", "m1");
    });
  });

  it("shows the empty state when there are no queue vehicles", () => {
    renderDialog({ queue: [] });
    expect(screen.getByText("No vehicles in queue")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Vehicle" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Customer" }),
    ).toBeInTheDocument();
  });

  it("filters the queue list client-side by search term", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByPlaceholderText("Search by plate, make, or model..."),
      "prius",
    );

    expect(screen.getByText(formatPlateNumber("ABC1234"))).toBeInTheDocument();

    await user.clear(
      screen.getByPlaceholderText("Search by plate, make, or model..."),
    );
    await user.type(
      screen.getByPlaceholderText("Search by plate, make, or model..."),
      "nonexistent",
    );

    expect(screen.getByText("No vehicles found")).toBeInTheDocument();
  });

  it("creates a work order for a searched vehicle and assigns it", async () => {
    vehicleSearchMock.data = [
      {
        id: "v9",
        plate_number: "XYZ9999",
        make: "Honda",
        model: "Civic",
        year: 2021,
        color: null,
        customer: {
          id: "c9",
          first_name: "Dorj",
          last_name: null,
          phone: null,
        },
      },
    ];
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByPlaceholderText("Search by plate, make, or model..."),
      "Honda",
    );

    const result = await screen.findByText(formatPlateNumber("XYZ9999"));
    await act(async () => {
      await user.click(result);
    });

    await waitFor(() => {
      expect(addVehicleToQueue).toHaveBeenCalledWith({
        vehicleId: "v9",
        customerId: "c9",
        complaint: "",
        branchId: "b1",
      });
    });

    const assignBtn = screen.getByRole("button", { name: /Assign to Bay #3/ });
    await act(async () => {
      await user.click(assignBtn);
    });

    await waitFor(() => {
      expect(onAssign).toHaveBeenCalledWith("wo9", undefined);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps the dialog open when the assignment fails", async () => {
    onAssign.mockRejectedValue(new Error("assign failed"));
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByText(formatPlateNumber("ABC1234")));
    const assignBtn = screen.getByRole("button", { name: /Assign to Bay #3/ });
    await waitFor(() => {
      expect(assignBtn).not.toBeDisabled();
    });
    await user.click(assignBtn);

    await waitFor(() => {
      expect(onAssign).toHaveBeenCalledWith("wo1", undefined);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("shows no mechanics message when the list is empty", () => {
    renderDialog({ mechanics: [] });
    expect(screen.getByText("No mechanics registered")).toBeInTheDocument();
  });
});
