import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ListPageError,
  ListPageShell,
  ListPageSkeleton,
} from "@/components/list-page-shell";
import { render } from "@/test/test-utils";

const messages = {
  common: {
    error: "Error",
    somethingWentWrong: "Something went wrong",
    tryAgain: "Try again",
  },
};

describe("ListPageShell", () => {
  it("renders title", () => {
    render(
      <ListPageShell title="Customers">
        <div>content</div>
      </ListPageShell>,
      { messages },
    );
    expect(screen.getByText("Customers")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <ListPageShell title="Customers" description="Manage your customers">
        <div>content</div>
      </ListPageShell>,
      { messages },
    );
    expect(screen.getByText("Manage your customers")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <ListPageShell title="Customers">
        <div data-testid="child-content">content</div>
      </ListPageShell>,
      { messages },
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("renders header action when provided and not loading", () => {
    render(
      <ListPageShell
        title="Customers"
        headerAction={<button type="button">Add Customer</button>}
      >
        <div>content</div>
      </ListPageShell>,
      { messages },
    );
    expect(screen.getByText("Add Customer")).toBeInTheDocument();
  });

  it("shows skeleton for headerAction when loading", () => {
    const { container } = render(
      <ListPageShell
        title="Customers"
        headerAction={<button type="button">Add Customer</button>}
        loading={true}
      >
        <div>content</div>
      </ListPageShell>,
      { messages },
    );
    // Skeleton should appear instead of the action button
    expect(screen.queryByText("Add Customer")).not.toBeInTheDocument();
    // Skeleton element should be present
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });

  it("shows error state when error is provided", () => {
    render(
      <ListPageShell title="Customers" error="Failed to load" onRetry={vi.fn()}>
        <div>content</div>
      </ListPageShell>,
      { messages },
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("does not show retry button when onRetry is not provided", () => {
    render(
      <ListPageShell title="Customers" error="Failed">
        <div>content</div>
      </ListPageShell>,
      { messages },
    );
    expect(screen.queryByText("Try again")).not.toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(
      <ListPageShell title="Customers" className="custom-shell">
        <div>content</div>
      </ListPageShell>,
      { messages },
    );
    expect(container.querySelector(".custom-shell")).toBeInTheDocument();
  });
});

describe("ListPageSkeleton", () => {
  it("renders skeleton rows", () => {
    const { container } = render(<ListPageSkeleton rows={3} columns={4} />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(12); // 3 rows * 4 columns
  });

  it("accepts custom className", () => {
    const { container } = render(<ListPageSkeleton className="custom-sk" />);
    expect(container.querySelector(".custom-sk")).toBeInTheDocument();
  });
});

describe("ListPageError", () => {
  it("renders error message", () => {
    render(<ListPageError error="Database error" />, { messages });
    expect(screen.getByText("Database error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ListPageError error="Timed out" onRetry={onRetry} />, { messages });
    await user.click(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("does not render retry button when onRetry is omitted", () => {
    render(<ListPageError error="Error" />, { messages });
    expect(screen.queryByText("Try again")).not.toBeInTheDocument();
  });
});
