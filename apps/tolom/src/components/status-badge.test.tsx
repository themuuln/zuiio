import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it('renders "New" status with correct label', () => {
    render(<StatusBadge status="New" />);
    const badge = screen.getByText("New");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("data-slot")).toBe("badge");
  });

  it('renders "Diagnosing" status', () => {
    render(<StatusBadge status="Diagnosing" />);
    expect(screen.getByText("Diagnosing")).toBeDefined();
  });

  it('renders "In Progress" status', () => {
    render(<StatusBadge status="In Progress" />);
    expect(screen.getByText("In Progress")).toBeDefined();
  });

  it('renders "Ready for Pickup" status', () => {
    render(<StatusBadge status="Ready for Pickup" />);
    expect(screen.getByText("Ready for Pickup")).toBeDefined();
  });

  it('renders "Completed" status', () => {
    render(<StatusBadge status="Completed" />);
    expect(screen.getByText("Completed")).toBeDefined();
  });

  it('renders "Cancelled" status', () => {
    render(<StatusBadge status="Cancelled" />);
    expect(screen.getByText("Cancelled")).toBeDefined();
  });

  it("handles unknown status gracefully", () => {
    render(<StatusBadge status={"Unknown" as any} />);
    expect(screen.getByText("Unknown")).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(
      <StatusBadge status="New" className="custom-class" />,
    );
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.classList.contains("custom-class")).toBe(true);
  });
});
