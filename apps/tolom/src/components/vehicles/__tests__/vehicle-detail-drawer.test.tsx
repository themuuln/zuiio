import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

// Mock @zuiio/query useOrgMutation
vi.mock("@zuiio/query", () => ({
  useOrgMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock useCurrentOrg
vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "org-1" },
    isLoading: false,
  }),
}));

// Mock usePageHeader
vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => ({
    setDetailCustomerId: vi.fn(),
  }),
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

// Mock isValidMongolianPlate
vi.mock("@/lib/form-validation", () => ({
  isValidMongolianPlate: () => true,
}));

const messages = {
  common: {
    cancel: "Cancel",
    delete: "Delete",
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
});
