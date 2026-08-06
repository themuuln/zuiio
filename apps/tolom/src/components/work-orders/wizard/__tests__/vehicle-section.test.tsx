import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { VehicleSection } from "../vehicle-section";

// ── Mock useWizardContext ─────────────────────────────────────────────
const mockSetVehicleSearch = vi.fn();
const mockSetSelectedVehicle = vi.fn();
const mockSetShowQuickVehicle = vi.fn();
const mockHandleSelectVehicle = vi.fn();
let mockCtx: Record<string, unknown>;

vi.mock("../wizard-context", () => ({
  useWizardContext: () => mockCtx,
}));

// ── Mock next-intl ────────────────────────────────────────────────────
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

// ── Mock SearchInput ──────────────────────────────────────────────────
vi.mock("@/components/search-input", () => ({
  SearchInput: vi.fn(
    ({
      placeholder,
      loading,
      onSearch,
    }: {
      placeholder?: string;
      loading?: boolean;
      onSearch?: (v: string) => void;
    }) => (
      <input
        data-testid="search-input-mock"
        placeholder={placeholder}
        data-loading={loading ? "true" : "false"}
        onChange={(e) => onSearch?.(e.target.value)}
      />
    ),
  ),
}));

// ── Mock VehicleForm ──────────────────────────────────────────────────
vi.mock("@/components/vehicles/vehicle-form", () => ({
  VehicleForm: vi.fn(
    ({
      onSuccess,
      onCancel,
      mode,
    }: {
      onSuccess: (v: { id: string; plate_number: string }) => void;
      onCancel: () => void;
      mode?: string;
    }) => (
      <div data-testid="vehicle-form-mock">
        <span data-testid="vehicle-form-mode">{mode}</span>
        <button
          type="button"
          data-testid="vehicle-form-success"
          onClick={() => onSuccess({ id: "new-veh-1", plate_number: "NEW001" })}
        >
          Success
        </button>
        <button
          type="button"
          data-testid="vehicle-form-cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    ),
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────
const mockVehicle = {
  id: "veh-1",
  plate_number: "ABC123",
  make: "Toyota",
  model: "Camry",
  year: 2020,
};

function createMockCtx(overrides?: Record<string, unknown>) {
  return {
    isRestoringFromDraft: false,
    selectedVehicle: null,
    vehicleSearch: "",
    vehicles: [],
    vehicleSearching: false,
    showQuickVehicle: false,
    setVehicleSearch: mockSetVehicleSearch,
    setSelectedVehicle: mockSetSelectedVehicle,
    setShowQuickVehicle: mockSetShowQuickVehicle,
    handleSelectVehicle: mockHandleSelectVehicle,
    selectedCustomer: null,
    ...overrides,
  };
}

function renderVehicle() {
  return render(<VehicleSection />, {
    messages: {
      workOrderWizard: {
        vehicle: "vehicle",
        change: "change",
        searchByPlate: "searchByPlate",
        quickCreateVehicle: "quickCreateVehicle",
        newVehicle: "newVehicle",
      },
    },
  });
}

describe("VehicleSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = createMockCtx();
  });

  it("renders restoring skeleton when isRestoringFromDraft", () => {
    mockCtx = createMockCtx({ isRestoringFromDraft: true });
    const { container } = renderVehicle();

    expect(
      container.querySelector('[data-wizard-step="vehicle"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });

  it("shows selected vehicle plate number in item", () => {
    mockCtx = createMockCtx({ selectedVehicle: mockVehicle });
    renderVehicle();

    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("shows selected vehicle info (year, make, model) in item", () => {
    mockCtx = createMockCtx({ selectedVehicle: mockVehicle });
    renderVehicle();

    expect(screen.getByText("2020 Toyota Camry")).toBeInTheDocument();
  });

  it("shows change button when vehicle is selected", () => {
    mockCtx = createMockCtx({ selectedVehicle: mockVehicle });
    renderVehicle();

    expect(screen.getByText("change")).toBeInTheDocument();
  });

  it("calls setSelectedVehicle(null) on change click", async () => {
    const user = userEvent.setup();
    mockCtx = createMockCtx({ selectedVehicle: mockVehicle });
    renderVehicle();

    await user.click(screen.getByText("change"));

    expect(mockSetSelectedVehicle).toHaveBeenCalledWith(null);
  });

  it("shows search input when no vehicle is selected", () => {
    renderVehicle();

    expect(screen.getByTestId("search-input-mock")).toBeInTheDocument();
  });

  it("renders vehicle search results when vehicleSearch and vehicles exist", () => {
    mockCtx = createMockCtx({
      vehicleSearch: "ABC",
      vehicles: [mockVehicle],
    });
    renderVehicle();

    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByText("2020 Toyota Camry")).toBeInTheDocument();
  });

  it("selects a vehicle when search result is clicked", async () => {
    const user = userEvent.setup();
    mockCtx = createMockCtx({
      vehicleSearch: "ABC",
      vehicles: [mockVehicle],
    });
    renderVehicle();

    await user.click(screen.getByText("ABC123"));

    expect(mockHandleSelectVehicle).toHaveBeenCalledWith(mockVehicle);
  });

  it("shows quick create vehicle button when showQuickVehicle is false", () => {
    renderVehicle();

    expect(screen.getByText("quickCreateVehicle")).toBeInTheDocument();
  });

  it("opens quick vehicle form when quick create is clicked", async () => {
    const user = userEvent.setup();
    renderVehicle();

    await user.click(screen.getByText("quickCreateVehicle"));

    expect(mockSetShowQuickVehicle).toHaveBeenCalledWith(true);
  });

  it("shows vehicle form when showQuickVehicle is true", () => {
    mockCtx = createMockCtx({ showQuickVehicle: true });
    renderVehicle();

    expect(screen.getByTestId("vehicle-form-mock")).toBeInTheDocument();
  });

  it("passes mode quick to VehicleForm", () => {
    mockCtx = createMockCtx({ showQuickVehicle: true });
    renderVehicle();

    expect(screen.getByTestId("vehicle-form-mode")).toHaveTextContent("quick");
  });

  it("selects vehicle and closes form on form success", async () => {
    const user = userEvent.setup();
    mockCtx = createMockCtx({
      showQuickVehicle: true,
      selectedCustomer: { id: "cust-1" },
    });
    renderVehicle();

    await user.click(screen.getByTestId("vehicle-form-success"));

    expect(mockHandleSelectVehicle).toHaveBeenCalledWith({
      id: "new-veh-1",
      plate_number: "NEW001",
    });
    expect(mockSetShowQuickVehicle).toHaveBeenCalledWith(false);
  });

  it("closes form on form cancel", async () => {
    const user = userEvent.setup();
    mockCtx = createMockCtx({ showQuickVehicle: true });
    renderVehicle();

    await user.click(screen.getByTestId("vehicle-form-cancel"));

    expect(mockSetShowQuickVehicle).toHaveBeenCalledWith(false);
  });

  it("hides results when vehicleSearch is empty", () => {
    mockCtx = createMockCtx({
      vehicleSearch: "",
      vehicles: [mockVehicle],
    });
    renderVehicle();

    expect(screen.queryByText("2020 Toyota Camry")).not.toBeInTheDocument();
  });

  it("shows wizard step data attribute", () => {
    const { container } = renderVehicle();

    expect(
      container.querySelector('[data-wizard-step="vehicle"]'),
    ).toBeInTheDocument();
  });
});
