import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VehicleDetailDrawer } from "@/components/vehicles/vehicle-detail-drawer";
import { render } from "@/test/test-utils";

// Mock useQuery to control data/loading/error states
const mockUseQuery = vi.fn();
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...(actual as object),
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useQueryClient: () => ({
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    }),
  };
});

// Mock @zuiio/query useOrgMutation — capture configs and mutate fns for assertions
const orgMutationMock = vi.hoisted(() => ({
  configs: [] as Array<Record<string, unknown>>,
  mutates: [] as Array<ReturnType<typeof vi.fn>>,
  useOrgMutation: vi.fn((config: unknown) => {
    orgMutationMock.configs.push(config as Record<string, unknown>);
    const mutate = vi.fn();
    orgMutationMock.mutates.push(mutate);
    return { mutate, isPending: false };
  }),
}));
vi.mock("@zuiio/query", () => ({
  useOrgMutation: orgMutationMock.useOrgMutation,
}));

/** Resolve the mutate fn of the latest render whose config matches. */
function lastMutateFor(
  predicate: (config: Record<string, unknown>) => boolean,
) {
  for (let i = orgMutationMock.configs.length - 1; i >= 0; i--) {
    if (predicate(orgMutationMock.configs[i]))
      return orgMutationMock.mutates[i];
  }
  return undefined;
}

const toastMock = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: toastMock }));

// Mock useCurrentOrg
vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "org-1" },
    isLoading: false,
  }),
}));

// Mock usePageHeader — capture setDetailCustomerId for assertions
const pageHeaderMock = vi.hoisted(() => ({
  setDetailCustomerId: vi.fn(),
}));
vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => pageHeaderMock,
}));

// Mock vehicleKeys
vi.mock("@/lib/queries/keys", () => ({
  vehicleKeys: {
    all: () => ["vehicles"],
    detail: () => ["vehicles", "detail"],
  },
  customerKeys: {
    all: () => ["customers"],
  },
}));

// Mock isValidMongolianPlate — controllable per test
const formValidationMock = vi.hoisted(() => ({
  isValidMongolianPlate: vi.fn(() => true),
}));
vi.mock("@/lib/form-validation", () => formValidationMock);

const messages = {
  common: {
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
    statusLabels: {
      new: "New",
      completed: "Completed",
    },
  },
  vehicles: {
    loading: "Loading",
    vehicleNotFound: "Vehicle not found",
    vehicleUpdated: "Vehicle updated",
    deleted: "Vehicle deleted",
    deleteConfirm: "Are you sure?",
    plateInvalid: "Invalid plate",
    plateNumber: "Plate Number",
    make: "Make",
    model: "Model",
    year: "Year",
    color: "Color",
    vin: "VIN",
    owner: "Owner",
    owners: "Owners",
    odometer: "Odometer",
    notes: "Notes",
    steering: "Steering",
    transmission: "Transmission",
    fuelType: "Fuel type",
    engine: "Engine",
    services: "Services",
    parts: "Parts",
    serviceHistory: "Service History",
    vehicleInformation: "Vehicle Information",
    noPhoneNumber: "No phone",
    plate: "Plate",
    showMore: "Show More",
    showLess: "Show Less",
    saving: "Saving",
    chassisNumber: "Chassis Number",
    trim: "Trim",
    drivetrain: "Drivetrain",
    bodyType: "Body Type",
    seats: "Seats",
    height: "Height",
    width: "Width",
    length: "Length",
    weight: "Weight",
    importDate: "Import Date",
    countryOfOrigin: "Country of Origin",
    category: "Category",
    noServiceHistory: "No service history yet",
    generalService: "General service",
    platePlaceholderEdit: "Plate placeholder",
    brandPlaceholder: "Brand",
    modelPlaceholder: "Model",
    vinPlaceholderEdit: "VIN",
    selectFuelType: "Fuel type",
    selectTransmission: "Transmission",
    selectDrivetrain: "Drivetrain",
    selectBodyType: "Body type",
    licenseExpiry: "License expiry",
    nextService: "Next service",
    steeringPlaceholder: "Steering",
    seatsPlaceholderEdit: "Seats",
    heightPlaceholder: "Height",
    widthPlaceholder: "Width",
    lengthPlaceholder: "Length",
    weightPlaceholder: "Weight",
    countryPlaceholder: "Country",
    categoryPlaceholder: "Category",
  },
};

const mockVehicle = {
  id: "veh-1",
  plate_number: "4444УНА",
  vin: "WBA3A5C5XDF123456",
  chassisNumber: null,
  make: "Toyota",
  model: "Camry",
  year: 2020,
  trim: "XLE",
  color: "White",
  engine: "2.5L",
  fuelType: "Petrol",
  transmission: "Auto",
  drivetrain: "FWD",
  bodyType: "Sedan",
  odometer: 45000,
  steering: "Left",
  seats: 5,
  height: null,
  width: null,
  length: null,
  weight: null,
  importDate: null,
  countryOfOrigin: null,
  category: null,
  licenseExpiryAt: null,
  nextServiceAt: null,
  notes: null,
  status: "active" as const,
  owners: [
    {
      id: "own-1",
      customer_id: "cust-1",
      is_primary: true,
      name: "John Doe",
      phone: "+976 9911-2233",
    },
  ],
  latest_work_order: null,
  recent_services: [],
  service_history: [],
  created_at: "2026-01-01",
  updated_at: "2026-06-01",
};

describe("VehicleDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orgMutationMock.configs.length = 0;
    orgMutationMock.mutates.length = 0;
    formValidationMock.isValidMongolianPlate.mockReturnValue(true);
  });

  it("shows loading state when query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <VehicleDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        vehicleId="veh-1"
      />,
      { messages },
    );

    expect(screen.getByText("Loading")).toBeInTheDocument();
    const spinners = document.querySelectorAll(".animate-spin");
    expect(spinners.length).toBeGreaterThan(0);
  });

  it("shows vehicle plate number when data loaded", () => {
    mockUseQuery.mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        vehicleId="veh-1"
      />,
      { messages },
    );

    const plates = screen.getAllByText("4444УНА");
    expect(plates.length).toBeGreaterThanOrEqual(1);
  });

  it("shows vehicle make/model/year when data loaded", () => {
    mockUseQuery.mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        vehicleId="veh-1"
      />,
      { messages },
    );

    expect(screen.getByText("2020")).toBeInTheDocument();
    expect(screen.getByText("Toyota")).toBeInTheDocument();
    expect(screen.getByText("Camry")).toBeInTheDocument();
  });

  it("shows owner section when owners data present", () => {
    mockUseQuery.mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        vehicleId="veh-1"
      />,
      { messages },
    );

    // Owner section label should be visible
    expect(screen.getByText("Owner")).toBeInTheDocument();
    // Phone number should be in the owner section
    expect(screen.getByText("+976 9911-2233")).toBeInTheDocument();
    // "Vehicle Information" section label should be visible
    expect(screen.getByText("Vehicle Information")).toBeInTheDocument();
    // Plate number in vehicle info section
    expect(screen.getByText("Plate")).toBeInTheDocument();
  });

  it("shows not found state when no data and no error", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        vehicleId="nonexistent"
      />,
      { messages },
    );

    expect(screen.getByText("Vehicle not found")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to fetch"),
    });

    render(
      <VehicleDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        vehicleId="veh-1"
      />,
      { messages },
    );

    expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <VehicleDetailDrawer
        open={false}
        onOpenChange={vi.fn()}
        vehicleId="veh-1"
      />,
      { messages },
    );

    expect(screen.queryByText("Loading")).not.toBeInTheDocument();
  });

  it("opens edit mode and submits the mapped save payload", async () => {
    mockUseQuery.mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer open onOpenChange={vi.fn()} vehicleId="veh-1" />,
      { messages },
    );

    // Enter edit mode via the pencil action
    const pencilButton = document
      .querySelector("button svg.lucide-pencil")
      ?.closest("button") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(pencilButton);
    });

    // Edit make + year, then submit the form
    fireEvent.change(screen.getByLabelText("Make"), {
      target: { value: "Honda" },
    });
    const yearInput = screen.getByLabelText("Year");
    fireEvent.change(yearInput, { target: { value: "2021" } });
    fireEvent.blur(yearInput);

    const form = document.querySelector(
      "form#vehicle-detail-form",
    ) as HTMLFormElement;
    await act(async () => {
      fireEvent.submit(form);
    });

    const editMutate = lastMutateFor((c) => c.method === "PATCH");
    expect(editMutate).toHaveBeenCalledTimes(1);
    expect(editMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        plateNumber: "4444УНА",
        make: "Honda",
        model: "Camry",
        year: "2021",
        vin: "WBA3A5C5XDF123456",
      }),
    );
    expect(orgMutationMock.configs[0]).toMatchObject({
      endpoint: "/api/organizations/org-1/vehicles/veh-1",
      method: "PATCH",
    });
  });

  it("rejects an invalid plate with a toast instead of submitting", async () => {
    mockUseQuery.mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      error: null,
    });
    formValidationMock.isValidMongolianPlate.mockReturnValue(false);

    render(
      <VehicleDetailDrawer open onOpenChange={vi.fn()} vehicleId="veh-1" />,
      { messages },
    );

    const pencilButton = document
      .querySelector("button svg.lucide-pencil")
      ?.closest("button") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(pencilButton);
    });

    const form = document.querySelector(
      "form#vehicle-detail-form",
    ) as HTMLFormElement;
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(toastMock.error).toHaveBeenCalledWith("Invalid plate");
    expect(orgMutationMock.mutates.some((m) => m.mock.calls.length > 0)).toBe(
      false,
    );
  });

  it("cancels editing without submitting", async () => {
    mockUseQuery.mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer open onOpenChange={vi.fn()} vehicleId="veh-1" />,
      { messages },
    );

    const pencilButton = document
      .querySelector("button svg.lucide-pencil")
      ?.closest("button") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(pencilButton);
    });

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(orgMutationMock.mutates.some((m) => m.mock.calls.length > 0)).toBe(
      false,
    );
  });

  it("deletes the vehicle after confirming the alert dialog", async () => {
    mockUseQuery.mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer open onOpenChange={vi.fn()} vehicleId="veh-1" />,
      { messages },
    );

    const trashButton = document
      .querySelector("button svg.lucide-trash-2")
      ?.closest("button") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(trashButton);
    });

    const deleteButton = await screen.findByRole("button", { name: "Delete" });
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    const deleteMutate = lastMutateFor((c) => c.method === "DELETE");
    expect(deleteMutate).toHaveBeenCalledTimes(1);
    const deleteConfig = orgMutationMock.configs.find(
      (c) => c.method === "DELETE",
    );
    expect(deleteConfig).toMatchObject({
      endpoint: "/api/organizations/org-1/vehicles/veh-1",
      method: "DELETE",
    });
  });

  it("navigates to the primary owner's customer page", async () => {
    mockUseQuery.mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      error: null,
    });

    const onOpenChange = vi.fn();
    render(
      <VehicleDetailDrawer
        open
        onOpenChange={onOpenChange}
        vehicleId="veh-1"
      />,
      { messages },
    );

    fireEvent.click(screen.getByText("John Doe"));

    expect(pageHeaderMock.setDetailCustomerId).toHaveBeenCalledWith("cust-1");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the no-phone fallback for owners without a phone", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        ...mockVehicle,
        owners: [
          {
            id: "own-2",
            customer_id: "cust-2",
            is_primary: true,
            name: "Sans Phone",
            phone: null,
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer open onOpenChange={vi.fn()} vehicleId="veh-1" />,
      { messages },
    );

    expect(screen.getByText("Sans Phone")).toBeInTheDocument();
    expect(screen.getByText("No phone")).toBeInTheDocument();
  });

  it("formats the odometer with km", async () => {
    mockUseQuery.mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer open onOpenChange={vi.fn()} vehicleId="veh-1" />,
      { messages },
    );

    expect(screen.getByText("45,000 km")).toBeInTheDocument();
  });

  it("expands the extended vehicle fields and notes", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        ...mockVehicle,
        chassis_number: "CH-123",
        fuel_type: "Petrol",
        steering: "Left",
        seats: 5,
        height: 1450,
        width: 1830,
        import_date: "2021-05-01",
        country_of_origin: "Japan",
        category: "Sedan",
        notes: "Second owner",
      },
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer open onOpenChange={vi.fn()} vehicleId="veh-1" />,
      { messages },
    );

    expect(screen.getByText("Show More")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Show More"));

    expect(screen.getByText("CH-123")).toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("1450 mm")).toBeInTheDocument();
    expect(screen.getByText("Petrol")).toBeInTheDocument();
    expect(screen.getByText("Second owner")).toBeInTheDocument();

    // Toggle back collapses the extra fields
    fireEvent.click(screen.getByText("Show Less"));
    expect(screen.queryByText("CH-123")).not.toBeInTheDocument();
  });

  it("renders service history with part chips and totals", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        ...mockVehicle,
        service_history: [
          {
            id: "wo-1",
            status: "completed",
            description: null,
            complaint: "Engine noise",
            total: 120000,
            created_at: "2026-05-01T09:00:00",
            work_order_services: [],
            work_order_parts: [
              {
                id: "wop-1",
                part_name: "Oil Filter",
                part_number: "OF-1",
                quantity: 2,
                final_price: 8000,
              },
            ],
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer open onOpenChange={vi.fn()} vehicleId="veh-1" />,
      { messages },
    );

    expect(screen.getByText("Engine noise")).toBeInTheDocument();
    expect(screen.getByText(/×2/)).toBeInTheDocument();
    expect(screen.getByText("₮ 120,000")).toBeInTheDocument();
  });

  it("shows the empty service history state", async () => {
    mockUseQuery.mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      error: null,
    });

    render(
      <VehicleDetailDrawer open onOpenChange={vi.fn()} vehicleId="veh-1" />,
      { messages },
    );

    expect(screen.getByText("No service history yet")).toBeInTheDocument();
  });
});
