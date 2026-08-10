import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeltaIndicator } from "@/components/reports/delta-indicator";

describe("DeltaIndicator", () => {
  it("renders nothing for null or undefined values", () => {
    const { container: nullContainer } = render(
      <DeltaIndicator value={null} />,
    );
    expect(nullContainer.innerHTML).toBe("");
    const { container: undefContainer } = render(
      <DeltaIndicator value={undefined as never} />,
    );
    expect(undefContainer.innerHTML).toBe("");
  });

  it("renders a positive delta with a plus sign, percent and up arrow", () => {
    const { container } = render(<DeltaIndicator value={12.5} />);
    expect(screen.getByText("+12.5%")).toBeInTheDocument();
    expect(container.querySelector(".lucide-trending-up")).toBeInTheDocument();
    expect(screen.getByText("+12.5%").className).toContain("text-green-600");
  });

  it("renders a negative delta with a minus-free number and down arrow", () => {
    const { container } = render(<DeltaIndicator value={-3} />);
    expect(screen.getByText("-3.0%")).toBeInTheDocument();
    expect(
      container.querySelector(".lucide-trending-down"),
    ).toBeInTheDocument();
    expect(screen.getByText("-3.0%").className).toContain("text-red-500");
  });

  it("renders zero with neutral styling and no arrow", () => {
    const { container } = render(<DeltaIndicator value={0} />);
    const el = screen.getByText("0.0%");
    expect(el.className).toContain("text-muted-foreground");
    expect(
      container.querySelector(".lucide-trending-up"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".lucide-trending-down"),
    ).not.toBeInTheDocument();
  });

  it("hides the percent suffix when showPercent is false", () => {
    render(<DeltaIndicator value={4} showPercent={false} />);
    expect(screen.getByText("+4.0")).toBeInTheDocument();
  });

  it("inverts colors: positive becomes red", () => {
    render(<DeltaIndicator value={10} invert />);
    expect(screen.getByText("+10.0%").className).toContain("text-red-500");
  });

  it("inverts colors: negative becomes green", () => {
    render(<DeltaIndicator value={-10} invert />);
    expect(screen.getByText("-10.0%").className).toContain("text-green-600");
  });
});
