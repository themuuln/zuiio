import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";

function renderBadge(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-slot", "badge");
  });

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText("Secondary");
    expect(badge).toBeInTheDocument();
  });

  it("renders with destructive variant", () => {
    render(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText("Destructive")).toBeInTheDocument();
  });

  it("renders with outline variant", () => {
    render(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText("Outline")).toBeInTheDocument();
  });

  it("renders with ghost variant", () => {
    render(<Badge variant="ghost">Ghost</Badge>);
    expect(screen.getByText("Ghost")).toBeInTheDocument();
  });

  it("renders with link variant", () => {
    render(<Badge variant="link">Link</Badge>);
    expect(screen.getByText("Link")).toBeInTheDocument();
  });

  it("renders as a different element via render prop", () => {
    render(<Badge render={<a href="/test" />}>Link Badge</Badge>);
    const link = screen.getByText("Link Badge");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/test");
  });

  it("applies custom className", () => {
    const { $ } = renderBadge(<Badge className="custom-class">Styled</Badge>);
    const badge = $("[data-slot='badge']");
    expect(badge?.className).toContain("custom-class");
  });

  it("passes additional props to the element", () => {
    render(
      <Badge data-testid="test-badge" id="my-badge">
        Test
      </Badge>,
    );
    expect(screen.getByTestId("test-badge")).toHaveAttribute("id", "my-badge");
  });

  it("renders children content", () => {
    render(
      <Badge>
        <span>Nested</span> Content
      </Badge>,
    );
    expect(screen.getByText("Nested")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
