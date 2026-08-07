import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

describe("Empty", () => {
  it("renders with default classes", () => {
    const { container } = render(<Empty />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-slot", "empty");
    expect(el.className).toContain("flex");
  });

  it("renders children", () => {
    render(
      <Empty>
        <span data-testid="child" />
      </Empty>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

describe("EmptyHeader", () => {
  it("renders", () => {
    const { container } = render(<EmptyHeader>Header</EmptyHeader>);
    expect(container.textContent).toBe("Header");
  });
});

describe("EmptyMedia", () => {
  it("renders with default variant", () => {
    const { container } = render(<EmptyMedia />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-slot", "empty-icon");
  });
});

describe("EmptyTitle", () => {
  it("renders text", () => {
    render(<EmptyTitle>Title</EmptyTitle>);
    expect(screen.getByText("Title")).toBeInTheDocument();
  });
});

describe("EmptyDescription", () => {
  it("renders description", () => {
    render(<EmptyDescription>Description</EmptyDescription>);
    expect(screen.getByText("Description")).toBeInTheDocument();
  });
});

describe("EmptyContent", () => {
  it("renders children", () => {
    render(
      <EmptyContent>
        <span data-testid="content" />
      </EmptyContent>,
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });
});
