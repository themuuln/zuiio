import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DviCreateDrawer } from "@/components/dvi/dvi-create-drawer";
import { render } from "@/test/test-utils";

// ── Mock factories ─────────────────────────────────────────────

let mockOrg = { orgId: "org-1", orgName: "Test Org", branchId: null };
const mockMutateAsync = vi.fn();
const mockAddItemAsync = vi.fn();
const mockSendAsync = vi.fn();

// ── Hook mocks ────────────────────────────────────────────────

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: vi.fn(() => ({ data: mockOrg, isPending: false })),
}));

vi.mock("@/lib/queries/use-vehicles", () => ({
  useVehicles: vi.fn(() => ({
    data: [
      {
        id: "v1",
        plate_number: "001УНА",
        make: "Toyota",
        model: "Land Cruiser",
        year: 2022,
        color: "White",
        fuel_type: "Diesel",
      },
    ],
    isLoading: false,
  })),
}));

vi.mock("@/lib/queries/use-dvi", () => ({
  useCreateDVInspection: vi.fn(() => ({ mutateAsync: mockMutateAsync })),
  useAddDVIItem: vi.fn(() => ({ mutateAsync: mockAddItemAsync })),
  useSendDVInspection: vi.fn(() => ({ mutateAsync: mockSendAsync })),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock(import("next-intl"), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ArrowRight: () => <svg data-testid="lucide-arrow-right" />,
    Camera: () => <svg data-testid="lucide-camera" />,
    Check: () => <svg data-testid="lucide-check" />,
    ChevronDownIcon: () => <svg data-testid="lucide-chevron-down" />,
    Plus: () => <svg data-testid="lucide-plus" />,
    X: () => <svg data-testid="lucide-x" />,
  };
});

// ── Shared props ──────────────────────────────────────────────

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
};

// ── Helpers ───────────────────────────────────────────────────

function renderDrawer(
  ui: React.ReactElement,
  messages?: Record<string, string>,
) {
  const result = render(ui, messages ? { messages } : undefined);
  return result;
}

// ── Tests ─────────────────────────────────────────────────────

describe("DviCreateDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrg = { orgId: "org-1", orgName: "Test Org", branchId: null };
  });

  it("renders drawer with native vehicle select and options", async () => {
    const { baseElement } = renderDrawer(<DviCreateDrawer {...defaultProps} />);

    // Find the native <select> for vehicle selection by name attribute
    // Base UI renders the drawer content in a portal, so use baseElement
    const select = baseElement.querySelector('select[name="vehicle_id"]');
    expect(select).toBeInTheDocument();

    // Should have the empty placeholder option + the mock vehicle
    expect(select?.querySelectorAll("option").length).toBe(2);

    // The mock vehicle option has the correct value
    const vehicleOption = select?.querySelector('option[value="v1"]');
    expect(vehicleOption).toBeInTheDocument();
    expect(vehicleOption?.textContent).toContain("001УНА");
  });

  it("shows odometer input", async () => {
    renderDrawer(<DviCreateDrawer {...defaultProps} />);

    // Odometer input with placeholder
    const odometer = await screen.findByPlaceholderText(/e\.?g\.?\s*45000/i);
    expect(odometer).toBeInTheDocument();
    expect(odometer).toHaveAttribute("type", "number");
  });

  it("shows fuel level select", async () => {
    renderDrawer(<DviCreateDrawer {...defaultProps} />);

    // Fuel level uses Base UI Select — renders as a button[role="combobox"]
    // It's the second combobox (first is the native <select> for vehicles)
    const comboboxes = screen.getAllByRole("combobox");
    const fuelTrigger = comboboxes[1]; // Second combobox is the fuel level Base UI trigger
    expect(fuelTrigger).toBeInTheDocument();
    expect(fuelTrigger.tagName).toBe("BUTTON");
  });

  it("phase 1 has create button", async () => {
    renderDrawer(<DviCreateDrawer {...defaultProps} />);

    // The submit button shows translation key "create"
    const createButton = await screen.findByRole("button", {
      name: /^create$/i,
    });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute("type", "submit");
  });

  it("has cancel button in footer", async () => {
    renderDrawer(<DviCreateDrawer {...defaultProps} />);

    const cancelButton = screen.getByRole("button", {
      name: /actions\.cancel/i,
    });
    expect(cancelButton).toBeInTheDocument();
  });

  it("can add inspection items after creating inspection", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ id: "dvi-1" });

    const { baseElement } = renderDrawer(<DviCreateDrawer {...defaultProps} />);

    // Phase 1: select a vehicle via the native <select>
    const select = baseElement.querySelector(
      'select[name="vehicle_id"]',
    ) as HTMLSelectElement;
    await user.selectOptions(select, "v1");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /^create$/i });
    await user.click(submitButton);

    // After successful creation, the "Add Item" button appears (phase 2)
    const addItemButton = await screen.findByRole("button", {
      name: /actions\.add_item/i,
    });
    expect(addItemButton).toBeInTheDocument();
  });

  it("shows item fields (category, name, condition, severity)", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ id: "dvi-1" });

    const { baseElement } = renderDrawer(<DviCreateDrawer {...defaultProps} />);

    // Phase 1: select vehicle and create inspection
    const select = baseElement.querySelector(
      'select[name="vehicle_id"]',
    ) as HTMLSelectElement;
    await user.selectOptions(select, "v1");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    // Wait for phase 2, then open item form
    const addItemButton = await screen.findByRole("button", {
      name: /actions\.add_item/i,
    });
    await user.click(addItemButton);

    // Item form fields should appear after clicking Add Item
    // Item name input by placeholder (wait for re-render)
    const itemNameInput = await screen.findByPlaceholderText(
      /e\.?g\.?\s*left front brake/i,
    );
    expect(itemNameInput).toBeInTheDocument();

    // Category label text (use case-insensitive regex)
    expect(screen.getByText(/^category$/i)).toBeInTheDocument();
    // Condition label text
    expect(screen.getByText(/^condition$/i)).toBeInTheDocument();
    // Severity label text
    expect(screen.getByText(/^severity$/i)).toBeInTheDocument();
  });

  it("shows cost and notes for item", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ id: "dvi-1" });

    const { baseElement } = renderDrawer(<DviCreateDrawer {...defaultProps} />);

    // Phase 1
    const select = baseElement.querySelector(
      'select[name="vehicle_id"]',
    ) as HTMLSelectElement;
    await user.selectOptions(select, "v1");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    // Open item form
    const addItemButton = await screen.findByRole("button", {
      name: /actions\.add_item/i,
    });
    await user.click(addItemButton);

    // Cost input by placeholder text from the component: "e.g. 50000"
    const costInput = screen.getByPlaceholderText(/e\.?g\.?\s*50000/i);
    expect(costInput).toBeInTheDocument();
    expect(costInput).toHaveAttribute("type", "number");

    // Notes textarea by placeholder
    const notesTextarea = screen.getByPlaceholderText(/additional notes/i);
    expect(notesTextarea).toBeInTheDocument();
  });

  it("can cancel/remove item form", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ id: "dvi-1" });

    const { baseElement } = renderDrawer(<DviCreateDrawer {...defaultProps} />);

    // Phase 1
    const select = baseElement.querySelector(
      'select[name="vehicle_id"]',
    ) as HTMLSelectElement;
    await user.selectOptions(select, "v1");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    // Open item form
    const addItemButton = await screen.findByRole("button", {
      name: /actions\.add_item/i,
    });
    await user.click(addItemButton);

    // Click cancel to close item form
    const cancelButton = screen.getByRole("button", {
      name: /actions\.cancel/i,
    });
    await user.click(cancelButton);

    // Item form should be closed, "Add Item" button should reappear
    expect(
      screen.getByRole("button", { name: /actions\.add_item/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors when empty form submitted", async () => {
    const user = userEvent.setup();

    const { baseElement } = renderDrawer(<DviCreateDrawer {...defaultProps} />);

    // Click submit without selecting a vehicle
    const submitButton = screen.getByRole("button", { name: /^create$/i });
    await user.click(submitButton);

    // The Phase 1 form has no explicit <FieldError> for the vehicle select,
    // but the Field gets data-invalid="true" after validation fails
    // Wait for the validation to run and mark the field as invalid
    const invalidField = await vi.waitFor(() => {
      const field = baseElement.querySelector('[data-invalid="true"]');
      if (!field) throw new Error("No invalid field found");
      return field;
    });
    expect(invalidField).toBeInTheDocument();
  });

  it("submit calls createDVI mutation", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ id: "dvi-1" });

    const { baseElement } = renderDrawer(<DviCreateDrawer {...defaultProps} />);

    // Phase 1: select vehicle via native <select>
    const select = baseElement.querySelector(
      'select[name="vehicle_id"]',
    ) as HTMLSelectElement;
    await user.selectOptions(select, "v1");

    // Submit
    const submitButton = screen.getByRole("button", { name: /^create$/i });
    await user.click(submitButton);

    // Wait for mutation to be called
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      vehicle_id: "v1",
      notes: undefined,
    });
  });
});
