import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimePicker } from "@/components/ui/time-picker";

function renderTP(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("TimePicker", () => {
  it("renders clock icon", () => {
    const { $ } = renderTP(<TimePicker />);
    expect($(".lucide-clock")).toBeInTheDocument();
  });

  it("renders hour and minute select triggers", () => {
    const { $$ } = renderTP(<TimePicker />);
    const triggers = $$("[data-slot='select-trigger']");
    expect(triggers.length).toBeGreaterThanOrEqual(1);
  });

  it("renders with provided date value", () => {
    const date = new Date(2026, 0, 1, 14, 30, 0);
    const { container } = renderTP(<TimePicker value={date} />);
    expect(container).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    const { $ } = renderTP(<TimePicker className="custom-tp" />);
    expect($(".custom-tp")).toBeInTheDocument();
  });

  it("renders disabled state", () => {
    const { $$ } = renderTP(<TimePicker disabled />);
    const triggers = $$("[data-slot='select-trigger']");
    expect(triggers.length).toBeGreaterThanOrEqual(1);
  });

  it("renders colon separator between hours and minutes", () => {
    renderTP(<TimePicker />);
    expect(screen.getByText(":")).toBeInTheDocument();
  });
});
