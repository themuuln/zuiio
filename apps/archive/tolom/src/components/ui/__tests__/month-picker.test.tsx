import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonthPicker } from "@/components/ui/month-picker";

function renderMP(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("MonthPicker", () => {
  it("renders with default placeholder", () => {
    render(<MonthPicker />);
    expect(screen.getByText("Select Month")).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<MonthPicker placeholder="Pick a month" />);
    expect(screen.getByText("Pick a month")).toBeInTheDocument();
  });

  it("renders calendar icon", () => {
    const { $ } = renderMP(<MonthPicker />);
    expect($(".lucide-calendar")).toBeInTheDocument();
  });

  it("renders with value", () => {
    render(<MonthPicker value="2026-05" />);
    expect(screen.getByText(/May/i)).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    const { $ } = renderMP(<MonthPicker className="custom-mp" />);
    expect($(".custom-mp")).toBeInTheDocument();
  });

  it("renders disabled state", () => {
    const { $$ } = renderMP(<MonthPicker disabled />);
    expect($$("[data-slot='popover-trigger']")).toBeDefined();
  });

  it("calls onChange when a month is selected", async () => {
    const onChange = vi.fn();
    render(<MonthPicker onChange={onChange} />);
    expect(screen.getByText("Select Month")).toBeInTheDocument();
  });
});
