import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/data-table-dashboard";
import { render } from "@/test/test-utils";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { promise: vi.fn().mockResolvedValue(undefined) },
}));

// Mock TableCellViewer (dynamic import)
vi.mock("@/components/_data-table-cell-viewer", () => ({
  TableCellViewer: ({ item }: { item: { header: string } }) => (
    <span>{item.header}</span>
  ),
}));

// Mock dnd-kit
vi.mock("@dnd-kit/core", () => ({
  closestCenter: vi.fn(),
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  KeyboardSensor: vi.fn(),
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));
vi.mock("@dnd-kit/modifiers", () => ({
  restrictToVerticalAxis: vi.fn(),
}));
vi.mock("@dnd-kit/sortable", () => ({
  arrayMove: vi.fn(),
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: vi.fn() },
}));

const sampleData = [
  {
    id: "1",
    header: "Feature request",
    description: "Add dark mode",
    status: "In Progress",
    priority: "Medium",
    reviewer: "Alice",
  },
  {
    id: "2",
    header: "Bug fix",
    description: "Fix login issue",
    status: "Done",
    priority: "High",
    reviewer: "Bob",
  },
  {
    id: "3",
    header: "Refactor",
    description: "Clean up code",
    status: "To do",
    priority: "Low",
    reviewer: "Charlie",
  },
];

describe("DataTable", () => {
  it("renders without crashing with data", () => {
    const { container } = render(<DataTable data={sampleData} />);
    expect(container.querySelector('[data-slot="tabs"]')).toBeInTheDocument();
  });

  it("renders without crashing with empty data", () => {
    const { container } = render(<DataTable data={[]} />);
    expect(container.querySelector('[data-slot="tabs"]')).toBeInTheDocument();
  });

  it("renders view selector", () => {
    render(<DataTable data={sampleData} />);
    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it("renders add section button", () => {
    render(<DataTable data={sampleData} />);
    expect(screen.getByText("Add Section")).toBeInTheDocument();
  });

  it("renders column visibility toggle", () => {
    const { container } = render(<DataTable data={sampleData} />);
    expect(container.querySelector(".lucide-columns-3")).toBeInTheDocument();
  });

  it("renders no results message for empty data", () => {
    render(<DataTable data={[]} />);
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });
});
