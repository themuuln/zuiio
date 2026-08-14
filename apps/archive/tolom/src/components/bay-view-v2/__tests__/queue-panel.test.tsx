import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BayViewWorkOrder } from "@/lib/services/bay-view-service";
import { render } from "@/test/test-utils";
import { QueuePanel } from "../queue-panel";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

vi.mock("@zuiio/hooks", () => ({
  useFuzzySearch: (
    items: unknown[],
    query: string,
    _opts: unknown,
  ): unknown[] =>
    query
      ? items.filter((item) =>
          JSON.stringify(item).toLowerCase().includes(query.toLowerCase()),
        )
      : items,
}));

function makeItem(
  id: string,
  plate: string,
  createdAt: string,
  mechanicId: string | null = null,
) {
  return {
    id,
    bay_number: null,
    mechanic_id: mechanicId,
    status: "New",
    created_at: createdAt,
    complaint: null,
    vehicle: {
      id: `v-${id}`,
      plate_number: plate,
      make: "Toyota",
      model: "Prius",
      year: 2020,
    },
  } as unknown as BayViewWorkOrder & { vehicle: BayViewWorkOrder["vehicle"] };
}

describe("QueuePanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the empty state when there are no items", () => {
    render(<QueuePanel items={[]} />);
    expect(screen.getByText("noVehiclesWaiting")).toBeTruthy();
  });

  it("renders queue items sorted by creation time", () => {
    render(
      <QueuePanel
        items={[
          makeItem("b", "2222УБА", "2026-08-09T09:30:00Z"),
          makeItem("a", "1111УБА", "2026-08-09T09:00:00Z"),
        ]}
      />,
    );
    const plates = screen.getAllByText(/УБА/);
    expect(plates.map((p) => p.textContent)).toEqual(["1111 УБА", "2222 УБА"]);
  });

  it("quick-assigns an item to the first bay", () => {
    const onQuickAssign = vi.fn();
    render(
      <QueuePanel
        items={[makeItem("a", "1111УБА", "2026-08-09T09:00:00Z")]}
        onQuickAssign={onQuickAssign}
      />,
    );
    fireEvent.click(screen.getByTitle("assignToFirstBay"));
    expect(onQuickAssign).toHaveBeenCalledWith("a");
  });

  it("assigns to a specific bay on hover", () => {
    const onAssignToBay = vi.fn();
    render(
      <QueuePanel
        items={[makeItem("a", "1111УБА", "2026-08-09T09:00:00Z")]}
        availableBays={[1, 2, 5]}
        onAssignToBay={onAssignToBay}
      />,
    );
    fireEvent.mouseEnter(screen.getByText("1111 УБА"));
    fireEvent.click(screen.getByTitle("Assign to Bay 05"));
    expect(onAssignToBay).toHaveBeenCalledWith("a", 5);
  });

  it("shows the mechanic name on items", () => {
    render(
      <QueuePanel
        items={[makeItem("a", "1111УБА", "2026-08-09T09:00:00Z", "m-1")]}
        mechanics={[{ id: "m-1", full_name: "Бат" }]}
      />,
    );
    expect(screen.getByText("Бат")).toBeTruthy();
  });

  it("filters items by search and shows the no-match state", () => {
    render(
      <QueuePanel items={[makeItem("a", "1111УБА", "2026-08-09T09:00:00Z")]} />,
    );
    fireEvent.change(screen.getByPlaceholderText(/queueSearchPlaceholder/), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("noMatch")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "clearSearch" }));
    expect(screen.getByText("1111 УБА")).toBeTruthy();
  });

  it("hides the quick assign button for pending items", () => {
    render(
      <QueuePanel
        items={[makeItem("a", "1111УБА", "2026-08-09T09:00:00Z")]}
        pendingWoIds={{ a: true }}
        onQuickAssign={vi.fn()}
      />,
    );
    expect(screen.queryByTitle("assignToFirstBay")).toBeNull();
  });
});
