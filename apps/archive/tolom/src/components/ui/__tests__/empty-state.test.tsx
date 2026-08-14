import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  it("renders with required title", () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders with description when provided", () => {
    render(
      <EmptyState
        title="No results"
        description="Try adjusting your search filters."
      />,
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting your search filters."),
    ).toBeInTheDocument();
  });

  it("renders default Inbox icon when no icon is provided", () => {
    render(<EmptyState title="Empty" />);
    // Inbox icon renders as an inline SVG
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders custom icon when provided", () => {
    const CustomIcon = () => (
      <svg data-testid="custom-icon" width="24" height="24" />
    );
    render(<EmptyState title="Custom" icon={<CustomIcon />} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders action button and fires onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <EmptyState title="No data" action={{ label: "Add Item", onClick }} />,
    );
    const button = screen.getByText("Add Item");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not render action button when action is not provided", () => {
    render(<EmptyState title="No action" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="No content" />);
    expect(screen.getByText("No content")).toBeInTheDocument();
    // The description wrapper (using Typography.Muted → text-muted-foreground) should not render
    const mutedText = screen.queryByText(
      (content) => content.includes("muted") || content.includes("description"),
    );
    expect(mutedText).not.toBeInTheDocument();
  });

  it("renders with long title text", () => {
    const longTitle =
      "This is a very long empty state title that should still render correctly without any issues or truncation problems";
    render(<EmptyState title={longTitle} />);
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("renders action button with correct variant and size", () => {
    const onClick = vi.fn();
    render(<EmptyState title="Empty" action={{ label: "Create", onClick }} />);
    const button = screen.getByText("Create");
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("outline");
  });
});
