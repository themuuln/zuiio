import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BaySlotData } from "@/lib/services/bay-view-service.types";
import { render } from "@/test/test-utils";
import { BayViewViews } from "../_view-renderer";

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
            plate_number: `12${bayNumber}УБА`,
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

const baseProps = {
  searchedBranchSections: undefined,
  searchedBays: [makeBay(1, "In Progress"), makeBay(2)],
  filteredQueue: [],
  pendingWoIds: {},
  readyWosCount: 0,
  batchCompletePending: false,
  onStatusChange: vi.fn(),
  onRemoveFromBay: vi.fn(),
  onOpenDetail: vi.fn(),
  onAssignClick: vi.fn(),
  onQueueItemClick: vi.fn(),
  onRemoveHelper: vi.fn(),
  onAssignMechanic: vi.fn(),
  onRemoveMechanic: vi.fn(),
  onAddHelper: vi.fn(),
  onReorderMechanics: vi.fn(),
  mechanics: [],
  t,
};

describe("BayViewViews", () => {
  it("renders the grid view for grid mode", () => {
    render(<BayViewViews {...baseProps} viewMode="grid" />);
    // 3-digit plate renders split into digit/letter spans by MongolianLicensePlate
    expect(screen.getByText("121")).toBeTruthy();
    expect(screen.getByText("УБА")).toBeTruthy();
    expect(screen.getByText("BAY 02")).toBeTruthy();
  });

  it("renders the kanban view for kanban mode", () => {
    render(<BayViewViews {...baseProps} viewMode="kanban" />);
    expect(screen.getByLabelText("In Progress column")).toBeTruthy();
    expect(screen.getByText("121")).toBeTruthy();
  });

  it("renders the list view for list mode", () => {
    render(<BayViewViews {...baseProps} viewMode="list" />);
    expect(screen.getByText("#01")).toBeTruthy();
    expect(screen.getByText("121УБА")).toBeTruthy();
  });

  it("renders branch headers when multiple branches are present", () => {
    render(
      <BayViewViews
        {...baseProps}
        viewMode="list"
        searchedBranchSections={[
          {
            branchId: "b-1",
            branchName: "Main",
            bayCount: 2,
            bays: [makeBay(1)],
          },
          {
            branchId: "b-2",
            branchName: "Second",
            bayCount: 2,
            bays: [makeBay(2)],
          },
        ]}
      />,
    );
    expect(screen.getByText("Main")).toBeTruthy();
    expect(screen.getByText("Second")).toBeTruthy();
    expect(screen.getAllByText("0/2 bays")).toHaveLength(2);
  });

  it("omits the branch header for a single branch section", () => {
    render(
      <BayViewViews
        {...baseProps}
        viewMode="grid"
        searchedBranchSections={[
          {
            branchId: "b-1",
            branchName: "Main",
            bayCount: 2,
            bays: [makeBay(1)],
          },
        ]}
      />,
    );
    expect(screen.queryByText("Main")).toBeNull();
  });
});
