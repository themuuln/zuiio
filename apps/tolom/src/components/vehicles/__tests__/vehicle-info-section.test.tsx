import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { type ReactNode, useRef, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  VehicleFormApi,
  VehicleFormT,
} from "@/components/vehicles/form-sections/_types";
import { VehicleInfoSection } from "@/components/vehicles/form-sections/_vehicle-info-section";
import { zodResolver } from "@/lib/hooks/use-form";
import type { CarBrand, CarModel } from "@/lib/queries/use-car-catalog";
import { carCatalogKeys } from "@/lib/queries/use-car-catalog";
import { vehicleSchema } from "@/lib/validation/vehicle-schema";

const toastMocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastDismiss: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastMocks.toastError(...args),
    success: (...args: unknown[]) => toastMocks.toastSuccess(...args),
    dismiss: (...args: unknown[]) => toastMocks.toastDismiss(...args),
  },
}));

// Combobox test double: mirrors the Base UI contract used by VehicleInfoSection
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

// ColorSelect is rendered inside VehicleInfoSection; stub its Base UI Select.
vi.mock("@/components/ui/select", () => {
  const React = require("react");
  function Select({
    value,
    onValueChange,
    children,
  }: {
    value?: string | null;
    onValueChange?: (value: string | null) => void;
    children?: React.ReactNode;
  }) {
    return (
      <select
        data-testid="select"
        value={value ?? undefined}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onValueChange?.(e.target.value)
        }
      >
        {children}
      </select>
    );
  }
  function SelectTrigger({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  }
  function SelectValue({ placeholder }: { placeholder?: string }) {
    return <span>{placeholder}</span>;
  }
  function SelectContent({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  }
  function SelectItem({
    value,
    children,
  }: {
    value: string;
    children?: React.ReactNode;
  }) {
    return <option value={value}>{children}</option>;
  }
  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup: ({ children }: { children?: React.ReactNode }) => (
      <>{children}</>
    ),
    SelectLabel: () => null,
    SelectSeparator: () => null,
  };
});

const t: VehicleFormT = (key: string) => key;

const BRANDS: CarBrand[] = [
  { id: "b1", name: "Toyota", country: "Japan", is_active: true },
  { id: "b2", name: "Honda", country: "Japan", is_active: true },
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

interface RenderInfoOptions {
  selectedBrand?: CarBrand | null;
  looking?: boolean;
  initialValues?: Record<string, string>;
  children?: ReactNode;
}

function renderInfo(options: RenderInfoOptions = {}) {
  const { selectedBrand = null, looking = false, initialValues = {} } = options;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const handlePlateLookup = vi.fn();
  let form: UseFormReturn<typeof vehicleSchema._type> | undefined;
  function Harness() {
    const plateRef = useRef<HTMLInputElement | null>(null);
    const [newBrandName, setNewBrandName] = useState("");
    const [newModelName, setNewModelName] = useState("");
    form = useForm({
      resolver: zodResolver(vehicleSchema),
      defaultValues: {
        plateNumber: "",
        make: "",
        model: "",
        ...initialValues,
      },
    });
    return (
      <VehicleInfoSection
        form={form as VehicleFormApi}
        t={t}
        brands={BRANDS}
        models={MODELS}
        displayModels={MODELS}
        selectedBrand={selectedBrand}
        newBrandName={newBrandName}
        setNewBrandName={setNewBrandName}
        newModelName={newModelName}
        setNewModelName={setNewModelName}
        plateRef={plateRef}
        looking={looking}
        plateAutoFocus={false}
        handlePlateLookup={handlePlateLookup}
      >
        {options.children}
      </VehicleInfoSection>
    );
  }
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <Harness />
    </QueryClientProvider>,
  );
  return {
    ...utils,
    getForm: () => form as UseFormReturn<typeof vehicleSchema._type>,
    handlePlateLookup,
    queryClient,
  };
}

function plateInput(): HTMLInputElement {
  return screen.getByPlaceholderText("platePlaceholder") as HTMLInputElement;
}

function searchButton(): HTMLButtonElement {
  return plateInput().parentElement?.querySelector(
    "button",
  ) as HTMLButtonElement;
}

function brandCombobox(): HTMLInputElement {
  return screen.getAllByRole("combobox")[0] as HTMLInputElement;
}

function modelCombobox(): HTMLInputElement {
  return screen.getAllByRole("combobox")[1] as HTMLInputElement;
}

describe("VehicleInfoSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the section title and plate field", () => {
    renderInfo();
    expect(screen.getByText("vehicleInformation")).toBeInTheDocument();
    expect(plateInput()).toBeInTheDocument();
  });

  it("renders children after the base fields", () => {
    renderInfo({ children: <div data-testid="extra-child">extra</div> });
    expect(screen.getByTestId("extra-child")).toBeInTheDocument();
  });

  it("disables the plate lookup button while the plate is empty", () => {
    renderInfo();
    expect(searchButton()).toBeDisabled();
  });

  it("enables the plate lookup button once a plate is typed", () => {
    renderInfo();
    fireEvent.change(plateInput(), { target: { value: "1234УНА" } });
    expect(searchButton()).not.toBeDisabled();
  });

  it("keeps the lookup button disabled while looking", () => {
    renderInfo({ looking: true });
    fireEvent.change(plateInput(), { target: { value: "1234УНА" } });
    expect(searchButton()).toBeDisabled();
  });

  it("calls handlePlateLookup from the search button", () => {
    const { handlePlateLookup } = renderInfo();
    fireEvent.change(plateInput(), { target: { value: "1234УНА" } });
    fireEvent.click(searchButton());
    expect(handlePlateLookup).toHaveBeenCalledTimes(1);
  });

  it("calls handlePlateLookup on Enter with a 7+ char plate", () => {
    const { handlePlateLookup } = renderInfo();
    fireEvent.change(plateInput(), { target: { value: "1234УНА" } });
    fireEvent.keyDown(plateInput(), { key: "Enter" });
    expect(handlePlateLookup).toHaveBeenCalledTimes(1);
  });

  it("does not call handlePlateLookup on Enter with a short plate", () => {
    const { handlePlateLookup } = renderInfo();
    fireEvent.change(plateInput(), { target: { value: "123" } });
    fireEvent.keyDown(plateInput(), { key: "Enter" });
    expect(handlePlateLookup).not.toHaveBeenCalled();
  });

  it("transliterates and formats the typed plate into the form", () => {
    const { getForm } = renderInfo();
    fireEvent.change(plateInput(), { target: { value: "1234UNA" } });
    expect(getForm().getValues("plateNumber")).toBe("1234УНА");
  });

  it("selecting a brand sets make and clears the model", () => {
    const { getForm } = renderInfo({
      initialValues: { model: "Camry" },
    });
    const brand = BRANDS[0];
    fireEvent.change(brandCombobox(), { target: { value: "Toy" } });
    fireEvent.click(screen.getByRole("button", { name: brand.name }));
    expect(getForm().getValues("make")).toBe("Toyota");
    expect(getForm().getValues("model")).toBe("");
  });

  it("selecting a model auto-fills catalog fields only when unset", () => {
    const { getForm } = renderInfo({ selectedBrand: BRANDS[0] });
    fireEvent.click(screen.getByRole("button", { name: /Camry/ }));
    expect(getForm().getValues("model")).toBe("Camry");
    expect(getForm().getValues("bodyType")).toBe("Sedan");
    expect(getForm().getValues("fuelType")).toBe("Gasoline");
    expect(getForm().getValues("transmission")).toBe("Automatic");
    expect(getForm().getValues("drivetrain")).toBe("FWD");
    expect(getForm().getValues("engine")).toBe("2.0L");
  });

  it("does not overwrite already-set fields when selecting a model", () => {
    const { getForm } = renderInfo({
      selectedBrand: BRANDS[0],
      initialValues: { bodyType: "SUV", fuelType: "Diesel" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Camry/ }));
    expect(getForm().getValues("model")).toBe("Camry");
    expect(getForm().getValues("bodyType")).toBe("SUV");
    expect(getForm().getValues("fuelType")).toBe("Diesel");
  });

  it("disables the model combobox until a brand is selected", () => {
    renderInfo();
    expect(modelCombobox()).toBeDisabled();
  });

  it("quick-creates a brand via the combobox empty state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "b3", name: "Tesla" }, error: null }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { getForm, queryClient } = renderInfo();
    queryClient.setQueryData(carCatalogKeys.brands(), []);
    fireEvent.change(brandCombobox(), { target: { value: "Tesla" } });
    const addButton = screen.getByRole("button", { name: /Add "Tesla"/ });
    await act(async () => {
      fireEvent.mouseDown(addButton);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/car-brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Tesla" }),
    });
    expect(getForm().getValues("make")).toBe("Tesla");
    expect(getForm().getValues("model")).toBe("");
    expect(toastMocks.toastSuccess).toHaveBeenCalledWith("brandCreated");
    expect(
      queryClient.getQueryState(carCatalogKeys.brands())?.isInvalidated,
    ).toBe(true);
  });

  it("shows a toast when brand creation returns an error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: null, error: { message: "name taken" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    renderInfo();
    fireEvent.change(brandCombobox(), { target: { value: "Tesla" } });
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("button", { name: /Add "Tesla"/ }));
    });
    expect(toastMocks.toastError).toHaveBeenCalledWith("name taken");
  });

  it("shows a toast when brand creation fetch fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);
    renderInfo();
    fireEvent.change(brandCombobox(), { target: { value: "Tesla" } });
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("button", { name: /Add "Tesla"/ }));
    });
    expect(toastMocks.toastError).toHaveBeenCalledWith("failedToCreateBrand");
  });

  it("does not call the API when the new brand name is empty", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderInfo();
    // Empty-state button renders nothing without input, so there is nothing
    // to click; typing spaces should not trigger a request either.
    fireEvent.change(brandCombobox(), { target: { value: "   " } });
    expect(screen.queryByRole("button", { name: /Add/ })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("quick-creates a model under the selected brand", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: "m3", name: "Prius" },
        error: null,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { getForm } = renderInfo({ selectedBrand: BRANDS[0] });
    fireEvent.change(modelCombobox(), { target: { value: "Prius" } });
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("button", { name: /Add "Prius"/ }));
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/car-brands/b1/models",
      expect.objectContaining({ method: "POST" }),
    );
    expect(getForm().getValues("model")).toBe("Prius");
    expect(toastMocks.toastSuccess).toHaveBeenCalledWith("modelCreated");
  });

  it("shows a toast when model creation fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: null, error: { message: "dupe" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    renderInfo({ selectedBrand: BRANDS[0] });
    fireEvent.change(modelCombobox(), { target: { value: "Prius" } });
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("button", { name: /Add "Prius"/ }));
    });
    expect(toastMocks.toastError).toHaveBeenCalledWith("dupe");
  });

  it("displays the plate number error message", () => {
    const { getForm } = renderInfo();
    act(() => {
      getForm().setError("plateNumber", {
        message: "Must be 4 digits + 3 letters",
      });
    });
    expect(
      screen.getByText("Must be 4 digits + 3 letters"),
    ).toBeInTheDocument();
  });

  it("displays the make error message", () => {
    const { getForm } = renderInfo();
    act(() => {
      getForm().setError("make", { message: "Brand is required" });
    });
    expect(screen.getByText("Brand is required")).toBeInTheDocument();
  });

  it("shows the year and odometer values from the form", () => {
    renderInfo({ initialValues: { year: "2020", odometer: "120000" } });
    const yearInput = screen.getByPlaceholderText("2020") as HTMLInputElement;
    const odometerInput = screen.getByPlaceholderText(
      "120000",
    ) as HTMLInputElement;
    expect(yearInput.value).toBe("2020");
    expect(odometerInput.value).toBe("120000");
  });

  it("writes the color via ColorSelect", () => {
    const { getForm } = renderInfo();
    fireEvent.change(screen.getByTestId("select"), {
      target: { value: "Red" },
    });
    expect(getForm().getValues("color")).toBe("Red");
  });
});
