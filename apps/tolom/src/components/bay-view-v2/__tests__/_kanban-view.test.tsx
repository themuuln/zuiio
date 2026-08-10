import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BaySlotData } from "@/lib/services/bay-view-service.types";
import { render } from "@/test/test-utils";
import { KanbanView } from "../_kanban-view";

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

const t = (key: string) => key;

function makeBay(bayNumber: number, status?: string): BaySlotData {
  return {
    bayNumber,
    workOrder: status
      ? ({
          id: `wo-${bayNumber}`,
          bay_number: bayNumber,
          mechanic_id: null,
          status,
          started_at: "2026-08-09T09:00:00Z",
          vehicle: {
            id: `v-${bayNumber}`,
            plate_number: `${bayNumber}00УБА`,
            make: "Toyota",
            model: "Prius",
            year: 2020,
          } as NonNullable<BaySlotData["workOrder"]>["vehicle"],
          mechanic: null,
          helpers: [],
          customer_name: null,
        } as unknown as BaySlotData["workOrder"])
      : null,
  };
}

const queueItem = {
  id: "wo-q-1",
  bay_number: null,
  mechanic_id: null,
  status: "New",
  created_at: "2026-08-09T09:00:00Z",
  vehicle: {
    id: "v-q",
    plate_number: "9999УБА",
    make: "Honda",
    model: "Fit",
    year: 2019,
  },
} as unknown as Parameters<typeof KanbanView>[0]["queue"][number];

const baseHandlers = {
  pendingWoIds: {},
  onStatusChange: vi.fn(),
  onRemoveFromBay: vi.fn(),
  onOpenDetail: vi.fn(),
  onAssignClick: vi.fn(),
  onNoEmptyBays: vi.fn(),
  onQueueItemClick: vi.fn(),
  onRemoveHelper: vi.fn(),
  t,
};

describe("KanbanView", () => {
  it("renders a column per active status plus the available queue", () => {
    render(
      <KanbanView
        searchedBays={[]}
        assignableBays={[]}
        queue={[]}
        {...baseHandlers}
      />,
    );
    expect(screen.getByLabelText("New column")).toBeTruthy();
    expect(screen.getByLabelText("Diagnosing column")).toBeTruthy();
    expect(screen.getByLabelText("In Progress column")).toBeTruthy();
    expect(screen.getByLabelText("Ready for Pickup column")).toBeTruthy();
    expect(screen.getByText("available")).toBeTruthy();
  });

  it("places work orders in their status column", () => {
    render(
      <KanbanView
        searchedBays={[makeBay(1, "In Progress"), makeBay(2, "New")]}
        assignableBays={[]}
        queue={[]}
        {...baseHandlers}
      />,
    );
    // 3-digit plates render split into digit/letter spans by MongolianLicensePlate
    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.getByText("200")).toBeTruthy();
  });

  it("shows queue items and reports their click", () => {
    const onQueueItemClick = vi.fn();
    render(
      <KanbanView
        searchedBays={[]}
        assignableBays={[]}
        queue={[queueItem]}
        {...baseHandlers}
        onQueueItemClick={onQueueItemClick}
      />,
    );
    expect(screen.getByText("9999 УБА")).toBeTruthy();
    fireEvent.click(screen.getByText("9999 УБА"));
    expect(onQueueItemClick).toHaveBeenCalledWith(queueItem);
  });

  it("shows empty states for the queue and empty columns", () => {
    render(
      <KanbanView
        searchedBays={[]}
        assignableBays={[]}
        queue={[]}
        {...baseHandlers}
      />,
    );
    // Queue empty state
    expect(screen.getAllByText("emptyBay").length).toBeGreaterThan(0);
    // Empty column assign prompts (one per status column)
    expect(screen.getAllByText("assignVehicleToBay").length).toBe(4);
  });

  it("assigns to an empty bay when available", () => {
    const onAssignClick = vi.fn();
    render(
      <KanbanView
        searchedBays={[makeBay(1, "New")]}
        assignableBays={[makeBay(1, "New"), makeBay(2)]}
        queue={[]}
        {...baseHandlers}
        onAssignClick={onAssignClick}
      />,
    );
    fireEvent.click(screen.getAllByTitle("assignVehicleToBay")[0]);
    expect(onAssignClick).toHaveBeenCalledWith(2);
  });

  it("reports no-empty-bays when every bay is occupied", () => {
    const onNoEmptyBays = vi.fn();
    render(
      <KanbanView
        searchedBays={[makeBay(1, "New")]}
        assignableBays={[makeBay(1, "New")]}
        queue={[]}
        {...baseHandlers}
        onNoEmptyBays={onNoEmptyBays}
      />,
    );
    fireEvent.click(screen.getAllByTitle("assignVehicleToBay")[0]);
    expect(onNoEmptyBays).toHaveBeenCalledTimes(1);
  });
});
