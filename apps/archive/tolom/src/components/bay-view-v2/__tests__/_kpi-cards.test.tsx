import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ShiftReport } from "@/lib/services/bay-view-service";
import type { BaySlotData } from "@/lib/services/bay-view-service.types";
import { render } from "@/test/test-utils";
import { KpiCards } from "../_kpi-cards";

const t = (key: string) => key;

function makeBay(
  bayNumber: number,
  workOrder?: BaySlotData["workOrder"],
): BaySlotData {
  return { bayNumber, workOrder: workOrder ?? null };
}

const occupiedBay: BaySlotData["workOrder"] = {
  id: "wo-1",
  bay_number: 1,
  mechanic_id: "m-1",
  status: "In Progress",
  started_at: "2026-08-09T08:00:00Z",
  vehicle: {
    id: "v-1",
    plate_number: "1234УБА",
    make: "Toyota",
  } as BaySlotData["workOrder"] extends infer T
    ? NonNullable<T>["vehicle"]
    : never,
  mechanic: { id: "m-1", full_name: "Бат", avatar_url: null },
  helpers: [],
  customer_name: "Дорж",
} as unknown as BaySlotData["workOrder"];

const shiftReport: ShiftReport = {
  completedToday: 3,
  revenueToday: 120000,
  avgDurationMinutes: 90,
  bayUtilization: 75,
  bayCount: 10,
  activeJobs: 4,
  revenuePerLaborHour: 15000,
};

const queueItem = {
  id: "wo-queue-1",
  bay_number: null,
  mechanic_id: null,
  status: "New",
  created_at: "2026-08-09T09:00:00Z",
  vehicle: { id: "v-2", plate_number: "5678УБА", make: "Honda" },
} as unknown as Parameters<typeof KpiCards>[0]["waitingQueue"][number];

const baseProps = {
  shiftReport,
  trendDelta: null,
  occupiedBays: 1,
  bayCount: 10,
  waitingQueueLength: 1,
  bays: [makeBay(1, occupiedBay), makeBay(2)],
  waitingQueue: [queueItem],
  onOpenWorkOrder: vi.fn(),
  t,
};

describe("KpiCards", () => {
  it("renders stat values from the shift report", () => {
    render(<KpiCards {...baseProps} />);
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("₮ 15,000")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("shows the waiting queue count subtitle on active jobs", () => {
    render(<KpiCards {...baseProps} />);
    expect(screen.getByText("+1")).toBeTruthy();
  });

  it("renders trend deltas when provided", () => {
    render(
      <KpiCards
        {...baseProps}
        trendDelta={{
          bayUtilization: 5,
          activeJobs: -2,
          completedToday: 0,
          revenueToday: 10,
          revenuePerLaborHour: -1,
        }}
      />,
    );
    // Positive trend shows +5
    expect(screen.getByText("5")).toBeTruthy();
    // Negative trend shows -2
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("opens the bay utilization dialog with occupied and available bays", () => {
    render(<KpiCards {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /bayUtilization/ }));
    // formatPlateNumber inserts a space between digits and letters
    expect(screen.getByText("1234 УБА")).toBeTruthy();
    expect(screen.getByText("Бат")).toBeTruthy();
    expect(screen.getByText("Occupied Bays")).toBeTruthy();
    expect(screen.getByText("Available Bays")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("opens the waiting queue dialog and reports the open callback", () => {
    const onOpenWorkOrder = vi.fn();
    render(<KpiCards {...baseProps} onOpenWorkOrder={onOpenWorkOrder} />);
    fireEvent.click(screen.getByRole("button", { name: /waitingQueue/ }));
    expect(screen.getByText("5678 УБА")).toBeTruthy();
    expect(screen.getByText("Honda")).toBeTruthy();
    fireEvent.click(screen.getByText("5678 УБА"));
    expect(onOpenWorkOrder).toHaveBeenCalledWith("wo-queue-1");
  });

  it("opens the completed-today dialog with revenue breakdown", () => {
    render(<KpiCards {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /completedToday/ }));
    // Revenue appears both in the summary card and the totals row
    expect(screen.getAllByText("₮ 120,000").length).toBeGreaterThan(0);
    expect(screen.getByText("Revenue per job")).toBeTruthy();
  });

  it("shows the no-vehicles-waiting empty state", () => {
    render(
      <KpiCards
        {...baseProps}
        bays={[]}
        waitingQueue={[]}
        waitingQueueLength={0}
        shiftReport={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /waitingQueue/ }));
    expect(screen.getByText("No vehicles waiting")).toBeTruthy();
  });

  it("shows the no-bay-data empty state", () => {
    render(
      <KpiCards
        {...baseProps}
        bays={[]}
        waitingQueue={[]}
        waitingQueueLength={0}
        shiftReport={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /bayUtilization/ }));
    expect(screen.getByText("No bay data available")).toBeTruthy();
  });
});
