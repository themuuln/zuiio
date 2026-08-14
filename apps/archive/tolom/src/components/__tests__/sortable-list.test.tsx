import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type SortableItem,
  SortableList,
  SortableListBody,
} from "@/components/sortable-list";

interface Item extends SortableItem {
  name: string;
}

const dndState = vi.hoisted(() => ({
  onDragEnd: null as
    | null
    | ((event: {
        active: { id: string | number };
        over: { id: string | number } | null;
      }) => void),
  onDragStart: null as
    | null
    | ((event: { active: { id: string | number } }) => void),
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({
    onDragStart,
    onDragEnd,
    children,
  }: {
    onDragStart?: (event: { active: { id: string | number } }) => void;
    onDragEnd?: (event: {
      active: { id: string | number };
      over: { id: string | number } | null;
    }) => void;
    children?: React.ReactNode;
  }) => {
    dndState.onDragStart = onDragStart ?? null;
    dndState.onDragEnd = onDragEnd ?? null;
    return <div>{children}</div>;
  },
  DragOverlay: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  PointerSensor: class {},
  useSensor: (sensor: unknown) => sensor,
  useSensors: (...sensors: unknown[]) => sensors,
}));

vi.mock("@dnd-kit/sortable", () => ({
  arrayMove: <T extends { id: string }>(
    arr: T[],
    from: number,
    to: number,
  ): T[] => {
    const copy = [...arr];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    return copy;
  },
  SortableContext: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
  verticalListSortingStrategy: vi.fn(),
}));

const items: Item[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
  { id: "c", name: "Gamma" },
];

const renderArgs: Array<{
  item: Item;
  isAssigned: boolean;
  isLead: boolean;
  index: number;
}> = [];

function captureRender(
  item: Item,
  args: { index: number; isAssigned: boolean; isLead: boolean },
) {
  renderArgs.push({ item, ...args });
  return (
    <div
      data-testid={`item-${item.id}`}
    >{`${item.name}|assigned=${args.isAssigned}|lead=${args.isLead}`}</div>
  );
}

describe("SortableListBody", () => {
  beforeEach(() => {
    renderArgs.length = 0;
  });

  it("renders assigned items first with the first marked as lead", () => {
    render(
      <SortableListBody
        items={items}
        assignedItems={[items[0]]}
        renderItem={captureRender}
      />,
    );
    expect(screen.getAllByTestId(/^item-/)).toHaveLength(3);
    expect(
      screen.getByText("Alpha|assigned=true|lead=true"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Beta|assigned=false|lead=false"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Gamma|assigned=false|lead=false"),
    ).toBeInTheDocument();
    expect(renderArgs[0].isLead).toBe(true);
    expect(renderArgs[0].index).toBe(0);
    expect(renderArgs[1].index).toBe(1);
  });

  it("filters items by search predicate", () => {
    render(
      <SortableListBody
        items={items}
        assignedItems={[]}
        renderItem={captureRender}
        search="alp"
        searchPredicate={(item, q) => item.name.toLowerCase().includes(q)}
      />,
    );
    expect(
      screen.getByText("Alpha|assigned=false|lead=false"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("item-b")).not.toBeInTheDocument();
  });

  it("shows the no-results text when the search matches nothing", () => {
    render(
      <SortableListBody
        items={items}
        assignedItems={[]}
        renderItem={captureRender}
        search="zzz"
        searchPredicate={(item, q) => item.name.toLowerCase().includes(q)}
      />,
    );
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("shows the empty text when there is nothing to render", () => {
    render(
      <SortableListBody
        items={[]}
        assignedItems={[]}
        renderItem={captureRender}
        emptyText="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});

describe("SortableList", () => {
  it("assigns an unassigned item dropped onto the assigned zone", () => {
    const onAssignFromDrop = vi.fn();
    const onReorder = vi.fn();
    render(
      <SortableList
        items={items}
        assignedItems={[items[0], items[1]]}
        renderItem={captureRender}
        renderDragOverlay={(item) => <span>overlay-{item.id}</span>}
        onAssignFromDrop={onAssignFromDrop}
        onReorder={onReorder}
      />,
    );

    act(() => {
      dndState.onDragEnd?.({
        active: { id: "c" },
        over: { id: "a" },
      });
    });

    expect(onAssignFromDrop).toHaveBeenCalledWith("c", 0);
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("reorders when an assigned item is dragged over another assigned item", () => {
    const onReorder = vi.fn();
    render(
      <SortableList
        items={items}
        assignedItems={[items[0], items[1]]}
        renderItem={captureRender}
        renderDragOverlay={(item) => <span>overlay-{item.id}</span>}
        onReorder={onReorder}
      />,
    );

    act(() => {
      dndState.onDragEnd?.({
        active: { id: "a" },
        over: { id: "b" },
      });
    });

    expect(onReorder).toHaveBeenCalledWith(["b", "a"]);
  });

  it("does nothing when dropped on itself", () => {
    const onReorder = vi.fn();
    const onAssignFromDrop = vi.fn();
    render(
      <SortableList
        items={items}
        assignedItems={[items[0]]}
        renderItem={captureRender}
        renderDragOverlay={(item) => <span>overlay-{item.id}</span>}
        onReorder={onReorder}
        onAssignFromDrop={onAssignFromDrop}
      />,
    );

    act(() => {
      dndState.onDragEnd?.({ active: { id: "a" }, over: { id: "a" } });
    });
    expect(onReorder).not.toHaveBeenCalled();
    expect(onAssignFromDrop).not.toHaveBeenCalled();
  });

  it("renders the drag overlay while dragging", () => {
    render(
      <SortableList
        items={items}
        assignedItems={[items[0]]}
        renderItem={captureRender}
        renderDragOverlay={(item) => <span>overlay-{item.id}</span>}
      />,
    );
    expect(screen.getByTestId("drag-overlay")).toBeEmptyDOMElement();

    act(() => {
      dndState.onDragStart?.({ active: { id: "b" } });
    });
    expect(screen.getByText("overlay-b")).toBeInTheDocument();

    act(() => {
      dndState.onDragEnd?.({ active: { id: "b" }, over: null });
    });
    expect(screen.getByTestId("drag-overlay")).toBeEmptyDOMElement();
  });
});
