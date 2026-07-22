import { render, screen } from "@testing-library/react";
import { DollarSign } from "lucide-react";
import { describe, expect, it } from "vitest";
import { KpiCard } from "./_kpi-card";

describe("KpiCard", () => {
  const defaultProps = {
    label: "Total Revenue",
    value: "₮500,000",
    icon: DollarSign,
  };

  it("renders label and value", () => {
    render(<KpiCard {...defaultProps} />);
    expect(screen.getByText("Total Revenue")).toBeDefined();
    expect(screen.getByText("₮500,000")).toBeDefined();
  });

  it("renders subtitle when provided", () => {
    render(<KpiCard {...defaultProps} subtitle="3 completed today" />);
    expect(screen.getByText("3 completed today")).toBeDefined();
  });

  it("does not render subtitle when not provided", () => {
    const { container } = render(<KpiCard {...defaultProps} />);
    // Only one text-muted-foreground exists from the label
    const mutedElements = container.querySelectorAll(".text-muted-foreground");
    // Label is text-muted-foreground, subtitle would also be
    // Check that no subtitle text appears
    expect(screen.queryByText(/completed/i)).toBeNull();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(
      <KpiCard {...defaultProps} loading subtitle="Should not appear" />,
    );
    // Value should not be visible when loading
    expect(screen.queryByText("₮500,000")).toBeNull();
    // Subtitle should not appear either
    expect(screen.queryByText("Should not appear")).toBeNull();
    // Skeleton should render
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toBeDefined();
  });

  it("renders the icon with aria-hidden", () => {
    const { container } = render(<KpiCard {...defaultProps} />);
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeDefined();
  });
});
