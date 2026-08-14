import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function renderTable(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("Table", () => {
  it("wraps the table in a scroll container", () => {
    const { $ } = renderTable(<Table />);
    expect($("[data-slot='table-container']")).toBeInTheDocument();
    expect($("[data-slot='table']")).toBeInTheDocument();
  });

  it("applies custom className to the table", () => {
    const { $ } = renderTable(<Table className="custom-table" />);
    expect($("[data-slot='table']")?.className).toContain("custom-table");
  });

  it("renders a full table structure with header, body, footer and caption", () => {
    const { $, $$ } = renderTable(
      <Table>
        <TableCaption>Vehicle list</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Plate</TableHead>
            <TableHead>Model</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1234 ABC</TableCell>
            <TableCell>Prius</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>1</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    expect($("[data-slot='table-header']")).toBeInTheDocument();
    expect($("[data-slot='table-body']")).toBeInTheDocument();
    expect($("[data-slot='table-footer']")).toBeInTheDocument();
    expect($("[data-slot='table-caption']")?.textContent).toBe("Vehicle list");
    expect($$("[data-slot='table-row']")).toHaveLength(3);
    expect($$("[data-slot='table-head']")).toHaveLength(2);
    expect($$("[data-slot='table-cell']")).toHaveLength(4);
    expect($("[data-slot='table']")?.textContent).toContain("1234 ABC");
    expect($("[data-slot='table']")?.textContent).toContain("Prius");
  });

  it("passes custom className to subcomponents", () => {
    const { $ } = renderTable(
      <Table>
        <TableHeader className="custom-header">
          <TableRow className="custom-row">
            <TableHead className="custom-head">H</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="custom-body">
          <TableRow>
            <TableCell className="custom-cell">C</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className="custom-footer">
          <TableRow>
            <TableCell>F</TableCell>
          </TableRow>
        </TableFooter>
        <TableCaption className="custom-caption">Cap</TableCaption>
      </Table>,
    );
    expect($("[data-slot='table-header']")?.className).toContain(
      "custom-header",
    );
    expect($("[data-slot='table-body']")?.className).toContain("custom-body");
    expect($("[data-slot='table-footer']")?.className).toContain(
      "custom-footer",
    );
    expect($("[data-slot='table-row']")?.className).toContain("custom-row");
    expect($("[data-slot='table-head']")?.className).toContain("custom-head");
    expect($("[data-slot='table-cell']")?.className).toContain("custom-cell");
    expect($("[data-slot='table-caption']")?.className).toContain(
      "custom-caption",
    );
  });

  it("renders a table without header/footer", () => {
    const { $ } = renderTable(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Solo cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect($("[data-slot='table-body']")).toBeInTheDocument();
    expect($("[data-slot='table-header']")).not.toBeInTheDocument();
  });
});
