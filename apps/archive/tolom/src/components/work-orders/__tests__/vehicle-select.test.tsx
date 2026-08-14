import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VehicleSelect } from "@/components/work-orders/vehicle-select";
import type { Vehicle } from "@/lib/types";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockMakes = vi.fn();
const mockModelsByMake = vi.fn();

vi.mock("@/lib/queries/use-vehicle-models", () => ({
  useMakes: (...args: unknown[]) => mockMakes(...args),
  useModelsByMake: (...args: unknown[]) => mockModelsByMake(...args),
}));

vi.mock("@/lib/hooks/use-form", () => ({
  useForm: () => ({
    register: vi.fn(() => ({
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
      name: "plate_number",
    })),
    handleSubmit:
      (fn: (d: unknown) => void) => (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();
        fn({
          plate_number: "4444УНА",
          make: "Toyota",
          model: "Camry",
          year: "2020",
        });
      },
    watch: vi.fn(() => ""),
    formState: { errors: {}, isSubmitting: false },
    reset: vi.fn(),
    setValue: vi.fn(),
  }),
  zodResolver: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: (namespace: string) => (key: string) => {
      const messages: Record<string, Record<string, string>> = {
        workOrderDetail: {
          vehicle: "Vehicle",
          searchByPlate: "Search by plate",
          quickCreateVehicle: "Quick Create Vehicle",
          newVehicle: "New Vehicle",
          platePlaceholder: "Plate number",
          make: "Make",
          model: "Model",
          year: "Year",
          searchMake: "Search make",
          searchModel: "Search model",
          selectMakeFirst: "Select make first",
          noMakesFound: "No makes found",
          noModelsFound: "No models found",
          createAndSelect: "Create & Select",
          failedToCreateVehicle: "Failed to create vehicle",
        },
        common: {
          change: "Change",
          cancel: "Cancel",
          creating: "Creating...",
          networkError: "Network error",
        },
      };
      return messages[namespace]?.[key] ?? key;
    },
  };
});

vi.mock("lucide-react", async () => {
  const actual =
    await vi.importActual<typeof import("lucide-react")>("lucide-react");
  return {
    ...actual,
    Car: () => <svg data-testid="car-icon" />,
    Plus: () => <svg data-testid="plus-icon" />,
  };
});

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/form-validation", () => ({
  isValidMongolianPlate: vi.fn(() => true),
  transliterateMongolianPlate: vi.fn((v: string) => v),
}));

// Mock fetch for vehicle search
vi.stubGlobal(
  "fetch",
  vi.fn().mockRejectedValue(new Error("expected in test")),
);

// ── Test data ─────────────────────────────────────────────────────────

const mockVehicle: Vehicle = {
  id: "veh-1",
  plate_number: "4444УНА",
  make: "Toyota",
  model: "Camry",
  year: 2020,
  customer_id: "cust-1",
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
};

// ── Tests ──────────────────────────────────────────────────────────────

describe("VehicleSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMakes.mockReturnValue({ data: [] });
    mockModelsByMake.mockReturnValue({ data: [] });
  });

  const defaultProps = {
    orgId: "org-1",
    customerId: "cust-1",
    selectedVehicle: null,
    onSelect: vi.fn(),
    onClear: vi.fn(),
  };

  it("renders vehicle search when no vehicle is selected", () => {
    render(<VehicleSelect {...defaultProps} />);
    expect(screen.getByText("Vehicle")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by plate")).toBeInTheDocument();
    expect(screen.getByText("Quick Create Vehicle")).toBeInTheDocument();
  });

  it("renders selected vehicle info when vehicle is provided", () => {
    render(<VehicleSelect {...defaultProps} selectedVehicle={mockVehicle} />);
    expect(screen.getByText("4444УНА")).toBeInTheDocument();
    expect(screen.getByText("2020 Toyota Camry")).toBeInTheDocument();
    expect(screen.getByText("Change")).toBeInTheDocument();
  });
});
