import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prefetchDrawerData } from "@/lib/queries/use-drawer-queries";
import type { BayViewWorkOrder } from "@/lib/services/bay-view-service";
import { render } from "@/test/test-utils";
import { QueueRail } from "../_queue-rail";

vi.mock("@/lib/queries/use-drawer-queries", () => ({
  prefetchDrawerData: vi.fn(),
}));

const t = (key: string) => key;

const item = {
  id: "wo-q-1",
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
  },
} as unknown as BayViewWorkOrder & { vehicle: BayViewWorkOrder["vehicle"] };

describe("QueueRail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing for an empty queue", () => {
    const { container } = render(
      <QueueRail
        items={[]}
        open
        onToggle={vi.fn()}
        onItemClick={vi.fn()}
        onAssignToBay={vi.fn()}
        t={t}
      />,
    );
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders queue items with plates and reports clicks", () => {
    const onItemClick = vi.fn();
    render(
      <QueueRail
        items={[item]}
        open
        onToggle={vi.fn()}
        onItemClick={onItemClick}
        onAssignToBay={vi.fn()}
        t={t}
      />,
    );
    expect(screen.getByText("1234 УБА")).toBeTruthy();
    expect(screen.getByText("Toyota Prius")).toBeTruthy();
    fireEvent.click(screen.getByText("1234 УБА"));
    expect(onItemClick).toHaveBeenCalledWith(item);
  });

  it("assigns a queue item to a bay without opening it", () => {
    const onAssignToBay = vi.fn();
    const onItemClick = vi.fn();
    render(
      <QueueRail
        items={[item]}
        open
        onToggle={vi.fn()}
        onItemClick={onItemClick}
        onAssignToBay={onAssignToBay}
        t={t}
      />,
    );
    fireEvent.click(screen.getByTitle("assignToBay"));
    expect(onAssignToBay).toHaveBeenCalledWith("wo-q-1");
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it("closes via the toggle button", () => {
    const onToggle = vi.fn();
    render(
      <QueueRail
        items={[item]}
        open
        onToggle={onToggle}
        onItemClick={vi.fn()}
        onAssignToBay={vi.fn()}
        t={t}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("applies the collapsed width when closed", () => {
    const { container } = render(
      <QueueRail
        items={[item]}
        open={false}
        onToggle={vi.fn()}
        onItemClick={vi.fn()}
        onAssignToBay={vi.fn()}
        t={t}
      />,
    );
    expect(container.querySelector(".w-\\[260px\\]")).toBeTruthy();
  });

  it("prefetches the drawer detail on hover after the debounce", () => {
    vi.useFakeTimers();
    render(
      <QueueRail
        items={[item]}
        open
        onToggle={vi.fn()}
        onItemClick={vi.fn()}
        onAssignToBay={vi.fn()}
        orgId="org-1"
        t={t}
      />,
    );

    fireEvent.mouseEnter(screen.getByText("1234 УБА"));
    expect(prefetchDrawerData).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(prefetchDrawerData).toHaveBeenCalledWith(
      expect.anything(),
      "org-1",
      "wo-q-1",
    );
  });

  it("skips prefetch without an orgId", () => {
    vi.useFakeTimers();
    render(
      <QueueRail
        items={[item]}
        open
        onToggle={vi.fn()}
        onItemClick={vi.fn()}
        onAssignToBay={vi.fn()}
        t={t}
      />,
    );

    fireEvent.mouseEnter(screen.getByText("1234 УБА"));
    vi.advanceTimersByTime(200);
    expect(prefetchDrawerData).not.toHaveBeenCalled();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
