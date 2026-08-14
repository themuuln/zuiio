import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "@/components/ui/label";

function renderLabel(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Label", () => {
  it("renders with data-slot label", () => {
    const { $ } = renderLabel(<Label>Name</Label>);
    expect($("[data-slot='label']")).toBeInTheDocument();
  });

  it("renders children text", () => {
    render(<Label>Full Name</Label>);
    expect(screen.getByText("Full Name")).toBeInTheDocument();
  });

  it("renders as label element", () => {
    const { $ } = renderLabel(<Label>Label</Label>);
    expect($("[data-slot='label']")?.tagName).toBe("LABEL");
  });

  it("associates with input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="name-input">Name</Label>
        <input id="name-input" />
      </>,
    );
    const label = screen.getByText("Name");
    expect(label).toHaveAttribute("for", "name-input");
  });

  it("accepts custom className", () => {
    const { $ } = renderLabel(<Label className="custom-label">Label</Label>);
    expect($("[data-slot='label']")?.className).toContain("custom-label");
  });

  it("renders nested elements", () => {
    render(
      <Label>
        <span>Nested</span> Text
      </Label>,
    );
    expect(screen.getByText("Nested")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("passes additional HTML props", () => {
    const { $ } = renderLabel(
      <Label data-testid="test-label" id="my-label">
        Label
      </Label>,
    );
    expect($("[data-slot='label']")).toHaveAttribute("id", "my-label");
  });
});
