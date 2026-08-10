import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { VehicleRegistrationForm } from "../_vehicle-registration-form";
import {
  EMPTY_LOOKUP,
  type LookupResult,
} from "../_vehicle-registration-schema";

// ── next-intl: render keys as text (stable assertions) ───────────────
// NOTE: useTranslations must return a STABLE function — components memoize
// effects on `t`; a fresh identity per render would re-run load effects.
const tStub = (key: string) => key;
vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useTranslations: () => tStub,
  useLocale: () => "mn",
}));

const reportServerErrorMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

const bayActionsMock = vi.hoisted(() => ({
  addVehicleToQueue: vi.fn().mockResolvedValue({ workOrderId: "wo-1" }),
  lookupVehicleByPlate: vi.fn(),
  quickRegisterVehicle: vi.fn(),
  searchVehicles: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/services/bay-view-actions", () => bayActionsMock);

const assignVehicleToBayMock = vi.hoisted(() => vi.fn().mockResolvedValue({}));
vi.mock("@/lib/services/bay-view-service.actions", () => ({
  assignVehicleToBay: assignVehicleToBayMock,
}));

// ── Fixtures ──────────────────────────────────────────────────────────

const existingLookup: LookupResult = {
  exists: true,
  vehicle: {
    id: "veh-existing",
    plate_number: "4444УНА",
    make: "Toyota",
    model: "Camry",
    year: 2021,
    color: null,
    vin: null,
    engine: null,
    transmission: null,
    fuel_type: null,
    odometer: 80000,
  },
  customer: {
    id: "cust-existing",
    first_name: "Bat",
    last_name: "Erdene",
    phone: "99112233",
  },
  serviceHistory: [
    {
      work_order_id: "wo-existing",
      status: "Completed",
      bay_number: 2,
      created_at: "2026-08-01T00:00:00Z",
      complaint: null,
      diagnosis: null,
      notes: null,
      total: 50000,
      mechanic_name: null,
      services: [],
    },
  ],
};

async function lookupPlate(
  user: ReturnType<typeof userEvent.setup>,
  plate: string,
) {
  const input = screen.getByPlaceholderText("enterPlate");
  await user.click(input);
  await user.type(input, plate);
  await user.click(screen.getByRole("button", { name: /lookup/ }));
}

async function fillNewVehicleForm(
  user: ReturnType<typeof userEvent.setup>,
  opts: { year?: string } = {},
) {
  await user.type(screen.getByPlaceholderText(/brand/), "Toyota");
  await user.type(screen.getByPlaceholderText(/model/), "Prius");
  if (opts.year) {
    const yearInput = screen.getByPlaceholderText(/year/);
    await user.click(yearInput);
    await user.clear(yearInput);
    await user.type(yearInput, opts.year);
  }
}

describe("VehicleRegistrationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bayActionsMock.lookupVehicleByPlate.mockResolvedValue(EMPTY_LOOKUP);
    bayActionsMock.quickRegisterVehicle.mockResolvedValue({
      vehicle: { id: "veh-1" },
      customerId: "cust-1",
      isUpdate: false,
    });
    bayActionsMock.addVehicleToQueue.mockResolvedValue({ workOrderId: "wo-1" });
  });

  it("shows the waiting state and disables lookup until a plate is typed", async () => {
    const user = userEvent.setup();
    render(<VehicleRegistrationForm bayNumber={2} />);

    expect(screen.getByText("enterPlateAbove")).toBeInTheDocument();
    expect(screen.getByText("timelineWillAppear")).toBeInTheDocument();
    const lookupButton = screen.getByRole("button", { name: /lookup/ });
    expect(lookupButton).toBeDisabled();

    const input = screen.getByPlaceholderText("enterPlate");
    await user.type(input, "4444UNA");
    expect(lookupButton).toBeEnabled();
  });

  it("shows validation errors when a new-vehicle form is submitted empty", async () => {
    const user = userEvent.setup();
    render(<VehicleRegistrationForm bayNumber={2} />);

    await lookupPlate(user, "4444UNA");
    await screen.findByPlaceholderText(/brand/);

    await user.click(screen.getByRole("button", { name: /saveAndAddToQueue/ }));

    expect(await screen.findByText("Brand is required")).toBeInTheDocument();
    expect(screen.getByText("Model is required")).toBeInTheDocument();
    expect(bayActionsMock.quickRegisterVehicle).not.toHaveBeenCalled();
  });

  it("shows a lookup error banner when the lookup fails", async () => {
    const user = userEvent.setup();
    bayActionsMock.lookupVehicleByPlate.mockRejectedValue(
      new Error("lookup exploded"),
    );
    render(<VehicleRegistrationForm bayNumber={2} />);

    await lookupPlate(user, "4444UNA");

    expect(await screen.findByText("lookup exploded")).toBeInTheDocument();
    expect(reportServerErrorMock).toHaveBeenCalled();
  });

  it("registers a new vehicle and queues it with the mapped payload", async () => {
    const user = userEvent.setup();
    const onQueued = vi.fn();
    const onAssigned = vi.fn();
    render(
      <VehicleRegistrationForm
        bayNumber={2}
        branchId="branch-1"
        onQueued={onQueued}
        onAssigned={onAssigned}
      />,
    );

    await lookupPlate(user, "4444UNA");
    await screen.findByPlaceholderText(/brand/);
    await fillNewVehicleForm(user, { year: "2020" });

    await user.click(screen.getByRole("button", { name: /saveAndAddToQueue/ }));

    await waitFor(() =>
      expect(bayActionsMock.quickRegisterVehicle).toHaveBeenCalledWith({
        plateNumber: "4444УНА",
        make: "Toyota",
        model: "Prius",
        year: 2020,
        color: undefined,
        vin: undefined,
        engine: undefined,
        odometer: undefined,
        customerFirstName: undefined,
        customerLastName: undefined,
        customerPhone: undefined,
      }),
    );
    expect(bayActionsMock.addVehicleToQueue).toHaveBeenCalledWith({
      vehicleId: "veh-1",
      customerId: "cust-1",
      complaint: undefined,
      branchId: "branch-1",
    });
    expect(onQueued).toHaveBeenCalledTimes(1);
    expect(onAssigned).not.toHaveBeenCalled();
    expect(await screen.findByText("vehicleRegistered")).toBeInTheDocument();
  });

  it("shows a save error banner and does not queue when registration fails", async () => {
    const user = userEvent.setup();
    const onQueued = vi.fn();
    bayActionsMock.quickRegisterVehicle.mockRejectedValue(
      new Error("save exploded"),
    );
    render(<VehicleRegistrationForm bayNumber={2} onQueued={onQueued} />);

    await lookupPlate(user, "4444UNA");
    await screen.findByPlaceholderText(/brand/);
    await fillNewVehicleForm(user);

    await user.click(screen.getByRole("button", { name: /saveAndAddToQueue/ }));

    expect(await screen.findByText("save exploded")).toBeInTheDocument();
    expect(reportServerErrorMock).toHaveBeenCalled();
    expect(bayActionsMock.addVehicleToQueue).not.toHaveBeenCalled();
    expect(onQueued).not.toHaveBeenCalled();
  });

  it("rejects an invalid customer phone number on submit", async () => {
    const user = userEvent.setup();
    render(<VehicleRegistrationForm bayNumber={2} />);

    await lookupPlate(user, "4444UNA");
    await screen.findByPlaceholderText(/brand/);
    await fillNewVehicleForm(user);

    // Open the customer drawer, type an invalid phone, then close it
    await user.click(screen.getByRole("button", { name: /ownerInfo/ }));
    const phoneInput = await screen.findByPlaceholderText("e.g. 99112233");
    await user.type(phoneInput, "12345");
    await user.click(screen.getByRole("button", { name: /common.save/ }));

    // Submit → validation fails and stores the phone error in form state
    await user.click(screen.getByRole("button", { name: /saveAndAddToQueue/ }));
    expect(bayActionsMock.quickRegisterVehicle).not.toHaveBeenCalled();

    // Re-open the drawer — the persisted field error renders with the field
    await user.click(screen.getByRole("button", { name: /ownerInfo/ }));
    expect(
      await screen.findByText(
        "Enter a valid Mongolian phone number (8 digits)",
      ),
    ).toBeInTheDocument();
  });

  it("queues an existing vehicle without a bay assignment", async () => {
    const user = userEvent.setup();
    const onQueued = vi.fn();
    bayActionsMock.lookupVehicleByPlate.mockResolvedValue(existingLookup);
    render(<VehicleRegistrationForm bayNumber={2} onQueued={onQueued} />);

    await lookupPlate(user, "4444УНА");
    await user.click(
      await screen.findByRole("button", { name: "assignToBayNumber" }),
    );

    await waitFor(() =>
      expect(bayActionsMock.addVehicleToQueue).toHaveBeenCalledWith({
        vehicleId: "veh-existing",
        customerId: "cust-existing",
        complaint: undefined,
        branchId: undefined,
      }),
    );
    expect(onQueued).toHaveBeenCalledTimes(1);
    expect(assignVehicleToBayMock).not.toHaveBeenCalled();
  });

  it("assigns an existing vehicle to the requested bay when assignBayNumber is set", async () => {
    const user = userEvent.setup();
    const onAssigned = vi.fn();
    bayActionsMock.lookupVehicleByPlate.mockResolvedValue(existingLookup);
    render(
      <VehicleRegistrationForm
        bayNumber={2}
        assignBayNumber={5}
        onAssigned={onAssigned}
      />,
    );

    await lookupPlate(user, "4444УНА");
    await user.click(
      await screen.findByRole("button", { name: "assignToBayNumber" }),
    );

    await waitFor(() =>
      expect(assignVehicleToBayMock).toHaveBeenCalledWith("wo-1", 5),
    );
    expect(onAssigned).toHaveBeenCalledTimes(1);
  });

  it("shows the search dropdown and selects a vehicle from it", async () => {
    const user = userEvent.setup();
    bayActionsMock.searchVehicles.mockResolvedValue([
      {
        id: "v-1",
        plate_number: "1111ABC",
        make: "Honda",
        model: "Accord",
        year: 2019,
        color: null,
      },
    ]);
    render(<VehicleRegistrationForm bayNumber={2} />);

    const input = screen.getByPlaceholderText("enterPlate");
    await user.type(input, "TOY");

    await waitFor(() =>
      expect(bayActionsMock.searchVehicles).toHaveBeenCalled(),
    );
    const result = await screen.findByText("1111ABC");
    await user.click(result);

    await waitFor(() =>
      expect(bayActionsMock.lookupVehicleByPlate).toHaveBeenCalledWith(
        "1111ABC",
      ),
    );
    // Lookup resolves to not-found → registration form appears
    expect(await screen.findByPlaceholderText(/brand/)).toBeInTheDocument();
  });

  it("shows the service timeline for an existing vehicle", async () => {
    const user = userEvent.setup();
    bayActionsMock.lookupVehicleByPlate.mockResolvedValue(existingLookup);
    render(<VehicleRegistrationForm bayNumber={2} />);

    await lookupPlate(user, "4444УНА");

    expect(await screen.findByText("serviceTimeline")).toBeInTheDocument();
    expect(screen.getByText("4444УНА")).toBeInTheDocument();
    expect(screen.getByText("Toyota Camry · 2021")).toBeInTheDocument();
  });
});
