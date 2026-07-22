import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { TransactionsTab } from "./_transactions-tab";

// Mock child components
vi.mock("@/components/list-toolbar", () => ({
  ListToolbar: ({
    search,
    stats,
    actions,
  }: {
    search?: { placeholder?: string; value?: string };
    stats?: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <div data-testid="mock-list-toolbar">
      <div data-testid="search-placeholder">{search?.placeholder}</div>
      <div data-testid="search-value">{search?.value}</div>
      <div data-testid="toolbar-stats">{stats}</div>
      <div data-testid="toolbar-actions">{actions}</div>
    </div>
  ),
}));

vi.mock("@/components/export-button", () => ({
  ExportButton: ({ filename }: { filename: string }) => (
    <div data-testid="mock-export-button">{filename}</div>
  ),
}));

vi.mock("@/components/ui/data-table", () => ({
  DataTable: ({
    columns,
    data,
    emptyState,
  }: {
    columns: unknown[];
    data: unknown[];
    emptyState?: React.ReactNode;
  }) => (
    <div data-testid="mock-data-table">
      <div data-testid="table-columns">{columns.length} cols</div>
      <div data-testid="table-rows">{data.length} rows</div>
      {emptyState && <div data-testid="table-empty">{emptyState}</div>}
    </div>
  ),
  DataTableColumnHeader: () => <div>ColumnHeader</div>,
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-07-22T12:00:00Z"),
}));

const messages = {
  finance: {
    workOrderNumberShort: "WO #",
    customerColumn: "Customer",
    vehicleColumn: "Vehicle",
    statusColumn: "Status",
    servicesColumn: "Services",
    partsColumn: "Parts",
    totalColumn: "Total",
    dateColumn: "Date",
    searchTransactions: "Search by customer, plate, or ID...",
    noWorkOrdersMatch: "No work orders match your search",
    noWorkOrdersInPeriod: "No work orders in this period",
    workOrdersCount: "{count} work order(s)",
    resultsCount: "{count} results",
    noMatches: "No matches for \"{query}\"",
    transactionsSheet: "Transactions",
    noFinancialData: "No financial data yet",
    noFinancialDataDesc:
      "Complete work orders with services and parts to see your revenue breakdown, financial KPIs, and transaction history.",
  },
};

const sampleWorkOrder = {
  id: "wo-001",
  status: "Completed",
  created_at: "2026-07-20T10:00:00Z",
  customer: { first_name: "John", last_name: "Doe" },
  vehicle: { plate_number: "ABC-123" },
  services: [{ final_price: 200000 }],
  parts: [{ final_price: 100000 }],
};

describe("TransactionsTab", () => {
  const baseProps = {
    hasAnyData: true,
    search: "",
    onSearchChange: vi.fn(),
    filteredWorkOrders: [sampleWorkOrder],
    data: { recentWorkOrders: [sampleWorkOrder] },
  };

  it("renders EmptyFinanceState when hasAnyData is false", () => {
    render(
      <TransactionsTab
        hasAnyData={false}
        search=""
        onSearchChange={vi.fn()}
        filteredWorkOrders={[]}
        data={null}
      />,
      { messages },
    );
    expect(screen.getByText("No financial data yet")).toBeDefined();
  });

  it("renders ListToolbar with search placeholder", () => {
    render(<TransactionsTab {...baseProps} />, { messages });
    expect(
      screen.getByText("Search by customer, plate, or ID..."),
    ).toBeDefined();
  });

  it("renders DataTable with work orders", () => {
    render(<TransactionsTab {...baseProps} />, { messages });
    expect(screen.getByTestId("mock-data-table")).toBeDefined();
    expect(screen.getByText("1 rows")).toBeDefined();
  });

  it("renders work orders count in stats", () => {
    render(<TransactionsTab {...baseProps} />, { messages });
    expect(screen.getByText("1 work order(s)")).toBeDefined();
  });

  it("renders export button with dated filename", () => {
    render(<TransactionsTab {...baseProps} />, { messages });
    expect(
      screen.getByText("transactions-2026-07-22.xlsx"),
    ).toBeDefined();
  });

  it("shows empty state message when filtered list is empty and search is active", () => {
    render(
      <TransactionsTab
        hasAnyData={true}
        search="nonexistent"
        onSearchChange={vi.fn()}
        filteredWorkOrders={[]}
        data={{ recentWorkOrders: [sampleWorkOrder] }}
      />,
      { messages },
    );
    expect(
      screen.getByText("No work orders match your search"),
    ).toBeDefined();
  });

  it("shows no work orders in period when data is empty", () => {
    render(
      <TransactionsTab
        hasAnyData={true}
        search=""
        onSearchChange={vi.fn()}
        filteredWorkOrders={[]}
        data={{ recentWorkOrders: [] }}
      />,
      { messages },
    );
    expect(
      screen.getByText("No work orders in this period"),
    ).toBeDefined();
  });

  it("renders without customer data gracefully", () => {
    const woNoCustomer = {
      ...sampleWorkOrder,
      customer: null,
    };
    render(
      <TransactionsTab
        hasAnyData={true}
        search=""
        onSearchChange={vi.fn()}
        filteredWorkOrders={[woNoCustomer]}
        data={{ recentWorkOrders: [woNoCustomer] }}
      />,
      { messages },
    );
    expect(screen.getByText("1 rows")).toBeDefined();
    expect(screen.getByText("1 work order(s)")).toBeDefined();
  });

  it("renders without vehicle data gracefully", () => {
    const woNoVehicle = {
      ...sampleWorkOrder,
      vehicle: null,
    };
    render(
      <TransactionsTab
        hasAnyData={true}
        search=""
        onSearchChange={vi.fn()}
        filteredWorkOrders={[woNoVehicle]}
        data={{ recentWorkOrders: [woNoVehicle] }}
      />,
      { messages },
    );
    expect(screen.getByText("1 rows")).toBeDefined();
  });
});
