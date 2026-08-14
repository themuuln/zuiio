import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BaySlotData } from "@/lib/services/bay-view-service.types";
import { render } from "@/test/test-utils";
import { ListView } from "../_list-view";

vi.mock("@/lib/queries/use-drawer-queries", () => ({
  prefetchDrawerData: vi.fn(),
}));

function makeBay(
  bayNumber: number,
  workOrder?: BaySlotData["workOrder"],
): BaySlotData {
  return { bayNumber, workOrder: workOrder ?? null };
}

const occupied: BaySlotData["workOrder"] = {
  id: "wo-1",
  bay_number: 3,
  mechanic_id: "m-1",
  status: "In Progress",
  started_at: "2026-08-09T09:00:00Z",
  vehicle: {
    id: "v-1",
    plate_number: "1234УБА",
    make: "Toyota",
    model: "Prius",
    year: 2020,
  } as NonNullable<BaySlotData["workOrder"]>["vehicle"],
  mechanic: { id: "m-1", full_name: "Бат", avatar_url: null },
  helpers: [{ id: "h-1", full_name: "Цэцэг", avatar_url: null }],
  customer_name: null,
};

const t = (key: string) => key;

describe("ListView", () => {
  it("renders occupied and empty rows with their data", () => {
    render(
      <ListView
        bays={[makeBay(3, occupied), makeBay(4)]}
        onOpenDetail={vi.fn()}
        onAssignClick={vi.fn()}
        t={t}
      />,
    );
    expect(screen.getByText("#03")).toBeTruthy();
    expect(screen.getByText("1234 УБА")).toBeTruthy();
    expect(screen.getByText("In Progress")).toBeTruthy();
    expect(screen.getByText("Toyota Prius")).toBeTruthy();
    expect(screen.getByText("Бат")).toBeTruthy();
    expect(screen.getByText("Цэцэг")).toBeTruthy();
    expect(screen.getByText("#04")).toBeTruthy();
    expect(screen.getByText("emptyBay")).toBeTruthy();
    expect(screen.getByText(/clickToAssign/)).toBeTruthy();
  });

  it("opens the detail drawer when an occupied row is clicked", () => {
    const onOpenDetail = vi.fn();
    render(
      <ListView
        bays={[makeBay(3, occupied)]}
        onOpenDetail={onOpenDetail}
        onAssignClick={vi.fn()}
        t={t}
      />,
    );
    fireEvent.click(screen.getByText("#03"));
    expect(onOpenDetail).toHaveBeenCalledWith("wo-1");
  });

  it("reports the assign click for empty rows", () => {
    const onAssignClick = vi.fn();
    render(
      <ListView
        bays={[makeBay(4)]}
        onOpenDetail={vi.fn()}
        onAssignClick={onAssignClick}
        t={t}
      />,
    );
    fireEvent.click(screen.getByText("#04"));
    expect(onAssignClick).toHaveBeenCalledWith(4);
  });

  it("shows unassigned and elapsed placeholders for a job without a mechanic", () => {
    render(
      <ListView
        bays={[makeBay(1, { ...occupied, mechanic: null, helpers: [] })]}
        onOpenDetail={vi.fn()}
        onAssignClick={vi.fn()}
        t={t}
      />,
    );
    expect(screen.getByText("Unassigned")).toBeTruthy();
  });
});
