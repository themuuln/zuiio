import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BaySlotData } from "@/lib/services/bay-view-service.types";
import { render } from "@/test/test-utils";
import { GridView } from "../_grid-view";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));

vi.mock("@/lib/queries/use-drawer-queries", () => ({
  prefetchDrawerData: vi.fn(),
}));

vi.mock("@/components/mechanic-avatar", () => ({
  MechanicAvatar: () => <span data-testid="mechanic-avatar" />,
}));

vi.mock("@/components/mechanic-avatar-chip", () => ({
  MechanicAvatarChip: () => <span data-testid="mechanic-chip" />,
}));

vi.mock("@/components/mechanic-picker-drawer", () => ({
  MechanicPickerDrawer: () => null,
}));

function makeBay(
  bayNumber: number,
  workOrder?: BaySlotData["workOrder"],
): BaySlotData {
  return { bayNumber, workOrder: workOrder ?? null };
}

const occupied: BaySlotData["workOrder"] = {
  id: "wo-1",
  bay_number: 1,
  mechanic_id: null,
  status: "In Progress",
  started_at: "2026-08-09T09:00:00Z",
  vehicle: {
    id: "v-1",
    plate_number: "1234УБА",
    make: "Toyota",
    model: "Prius",
    year: 2020,
  } as NonNullable<BaySlotData["workOrder"]>["vehicle"],
  mechanic: null,
  helpers: [],
  customer_name: null,
};

const baseHandlers = {
  onStatusChange: vi.fn(),
  onRemoveFromBay: vi.fn(),
  onOpenDetail: vi.fn(),
  onAssignClick: vi.fn(),
  onRemoveHelper: vi.fn(),
};

describe("GridView", () => {
  it("renders a card per bay with vehicle data", () => {
    render(
      <GridView
        bays={[makeBay(1, occupied), makeBay(2)]}
        pendingWoIds={{}}
        {...baseHandlers}
      />,
    );
    expect(screen.getByText("1234")).toBeTruthy();
    expect(screen.getByText("Toyota Prius · 2020")).toBeTruthy();
    expect(screen.getByText("BAY 02")).toBeTruthy();
  });

  it("reports the assign click for empty bays", () => {
    const onAssignClick = vi.fn();
    render(
      <GridView
        bays={[makeBay(4)]}
        pendingWoIds={{}}
        {...baseHandlers}
        onAssignClick={onAssignClick}
      />,
    );
    fireEvent.click(screen.getByText("clickToAddVehicle"));
    expect(onAssignClick).toHaveBeenCalledWith(4);
  });

  it("opens the detail drawer for occupied bays", () => {
    const onOpenDetail = vi.fn();
    render(
      <GridView
        bays={[makeBay(1, occupied)]}
        pendingWoIds={{}}
        {...baseHandlers}
        onOpenDetail={onOpenDetail}
      />,
    );
    const section = screen.getByLabelText("Bay 1 - 1234УБА");
    const card = section.querySelector(".cursor-pointer");
    expect(card).not.toBeNull();
    fireEvent.click(card as Element);
    expect(onOpenDetail).toHaveBeenCalledWith("wo-1");
  });

  it("marks pending work orders", () => {
    render(
      <GridView
        bays={[makeBay(1, occupied)]}
        pendingWoIds={{ "wo-1": true }}
        {...baseHandlers}
      />,
    );
    expect(
      screen
        .getByLabelText("Bay 1 - 1234УБА")
        .querySelector(".pointer-events-none"),
    ).toBeTruthy();
  });
});
