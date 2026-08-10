import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { StatusStepper } from "../_status-stepper";

describe("StatusStepper", () => {
  it("renders all four steps with abbreviated Ready label", () => {
    render(<StatusStepper currentStatus="New" />);
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByText("Diagnosing")).toBeTruthy();
    expect(screen.getByText("In Progress")).toBeTruthy();
    expect(screen.getByText("Ready")).toBeTruthy();
  });

  it("marks past steps as completed with a checkmark", () => {
    const { container } = render(<StatusStepper currentStatus="In Progress" />);
    // New + Diagnosing are past → two checkmarks
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
    expect(container.textContent?.match(/\u2713/g)).toHaveLength(2);
  });

  it("treats Completed as the final step by filling the progress line", () => {
    const { container } = render(<StatusStepper currentStatus="Completed" />);
    // Completed is not in STEP_ORDER, so no checkmarks — but the progress
    // line spans the full width (100% - 20px offset).
    expect(container.textContent?.match(/\u2713/g)).toBeNull();
    expect(
      container.querySelector('[style*="calc(100% - 20px)"]'),
    ).toBeTruthy();
  });

  it("treats unknown statuses as if no progress was made", () => {
    const { container } = render(<StatusStepper currentStatus="Cancelled" />);
    expect(container.textContent?.match(/\u2713/g)).toBeNull();
  });
});
