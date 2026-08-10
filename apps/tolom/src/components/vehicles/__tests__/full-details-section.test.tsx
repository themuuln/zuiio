import { act, fireEvent, render, screen } from "@testing-library/react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { FullDetailsSection } from "@/components/vehicles/form-sections/_full-details-section";
import type {
  VehicleFormApi,
  VehicleFormT,
} from "@/components/vehicles/form-sections/_types";
import { zodResolver } from "@/lib/hooks/use-form";
import { vehicleSchema } from "@/lib/validation/vehicle-schema";

// Minimal select double: mirrors the Base UI contract used by FullDetailsSection
// (value/onValueChange + trigger/value/content/item) without portal machinery.
vi.mock("@/components/ui/select", () => {
  const React = require("react");
  function Select({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
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

function renderFullDetails(
  currentMode: "quick" | "full" = "full",
  initialValues: Record<string, string> = {},
) {
  let form: UseFormReturn<typeof vehicleSchema._type> | undefined;
  function Harness() {
    form = useForm({
      resolver: zodResolver(vehicleSchema),
      defaultValues: { plateNumber: "", make: "", model: "", ...initialValues },
    });
    return (
      <FullDetailsSection
        form={form as VehicleFormApi}
        t={t}
        currentMode={currentMode}
      />
    );
  }
  const utils = render(<Harness />);
  return {
    ...utils,
    getForm: () => form as UseFormReturn<typeof vehicleSchema._type>,
  };
}

describe("FullDetailsSection", () => {
  it("renders nothing in quick mode", () => {
    const { container } = renderFullDetails("quick");
    expect(container.firstChild).toBeNull();
  });

  it("renders all full-mode field labels", () => {
    renderFullDetails();
    for (const label of [
      "vin",
      "chassisNumber",
      "trim",
      "fuelType",
      "transmission",
      "drivetrain",
      "bodyType",
      "seats",
      "licenseExpiry",
      "nextService",
      "importDate",
      "countryOfOrigin",
      "category",
      "steering",
      "height",
      "width",
      "length",
      "weight",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("edits the VIN input and writes to the form", () => {
    const { getForm } = renderFullDetails();
    const vinInput = screen.getByPlaceholderText("vinPlaceholder");
    fireEvent.change(vinInput, { target: { value: "JT3HY86J1X0123456" } });
    expect(getForm().getValues("vin")).toBe("JT3HY86J1X0123456");
  });

  it("shows the current VIN value from the form", () => {
    renderFullDetails("full", { vin: "ABC123" });
    expect(
      (screen.getByPlaceholderText("vinPlaceholder") as HTMLInputElement).value,
    ).toBe("ABC123");
  });

  it("displays a VIN validation error message", () => {
    const { getForm } = renderFullDetails();
    act(() => {
      getForm().setError("vin", { message: "Invalid VIN" });
    });
    expect(screen.getByText("Invalid VIN")).toBeInTheDocument();
  });

  it("sets the fuel type from the select", () => {
    const { getForm } = renderFullDetails();
    const selects = screen.getAllByTestId("select");
    fireEvent.change(selects[0], { target: { value: "Diesel" } });
    expect(getForm().getValues("fuelType")).toBe("Diesel");
  });

  it("sets the transmission from the select", () => {
    const { getForm } = renderFullDetails();
    const selects = screen.getAllByTestId("select");
    fireEvent.change(selects[1], { target: { value: "Manual" } });
    expect(getForm().getValues("transmission")).toBe("Manual");
  });

  it("writes seats through the numeric input on commit", () => {
    const { getForm } = renderFullDetails();
    const seats = screen.getByPlaceholderText("5");
    fireEvent.focus(seats);
    fireEvent.change(seats, { target: { value: "7" } });
    fireEvent.blur(seats);
    expect(getForm().getValues("seats")).toBe("7");
  });

  it("writes the license expiry date input", () => {
    const { getForm } = renderFullDetails();
    const dateInputs = screen.getAllByDisplayValue("");
    const licenseExpiry = dateInputs.find(
      (el) => el.getAttribute("type") === "date",
    );
    fireEvent.change(licenseExpiry as HTMLInputElement, {
      target: { value: "2026-01-01" },
    });
    expect(getForm().getValues("licenseExpiryAt")).toBe("2026-01-01");
  });

  it("edits the chassis number input", () => {
    const { getForm } = renderFullDetails();
    fireEvent.change(screen.getByPlaceholderText("chassisPlaceholder"), {
      target: { value: "JT3HY86J1X0123456" },
    });
    expect(getForm().getValues("chassisNumber")).toBe("JT3HY86J1X0123456");
  });
});
