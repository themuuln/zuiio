import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { StatusBadge } from "./status-badge";

const messages = {
  common: {
    statusLabels: {
      new: "New",
      diagnosing: "Diagnosing",
      inProgress: "In Progress",
      readyForPickup: "Ready for Pickup",
      completed: "Completed",
      cancelled: "Cancelled",
    },
  },
};

describe("StatusBadge", () => {
  it("renders translated label for each known status", () => {
    render(<StatusBadge status="New" />, { messages });
    expect(screen.getByText("New")).toBeDefined();
  });

  it("renders 'Diagnosing' with correct styling", () => {
    const { container } = render(<StatusBadge status="Diagnosing" />, { messages });
    expect(screen.getByText("Diagnosing")).toBeDefined();
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain("border-yellow-300");
  });

  it("renders 'In Progress' status", () => {
    render(<StatusBadge status="In Progress" />, { messages });
    expect(screen.getByText("In Progress")).toBeDefined();
  });

  it("renders 'Ready for Pickup' status", () => {
    render(<StatusBadge status="Ready for Pickup" />, { messages });
    expect(screen.getByText("Ready for Pickup")).toBeDefined();
  });

  it("renders 'Completed' status", () => {
    render(<StatusBadge status="Completed" />, { messages });
    expect(screen.getByText("Completed")).toBeDefined();
  });

  it("renders 'Cancelled' status", () => {
    render(<StatusBadge status="Cancelled" />, { messages });
    expect(screen.getByText("Cancelled")).toBeDefined();
  });

  it("applies custom className alongside status styles", () => {
    const { container } = render(
      <StatusBadge status="New" className="custom-class" />,
      { messages },
    );
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.classList.contains("custom-class")).toBe(true);
  });
});
