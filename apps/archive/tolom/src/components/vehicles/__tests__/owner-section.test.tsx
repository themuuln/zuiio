import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  getCustomerLabel,
  OwnerSection,
} from "@/components/vehicles/form-sections/_owner-section";
import type {
  CommonT,
  VehicleFormApi,
  VehicleFormT,
} from "@/components/vehicles/form-sections/_types";
import type { Customer } from "@/lib/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// CustomerForm is tested separately; stub it so the inline quick-add flow
// can be driven deterministically from the OwnerSection side.
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

const t: VehicleFormT = (key: string) => key;
const commonT: CommonT = (key: string) => key;

const CUSTOMER: Customer = {
  id: "c1",
  first_name: "Bat",
  last_name: "Erdene",
  phone: "99001122",
} as Customer;

function makeForm(errors: Record<string, unknown> = {}) {
  return { formState: { errors } } as unknown as VehicleFormApi;
}

function renderOwner(
  overrides: Partial<Parameters<typeof OwnerSection>[0]> = {},
) {
  const setSelectedCustomer = vi.fn();
  const setCustomerSearch = vi.fn();
  const setShowQuickCustomer = vi.fn();
  const props: Parameters<typeof OwnerSection>[0] = {
    form: makeForm(),
    selectedCustomer: null,
    setSelectedCustomer,
    customerSearch: "",
    setCustomerSearch,
    customerResults: [],
    customerSearching: false,
    showQuickCustomer: false,
    setShowQuickCustomer,
    t,
    commonT,
    ...overrides,
  };
  const utils = render(<OwnerSection {...props} />);
  return {
    ...utils,
    setSelectedCustomer,
    setCustomerSearch,
    setShowQuickCustomer,
  };
}

describe("getCustomerLabel", () => {
  it("joins first and last name", () => {
    expect(
      getCustomerLabel({ first_name: "Bat", last_name: "Erdene" } as Customer),
    ).toBe("Bat Erdene");
  });

  it("falls back through company, contact, full name and phone", () => {
    expect(
      getCustomerLabel({ first_name: "", company_name: "Zui LLC" } as Customer),
    ).toBe("Zui LLC");
    expect(
      getCustomerLabel({
        first_name: "",
        contact_person: "Temuulen",
      } as Customer),
    ).toBe("Temuulen");
    expect(
      getCustomerLabel({ first_name: "", full_name: "Bat Erdene" } as Customer),
    ).toBe("Bat Erdene");
    expect(
      getCustomerLabel({ first_name: "", phone: "99001122" } as Customer),
    ).toBe("99001122");
  });

  it("uses the fallback when every field is empty", () => {
    expect(getCustomerLabel({} as Customer)).toBe("Unnamed customer");
    expect(getCustomerLabel({} as Customer, "Unknown")).toBe("Unknown");
  });
});

describe("OwnerSection", () => {
  it("shows the selected customer with phone and a change button", () => {
    renderOwner({ selectedCustomer: CUSTOMER });
    expect(screen.getByText("Bat Erdene")).toBeInTheDocument();
    expect(screen.getByText("99001122")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "change" })).toBeInTheDocument();
  });

  it("clears the selected customer when change is clicked", () => {
    const { setSelectedCustomer } = renderOwner({
      selectedCustomer: CUSTOMER,
    });
    fireEvent.click(screen.getByRole("button", { name: "change" }));
    expect(setSelectedCustomer).toHaveBeenCalledWith(null);
  });

  it("renders the customer search input when no customer is selected", () => {
    renderOwner();
    expect(
      screen.getByPlaceholderText("searchPlaceholder"),
    ).toBeInTheDocument();
  });

  it("calls setCustomerSearch after the debounce when typing", async () => {
    const { setCustomerSearch } = renderOwner();
    fireEvent.change(screen.getByPlaceholderText("searchPlaceholder"), {
      target: { value: "Bat" },
    });
    await waitFor(() => expect(setCustomerSearch).toHaveBeenCalledWith("Bat"), {
      timeout: 1500,
    });
  });

  it("renders search results and selects one on click", () => {
    const { setSelectedCustomer } = renderOwner({
      customerSearch: "Bat",
      customerResults: [CUSTOMER],
    });
    expect(screen.getByText("Bat Erdene")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Bat Erdene/ }));
    expect(setSelectedCustomer).toHaveBeenCalledWith(CUSTOMER);
  });

  it("does not render results when the search is empty", () => {
    renderOwner({ customerResults: [CUSTOMER] });
    expect(screen.queryByText("Bat Erdene")).toBeNull();
  });

  it("opens the quick customer form via the dashed button", () => {
    const { setShowQuickCustomer } = renderOwner();
    fireEvent.click(screen.getByRole("button", { name: "quickAddCustomer" }));
    expect(setShowQuickCustomer).toHaveBeenCalledWith(true);
  });

  it("renders the inline customer form when showQuickCustomer is true", () => {
    renderOwner({ showQuickCustomer: true });
    expect(screen.getByTestId("quick-customer-form")).toBeInTheDocument();
    expect(screen.getByText("quickAddCustomerTitle")).toBeInTheDocument();
  });

  it("selects the created customer when the quick form succeeds", () => {
    const { setSelectedCustomer, setShowQuickCustomer } = renderOwner({
      showQuickCustomer: true,
    });
    fireEvent.click(
      screen.getByRole("button", { name: "save-quick-customer" }),
    );
    expect(setSelectedCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ id: "q1", first_name: "Quick" }),
    );
    expect(setShowQuickCustomer).toHaveBeenCalledWith(false);
  });

  it("closes the quick form when cancelled", () => {
    const { setShowQuickCustomer } = renderOwner({ showQuickCustomer: true });
    fireEvent.click(
      screen.getByRole("button", { name: "cancel-quick-customer" }),
    );
    expect(setShowQuickCustomer).toHaveBeenCalledWith(false);
  });

  it("applies the destructive border style when there is a root error", () => {
    renderOwner({
      form: makeForm({ root: { message: "boom" } }),
    });
    const card = document.querySelector("[data-slot='card']") ?? document.body;
    expect(card.className).toContain("border-destructive");
  });

  it("shows the searching state on the search input", () => {
    renderOwner({ customerSearching: true });
    expect(screen.getByLabelText("searching")).toBeInTheDocument();
  });
});
