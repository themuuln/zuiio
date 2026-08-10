import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppointmentDatePicker } from "@/components/ui/appointment-date-picker";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      today: "Today",
      tomorrow: "Tomorrow",
      inOneWeek: "In 1 week",
      inTwoWeeks: "In 2 weeks",
      inOneMonth: "In 1 month",
      inThreeMonths: "In 3 months",
      inSixMonths: "In 6 months",
      clearDate: "Clear date",
      selectDate: "Select date",
    };
    return messages[key] ?? key;
  },
}));

function toIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

describe("AppointmentDatePicker", () => {
  it("renders the default placeholder when no value is set", () => {
    render(<AppointmentDatePicker />);
    expect(screen.getByText("Select date")).toBeInTheDocument();
  });

  it("renders a custom placeholder", () => {
    render(<AppointmentDatePicker placeholder="Pick a date" />);
    expect(screen.getByText("Pick a date")).toBeInTheDocument();
  });

  it("renders the formatted value when set", () => {
    render(<AppointmentDatePicker value={new Date(2026, 7, 10)} />);
    expect(screen.getByText("Mon, Aug 10, 2026")).toBeInTheDocument();
  });

  it("opens the popover with presets and a calendar when the trigger is clicked", () => {
    render(<AppointmentDatePicker />);
    fireEvent.click(screen.getByText("Select date"));
    expect(screen.getAllByText("Tomorrow").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Clear date").length).toBeGreaterThan(0);
    // react-day-picker grid renders
    expect(document.querySelector('[role="grid"]')).toBeInTheDocument();
  });

  it("fires onChange with tomorrow's date when the Tomorrow preset is clicked", () => {
    const onChange = vi.fn();
    render(<AppointmentDatePicker onChange={onChange} />);
    fireEvent.click(screen.getByText("Select date"));
    fireEvent.click(screen.getAllByText("Tomorrow")[0]);
    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0][0] as Date;
    expect(arg).toBeInstanceOf(Date);
    expect(sameDay(arg, new Date(Date.now() + 24 * 60 * 60 * 1000))).toBe(true);
  });

  it("fires onChange with undefined when Clear date is clicked", () => {
    const onChange = vi.fn();
    render(<AppointmentDatePicker onChange={onChange} />);
    fireEvent.click(screen.getByText("Select date"));
    fireEvent.click(screen.getAllByText("Clear date")[0]);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("fires onChange with the picked calendar day", () => {
    const onChange = vi.fn();
    render(<AppointmentDatePicker onChange={onChange} />);
    fireEvent.click(screen.getByText("Select date"));

    // Pick a day a few days ahead (still in the current month, never disabled)
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      Math.min(now.getDate() + 5, 27),
    );
    const cells = document.querySelectorAll(`[data-day="${toIso(target)}"]`);
    expect(cells.length).toBeGreaterThan(0);
    const dayButton = cells[0].querySelector("button");
    expect(dayButton).not.toBeNull();
    fireEvent.click(dayButton as Element);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(sameDay(onChange.mock.calls[0][0] as Date, target)).toBe(true);
  });

  it("closes the popover after picking a day", () => {
    const onChange = vi.fn();
    render(<AppointmentDatePicker onChange={onChange} />);
    fireEvent.click(screen.getByText("Select date"));
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      Math.min(now.getDate() + 5, 27),
    );
    const cells = document.querySelectorAll(`[data-day="${toIso(target)}"]`);
    const dayButton = cells[0].querySelector("button");
    fireEvent.click(dayButton as Element);
    // popover content stays mounted for the exit animation but is closed
    const content = document.querySelector("[data-slot='popover-content']");
    expect(content?.getAttribute("data-closed")).toBeDefined();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("marks past days as disabled before the min date", () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 10);
    render(<AppointmentDatePicker minDate={minDate} />);
    fireEvent.click(screen.getByText("Select date"));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const cells = document.querySelectorAll(`[data-day="${toIso(yesterday)}"]`);
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(cell.getAttribute("data-disabled")).toBeDefined();
    }
  });

  it("applies the selected style to the matching preset button", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    render(<AppointmentDatePicker value={tomorrow} />);
    // trigger shows the formatted date (contains a comma)
    fireEvent.click(screen.getByText(/,\s/));
    const buttons = screen.getAllByRole("button", { name: "Tomorrow" });
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0].className).toContain("bg-primary/10");
  });

  it("applies custom className to the trigger button", () => {
    render(<AppointmentDatePicker className="custom-trigger" />);
    expect(document.querySelector(".custom-trigger")).toBeInTheDocument();
  });
});
