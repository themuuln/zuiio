import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import {
  columns,
  DraggableRow,
  type schema,
} from "@/components/_data-table-columns";

vi.mock("sonner", () => ({
  toast: { promise: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: () => null },
}));

// TableCellViewer is a heavy drawer — replace with a plain text cell
vi.mock("@/components/_data-table-cell-viewer", () => ({
  TableCellViewer: ({ item }: { item: { header: string } }) => (
    <span>{item.header}</span>
  ),
}));

type Row = ReturnType<typeof schema.parse>;

const rows: Row[] = [
  {
    id: 1,
    header: "Feature request",
    type: "Design",
    status: "Done",
    target: "10",
    limit: "5",
    reviewer: "Eddie Lake",
  },
  {
    id: 2,
    header: "Bug fix",
    type: "Narrative",
    status: "In Progress",
    target: "20",
    limit: "10",
    reviewer: "Assign reviewer",
  },
];

function TableHarness() {
  const [rowSelection, setRowSelection] = useState({});
  const table = useReactTable({
    data: rows,
    columns: columns as ColumnDef<Row>[],
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <DraggableRow key={row.id} row={row} />
        ))}
      </tbody>
    </table>
  );
}

describe("DataTableColumns", () => {
  it("renders the column headers and cell content", () => {
    const { container } = render(<TableHarness />);
    const headerText = Array.from(container.querySelectorAll("th")).map(
      (th) => th.textContent,
    );
    for (const header of [
      "Header",
      "Section Type",
      "Status",
      "Target",
      "Limit",
      "Reviewer",
    ]) {
      expect(headerText.join(" ")).toContain(header);
    }
    expect(screen.getByText("Feature request")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Narrative")).toBeInTheDocument();
  });

  it("renders the Done status with a check icon and others with a loader", () => {
    const { container } = render(<TableHarness />);
    expect(container.querySelector(".lucide-circle-check")).toBeInTheDocument();
    expect(container.querySelector(".lucide-loader")).toBeInTheDocument();
  });

  it("selects all page rows via the header checkbox", () => {
    render(<TableHarness />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all" }));
    expect(screen.getAllByRole("checkbox", { name: "Select row" }).length).toBe(
      2,
    );
    expect(
      screen.getAllByRole("checkbox", { name: "Select row" })[0],
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getAllByRole("checkbox", { name: "Select row" })[1],
    ).toHaveAttribute("aria-checked", "true");
  });

  it("marks the selected row with data-state selected", () => {
    render(<TableHarness />);
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select row" })[0]);
    const row = screen
      .getByText("Feature request")
      .closest("tr") as HTMLTableRowElement;
    expect(row).toHaveAttribute("data-state", "selected");
  });

  it("submits the target form and fires toast.promise", () => {
    const { container } = render(<TableHarness />);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    expect(toast.promise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({ loading: "Saving Feature request" }),
    );
  });

  it("renders the reviewer text when assigned and a select otherwise", () => {
    render(<TableHarness />);
    expect(screen.getByText("Eddie Lake")).toBeInTheDocument();
    expect(screen.getByText("Assign reviewer")).toBeInTheDocument();
  });

  it("renders the row actions menu", () => {
    const { container } = render(<TableHarness />);
    expect(container.querySelector(".lucide-ellipsis-vertical")).toBeTruthy();
  });

  it("renders the drag handle for each row", () => {
    const { container } = render(<TableHarness />);
    expect(container.querySelectorAll(".lucide-grip-vertical")).toHaveLength(2);
  });
});
