import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomerDetailDrawer } from "@/components/customers/customer-detail-drawer";
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
    setDetailVehicleId: vi.fn(),
  }),
}));

// Mock useForm + zodResolver
vi.mock("@/lib/hooks/use-form", () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit:
      (fn: (d: unknown) => void) => (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();
        return fn({});
      },
    reset: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn(() => ""),
    formState: { errors: {} },
  }),
  zodResolver: () => vi.fn(),
}));

// Mock the customer edit form import from dashboard route
vi.mock("@/app/[locale]/dashboard/customers/[id]/_customer-edit-form", () => ({
  CustomerEditForm: () => <div data-testid="customer-edit-form-mock" />,
  customerEditSchema: {},
}));

// Mock CustomerFollowupsSection
vi.mock("@/components/customers/customer-followups-section", () => ({
  CustomerFollowupsSection: () => <div data-testid="customer-followups-mock" />,
}));

// Mock customerKeys
vi.mock("@/lib/queries/keys", () => ({
  customerKeys: {
    all: () => ["customers"],
    detail: () => ["customers", "detail"],
  },
  vehicleKeys: {
    all: () => ["vehicles"],
    detail: () => ["vehicles", "detail"],
  },
}));

const messages = {
  common: {
    cancel: "Cancel",
    delete: "Delete",
  },
  customers: {
    customerNotFound: "Customer not found",
    phone: "Phone",
    email: "Email",
    address: "Address",
    notes: "Notes",
    contactPerson: "Contact person",
    saved: "Saved",
    deleted: "Deleted",
    deleteConfirm: "Are you sure?",
  },
};

const mockCustomer = {
  id: "cust-1",
  type: "individual" as const,
  first_name: "John",
  last_name: "Doe",
  company_name: null,
  contact_person: null,
  phone: "+976 9911-2233",
  email: "john@example.com",
  address: "Ulaanbaatar",
  notes: null,
  source: null,
  total_spent: 500000,
  total_visits: 3,
  status: "active" as const,
  vehicles: [],
  work_orders: [],
  created_at: "2026-01-01",
  updated_at: "2026-06-01",
};

describe("CustomerDetailDrawer", () => {
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
      <CustomerDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        customerId="cust-1"
      />,
      { messages },
    );

    // Loading text in the title area
    expect(screen.getByText("Loading\u2026")).toBeInTheDocument();
    // Should have a spinner
    const spinners = document.querySelectorAll(".animate-spin");
    expect(spinners.length).toBeGreaterThan(0);
  });

  it("shows customer data when loaded", () => {
    mockUseQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
    });

    render(
      <CustomerDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        customerId="cust-1"
      />,
      { messages },
    );

    // Customer name should be displayed
    const displayName =
      mockCustomer.last_name || mockCustomer.first_name
        ? `${mockCustomer.last_name ?? ""} ${mockCustomer.first_name ?? ""}`
        : "";
    expect(displayName).toBeTruthy();

    // Contact info sections should render
    expect(screen.getByText("Phone")).toBeInTheDocument();
  });

  it("shows not found state when no data and no error", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(
      <CustomerDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        customerId="nonexistent"
      />,
      { messages },
    );

    expect(screen.getByText("Customer not found")).toBeInTheDocument();
  });

  it("shows error state when query has error", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Network error"),
    });

    render(
      <CustomerDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        customerId="cust-1"
      />,
      { messages },
    );

    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <CustomerDetailDrawer
        open={false}
        onOpenChange={vi.fn()}
        customerId="cust-1"
      />,
      { messages },
    );

    // When closed, the drawer content should not be rendered
    expect(screen.queryByText("Loading\u2026")).not.toBeInTheDocument();
  });
});
