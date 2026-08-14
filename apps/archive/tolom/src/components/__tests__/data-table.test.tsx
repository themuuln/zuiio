import { describe, expect, it } from "vitest";
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
} from "@/components/data-table";
import {
  DataTableColumnHeader as OriginalColumnHeader,
  DataTable as OriginalDataTable,
  DataTablePagination as OriginalPagination,
  DataTableViewOptions as OriginalViewOptions,
} from "@/components/ui/data-table";

// The deprecated barrel must re-export the canonical ui/data-table symbols
describe("components/data-table re-export", () => {
  it("re-exports the same DataTable component", () => {
    expect(DataTable).toBe(OriginalDataTable);
  });

  it("re-exports DataTableColumnHeader", () => {
    expect(DataTableColumnHeader).toBe(OriginalColumnHeader);
  });

  it("re-exports DataTablePagination", () => {
    expect(DataTablePagination).toBe(OriginalPagination);
  });

  it("re-exports DataTableViewOptions", () => {
    expect(DataTableViewOptions).toBe(OriginalViewOptions);
  });
});
