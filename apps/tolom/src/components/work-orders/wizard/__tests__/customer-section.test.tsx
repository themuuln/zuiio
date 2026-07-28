import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { CustomerSection } from "../customer-section";

// ── Mock useWizardContext ─────────────────────────────────────────────
const mockSetCustomerSearch = vi.fn();
const mockSetSelectedCustomer = vi.fn();
const mockSetShowQuickCustomer = vi.fn();
const mockHandleSelectCustomer = vi.fn();
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

// ── Mock CustomerForm ─────────────────────────────────────────────────
vi.mock("@/components/customers/customer-form", () => ({
  CustomerForm: vi.fn(
    ({
      onSuccess,
      onCancel,
    }: {
      onSuccess: (c: { id: string; first_name: string }) => void;
      onCancel: () => void;
    }) => (
      <div data-testid="customer-form-mock">
        <button
          data-testid="customer-form-success"
          onClick={() => onSuccess({ id: "new-cust-1", first_name: "New" })}
        >
          Success
        </button>
        <button data-testid="customer-form-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ),
  ),
}));

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

// ── Helpers ───────────────────────────────────────────────────────────
const mockCustomer = {
  id: "cust-1",
  first_name: "John",
  last_name: "Doe",
  phone: "99112233",
};

function createMockCtx(overrides?: Record<string, unknown>) {
  return {
    isRestoringFromDraft: false,
    selectedCustomer: null,
    customerSearch: "",
    customers: [],
    customerSearching: false,
    showQuickCustomer: false,
    setCustomerSearch: mockSetCustomerSearch,
    setSelectedCustomer: mockSetSelectedCustomer,
    setShowQuickCustomer: mockSetShowQuickCustomer,
    handleSelectCustomer: mockHandleSelectCustomer,
    ...overrides,
  };
}

function renderCustomer() {
  return render(<CustomerSection />, {
    messages: {
      workOrderWizard: {
        customer: "customer",
        change: "change",
        searchByNameOrPhone: "searchByNameOrPhone",
        quickCreateCustomer: "quickCreateCustomer",
        noName: "noName",
      },
    },
  });
}

describe("CustomerSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = createMockCtx();
  });

  it("renders restoring skeleton when isRestoringFromDraft", () => {
    mockCtx = createMockCtx({ isRestoringFromDraft: true });
    const { container } = renderCustomer();

    expect(
      container.querySelector('[data-wizard-step="customer"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });

  it("shows selected customer name and phone in the item", () => {
    mockCtx = createMockCtx({ selectedCustomer: mockCustomer });
    renderCustomer();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("99112233")).toBeInTheDocument();
  });

  it("shows change button when customer is selected", () => {
    mockCtx = createMockCtx({ selectedCustomer: mockCustomer });
    renderCustomer();

    expect(screen.getByText("change")).toBeInTheDocument();
  });

  it("calls setSelectedCustomer(null) and setSelectedVehicle(null) on change click", async () => {
    const mockSetSelectedVehicle = vi.fn();
    mockCtx = createMockCtx({
      selectedCustomer: mockCustomer,
      setSelectedVehicle: mockSetSelectedVehicle,
    });
    const user = userEvent.setup();
    renderCustomer();

    await user.click(screen.getByText("change"));

    expect(mockSetSelectedCustomer).toHaveBeenCalledWith(null);
    expect(mockSetSelectedVehicle).toHaveBeenCalledWith(null);
  });

  it("shows search input when no customer is selected", () => {
    renderCustomer();

    expect(screen.getByTestId("search-input-mock")).toBeInTheDocument();
  });

  it("renders customer search results when customerSearch and customers exist", () => {
    mockCtx = createMockCtx({
      customerSearch: "John",
      customers: [mockCustomer],
    });
    renderCustomer();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("99112233")).toBeInTheDocument();
  });

  it("selects a customer when search result is clicked", async () => {
    const user = userEvent.setup();
    mockCtx = createMockCtx({
      customerSearch: "John",
      customers: [mockCustomer],
    });
    renderCustomer();

    await user.click(screen.getByText("John Doe"));

    expect(mockHandleSelectCustomer).toHaveBeenCalledWith(mockCustomer);
  });

  it("shows quick create customer button when showQuickCustomer is false", () => {
    renderCustomer();

    expect(screen.getByText("quickCreateCustomer")).toBeInTheDocument();
  });

  it("opens quick customer form when quick create is clicked", async () => {
    const user = userEvent.setup();
    renderCustomer();

    await user.click(screen.getByText("quickCreateCustomer"));

    expect(mockSetShowQuickCustomer).toHaveBeenCalledWith(true);
  });

  it("shows customer form when showQuickCustomer is true", () => {
    mockCtx = createMockCtx({ showQuickCustomer: true });
    renderCustomer();

    expect(screen.getByTestId("customer-form-mock")).toBeInTheDocument();
  });

  it("selects customer and closes form on form success", async () => {
    const user = userEvent.setup();
    mockCtx = createMockCtx({ showQuickCustomer: true });
    renderCustomer();

    await user.click(screen.getByTestId("customer-form-success"));

    expect(mockHandleSelectCustomer).toHaveBeenCalledWith({
      id: "new-cust-1",
      first_name: "New",
    });
    expect(mockSetShowQuickCustomer).toHaveBeenCalledWith(false);
  });

  it("closes form on form cancel", async () => {
    const user = userEvent.setup();
    mockCtx = createMockCtx({ showQuickCustomer: true });
    renderCustomer();

    await user.click(screen.getByTestId("customer-form-cancel"));

    expect(mockSetShowQuickCustomer).toHaveBeenCalledWith(false);
  });

  it("hides results when customerSearch is empty", () => {
    mockCtx = createMockCtx({
      customerSearch: "",
      customers: [mockCustomer],
    });
    renderCustomer();

    expect(screen.queryByText("99112233")).not.toBeInTheDocument();
  });

  it("shows wizard step data attribute", () => {
    const { container } = renderCustomer();

    expect(
      container.querySelector('[data-wizard-step="customer"]'),
    ).toBeInTheDocument();
  });
});
