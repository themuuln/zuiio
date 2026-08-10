import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { StatusFilter } from "../_status-filter";

const t = (key: string) => key;

describe("StatusFilter", () => {
  it("renders all four filter options", () => {
    render(
      <StatusFilter statusFilter={null} setStatusFilter={vi.fn()} t={t} />,
    );
    expect(screen.getByText("allStatuses")).toBeTruthy();
    expect(screen.getByText("inProgress")).toBeTruthy();
    expect(screen.getByText("newStatus")).toBeTruthy();
    expect(screen.getByText("ready")).toBeTruthy();
  });

  it("calls setStatusFilter with the clicked status", () => {
    const setStatusFilter = vi.fn();
    render(
      <StatusFilter
        statusFilter={null}
        setStatusFilter={setStatusFilter}
        t={t}
      />,
    );
    fireEvent.click(screen.getByText("inProgress"));
    expect(setStatusFilter).toHaveBeenCalledWith("In Progress");
  });

  it("calls setStatusFilter with null for the all-statuses option", () => {
    const setStatusFilter = vi.fn();
    render(
      <StatusFilter
        statusFilter="In Progress"
        setStatusFilter={setStatusFilter}
        t={t}
      />,
    );
    fireEvent.click(screen.getByText("allStatuses"));
    expect(setStatusFilter).toHaveBeenCalledWith(null);
  });

  it("marks the active filter with the active background class", () => {
    const { container } = render(
      <StatusFilter statusFilter="New" setStatusFilter={vi.fn()} t={t} />,
    );
    const activeButton = container.querySelector("button.text-foreground");
    expect(activeButton).toBeTruthy();
    expect(activeButton?.textContent).toContain("newStatus");
  });
});
