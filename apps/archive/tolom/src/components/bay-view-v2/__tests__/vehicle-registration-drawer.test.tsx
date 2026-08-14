import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatPlateInput } from "@/lib/form-ux";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import { render } from "@/test/test-utils";
import type { LookupResult } from "../_vehicle-registration-schema";
import { VehicleRegistrationDrawer } from "../vehicle-registration-drawer";

const tMock = vi.hoisted(() => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key}[${Object.values(params).join("|")}]` : key,
}));
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => tMock.t,
  };
});

vi.mock("@/components/ui/detail-drawer", () => ({
  DetailDrawer: Object.assign(
    ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? <div data-testid="detail-drawer">{children}</div> : null,
    {
      Header: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-header">{children}</div>
      ),
      Title: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-title">{children}</div>
      ),
      Description: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-description">{children}</div>
      ),
      Body: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-body">{children}</div>
      ),
      Footer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer">{children}</div>
      ),
      FooterActions: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer-actions">{children}</div>
      ),
    },
  ),
}));

const actionsMock = vi.hoisted(() => ({
  lookupVehicleByPlate: vi.fn(),
  searchVehicles: vi.fn(),
  quickRegisterVehicle: vi.fn(),
  addVehicleToQueue: vi.fn(),
}));
vi.mock("@/lib/services/bay-view-actions", () => ({
  lookupVehicleByPlate: actionsMock.lookupVehicleByPlate,
  searchVehicles: actionsMock.searchVehicles,
  quickRegisterVehicle: actionsMock.quickRegisterVehicle,
  addVehicleToQueue: actionsMock.addVehicleToQueue,
}));

const assignVehicleToBay = vi.fn();
vi.mock("@/lib/services/bay-view-service.actions", () => ({
  assignVehicleToBay: (...args: unknown[]) => assignVehicleToBay(...args),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  dismiss: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: toastMock }));

const onQueued = vi.fn();
const onAssigned = vi.fn();
const onRefresh = vi.fn();
const onOpenChange = vi.fn();

const NOT_EXISTS: LookupResult = {
  exists: false,
  vehicle: null,
  customer: null,
  serviceHistory: [],
};

const EXISTS: LookupResult = {
  exists: true,
  vehicle: {
    id: "v1",
    plate_number: "ABC 1234",
    make: "Toyota",
    model: "Prius",
    year: 2020,
    color: null,
    vin: null,
    engine: null,
    transmission: null,
    fuel_type: null,
    odometer: null,
  },
  customer: null,
  serviceHistory: [],
};

const PLATE = formatPlateInput(transliterateMongolianPlate("ABC1234"));

function renderDrawer(overrides?: {
  open?: boolean;
  assignBayNumber?: number;
  branchId?: string;
}) {
  return render(
    <VehicleRegistrationDrawer
      open={overrides?.open ?? true}
      onOpenChange={onOpenChange}
      onQueued={onQueued}
      onAssigned={onAssigned}
      onRefresh={onRefresh}
      assignBayNumber={overrides?.assignBayNumber}
      branchId={overrides?.branchId}
    />,
  );
}

async function lookupPlate(user: UserEvent) {
  fireEvent.change(screen.getByPlaceholderText("enterPlate"), {
    target: { value: "ABC1234" },
  });
  await user.click(screen.getByRole("button", { name: "lookup" }));
}

describe("VehicleRegistrationDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actionsMock.lookupVehicleByPlate.mockResolvedValue(EXISTS);
    actionsMock.searchVehicles.mockResolvedValue([]);
    actionsMock.quickRegisterVehicle.mockResolvedValue({
      vehicle: { id: "v1" },
      customerId: null,
      isUpdate: false,
    });
    actionsMock.addVehicleToQueue.mockResolvedValue({ workOrderId: "wo1" });
    assignVehicleToBay.mockResolvedValue(undefined);
  });

  it("renders nothing when closed", () => {
    renderDrawer({ open: false });
    expect(screen.queryByTestId("detail-drawer")).not.toBeInTheDocument();
  });

  it("shows the waiting state before any lookup", () => {
    renderDrawer();
    expect(screen.getByText("vehicleRegistration")).toBeInTheDocument();
    expect(screen.getByText("enterPlateAbove")).toBeInTheDocument();
  });

  it("looks up the formatted plate and renders the registration form for a new vehicle", async () => {
    actionsMock.lookupVehicleByPlate.mockResolvedValueOnce(NOT_EXISTS);
    const user = userEvent.setup();
    renderDrawer();

    await lookupPlate(user);

    expect(actionsMock.lookupVehicleByPlate).toHaveBeenCalledWith(PLATE);
    expect(await screen.findByText("vehicleNotFound")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("brand (e.g. Toyota)"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("model (e.g. Prius)"),
    ).toBeInTheDocument();
  });

  it("shows the lookup error banner when the lookup fails", async () => {
    actionsMock.lookupVehicleByPlate.mockRejectedValueOnce(
      new Error("lookup failed"),
    );
    const user = userEvent.setup();
    renderDrawer();

    await lookupPlate(user);

    expect(await screen.findByText("lookup failed")).toBeInTheDocument();
  });

  it("blocks save with validation errors when make/model are missing", async () => {
    actionsMock.lookupVehicleByPlate.mockResolvedValueOnce(NOT_EXISTS);
    const user = userEvent.setup();
    renderDrawer();

    await lookupPlate(user);
    await user.click(
      await screen.findByRole("button", { name: "saveAndAddToQueue" }),
    );

    expect(await screen.findByText("Brand is required")).toBeInTheDocument();
    expect(screen.getByText("Model is required")).toBeInTheDocument();
    expect(actionsMock.quickRegisterVehicle).not.toHaveBeenCalled();
  });

  it("registers the vehicle and queues it with the correct payload", async () => {
    actionsMock.lookupVehicleByPlate
      .mockResolvedValueOnce(NOT_EXISTS)
      .mockResolvedValueOnce(EXISTS);
    const user = userEvent.setup();
    renderDrawer();

    await lookupPlate(user);
    await user.type(
      await screen.findByPlaceholderText("brand (e.g. Toyota)"),
      "Toyota",
    );
    await user.type(screen.getByPlaceholderText("model (e.g. Prius)"), "Prius");
    await user.type(
      screen.getByPlaceholderText("complaintPlaceholder"),
      "  Brakes squeak  ",
    );
    await user.click(screen.getByRole("button", { name: "saveAndAddToQueue" }));

    await waitFor(() => {
      expect(actionsMock.quickRegisterVehicle).toHaveBeenCalledTimes(1);
    });
    expect(actionsMock.quickRegisterVehicle).toHaveBeenCalledWith({
      plateNumber: PLATE,
      make: "Toyota",
      model: "Prius",
      year: undefined,
      color: undefined,
      vin: undefined,
      engine: undefined,
      odometer: undefined,
      customerFirstName: undefined,
      customerLastName: undefined,
      customerPhone: undefined,
    });
    expect(actionsMock.addVehicleToQueue).toHaveBeenCalledWith({
      vehicleId: "v1",
      customerId: undefined,
      complaint: "Brakes squeak",
      branchId: undefined,
    });
    expect(await screen.findByText("vehicleRegistered")).toBeInTheDocument();
    expect(onQueued).toHaveBeenCalledTimes(1);
    expect(onAssigned).not.toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("assigns the new vehicle to the requested bay after queueing", async () => {
    actionsMock.lookupVehicleByPlate
      .mockResolvedValueOnce(NOT_EXISTS)
      .mockResolvedValueOnce(EXISTS);
    const user = userEvent.setup();
    renderDrawer({ assignBayNumber: 4 });

    await lookupPlate(user);
    await user.type(
      await screen.findByPlaceholderText("brand (e.g. Toyota)"),
      "Toyota",
    );
    await user.type(screen.getByPlaceholderText("model (e.g. Prius)"), "Prius");
    await user.click(
      screen.getByRole("button", { name: "saveAndAssignToBay[4]" }),
    );

    await waitFor(() => {
      expect(assignVehicleToBay).toHaveBeenCalledWith("wo1", 4);
    });
    expect(onAssigned).toHaveBeenCalledTimes(1);
    expect(onQueued).not.toHaveBeenCalled();
  });

  it("queues an existing vehicle directly and calls onQueued", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await lookupPlate(user);

    await user.click(
      await screen.findByRole("button", { name: "addToWaitingQueue" }),
    );

    await waitFor(() => {
      expect(actionsMock.addVehicleToQueue).toHaveBeenCalledTimes(1);
    });
    expect(actionsMock.addVehicleToQueue).toHaveBeenCalledWith({
      vehicleId: "v1",
      customerId: undefined,
      complaint: undefined,
      branchId: undefined,
    });
    expect(onQueued).toHaveBeenCalledTimes(1);
    expect(actionsMock.quickRegisterVehicle).not.toHaveBeenCalled();
  });

  it("assigns an existing vehicle to a bay and reports the active bay warning", async () => {
    const user = userEvent.setup();
    renderDrawer({ assignBayNumber: 4 });

    await lookupPlate(user);

    await user.click(
      await screen.findByRole("button", { name: "assignToBayNumber[4]" }),
    );

    await waitFor(() => {
      expect(assignVehicleToBay).toHaveBeenCalledWith("wo1", 4);
    });
    expect(onAssigned).toHaveBeenCalledTimes(1);
    expect(onQueued).not.toHaveBeenCalled();
  });

  it("disables assignment when the vehicle has an active work order", async () => {
    actionsMock.lookupVehicleByPlate.mockResolvedValue({
      ...EXISTS,
      serviceHistory: [
        {
          work_order_id: "wo-old",
          status: "In Progress",
          bay_number: 2,
          created_at: "2026-08-01T09:00:00",
          complaint: null,
          diagnosis: null,
          notes: null,
          total: 0,
          mechanic_name: null,
          services: [],
        },
      ],
    });
    const user = userEvent.setup();
    renderDrawer();

    await lookupPlate(user);

    expect(
      (await screen.findAllByText("vehicleAlreadyInBay[2]")).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole("button", { name: "vehicleAlreadyInBay[2]" }),
    ).toBeDisabled();
  });

  it("closes via the cancel button", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "common.cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
