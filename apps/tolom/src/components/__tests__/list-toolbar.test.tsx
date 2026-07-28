import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ListToolbar } from "@/components/list-toolbar";
import { render } from "@/test/test-utils";

const messages = {
  common: {
    search: "Search",
  },
};

describe("ListToolbar", () => {
  it("renders search input when search config provided", () => {
    const { baseElement } = render(
      <ListToolbar
        search={{
          value: "",
          onChange: vi.fn(),
        }}
      />,
      { messages },
    );
    expect(
      baseElement.querySelector("[data-slot='search-input']"),
    ).toBeInTheDocument();
  });

  it("does not render search when search config omitted", () => {
    const { baseElement } = render(<ListToolbar />);
    expect(baseElement.querySelector("[data-slot='search-input']")).toBeNull();
  });

  it("renders action buttons when actions provided", () => {
    render(<ListToolbar actions={<button type="button">Add</button>} />);
    expect(screen.getByText("Add")).toBeInTheDocument();
  });

  it("renders filter content when provided", () => {
    render(<ListToolbar filters={<div data-testid="filters">Filters</div>} />);
    expect(screen.getByTestId("filters")).toBeInTheDocument();
  });

  it("renders stats when provided", () => {
    render(<ListToolbar stats={<span>10 total</span>} />);
    expect(screen.getByText("10 total")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<ListToolbar className="custom-lt" />);
    expect(container.querySelector(".custom-lt")).toBeInTheDocument();
  });

  it("renders with all sections combined", () => {
    render(
      <ListToolbar
        search={{ value: "", onChange: vi.fn() }}
        filters={<span>Status</span>}
        actions={<button type="button">Add</button>}
        stats={<span>42 items</span>}
      />,
      { messages },
    );
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Add")).toBeInTheDocument();
    expect(screen.getByText("42 items")).toBeInTheDocument();
  });
});
