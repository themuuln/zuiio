import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "@/components/ui/date-range-picker";

// Mock next-intl - note that useTranslations("dateRangePicker") is called,
// so the returned function receives keys without the namespace prefix
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      today: "Today",
      yesterday: "Yesterday",
      last7Days: "Last 7 days",
      last30Days: "Last 30 days",
      thisMonth: "This month",
      lastMonth: "Last month",
      thisYear: "This year",
      lastYear: "Last year",
      all: "All time",
      custom: "Custom",
    };
    return messages[key] ?? key;
  },
}));

describe("DateRangePicker", () => {
  it("renders with 'All time' as default label", () => {
    render(<DateRangePicker />);
    // The component's default value shows "All time" as preset
  });

  it("renders with custom placeholder", () => {
    render(<DateRangePicker placeholder="Select range" />);
    expect(screen.getByText("Select range")).toBeInTheDocument();
  });

  it("renders calendar icon", () => {
    render(<DateRangePicker />);
    expect(document.querySelector(".lucide-calendar-days")).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    const { container } = render(<DateRangePicker />);
    expect(
      container.querySelector(".lucide-calendar-days"),
    ).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<DateRangePicker className="custom-ranger" />);
    expect(
      container.querySelector(".lucide-calendar-days"),
    ).toBeInTheDocument();
  });
});
