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
  it("renders with data-slot and children", () => {
    const { container } = render(<Empty>empty content</Empty>);
    const el = container.querySelector("[data-slot='empty']");
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("empty content");
  });

  it("applies custom className", () => {
    const { container } = render(<Empty className="custom-empty" />);
    expect(container.querySelector("[data-slot='empty']")?.className).toContain(
      "custom-empty",
    );
  });

  it("forwards extra props", () => {
    const { container } = render(<Empty data-testid="empty-root" />);
    expect(
      container.querySelector("[data-testid='empty-root']"),
    ).toBeInTheDocument();
  });
});

describe("Empty subcomponents", () => {
  it("renders header, title and description", () => {
    render(
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No items</EmptyTitle>
          <EmptyDescription>Try adding one</EmptyDescription>
        </EmptyHeader>
      </Empty>,
    );
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Try adding one")).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='empty-header']"),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='empty-title']"),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='empty-description']"),
    ).toBeInTheDocument();
  });

  it("renders media with default variant", () => {
    const { container } = render(<EmptyMedia>icon</EmptyMedia>);
    const media = container.querySelector("[data-slot='empty-icon']");
    expect(media).toBeInTheDocument();
    expect(media?.getAttribute("data-variant")).toBe("default");
  });

  it("renders media with icon variant", () => {
    const { container } = render(<EmptyMedia variant="icon">icon</EmptyMedia>);
    const media = container.querySelector("[data-slot='empty-icon']");
    expect(media?.getAttribute("data-variant")).toBe("icon");
  });

  it("renders content slot", () => {
    const { container } = render(
      <Empty>
        <EmptyContent>
          <button type="button">Add one</button>
        </EmptyContent>
      </Empty>,
    );
    expect(
      container.querySelector("[data-slot='empty-content']"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add one" })).toBeInTheDocument();
  });
});
