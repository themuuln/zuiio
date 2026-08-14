import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  VehicleForm,
  type VehicleFormProps,
} from "@/components/vehicles/vehicle-form";
import type { CarBrand, CarModel } from "@/lib/queries/use-car-catalog";
import type { Customer, Vehicle } from "@/lib/types";

// ── Query hook mocks (hoisted so vi.mock factories can reference them) ──

const queryMocks = vi.hoisted(() => ({
  mockCurrentOrg: vi.fn(),
  mockCreateVehicle: vi.fn(),
  mockCustomerSearch: vi.fn(),
  mockAllBrands: vi.fn(),
  mockFilteredBrands: vi.fn(),
  mockFilteredModels: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastDismiss: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: { fallback?: string }) =>
    params?.fallback ?? key,
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => queryMocks.mockCurrentOrg(...args),
}));

vi.mock("@/lib/queries/use-wizard-data", () => ({
  useCreateVehicle: (...args: unknown[]) =>
    queryMocks.mockCreateVehicle(...args),
  useCustomerSearch: (...args: unknown[]) =>
    queryMocks.mockCustomerSearch(...args),
}));

vi.mock("@/lib/queries/use-car-catalog", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/queries/use-car-catalog")
  >("@/lib/queries/use-car-catalog");
  return {
    ...actual,
    useCarBrands: (...args: unknown[]) => queryMocks.mockAllBrands(...args),
    useFilteredCarBrands: (...args: unknown[]) =>
      queryMocks.mockFilteredBrands(...args),
    useFilteredCarModels: (...args: unknown[]) =>
      queryMocks.mockFilteredModels(...args),
  };
});

vi.mock("@/lib/queries/use-org-settings", () => ({
  useOrgSettings: () => ({ settings: null, isLoading: false, error: null }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastMocks.toastError(...args),
    success: (...args: unknown[]) => toastMocks.toastSuccess(...args),
    dismiss: (...args: unknown[]) => toastMocks.toastDismiss(...args),
    warning: vi.fn(),
  },
}));

// CustomerForm is tested separately; stub it so the inline quick-add flow
// can be driven deterministically from the VehicleForm side.
vi.mock("@/components/customers/customer-form", () => ({
  CustomerForm: (props: {
    mode?: string;
    disableFormWrapper?: boolean;
    onSuccess?: (customer: Customer) => void;
    onCancel?: () => void;
  }) => {
    const quickCustomer = {
      id: "q1",
      first_name: "Quick",
      last_name: "Add",
      phone: "90000000",
    } as Customer;
    return (
      <div data-testid="quick-customer-form">
        <button type="button" onClick={() => props.onSuccess?.(quickCustomer)}>
          save-quick-customer
        </button>
        <button type="button" onClick={() => props.onCancel?.()}>
          cancel-quick-customer
        </button>
      </div>
    );
  },
}));

// Combobox test double: mirrors the Base UI contract used by VehicleForm
// (items + function-children list, empty state, onValueChange/onInputValueChange)
// without portal/positioning machinery.
vi.mock("@/components/ui/combobox", () => {
  const React = require("react");
  const ComboboxContext = React.createContext<{
    items: unknown[];
    onValueChange?: (value: unknown) => void;
    onInputValueChange?: (value: string) => void;
    disabled?: boolean;
    inputValue: string;
    setInputValue: (value: string) => void;
    itemToStringLabel?: (item: unknown) => string;
  } | null>(null);

  function MockCombobox({
    items = [],
    onValueChange,
    onInputValueChange,
    disabled = false,
    itemToStringLabel,
    children,
  }: {
    items?: unknown[];
    onValueChange?: (value: unknown) => void;
    onInputValueChange?: (value: string) => void;
    disabled?: boolean;
    isItemEqualToValue?: (a: unknown, b: unknown) => boolean;
    itemToStringLabel?: (item: unknown) => string;
    children?: ReactNode;
  }) {
    const [inputValue, setInputValue] = React.useState("");
    const ctx = {
      items,
      onValueChange,
      onInputValueChange,
      disabled,
      inputValue,
      setInputValue,
      itemToStringLabel,
    };
    return (
      <ComboboxContext.Provider value={ctx}>
        {children}
      </ComboboxContext.Provider>
    );
  }

  function ComboboxInput({
    placeholder,
    disabled,
  }: {
    placeholder?: string;
    disabled?: boolean;
    className?: string;
  }) {
    const ctx = React.useContext(ComboboxContext);
    if (!ctx) return null;
    return (
      <input
        role="combobox"
        aria-expanded={false}
        placeholder={placeholder}
        disabled={disabled ?? ctx.disabled}
        value={ctx.inputValue}
        onChange={(e) => {
          ctx.setInputValue(e.target.value);
          ctx.onInputValueChange?.(e.target.value);
        }}
      />
    );
  }

  function ComboboxList({ children }: { children?: ReactNode }) {
    const ctx = React.useContext(ComboboxContext);
    if (!ctx) return null;
    if (typeof children === "function") {
      return (
        <div>
          {ctx.items.map((item, i) => (
            <React.Fragment key={i}>{children(item)}</React.Fragment>
          ))}
        </div>
      );
    }
    return <div>{children}</div>;
  }

  function ComboboxItem({
    value,
    children,
  }: {
    value: unknown;
    children?: ReactNode;
  }) {
    const ctx = React.useContext(ComboboxContext);
    return (
      <button type="button" onClick={() => ctx?.onValueChange?.(value)}>
        {children}
      </button>
    );
  }

  function ComboboxEmpty({ children }: { children?: ReactNode }) {
    const ctx = React.useContext(ComboboxContext);
    if (!ctx?.inputValue.trim()) return null;
    const matches = ctx.items.filter((item) =>
      (ctx.itemToStringLabel?.(item) ?? "")
        .toLowerCase()
        .includes(ctx.inputValue.toLowerCase()),
    );
    if (matches.length > 0) return null;
    return <div>{children}</div>;
  }

  function Passthrough({ children }: { children?: ReactNode }) {
    return <div>{children}</div>;
  }

  return {
    Combobox: MockCombobox,
    ComboboxInput,
    ComboboxContent: Passthrough,
    ComboboxList,
    ComboboxItem,
    ComboboxEmpty,
    ComboboxValue: Passthrough,
    ComboboxTrigger: Passthrough,
    ComboboxClear: () => null,
    ComboboxGroup: Passthrough,
    ComboboxLabel: Passthrough,
    ComboboxCollection: Passthrough,
    ComboboxSeparator: () => null,
    ComboboxChips: Passthrough,
    ComboboxChip: Passthrough,
    ComboboxChipsInput: () => null,
    CreatableCombobox: Passthrough,
    useComboboxAnchor: () => React.useRef(null),
  };
});

// ── Fixtures ─────────────────────────────────────────────────────────

const BRANDS: CarBrand[] = [
  { id: "b1", name: "Toyota", country: "Japan", is_active: true },
  { id: "b2", name: "Honda", country: "Japan", is_active: true },
];

const ALL_BRANDS: CarBrand[] = [
  ...BRANDS,
  { id: "b-tesla", name: "Tesla", country: "USA", is_active: true },
];

const MODELS: CarModel[] = [
  {
    id: "m1",
    name: "Camry",
    body_type: "Sedan",
    fuel_type: "Gasoline",
    transmission: "Automatic",
    drivetrain: "FWD",
    year_start: 2018,
    year_end: null,
    engine_options: "2.0L, 2.5L",
    is_active: true,
  },
  {
    id: "m2",
    name: "Civic",
    body_type: null,
    fuel_type: null,
    transmission: null,
    drivetrain: null,
    year_start: null,
    year_end: null,
    engine_options: null,
    is_active: true,
  },
];

const CUSTOMERS = [
  {
    id: "c1",
    first_name: "Jane",
    last_name: "Doe",
    phone: "99112233",
    company_name: null,
    contact_person: null,
    full_name: null,
  },
  {
    id: "c2",
    first_name: null,
    last_name: null,
    phone: "88001122",
    company_name: "Zui LLC",
    contact_person: null,
    full_name: null,
  },
  {
    id: "c3",
    first_name: null,
    last_name: null,
    phone: "77778888",
    company_name: null,
    contact_person: null,
    full_name: null,
  },
] as Customer[];

const VEHICLE: Vehicle = {
  id: "veh-1",
  plate_number: "4444УНА",
  make: "Toyota",
  model: "Camry",
  year: 2020,
  customer_id: null,
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
} as Vehicle;

function lookupData(overrides: Record<string, unknown> = {}) {
  return {
    make: "Tesla",
    model: "Model 3",
    year: 2021,
    vin: "VIN123456789",
    engineCc: 2000,
    fuelType: "БЕНЗИН",
    transmission: "АВТОМАТ",
    bodyType: "Седан",
    color: "ХАР",
    country: "Japan",
    seats: 5,
    category: "Passenger",
    importDate: "2019-07-08T00:00:00",
    steering: "Зүүн",
    height: "1450",
    width: "1780",
    length: "4600",
    weight: "1500",
    ...overrides,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────

function renderForm(props: VehicleFormProps = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <VehicleForm {...props} />
    </QueryClientProvider>,
  );
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} in DOM`);
  return value;
}

function plateInput(): HTMLInputElement {
  return required(
    screen.getByPlaceholderText("platePlaceholder") as HTMLInputElement,
    "plate input",
  );
}

function comboboxInputs(): HTMLInputElement[] {
  return Array.from(
    document.querySelectorAll('input[role="combobox"]'),
  ) as HTMLInputElement[];
}

function searchInput(): HTMLInputElement {
  return required(
    document.querySelector('[data-slot="search-input"]') as HTMLInputElement,
    "customer search input",
  );
}

function dateInputs(): HTMLInputElement[] {
  return Array.from(
    document.querySelectorAll('input[type="date"]'),
  ) as HTMLInputElement[];
}

/** Fill the make/model comboboxes and the common fields of the form. */
async function fillRequiredFields(user: UserEvent) {
  await user.type(plateInput(), "4444una");
  await user.click(comboboxInputs()[0]);
  await user.click(screen.getByRole("button", { name: "Toyota" }));
  await user.click(screen.getByRole("button", { name: /^Camry/ }));
}

/** Fill every editable field (full mode) with values matching FULL_PAYLOAD. */
async function fillFullForm(user: UserEvent) {
  await fillRequiredFields(user);

  const year = required(
    screen.getByPlaceholderText("2020") as HTMLInputElement,
    "year input",
  );
  await user.type(year, "2020");
  await user.tab();

  const odometer = required(
    screen.getByPlaceholderText("120000") as HTMLInputElement,
    "odometer input",
  );
  await user.type(odometer, "120000");
  await user.tab();

  await user.type(
    required(
      screen.getByPlaceholderText("vinPlaceholder") as HTMLInputElement,
      "vin input",
    ),
    "JT2BF22K3W0123456",
  );
  await user.type(
    required(
      screen.getByPlaceholderText("chassisPlaceholder") as HTMLInputElement,
      "chassis input",
    ),
    "ABC123",
  );
  await user.type(
    required(
      screen.getByPlaceholderText("trimPlaceholder") as HTMLInputElement,
      "trim input",
    ),
    "LE",
  );
  const engine = required(
    screen.getByPlaceholderText("enginePlaceholder") as HTMLInputElement,
    "engine input",
  );
  await user.clear(engine);
  await user.type(engine, "2.5L");

  const seats = required(
    screen.getByPlaceholderText("5") as HTMLInputElement,
    "seats input",
  );
  await user.type(seats, "5");
  await user.tab();

  const [license, nextService, importDate] = dateInputs();
  fireEvent.change(license, { target: { value: "2027-01-01" } });
  fireEvent.change(nextService, { target: { value: "2026-09-01" } });
  fireEvent.change(importDate, { target: { value: "2019-07-08" } });

  await user.type(
    required(
      screen.getByPlaceholderText("countryPlaceholder") as HTMLInputElement,
      "country input",
    ),
    "Japan",
  );
  await user.type(
    required(
      screen.getByPlaceholderText("categoryPlaceholder") as HTMLInputElement,
      "category input",
    ),
    "Passenger",
  );
  await user.type(
    required(
      screen.getByPlaceholderText("steeringPlaceholder") as HTMLInputElement,
      "steering input",
    ),
    "Left",
  );

  const dims: Array<[string, string]> = [
    ["heightPlaceholder", "1450"],
    ["widthPlaceholder", "1780"],
    ["lengthPlaceholder", "4600"],
    ["weightPlaceholder", "1500"],
  ];
  for (const [placeholder, value] of dims) {
    const input = required(
      screen.getByPlaceholderText(placeholder) as HTMLInputElement,
      `${placeholder} input`,
    );
    await user.type(input, value);
    await user.tab();
  }

  await user.type(
    required(
      screen.getByPlaceholderText("notesPlaceholderForm") as HTMLInputElement,
      "notes textarea",
    ),
    "First owner",
  );
}

function submitButton(): HTMLButtonElement {
  return required(
    screen.getByRole("button", { name: "addVehicle" }) as HTMLButtonElement,
    "submit button",
  );
}

/**
 * Select a Base UI Select item: userEvent clicks get blocked by the popup's
 * `pointer-events: none` during mount transitions in jsdom, while bare
 * fireEvent.click lacks the pointerdown that arms selection. Fire both.
 */
function selectPopupItem(text: string) {
  const item = screen.getByText(text);
  fireEvent.pointerDown(item, { pointerType: "mouse" });
  fireEvent.click(item);
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("VehicleForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryMocks.mockCurrentOrg.mockReturnValue({
      data: { orgId: "org-1" },
      isLoading: false,
    });
    queryMocks.mockCreateVehicle.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(VEHICLE),
      isPending: false,
    });
    queryMocks.mockCustomerSearch.mockReturnValue({
      data: [],
      isFetching: false,
    });
    queryMocks.mockAllBrands.mockReturnValue({ data: ALL_BRANDS });
    queryMocks.mockFilteredBrands.mockReturnValue({ data: BRANDS });
    queryMocks.mockFilteredModels.mockReturnValue({ data: MODELS });
  });

  describe("rendering", () => {
    it("renders all fields, tabs, and submit button in full mode", () => {
      renderForm();

      expect(
        screen.getByRole("tab", { name: "Quick Vehicle" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Full Details" }),
      ).toBeInTheDocument();
      expect(plateInput()).toBeInTheDocument();
      expect(comboboxInputs()).toHaveLength(2);
      expect(screen.getByPlaceholderText("2020")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("120000")).toBeInTheDocument();
      expect(screen.getByText("Select color")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("enginePlaceholder"),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("vinPlaceholder")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("chassisPlaceholder"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("trimPlaceholder"),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("5")).toBeInTheDocument();
      expect(dateInputs()).toHaveLength(3);
      expect(
        screen.getByPlaceholderText("countryPlaceholder"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("categoryPlaceholder"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("steeringPlaceholder"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("heightPlaceholder"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("widthPlaceholder"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("lengthPlaceholder"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("weightPlaceholder"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("notesPlaceholderForm"),
      ).toBeInTheDocument();
      expect(submitButton()).toBeInTheDocument();
      expect(screen.getByText("ownerCustomer")).toBeInTheDocument();
      expect(screen.getByText("quickAddCustomer")).toBeInTheDocument();
      // Model combobox is disabled until a brand is selected
      expect(comboboxInputs()[1]).toBeDisabled();
      expect(comboboxInputs()[1]).toHaveAttribute(
        "placeholder",
        "selectBrandFirst",
      );
    });

    it('renders only quick fields when mode="quick" prop is set', () => {
      renderForm({ mode: "quick" });

      expect(plateInput()).toBeInTheDocument();
      expect(screen.getByPlaceholderText("2020")).toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("vinPlaceholder"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("chassisPlaceholder"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("trimPlaceholder"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("ownerCustomer")).not.toBeInTheDocument();
      expect(screen.queryByText("quickAddCustomer")).not.toBeInTheDocument();
    });

    it("hides full-only fields when switching to the Quick tab", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole("tab", { name: "Quick Vehicle" }));

      expect(
        screen.queryByPlaceholderText("vinPlaceholder"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("ownerCustomer")).not.toBeInTheDocument();
    });

    it("syncs mode back to full when the mode prop changes", async () => {
      const user = userEvent.setup();
      const { rerender } = renderForm({ mode: "quick" });
      expect(
        screen.queryByPlaceholderText("vinPlaceholder"),
      ).not.toBeInTheDocument();

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <VehicleForm mode="full" />
        </QueryClientProvider>,
      );

      expect(screen.getByPlaceholderText("vinPlaceholder")).toBeInTheDocument();
      expect(screen.getByText("ownerCustomer")).toBeInTheDocument();
      void user;
    });

    it("pre-fills initialData and submits it", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm({
        initialData: {
          plateNumber: "1234ABC",
          make: "Toyota",
          model: "Camry",
          year: 2020,
          vin: "VINX",
          odometer: 50000,
          color: "Black",
          seats: 5,
        },
      });

      expect(plateInput().value).toBe("1234ABC");
      expect(
        (screen.getByPlaceholderText("2020") as HTMLInputElement).value,
      ).toBe("2020");
      expect(
        (screen.getByPlaceholderText("120000") as HTMLInputElement).value,
      ).toBe("50000");
      expect(
        (screen.getByPlaceholderText("vinPlaceholder") as HTMLInputElement)
          .value,
      ).toBe("VINX");
      expect(screen.getByText("Black")).toBeInTheDocument();
      expect((screen.getByPlaceholderText("5") as HTMLInputElement).value).toBe(
        "5",
      );

      await user.click(submitButton());

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          plateNumber: "1234ABC",
          make: "Toyota",
          model: "Camry",
          year: 2020,
          vin: "VINX",
          odometer: 50000,
          color: "Black",
          seats: 5,
        }),
      );
    });

    it("hides buttons and sets the custom form id when showButtons=false", () => {
      renderForm({ showButtons: false, formId: "custom-vehicle-form" });

      expect(document.querySelector("form")?.id).toBe("custom-vehicle-form");
      expect(
        screen.queryByRole("button", { name: "addVehicle" }),
      ).not.toBeInTheDocument();
    });

    it("calls onCancel when the cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      renderForm({ onCancel });

      await user.click(screen.getByRole("button", { name: "cancel" }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("validation", () => {
    it("shows required errors for empty plate, make, and model", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(submitButton());

      expect(
        await screen.findByText("Plate number is required"),
      ).toBeInTheDocument();
      expect(screen.getByText("Brand is required")).toBeInTheDocument();
      expect(screen.getByText("Model is required")).toBeInTheDocument();
    });

    it("rejects an invalid plate format", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(plateInput(), "12");
      await user.click(submitButton());

      expect(
        await screen.findByText("Must be 4 digits + 3 letters (e.g. 4444УНА)"),
      ).toBeInTheDocument();
    });

    it("rejects an out-of-range year without calling the mutation", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await fillRequiredFields(user);
      const year = required(
        screen.getByPlaceholderText("2020") as HTMLInputElement,
        "year input",
      );
      await user.type(year, "1800");
      await user.tab();
      await user.click(submitButton());

      expect(
        await screen.findByText("validation.yearInvalid"),
      ).toBeInTheDocument();
      expect(toastMocks.toastError).toHaveBeenCalledWith(
        "validation.yearInvalid",
      );
      expect(mutateAsync).not.toHaveBeenCalled();
    });

    it("rejects seats outside the 1-50 range without calling the mutation", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await fillRequiredFields(user);
      const seats = required(
        screen.getByPlaceholderText("5") as HTMLInputElement,
        "seats input",
      );
      await user.type(seats, "100");
      await user.tab();
      await user.click(submitButton());

      expect(
        await screen.findByText("validation.seatsRange"),
      ).toBeInTheDocument();
      expect(mutateAsync).not.toHaveBeenCalled();
    });

    it("shows an error when no organization is loaded", async () => {
      queryMocks.mockCurrentOrg.mockReturnValue({
        data: undefined,
        isLoading: false,
      });
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await fillRequiredFields(user);
      await user.click(submitButton());

      expect(await screen.findByText("noOrganization")).toBeInTheDocument();
      expect(mutateAsync).not.toHaveBeenCalled();
    });
  });

  describe("submit", () => {
    it("submits the full payload with normalized values and calls onSuccess", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const onSuccess = vi.fn();
      const user = userEvent.setup();
      renderForm({ onSuccess });

      await fillFullForm(user);
      await user.click(submitButton());

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync).toHaveBeenCalledWith({
        plateNumber: "4444УНА",
        make: "Toyota",
        model: "Camry",
        year: 2020,
        customerId: undefined,
        vin: "JT2BF22K3W0123456",
        chassisNumber: "ABC123",
        trim: "LE",
        color: undefined,
        engine: "2.5L",
        fuelType: "Gasoline",
        transmission: "Automatic",
        drivetrain: "FWD",
        bodyType: "Sedan",
        odometer: 120000,
        notes: "First owner",
        licenseExpiryAt: "2027-01-01",
        nextServiceAt: "2026-09-01",
        importDate: "2019-07-08",
        countryOfOrigin: "Japan",
        category: "Passenger",
        seats: 5,
        steering: "Left",
        height: 1450,
        width: 1780,
        length: 4600,
        weight: 1500,
      });
      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(VEHICLE));
    });

    it("submits a minimal payload in quick mode (no full-only keys)", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole("tab", { name: "Quick Vehicle" }));
      await fillRequiredFields(user);
      const year = required(
        screen.getByPlaceholderText("2020") as HTMLInputElement,
        "year input",
      );
      await user.type(year, "2020");
      await user.tab();
      await user.click(submitButton());

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      const payload = mutateAsync.mock.calls[0][0] as Record<string, unknown>;
      expect(payload).toEqual(
        expect.objectContaining({
          plateNumber: "4444УНА",
          make: "Toyota",
          model: "Camry",
          year: 2020,
        }),
      );
      expect(payload.vin).toBeUndefined();
      expect(payload.chassisNumber).toBeUndefined();
      expect(payload.trim).toBeUndefined();
      expect(payload.drivetrain).toBeUndefined();
      expect(payload.bodyType).toBeUndefined();
      expect(payload.seats).toBeUndefined();
      expect(payload.height).toBeUndefined();
      expect(payload.licenseExpiryAt).toBeUndefined();
      expect(payload.importDate).toBeUndefined();
    });

    it("surfaces a mutation Error message and toasts it", async () => {
      const mutateAsync = vi.fn().mockRejectedValue(new Error("boom"));
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await fillRequiredFields(user);
      await user.click(submitButton());

      expect(await screen.findByText("boom")).toBeInTheDocument();
      expect(toastMocks.toastError).toHaveBeenCalledWith("boom");
    });

    it("falls back to the generic message for non-Error rejections", async () => {
      const mutateAsync = vi.fn().mockRejectedValue("boom");
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await fillRequiredFields(user);
      await user.click(submitButton());

      expect(
        await screen.findByText("failedToCreateVehicle"),
      ).toBeInTheDocument();
      expect(toastMocks.toastError).toHaveBeenCalledWith(
        "failedToCreateVehicle",
      );
    });

    it("disables the submit button and shows saving text while pending", async () => {
      let resolveMutation!: (v: Vehicle) => void;
      const mutateAsync = vi.fn(
        () =>
          new Promise<Vehicle>((resolve) => {
            resolveMutation = resolve;
          }),
      );
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const onSuccess = vi.fn();
      const user = userEvent.setup();
      renderForm({ onSuccess });

      await fillRequiredFields(user);
      await user.click(submitButton());

      await waitFor(() => {
        expect(screen.getByText("saving")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "saving" })).toBeDisabled();

      resolveMutation(VEHICLE);
      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(VEHICLE));
    });
  });

  describe("customer owner selection", () => {
    it("searches customers and includes the selected owner in the payload", async () => {
      queryMocks.mockCustomerSearch.mockReturnValue({
        data: CUSTOMERS,
        isFetching: false,
      });
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await user.type(searchInput(), "Jane");
      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Jane Doe"));

      expect(screen.getByText("Jane Doe · 99112233")).toBeInTheDocument();
      await fillRequiredFields(user);
      await user.click(submitButton());

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: "c1" }),
      );
    });

    it("clears the selected customer via the Change button", async () => {
      queryMocks.mockCustomerSearch.mockReturnValue({
        data: CUSTOMERS,
        isFetching: false,
      });
      const user = userEvent.setup();
      renderForm();

      await user.type(searchInput(), "Jane");
      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Jane Doe"));
      expect(screen.getByText("change")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "change" }));

      expect(screen.queryByText("Jane Doe · 99112233")).not.toBeInTheDocument();
      expect(screen.getByText("quickAddCustomer")).toBeInTheDocument();
    });

    it("falls back to company name and phone in the owner label", async () => {
      queryMocks.mockCustomerSearch.mockReturnValue({
        data: CUSTOMERS,
        isFetching: false,
      });
      const user = userEvent.setup();
      renderForm();

      await user.type(searchInput(), "Zui");
      await waitFor(() => {
        expect(screen.getByText("Zui LLC")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Zui LLC"));
      expect(screen.getByText("Zui LLC · 88001122")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "change" }));
      await user.type(searchInput(), "77");
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /77778888/ }),
        ).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /77778888/ }));
      expect(screen.getByText("77778888 · 77778888")).toBeInTheDocument();
    });

    it("pre-selects the owner from customerId via the customers API", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [CUSTOMERS[0]] }),
      });
      vi.stubGlobal("fetch", fetchMock);
      renderForm({ customerId: "c1" });

      expect(
        await screen.findByText("Jane Doe · 99112233"),
      ).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/organizations/org-1/customers?q=c1",
      );
    });

    it("uses the customerId prop in the payload when showOwnerSelect=false", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm({ customerId: "c9", showOwnerSelect: false });

      expect(screen.queryByText("ownerCustomer")).not.toBeInTheDocument();
      await fillRequiredFields(user);
      await user.click(submitButton());

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: "c9" }),
      );
    });

    it("selects a quick-created customer from the inline form", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByText("quickAddCustomer"));
      expect(screen.getByTestId("quick-customer-form")).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "save-quick-customer" }),
      );

      expect(screen.getByText("Quick Add · 90000000")).toBeInTheDocument();
      await fillRequiredFields(user);
      await user.click(submitButton());

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: "q1" }),
      );
    });

    it("cancels the inline quick customer form", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByText("quickAddCustomer"));
      expect(screen.getByTestId("quick-customer-form")).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "cancel-quick-customer" }),
      );

      expect(
        screen.queryByTestId("quick-customer-form"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("quickAddCustomer")).toBeInTheDocument();
    });
  });

  describe("plate lookup", () => {
    it("looks up a plate on Enter, fills the form, and submits mapped values", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: lookupData() }),
      });
      vi.stubGlobal("fetch", fetchMock);
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await user.type(plateInput(), "4444una");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/smartcar/lookup?plate=4444%D0%A3%D0%9D%D0%90",
        );
      });
      await waitFor(() => {
        expect(toastMocks.toastSuccess).toHaveBeenCalledWith("lookupComplete");
      });

      expect(
        (screen.getByPlaceholderText("2020") as HTMLInputElement).value,
      ).toBe("2021");
      expect(
        (screen.getByPlaceholderText("vinPlaceholder") as HTMLInputElement)
          .value,
      ).toBe("VIN123456789");
      expect(
        (screen.getByPlaceholderText("enginePlaceholder") as HTMLInputElement)
          .value,
      ).toBe("2000");
      // Base UI force-mounts select popups after programmatic value changes,
      // so item labels appear both in the trigger and the (closed) popup.
      expect(screen.getAllByText("Gasoline").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Automatic").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Sedan").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Black").length).toBeGreaterThan(0);
      expect(
        (screen.getByPlaceholderText("steeringPlaceholder") as HTMLInputElement)
          .value,
      ).toBe("Left");
      expect(
        (screen.getByPlaceholderText("countryPlaceholder") as HTMLInputElement)
          .value,
      ).toBe("Japan");
      expect(
        (screen.getByPlaceholderText("categoryPlaceholder") as HTMLInputElement)
          .value,
      ).toBe("Passenger");
      expect((screen.getByPlaceholderText("5") as HTMLInputElement).value).toBe(
        "5",
      );
      expect(dateInputs()[2].value).toBe("2019-07-08");

      await user.click(submitButton());

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          plateNumber: "4444УНА",
          make: "Tesla",
          model: "Model 3",
          year: 2021,
          vin: "VIN123456789",
          engine: "2000",
          fuelType: "Gasoline",
          transmission: "Automatic",
          bodyType: "Sedan",
          color: "Black",
          countryOfOrigin: "Japan",
          seats: 5,
          category: "Passenger",
          importDate: "2019-07-08",
          steering: "Left",
          height: 1450,
          width: 1780,
          length: 4600,
          weight: 1500,
        }),
      );
    });

    it("maps multiple Mongolian body types through successive lookups", async () => {
      const fetchMock = vi.fn();
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: lookupData({ bodyType: "Кроссовер" }) }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: lookupData({ bodyType: "Пикап" }) }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: lookupData({ bodyType: "Ван" }) }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: lookupData({ bodyType: "Купе" }) }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: lookupData({ bodyType: "Универсал" }) }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: lookupData({ bodyType: "Фургон", vin: "LAST" }),
          }),
        });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      renderForm();

      await user.type(plateInput(), "4444una");
      for (let i = 0; i < 6; i += 1) {
        // Plate lookup blurs the input; refocus before each Enter.
        await user.click(plateInput());
        await user.keyboard("{Enter}");
        await waitFor(() => {
          expect(toastMocks.toastSuccess).toHaveBeenCalledTimes(i + 1);
        });
      }

      // The unrecognized body type is passed through as-is
      expect(screen.getByText("Фургон")).toBeInTheDocument();
      expect(
        (screen.getByPlaceholderText("vinPlaceholder") as HTMLInputElement)
          .value,
      ).toBe("LAST");
    });

    it("toasts when the plate is too short", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("unexpected"));
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      renderForm();

      await user.type(plateInput(), "1234");
      const searchButton = required(
        plateInput().parentElement?.querySelector("button"),
        "plate lookup button",
      );
      await user.click(searchButton);

      expect(toastMocks.toastError).toHaveBeenCalledWith(
        "enterValidPlateFirst",
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("toasts the server error when the lookup response is not ok", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "SmartCar is down" }),
      });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      renderForm();

      await user.type(plateInput(), "4444una");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(toastMocks.toastError).toHaveBeenCalledWith("SmartCar is down");
      });
    });

    it("toasts a retry message when the lookup fetch throws", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      renderForm();

      await user.type(plateInput(), "4444una");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(toastMocks.toastError).toHaveBeenCalledWith(
          "lookupFailedTryAgain",
        );
      });
    });
  });

  describe("car catalog", () => {
    it("auto-fills model metadata when a model with details is selected", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await user.type(plateInput(), "4444una");
      await user.click(comboboxInputs()[0]);
      await user.click(screen.getByRole("button", { name: "Toyota" }));
      expect(comboboxInputs()[1]).not.toBeDisabled();

      await user.click(screen.getByRole("button", { name: /^Camry/ }));

      expect(
        (screen.getByPlaceholderText("enginePlaceholder") as HTMLInputElement)
          .value,
      ).toBe("2.0L");
      // Base UI force-mounts select popups after programmatic value changes,
      // so item labels appear both in the trigger and the (closed) popup.
      expect(screen.getAllByText("Gasoline").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Automatic").length).toBeGreaterThan(0);
      expect(
        screen.getAllByText("FWD (Front Wheel Drive)").length,
      ).toBeGreaterThan(0);
      expect(screen.getAllByText("Sedan").length).toBeGreaterThan(0);

      await user.click(submitButton());

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          make: "Toyota",
          model: "Camry",
          engine: "2.0L",
          fuelType: "Gasoline",
          transmission: "Automatic",
          drivetrain: "FWD",
          bodyType: "Sedan",
        }),
      );
    });

    it("does not auto-fill metadata for models without details", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(comboboxInputs()[0]);
      await user.click(screen.getByRole("button", { name: "Honda" }));
      await user.click(screen.getByRole("button", { name: "Civic" }));

      expect(
        (screen.getByPlaceholderText("enginePlaceholder") as HTMLInputElement)
          .value,
      ).toBe("");
    });

    it("selects values from the full-mode dropdowns", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      // Use a model without metadata so the select fields start empty
      await user.type(plateInput(), "4444una");
      await user.click(comboboxInputs()[0]);
      await user.click(screen.getByRole("button", { name: "Honda" }));
      await user.click(screen.getByRole("button", { name: "Civic" }));

      await user.click(screen.getByText("Select color"));
      selectPopupItem("Black");

      await user.click(screen.getByText("selectFuelType"));
      selectPopupItem("Diesel");

      await user.click(screen.getByText("selectTransmission"));
      selectPopupItem("Manual");

      await user.click(screen.getByText("selectDrivetrain"));
      selectPopupItem("AWD (All Wheel Drive)");

      await user.click(screen.getByText("selectBodyType"));
      selectPopupItem("SUV");

      await user.click(submitButton());

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "Black",
          fuelType: "Diesel",
          transmission: "Manual",
          drivetrain: "AWD",
          bodyType: "SUV",
        }),
      );
    });
  });

  describe("create brand / model", () => {
    it("creates a brand from the combobox empty state", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: "b9", name: "Tesla" } }),
      });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      renderForm();

      await user.type(comboboxInputs()[0], "Tesla");
      await user.click(screen.getByRole("button", { name: 'Add "Tesla"' }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/car-brands",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Tesla" }),
          }),
        );
      });
      expect(toastMocks.toastSuccess).toHaveBeenCalledWith("brandCreated");
    });

    it("toasts the server error when creating a brand fails", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: null,
          error: { message: "duplicate brand" },
        }),
      });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      renderForm();

      await user.type(comboboxInputs()[0], "Tesla");
      await user.click(screen.getByRole("button", { name: 'Add "Tesla"' }));

      await waitFor(() => {
        expect(toastMocks.toastError).toHaveBeenCalledWith("duplicate brand");
      });
    });

    it("toasts a fallback when creating a brand throws", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      renderForm();

      await user.type(comboboxInputs()[0], "Tesla");
      await user.click(screen.getByRole("button", { name: 'Add "Tesla"' }));

      await waitFor(() => {
        expect(toastMocks.toastError).toHaveBeenCalledWith(
          "failedToCreateBrand",
        );
      });
    });

    it("creates a model for the selected brand and submits it", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: "m9", name: "Land Cruiser" } }),
      });
      vi.stubGlobal("fetch", fetchMock);
      const mutateAsync = vi.fn().mockResolvedValue(VEHICLE);
      queryMocks.mockCreateVehicle.mockReturnValue({
        mutateAsync,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();

      await user.type(plateInput(), "4444una");
      await user.click(comboboxInputs()[0]);
      await user.click(screen.getByRole("button", { name: "Toyota" }));
      await user.type(comboboxInputs()[1], "Land Cruiser");
      await user.click(
        screen.getByRole("button", { name: 'Add "Land Cruiser"' }),
      );

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/car-brands/b1/models",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ name: "Land Cruiser" }),
          }),
        );
      });
      expect(toastMocks.toastSuccess).toHaveBeenCalledWith("modelCreated");

      await user.click(submitButton());

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          make: "Toyota",
          model: "Land Cruiser",
        }),
      );
    });

    it("toasts the server error when creating a model fails", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: null,
          error: { message: "duplicate model" },
        }),
      });
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      renderForm();

      await user.click(comboboxInputs()[0]);
      await user.click(screen.getByRole("button", { name: "Toyota" }));
      await user.type(comboboxInputs()[1], "Land Cruiser");
      await user.click(
        screen.getByRole("button", { name: 'Add "Land Cruiser"' }),
      );

      await waitFor(() => {
        expect(toastMocks.toastError).toHaveBeenCalledWith("duplicate model");
      });
    });
  });
});
