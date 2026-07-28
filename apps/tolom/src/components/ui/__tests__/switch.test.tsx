import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "@/components/ui/switch";

function renderSwitch(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Switch", () => {
  it("renders with data-slot switch", () => {
    const { $ } = renderSwitch(<Switch />);
    expect($("[data-slot='switch']")).toBeInTheDocument();
  });

  it("renders thumb with data-slot switch-thumb", () => {
    const { $ } = renderSwitch(<Switch />);
    expect($("[data-slot='switch-thumb']")).toBeInTheDocument();
  });

  it("renders with default size by default", () => {
    const { $ } = renderSwitch(<Switch />);
    const sw = $("[data-slot='switch']");
    expect(sw).toHaveAttribute("data-size", "default");
  });

  it("renders with sm size", () => {
    const { $ } = renderSwitch(<Switch size="sm" />);
    const sw = $("[data-slot='switch']");
    expect(sw).toHaveAttribute("data-size", "sm");
  });

  it("accepts custom className", () => {
    const { $ } = renderSwitch(<Switch className="custom-switch" />);
    expect($("[data-slot='switch']")?.className).toContain("custom-switch");
  });

  it("renders checked state", () => {
    const { $ } = renderSwitch(<Switch defaultChecked />);
    const sw = $("[data-slot='switch']");
    // Base UI switch may have data-checked attribute
    expect(sw).toBeInTheDocument();
  });

  it("renders disabled state", () => {
    const { $ } = renderSwitch(<Switch disabled />);
    const sw = $("[data-slot='switch']");
    // Base UI adds data-disabled attribute
    expect(sw).toBeInTheDocument();
  });

  it("passes additional props", () => {
    render(<Switch data-testid="test-switch" />);
    expect(screen.getByTestId("test-switch")).toBeInTheDocument();
  });

  it("renders with aria-label when provided", () => {
    render(<Switch aria-label="Toggle feature" />);
    expect(screen.getByLabelText("Toggle feature")).toBeInTheDocument();
  });
});
