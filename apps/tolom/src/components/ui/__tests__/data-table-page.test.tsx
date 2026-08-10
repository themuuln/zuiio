import type { ColumnDef } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTablePage } from "@/components/ui/data-table-page";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    const labels: Record<string, string> = {
      error: "Error",
      somethingWentWrong: "Something went wrong",
      tryAgain: "Try again",
      noDataFound: "No data found",
      tryAdjustingFilters: "Try adjusting your search or filters",
      searchDots: "Search...",
      noResultsDot: "No results.",
      rowsPerPage: "Rows per page",
      pageOf: `Page ${params?.current} of ${params?.total}`,
      next: "Next",
      previous: "Previous",
      columnToggle: "Columns",
      toggleColumns: "Toggle columns",
      search: "Search",
      searching: "Searching...",
      clearSearch: "Clear search",
    };
    return labels[key] ?? key;
  },
}));

interface TestData {
  id: string;
  name: string;
  email: string;
}

const columns: ColumnDef<TestData>[] = [
  { id: "name", accessorKey: "name", header: "Name" },
  { id: "email", accessorKey: "email", header: "Email" },
];

const sampleData: TestData[] = [
  { id: "1", name: "Alice", email: "alice@test.com" },
  { id: "2", name: "Bob", email: "bob@test.com" },
  { id: "3", name: "Charlie", email: "charlie@test.com" },
];

function renderPage(overrides: {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyState?: React.ReactNode;
  emptyAction?: React.ReactNode;
  search?: {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onValueChange?: (value: string) => void;
  };
  stats?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  onRowClick?: (row: TestData) => void;
  pageSize?: number;
  headerAction?: React.ReactNode;
  beforeTable?: React.ReactNode;
}) {
  return render(
    <DataTablePage<TestData, unknown>
      title="Vehicles"
      description="Manage your vehicles"
      columns={columns}
      data={sampleData}
      getRowId={(row) => row.id}
      headerAction={overrides.headerAction}
      loading={overrides.loading}
      error={overrides.error ?? null}
      onRetry={overrides.onRetry}
      emptyTitle={overrides.emptyTitle}
      emptyState={overrides.emptyState}
      emptyAction={overrides.emptyAction}
      search={overrides.search}
      stats={overrides.stats}
      filters={overrides.filters}
      actions={overrides.actions}
      onRowClick={overrides.onRowClick}
      pageSize={overrides.pageSize ?? 20}
      beforeTable={overrides.beforeTable}
    />,
  );
}

describe("DataTablePage", () => {
  it("renders title, description and header action", () => {
    renderPage({ headerAction: <button type="button">Add Vehicle</button> });
    expect(
      screen.getByRole("heading", { name: "Vehicles" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Manage your vehicles")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Vehicle" }),
    ).toBeInTheDocument();
  });

  it("renders the data rows", () => {
    renderPage({});
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("charlie@test.com")).toBeInTheDocument();
  });

  it("shows a skeleton instead of data on the first load", () => {
    renderPage({ loading: true });
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows the error card with a working retry button", () => {
    const onRetry = vi.fn();
    renderPage({ error: "Network down", onRetry });
    expect(screen.getByText("Network down")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders the default empty state when there is no data", () => {
    render(
      <DataTablePage<TestData, unknown>
        title="Vehicles"
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        pageSize={20}
      />,
    );
    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("renders the empty state when data is empty", () => {
    render(
      <DataTablePage<TestData, unknown>
        title="Vehicles"
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        pageSize={20}
        emptyTitle="No vehicles yet"
        emptyAction={<button type="button">Add one</button>}
      />,
    );
    expect(screen.getByText("No vehicles yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add one" })).toBeInTheDocument();
  });

  it("renders a fully custom empty state instead", () => {
    render(
      <DataTablePage<TestData, unknown>
        title="Vehicles"
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        pageSize={20}
        emptyState={<div>Custom empty state</div>}
      />,
    );
    expect(screen.getByText("Custom empty state")).toBeInTheDocument();
    expect(screen.queryByText("No data found")).not.toBeInTheDocument();
  });

  it("renders the search toolbar and reports typed values", () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    renderPage({
      search: {
        placeholder: "Search vehicles",
        value: "",
        onChange,
        onValueChange,
      },
    });
    const input = screen.getByLabelText("Search vehicles");
    fireEvent.change(input, { target: { value: "prius" } });
    expect(onValueChange).toHaveBeenCalledWith("prius");
  });

  it("renders filters, stats and actions", () => {
    renderPage({
      filters: <span>Filter chips</span>,
      stats: <span>3 total</span>,
      actions: <button type="button">Export</button>,
    });
    expect(screen.getByText("Filter chips")).toBeInTheDocument();
    expect(screen.getByText("3 total")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("renders beforeTable content", () => {
    renderPage({ beforeTable: <div>KPI cards</div> });
    expect(screen.getByText("KPI cards")).toBeInTheDocument();
  });

  it("fires onRowClick when a row is clicked", () => {
    const onRowClick = vi.fn();
    renderPage({ onRowClick });
    fireEvent.click(screen.getByText("Bob"));
    expect(onRowClick).toHaveBeenCalledWith(sampleData[1]);
  });

  it("renders the external pagination for positive page sizes", () => {
    // Pagination must mount on the FIRST load — DataTable's onTableReady
    // populates table state, so no extra parent re-render should be needed.
    renderPage({ pageSize: 20 });
    expect(screen.getByText("Rows per page")).toBeInTheDocument();
  });

  it("renders no pagination when pageSize is -1", () => {
    renderPage({ pageSize: -1 });
    expect(screen.queryByText("Rows per page")).not.toBeInTheDocument();
  });
});
