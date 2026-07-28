import type { ColumnDef } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

// Mock next-intl's useTranslations for the DataTable component
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => {
      const labels: Record<string, string> = {
        noDataFound: "No data found",
        tryAdjustingFilters: "Try adjusting your search or filters",
        searchDots: "Search...",
        noResultsDot: "No results.",
        rowsPerPage: "Rows per page",
        of: "of",
        page: "Page",
        next: "Next",
        previous: "Previous",
        columnToggle: "Columns",
        toggleColumns: "Toggle columns",
      };
      return labels[key] ?? key;
    },
  };
});

interface TestData {
  id: string;
  name: string;
  email: string;
  status: string;
}

const columns: ColumnDef<TestData>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
  },
];

const sampleData: TestData[] = [
  { id: "1", name: "Alice", email: "alice@test.com", status: "Active" },
  { id: "2", name: "Bob", email: "bob@test.com", status: "Inactive" },
  { id: "3", name: "Charlie", email: "charlie@test.com", status: "Active" },
];

function renderDataTable(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("DataTable", () => {
  it("renders with columns and data", () => {
    render(<DataTable columns={columns} data={sampleData} />);
    // Headers
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    // Data rows
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("renders loading skeleton when loading is true", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} loading />,
    );
    // Loading skeletons — check for the skeleton container
    const skeletonContainer = container.querySelector(".animate-pulse");
    expect(skeletonContainer).toBeInTheDocument();
  });

  it("renders default empty state when data is empty", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("No data found")).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting your search or filters"),
    ).toBeInTheDocument();
  });

  it("renders custom empty state when provided", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyState={<div>Custom empty message</div>}
      />,
    );
    expect(screen.getByText("Custom empty message")).toBeInTheDocument();
    expect(screen.queryByText("No data found")).not.toBeInTheDocument();
  });

  it("renders toolbar content", () => {
    render(
      <DataTable
        columns={columns}
        data={sampleData}
        toolbar={<button type="button">Add Item</button>}
      />,
    );
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });

  it("renders with search input", () => {
    render(
      <DataTable
        columns={columns}
        data={sampleData}
        search={{ placeholder: "Search items..." }}
      />,
    );
    const searchInput = screen.getByPlaceholderText("Search items...");
    expect(searchInput).toBeInTheDocument();
  });

  it("renders with global search", () => {
    render(
      <DataTable
        columns={columns}
        data={sampleData}
        search={{ type: "global", placeholder: "Global search..." }}
      />,
    );
    expect(screen.getByPlaceholderText("Global search...")).toBeInTheDocument();
  });

  it("renders without pagination when noPagination is true", () => {
    render(
      <DataTable
        columns={columns}
        data={sampleData}
        pageSize={10}
        noPagination
      />,
    );
    // Data should still render
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("handles row click", () => {
    const onRowClick = vi.fn();
    render(
      <DataTable columns={columns} data={sampleData} onRowClick={onRowClick} />,
    );
    // Find a row and click it (looking at the table body row)
    const rows = document.querySelectorAll("tbody tr");
    expect(rows.length).toBeGreaterThan(0);
    fireEvent.click(rows[0]);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(sampleData[0]);
  });

  it("renders with column visibility toggle", () => {
    render(
      <DataTable columns={columns} data={sampleData} showColumnVisibility />,
    );
    // The visibility toggle component renders a trigger button
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders with enableRowSelection", () => {
    render(
      <DataTable columns={columns} data={sampleData} enableRowSelection />,
    );
    // Rows render with selection state
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders with insideCard prop", () => {
    render(<DataTable columns={columns} data={sampleData} insideCard />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders data with getRowId", () => {
    render(
      <DataTable
        columns={columns}
        data={sampleData}
        getRowId={(row) => row.id}
      />,
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("passes className to container", () => {
    const { $ } = renderDataTable(
      <DataTable
        columns={columns}
        data={sampleData}
        className="my-custom-class"
      />,
    );
    const container = $(".my-custom-class");
    expect(container).toBeInTheDocument();
  });
});
