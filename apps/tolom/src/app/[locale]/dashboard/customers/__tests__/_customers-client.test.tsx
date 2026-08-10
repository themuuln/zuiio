import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import type { CustomerRow } from "../_columns";
import { CustomersPage } from "../_customers-client";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useCustomers: vi.fn(),
  useSharedCustomers: vi.fn(),
  refetch: vi.fn(),
  setNewCustomerDialogOpen: vi.fn(),
  setDetailCustomerId: vi.fn(),
  setView: vi.fn(),
  setSearch: vi.fn(),
  view: "my",
  isMobile: false,
  branchId: "all",
}));

// ── Hook mocks ──────────────────────────────────────────────────────
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/queries/use-customers", () => ({
  useCustomers: mocks.useCustomers,
  useSharedCustomers: mocks.useSharedCustomers,
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "org-1" },
    isPending: false,
    isError: false,
  }),
}));

vi.mock("@/lib/hooks/use-table-filters", () => ({
  useTableFilters: () => ({
    search: "",
    setSearch: mocks.setSearch,
    view: mocks.view,
    setView: mocks.setView,
  }),
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-01-15T10:00:00.000Z"),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => mocks.isMobile,
}));

vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => ({
    setNewCustomerDialogOpen: mocks.setNewCustomerDialogOpen,
    setDetailCustomerId: mocks.setDetailCustomerId,
    setDetailVehicleId: vi.fn(),
  }),
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => mocks.branchId,
}));

vi.mock("@/lib/i18n/navigation", () => ({
  Link: (props: ComponentProps<"a">) => <a {...props} />,
}));

vi.mock("@/components/export-button", () => ({
  ExportButton: () => (
    <button type="button" data-testid="export-button">
      Export Excel
    </button>
  ),
}));

// Detail panel is exercised by its own test file — here assert the page
// wires the selected customer id into it.
vi.mock("../_customer-detail-panel", () => ({
  CustomerDetailPanel: ({ customerId }: { customerId: string }) => (
    <div data-testid="customer-detail-panel">{customerId}</div>
  ),
}));

// ── Fixtures ────────────────────────────────────────────────────────

function makeCustomer(overrides: Partial<CustomerRow> = {}): CustomerRow {
  return {
    id: "cust-1",
    organization_id: "org-1",
    type: "individual",
    first_name: "Bold",
    last_name: "Bat",
    full_name: null,
    company_name: null,
    contact_person: null,
    phone: "+97699112233",
    email: "bold@example.com",
    address: null,
    notes: null,
    source: null,
    tags: null,
    total_visits: 5,
    last_visit_at: null,
    portal_token: null,
    created_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    updated_at: "2026-01-01T00:00:00.000Z",
    updated_by: null,
    ...overrides,
  };
}

function customersResult(
  data: CustomerRow[],
  overrides: Record<string, unknown> = {},
) {
  return {
    data,
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: mocks.refetch,
    ...overrides,
  };
}

const twoCustomers = [
  makeCustomer({
    id: "cust-1",
    first_name: "Bold",
    last_name: "Bat",
    vehicle_count: 2,
  }),
  makeCustomer({
    id: "cust-2",
    type: "company",
    first_name: null,
    last_name: null,
    full_name: null,
    company_name: "Mongol LLC",
    phone: "+97670001122",
    vehicle_count: 0,
  }),
];

// ── Tests ───────────────────────────────────────────────────────────

describe("CustomersPage", () => {
  beforeEach(() => {
    mocks.useCustomers.mockReset();
    mocks.useSharedCustomers.mockReset();
    mocks.refetch.mockReset();
    mocks.setNewCustomerDialogOpen.mockReset();
    mocks.setDetailCustomerId.mockReset();
    mocks.setView.mockReset();
    mocks.setSearch.mockReset();
    mocks.view = "my";
    mocks.isMobile = false;
    mocks.branchId = "all";
    mocks.useCustomers.mockReturnValue(customersResult([]));
    mocks.useSharedCustomers.mockReturnValue(customersResult([]));
  });

  it("shows the page title and no add button while customers are pending", () => {
    mocks.useCustomers.mockReturnValue(
      customersResult(undefined, { isPending: true, isFetching: true }),
    );
    render(<CustomersPage />);
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "addCustomer" }),
    ).not.toBeInTheDocument();
  });

  it("renders customers with name, phone, type and vehicle counts", () => {
    mocks.useCustomers.mockReturnValue(customersResult(twoCustomers));
    render(<CustomersPage />);

    expect(screen.getAllByText("Bold Bat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mongol LLC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+97699112233").length).toBeGreaterThan(0);
    expect(screen.getByText("2 vehicles")).toBeInTheDocument();
    expect(screen.getByText("0 vehicles")).toBeInTheDocument();
    expect(screen.getAllByText("individual").length).toBeGreaterThan(0);
    expect(screen.getAllByText("company").length).toBeGreaterThan(0);
    // Import action links to the import page
    const importLink = screen.getByRole("link", { name: "importCustomers" });
    expect(importLink).toHaveAttribute("href", "/dashboard/customers/import");
    // Counts shown in the shell description + toolbar stats
    expect(screen.getAllByText("2 customers").length).toBeGreaterThan(0);
  });

  it("passes org id and no branch filter to useCustomers when branch is 'all'", () => {
    mocks.useCustomers.mockReturnValue(customersResult(twoCustomers));
    render(<CustomersPage />);
    expect(mocks.useCustomers).toHaveBeenCalledWith("org-1", "", null);
  });

  it("passes the selected branch as branch filter to useCustomers", () => {
    mocks.branchId = "branch-1";
    mocks.useCustomers.mockReturnValue(customersResult(twoCustomers));
    render(<CustomersPage />);
    expect(mocks.useCustomers).toHaveBeenCalledWith("org-1", "", "branch-1");
  });

  it("shows the empty state and its add-first-customer button opens the dialog", async () => {
    const user = userEvent.setup();
    render(<CustomersPage />);
    expect(screen.getByText("noCustomers")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "addFirstCustomer" }));
    expect(mocks.setNewCustomerDialogOpen).toHaveBeenCalledWith(true);
  });

  it("opens the new customer dialog from the header action", async () => {
    const user = userEvent.setup();
    mocks.useCustomers.mockReturnValue(customersResult(twoCustomers));
    render(<CustomersPage />);
    await user.click(screen.getByRole("button", { name: "addCustomer" }));
    expect(mocks.setNewCustomerDialogOpen).toHaveBeenCalledWith(true);
  });

  it("shows the error state with retry and refetches on try again", async () => {
    const user = userEvent.setup();
    mocks.useCustomers.mockReturnValue(
      customersResult(undefined, {
        isError: true,
        error: new Error("Failed to load"),
      }),
    );
    render(<CustomersPage />);
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "tryAgain" }));
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("switching the toggle to Shared calls setView with 'shared'", async () => {
    const user = userEvent.setup();
    mocks.useCustomers.mockReturnValue(customersResult(twoCustomers));
    render(<CustomersPage />);
    await user.click(screen.getByText("Shared"));
    expect(mocks.setView).toHaveBeenCalledWith("shared");
  });

  it("renders shared customers with org attribution in shared view", () => {
    mocks.view = "shared";
    mocks.useSharedCustomers.mockReturnValue(
      customersResult([
        makeCustomer({
          id: "cust-3",
          first_name: "Shared",
          last_name: "User",
          phone: "+97699990000",
          organization_name: "Other Org",
          vehicle_count: 1,
        }),
      ]),
    );
    render(<CustomersPage />);

    expect(screen.getAllByText("Shared User").length).toBeGreaterThan(0);
    expect(screen.getByText("Other Org")).toBeInTheDocument();
    expect(screen.getByText("1 vehicle")).toBeInTheDocument();
    // Shared view swaps the search placeholder and hides import/export
    expect(
      screen.getByPlaceholderText("Search shared customers..."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "importCustomers" }),
    ).not.toBeInTheDocument();
    expect(mocks.useSharedCustomers).toHaveBeenCalledWith("org-1", "");
  });

  it("filters customers not visited in 3+ months via the inactive chip", async () => {
    const user = userEvent.setup();
    const inactive = makeCustomer({
      id: "cust-old",
      last_visit_at: "2024-01-01T00:00:00.000Z",
    });
    const recent = makeCustomer({
      id: "cust-new",
      last_visit_at: "2099-01-01T00:00:00.000Z",
    });
    mocks.useCustomers.mockReturnValue(customersResult([inactive, recent]));
    render(<CustomersPage />);

    const chip = screen.getByRole("button", {
      name: /Not visited in 3\+ months/,
    });
    expect(chip).toHaveTextContent("1");
    await user.click(chip);

    expect(screen.queryByText("Recent")).not.toBeInTheDocument();
    expect(screen.getAllByText("Bold Bat").length).toBeGreaterThan(0);
  });

  it("opens the customer detail panel with the clicked row id on desktop", async () => {
    const user = userEvent.setup();
    mocks.useCustomers.mockReturnValue(customersResult(twoCustomers));
    render(<CustomersPage />);

    const rows = screen.getAllByRole("row");
    await user.click(rows[1]);

    const panel = screen.getByTestId("customer-detail-panel");
    expect(panel).toHaveTextContent("cust-1");
  });

  it("routes row clicks to setDetailCustomerId on mobile and renders mobile cards", async () => {
    mocks.isMobile = true;
    mocks.useCustomers.mockReturnValue(
      customersResult([
        makeCustomer({
          id: "cust-1",
          last_visit_at: new Date().toISOString(),
          vehicle_count: 2,
        }),
      ]),
    );
    const user = userEvent.setup();
    render(<CustomersPage />);

    // Mobile card content: vehicle count + relative last visit
    expect(screen.getByText("2 vehicles")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();

    const card = screen.getByText("2 vehicles").closest('[role="button"]');
    expect(card).not.toBeNull();

    // Pointer click on the card fires onRowClick → detail panel opens
    // (fixed: the onClick guard no longer swallows clicks on the wrapper).
    await user.click(card as HTMLElement);
    expect(mocks.setDetailCustomerId).toHaveBeenCalledWith("cust-1");

    // The keyboard path works too.
    fireEvent.keyDown(card as HTMLElement, { key: "Enter" });
    expect(mocks.setDetailCustomerId).toHaveBeenCalledWith("cust-1");
    // Detail panel is desktop-only
    expect(
      screen.queryByTestId("customer-detail-panel"),
    ).not.toBeInTheDocument();
  });
});
