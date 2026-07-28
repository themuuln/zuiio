import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PartLine } from "@/components/work-orders/part-lines";
import { PartLines } from "@/components/work-orders/part-lines";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations:
      (namespace: string) =>
      (key: string, params?: Record<string, string | number>) => {
        const messages: Record<string, Record<string, string>> = {
          workOrderDetail: {
            parts: "Parts & Materials",
            partCount: `${params?.count ?? 0} parts`,
            partNamePlaceholder: "Part name",
            partNumberPlaceholder: "Part #",
            addPart: "Add Part",
            removeItem: `Remove ${params?.name ?? "item"}`,
          },
          common: {
            quantity: "Qty",
            unitPrice: "Unit price",
          },
        };
        return messages[namespace]?.[key] ?? key;
      },
  };
});

vi.mock("lucide-react", async () => {
  const actual =
    await vi.importActual<typeof import("lucide-react")>("lucide-react");
  return {
    ...actual,
    Package: () => <svg data-testid="package-icon" />,
    Plus: () => <svg data-testid="plus-icon" />,
    Trash2: () => <svg data-testid="trash-icon" />,
  };
});

vi.mock("@/lib/utils", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/utils")>("@/lib/utils");
  return {
    ...actual,
    formatCurrency: (val: number) => `₮${val.toLocaleString()}`,
  };
});

// ── Test data ─────────────────────────────────────────────────────────

const mockLines: PartLine[] = [
  {
    part_name: "Oil Filter",
    part_number: "OF-101",
    quantity: 2,
    unit_price: 15000,
    final_price: 30000,
  },
  {
    part_name: "Brake Pad Set",
    part_number: "BP-202",
    quantity: 1,
    unit_price: 85000,
    final_price: 85000,
  },
];

// ── Tests ──────────────────────────────────────────────────────────────

describe("PartLines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultHandlers = {
    onAdd: vi.fn(),
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
  };

  it("renders empty state with no lines", () => {
    render(<PartLines lines={[]} {...defaultHandlers} />);
    expect(screen.getByText("Parts & Materials")).toBeInTheDocument();
    expect(screen.getByText("Add Part")).toBeInTheDocument();
  });

  it("renders part lines when provided", () => {
    render(<PartLines lines={mockLines} {...defaultHandlers} />);
    expect(screen.getByDisplayValue("Oil Filter")).toBeInTheDocument();
    expect(screen.getByDisplayValue("OF-101")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Brake Pad Set")).toBeInTheDocument();
    expect(screen.getByDisplayValue("BP-202")).toBeInTheDocument();
    expect(screen.getByText("2 parts")).toBeInTheDocument();
  });

  it("renders add button and calls onAdd when clicked", () => {
    render(<PartLines lines={mockLines} {...defaultHandlers} />);
    const addBtn = screen.getByText("Add Part");
    fireEvent.click(addBtn);
    expect(defaultHandlers.onAdd).toHaveBeenCalledTimes(1);
  });

  it("calls onRemove when remove button is clicked", () => {
    render(<PartLines lines={mockLines} {...defaultHandlers} />);
    const removeBtn = screen.getByLabelText("Remove Oil Filter");
    fireEvent.click(removeBtn);
    expect(defaultHandlers.onRemove).toHaveBeenCalledWith(0);
  });
});
