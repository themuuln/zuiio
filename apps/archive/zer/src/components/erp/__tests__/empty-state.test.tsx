/**
 * Tests for ErpEmptyState component.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErpEmptyState } from "../empty-state";

describe("ErpEmptyState", () => {
  it("renders title", () => {
    render(<ErpEmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(
      <ErpEmptyState title="No items" description="Try creating a new item" />,
    );
    expect(screen.getByText("Try creating a new item")).toBeDefined();
  });

  it("renders action when provided", () => {
    render(
      <ErpEmptyState
        title="No items"
        action={<button type="button">Create</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeDefined();
  });

  it("renders without crashing with just title", () => {
    const { container } = render(<ErpEmptyState title="Empty" />);
    expect(container).toBeDefined();
  });
});
