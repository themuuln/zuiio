import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BaySlotData } from "@/lib/services/bay-view-service.types";
import { render } from "@/test/test-utils";
import { BayCard, BayCardDragPreview } from "../bay-card";

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
  MechanicAvatar: ({
    mechanic,
  }: {
    mechanic: { full_name: string | null };
  }) => <span data-testid="mechanic-avatar">{mechanic.full_name ?? "?"}</span>,
}));

vi.mock("@/components/mechanic-avatar-chip", () => ({
  MechanicAvatarChip: ({
    mechanic,
    onRemove,
  }: {
    mechanic: { id: string; full_name: string | null };
    onRemove?: () => void;
  }) => (
    <span data-testid="mechanic-chip">
      {mechanic.full_name ?? "?"}
      {onRemove && (
        <button
          type="button"
          aria-label={`remove ${mechanic.id}`}
          onClick={onRemove}
        >
          x
        </button>
      )}
    </span>
  ),
}));

vi.mock("@/components/mechanic-picker-drawer", () => ({
  MechanicPickerDrawer: ({
    open,
    title,
    selectedIds,
    onToggle,
  }: {
    open: boolean;
    title: string;
    selectedIds: string[];
    onToggle: (id: string) => void;
  }) =>
    open ? (
      <div data-testid="mechanic-picker">
        <span>{title}</span>
        {selectedIds.map((id) => (
          <button key={id} type="button" onClick={() => onToggle(id)}>
            toggle-{id}
          </button>
        ))}
      </div>
    ) : null,
}));

function makeOccupiedBay(
  overrides: Partial<NonNullable<BaySlotData["workOrder"]>> = {},
): BaySlotData {
  return {
    bayNumber: 1,
    workOrder: {
      id: "wo-1",
      bay_number: 1,
      mechanic_id: "m-1",
      status: "New",
      started_at: "2026-08-09T09:00:00Z",
      created_at: "2026-08-09T09:00:00Z",
      vehicle: {
        id: "v-1",
        plate_number: "1234УБА",
        make: "Toyota",
        model: "Prius",
        year: 2020,
      } as NonNullable<BaySlotData["workOrder"]>["vehicle"],
      mechanic: { id: "m-1", full_name: "Бат", avatar_url: null },
      helpers: [],
      customer_name: "Дорж",
      ...overrides,
    },
  };
}

const handlers = {
  onStatusChange: vi.fn(),
  onRemoveFromBay: vi.fn(),
  onOpenDetail: vi.fn(),
  onAssignClick: vi.fn(),
};

describe("BayCard", () => {
  it("renders the empty state and reports the assign click", () => {
    render(<BayCard bay={{ bayNumber: 3, workOrder: null }} {...handlers} />);
    expect(screen.getByText("clickToAddVehicle")).toBeTruthy();
    expect(screen.getByText("BAY 03")).toBeTruthy();
    fireEvent.click(screen.getByText("clickToAddVehicle"));
    expect(handlers.onAssignClick).toHaveBeenCalledWith(3);
  });

  it("renders occupied vehicle data and status badge", () => {
    render(<BayCard bay={makeOccupiedBay()} {...handlers} />);
    expect(screen.getByText("1234")).toBeTruthy();
    expect(screen.getByText("УБА")).toBeTruthy();
    expect(screen.getByText("Toyota Prius · 2020")).toBeTruthy();
    expect(screen.getByText("Дорж")).toBeTruthy();
  });

  it("opens the detail drawer when the occupied card is clicked", () => {
    render(<BayCard bay={makeOccupiedBay()} {...handlers} />);
    // The Card (section child) carries the click handler, not the section
    const section = screen.getByLabelText("Bay 1 - 1234УБА");
    const card = section.querySelector(".cursor-pointer");
    expect(card).not.toBeNull();
    fireEvent.click(card as Element);
    expect(handlers.onOpenDetail).toHaveBeenCalledWith("wo-1");
  });

  it("triggers a status transition from the footer", () => {
    render(<BayCard bay={makeOccupiedBay()} {...handlers} />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(handlers.onStatusChange).toHaveBeenCalledWith("wo-1", "Diagnosing");
  });

  it("renders a completed work order without a transition button", () => {
    render(
      <BayCard bay={makeOccupiedBay({ status: "Completed" })} {...handlers} />,
    );
    expect(screen.queryByRole("button", { name: "Start" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Complete" })).toBeNull();
  });
});

describe("BayCardDragPreview", () => {
  it("renders vehicle data in the drag preview", () => {
    render(<BayCardDragPreview bay={makeOccupiedBay()} />);
    expect(screen.getByText("1234")).toBeTruthy();
    expect(screen.getByText("Toyota Prius · 2020")).toBeTruthy();
  });

  it("renders nothing for an empty bay", () => {
    const { container } = render(
      <BayCardDragPreview bay={{ bayNumber: 1, workOrder: null }} />,
    );
    expect(container.querySelector("div")).toBeNull();
  });
});
