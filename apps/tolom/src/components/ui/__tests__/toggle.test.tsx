import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toggle } from "@/components/ui/toggle";

function renderToggle(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Toggle", () => {
  it("renders with data-slot toggle", () => {
    const { $ } = renderToggle(<Toggle>Toggle</Toggle>);
    const toggle = $("[data-slot='toggle']");
    expect(toggle).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<Toggle>Click me</Toggle>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    const { $ } = renderToggle(<Toggle>Default</Toggle>);
    const toggle = $("[data-slot='toggle']");
    expect(toggle).toBeInTheDocument();
  });

  it("renders with outline variant", () => {
    const { $ } = renderToggle(<Toggle variant="outline">Outline</Toggle>);
    const toggle = $("[data-slot='toggle']");
    expect(toggle).toBeInTheDocument();
  });

  it("renders with sm size", () => {
    const { $ } = renderToggle(<Toggle size="sm">Small</Toggle>);
    const toggle = $("[data-slot='toggle']");
    expect(toggle).toBeInTheDocument();
  });

  it("renders with lg size", () => {
    const { $ } = renderToggle(<Toggle size="lg">Large</Toggle>);
    const toggle = $("[data-slot='toggle']");
    expect(toggle).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderToggle(
      <Toggle className="custom-class">Styled</Toggle>,
    );
    const toggle = $("[data-slot='toggle']");
    expect(toggle?.className).toContain("custom-class");
  });

  it("passes additional props", () => {
    render(<Toggle data-testid="test-toggle">Test</Toggle>);
    expect(screen.getByTestId("test-toggle")).toBeInTheDocument();
  });

  it("renders with pressed state", () => {
    const { $ } = renderToggle(
      <Toggle defaultPressed data-testid="pressed-toggle">
        Pressed
      </Toggle>,
    );
    const toggle = $("[data-slot='toggle']");
    // Base UI toggle should have aria-pressed or data-pressed when pressed
    expect(toggle).toBeInTheDocument();
  });
});
