import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { StatusPill } from "../_status-pill";

describe("StatusPill", () => {
  it.each([
    "New",
    "Diagnosing",
    "In Progress",
    "Ready for Pickup",
    "Completed",
    "Cancelled",
  ])("renders the %s status label", (status) => {
    render(<StatusPill status={status} />);
    // Status is rendered twice: sr-only (mobile) + inline (desktop)
    expect(screen.getAllByText(status)).toHaveLength(2);
  });

  it("shows the pulse dot for In Progress", () => {
    const { container } = render(<StatusPill status="In Progress" />);
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("falls back to muted styling for unknown statuses", () => {
    const { container } = render(<StatusPill status="Unknown" />);
    expect(screen.getAllByText("Unknown")).toHaveLength(2);
    expect(container.querySelector(".bg-muted")).toBeTruthy();
  });
});
