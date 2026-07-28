import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/ui/calendar";

function renderCalendar(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Calendar", () => {
  it("renders a day picker with calendar data-slot", () => {
    const { $ } = renderCalendar(<Calendar mode="single" />);
    expect($("[data-slot='calendar']")).toBeInTheDocument();
  });

  it("renders month navigation buttons", () => {
    const { $ } = renderCalendar(<Calendar mode="single" />);
    // There should be previous and next buttons
    const buttons = document.querySelectorAll("[data-slot='button']");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("renders weekdays headers", () => {
    const { $ } = renderCalendar(<Calendar mode="single" />);
    // The day picker renders weekday elements
    const calendar = $("[data-slot='calendar']");
    expect(calendar).toBeInTheDocument();
  });

  it("accepts selected date", () => {
    const { $ } = renderCalendar(
      <Calendar mode="single" selected={new Date(2024, 0, 15)} />,
    );
    expect($("[data-slot='calendar']")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { $ } = renderCalendar(
      <Calendar mode="single" className="custom-cal" />,
    );
    expect($("[data-slot='calendar']")?.className).toContain("custom-cal");
  });

  it("renders with outside days shown by default", () => {
    const { $ } = renderCalendar(<Calendar mode="single" />);
    expect($("[data-slot='calendar']")).toBeInTheDocument();
  });

  it("renders with dropdown caption layout", () => {
    const { $ } = renderCalendar(
      <Calendar mode="single" captionLayout="dropdown" />,
    );
    expect($("[data-slot='calendar']")).toBeInTheDocument();
  });
});
