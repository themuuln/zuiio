import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerSelect } from "@/components/work-orders/customer-select";
import type { Customer } from "@/lib/types";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockCustomers = vi.fn();

vi.mock("@/lib/queries/use-customers", () => ({
  useCustomers: (...args: unknown[]) => mockCustomers(...args),
}));

vi.mock("@/lib/hooks/use-form", () => ({
  useForm: () => ({
    register: vi.fn(() => ({
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
      name: "first_name",
    })),
    handleSubmit:
      (fn: (d: unknown) => void) => (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();
        fn({ first_name: "Test", last_name: "User", phone: "" });
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
          customer: "Customer",
          searchByNameOrPhone: "Search by name or phone",
          quickCreateCustomer: "Quick Create Customer",
          newCustomer: "New Customer",
          firstNamePlaceholder: "First name",
          lastNamePlaceholder: "Last name",
          phonePlaceholder: "Phone",
          createAndSelect: "Create & Select",
        },
        common: {
          change: "Change",
          cancel: "Cancel",
          creating: "Creating...",
          search: "Search",
          noName: "No Name",
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
    User: () => <svg data-testid="user-icon" />,
    Plus: () => <svg data-testid="plus-icon" />,
    AlertTriangle: () => <svg data-testid="alert-icon" />,
  };
});

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign((message: string) => ({ message }), {
    warning: vi.fn(),
    error: vi.fn(),
  }),
}));

// ── Test data ─────────────────────────────────────────────────────────

const mockCustomer: Customer = {
  id: "cust-1",
  first_name: "John",
  last_name: "Doe",
  phone: "+976-99112233",
  email: null,
  address: null,
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
};

// ── Tests ──────────────────────────────────────────────────────────────

describe("CustomerSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomers.mockReturnValue({ data: [], isFetching: false });
  });

  const defaultProps = {
    orgId: "org-1",
    selectedCustomer: null,
    onSelect: vi.fn(),
    onClear: vi.fn(),
  };

  it("renders search input when no customer is selected", () => {
    render(<CustomerSelect {...defaultProps} />);
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search by name or phone"),
    ).toBeInTheDocument();
    expect(screen.getByText("Quick Create Customer")).toBeInTheDocument();
  });

  it("renders selected customer info when customer is provided", () => {
    render(
      <CustomerSelect {...defaultProps} selectedCustomer={mockCustomer} />,
    );
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("+976-99112233")).toBeInTheDocument();
    expect(screen.getByText("Change")).toBeInTheDocument();
  });

  it("renders search input for typing", () => {
    render(<CustomerSelect {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Search by name or phone");
    fireEvent.change(searchInput, { target: { value: "John" } });
    expect(searchInput).toHaveValue("John");
  });
});
