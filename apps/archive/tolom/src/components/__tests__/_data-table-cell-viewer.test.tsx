import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TableCellViewer } from "@/components/_data-table-cell-viewer";

vi.mock("@/components/_data-table-chart", () => ({
  DataTableChart: () => <div data-testid="mock-chart" />,
}));

const item = {
  id: 1,
  header: "Feature request",
  type: "Design",
  status: "Done",
  target: "10",
  limit: "5",
  reviewer: "Eddie Lake",
};

describe("TableCellViewer", () => {
  it("renders the header as a link-style button", () => {
    render(<TableCellViewer item={item} />);
    expect(
      screen.getByRole("button", { name: "Feature request" }),
    ).toBeInTheDocument();
  });

  it("opens the detail drawer with prefilled fields and the chart", async () => {
    render(<TableCellViewer item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "Feature request" }));

    // Drawer title + inputs prefilled from the item
    expect(screen.getAllByText("Feature request").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Design")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Done")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(await screen.findByTestId("mock-chart")).toBeInTheDocument();
  });

  it("closes and reopens the drawer without losing the item", () => {
    render(<TableCellViewer item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "Feature request" }));
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();

    // Close is wired to the internal open state — clicking again reopens
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Feature request" }));
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });
});
