import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BayViewWorkOrder } from "@/lib/services/bay-view-service";
import { render } from "@/test/test-utils";
import { CondensedQueueItem } from "../_condensed-queue-item";

vi.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

function makeWorkOrder(
  overrides: Partial<BayViewWorkOrder> = {},
): BayViewWorkOrder & { vehicle: BayViewWorkOrder["vehicle"] } {
  return {
    id: "wo-queue-1",
    bay_number: null,
    mechanic_id: null,
    status: "New",
    created_at: "2026-08-09T09:00:00Z",
    vehicle: {
      id: "v-1",
      plate_number: "1234УБА",
      make: "Toyota",
      model: "Prius",
      year: 2020,
    } as BayViewWorkOrder["vehicle"],
    ...overrides,
  } as BayViewWorkOrder & { vehicle: BayViewWorkOrder["vehicle"] };
}

describe("CondensedQueueItem", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the plate number and a short wait time", () => {
    render(
      <CondensedQueueItem workOrder={makeWorkOrder()} onClick={vi.fn()} />,
    );
    expect(screen.getByText("1234 УБА")).toBeTruthy();
    expect(screen.getByText(/wait/)).toBeTruthy();
  });

  it("renders a truncated work order id without a vehicle", () => {
    render(
      <CondensedQueueItem
        workOrder={makeWorkOrder({ vehicle: null })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText(`WO ${"wo-queue-1".slice(0, 8)}`)).toBeTruthy();
  });

  it("flags long waits as urgent", () => {
    render(
      <CondensedQueueItem
        workOrder={makeWorkOrder({ created_at: "2026-08-09T08:00:00Z" })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText(/wait/).textContent).toContain("2h+");
    expect(document.querySelector(".bg-amber-500")).toBeTruthy();
  });

  it("reports clicks on the queue item", () => {
    const onClick = vi.fn();
    render(
      <CondensedQueueItem workOrder={makeWorkOrder()} onClick={onClick} />,
    );
    fireEvent.click(screen.getByText("1234 УБА"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
