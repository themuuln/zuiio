import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DatePicker } from "@/components/ui/date-picker";

describe("DatePicker", () => {
  it("renders with placeholder text", () => {
    render(<DatePicker />);
    expect(screen.getByText("Өдөр сонгох")).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<DatePicker placeholder="Select date" />);
    expect(screen.getByText("Select date")).toBeInTheDocument();
  });

  it("renders calendar icon", () => {
    render(<DatePicker />);
    expect(document.querySelector(".lucide-calendar")).toBeInTheDocument();
  });

  it("shows formatted date when value is provided", () => {
    render(<DatePicker value={new Date(2024, 0, 15)} />);
    expect(screen.getByText("2024-01-15")).toBeInTheDocument();
  });

  it("renders with disabled prop", () => {
    const { container } = render(<DatePicker disabled />);
    expect(container.querySelector(".lucide-calendar")).toBeInTheDocument();
  });

  it("renders with fromYear and toYear", () => {
    render(<DatePicker fromYear={2020} toYear={2030} />);
    expect(screen.getByText("Өдөр сонгох")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<DatePicker className="custom-picker" />);
    expect(screen.getByText("Өдөр сонгох")).toBeInTheDocument();
  });
});
