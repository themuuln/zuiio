import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceLine } from "@/components/work-orders/service-lines";
import { ServiceLines } from "@/components/work-orders/service-lines";
import type { ServiceCatalog } from "@/lib/types";
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
            services: "Services",
            searchServices: "Search services",
            noServicesFound: "No services found",
            serviceCount: `${params?.count ?? 0} services`,
            removeItem: `Remove ${params?.name ?? "item"}`,
          },
          common: {
            quantity: "Qty",
            search: "Search",
          },
        };
        return messages[namespace]?.[key] ?? key;
      },
  };
});

vi.mock("@zuiio/hooks", () => ({
  useFuzzySearch: <T,>(
    items: T[],
    _query: string,
    _opts?: Record<string, unknown>,
  ) => items,
}));

vi.mock("lucide-react", async () => {
  const actual =
    await vi.importActual<typeof import("lucide-react")>("lucide-react");
  return {
    ...actual,
    Wrench: () => <svg data-testid="wrench-icon" />,
    Trash2: () => <svg data-testid="trash-icon" />,
  };
});

vi.mock("@/lib/utils/search-utils", () => ({
  HighlightText: ({ text }: { text: string }) => <>{text}</>,
}));

vi.mock("@/lib/utils", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/utils")>("@/lib/utils");
  return {
    ...actual,
    formatCurrency: (val: number) => `₮${val.toLocaleString()}`,
  };
});

vi.mock("@/components/search-input", () => ({
  SearchInput: ({
    onSearch,
    placeholder,
  }: {
    onSearch: (q: string) => void;
    placeholder: string;
  }) => (
    <input
      placeholder={placeholder}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onSearch(e.target.value)
      }
      data-testid="search-input"
    />
  ),
}));

// ── Test data ─────────────────────────────────────────────────────────

const mockCatalog: ServiceCatalog[] = [
  {
    id: "svc-1",
    name: "Oil Change",
    category: "Maintenance",
    default_price: "50000",
  },
  {
    id: "svc-2",
    name: "Brake Pad Replacement",
    category: "Brakes",
    default_price: "120000",
  },
];

const priceHistory: Record<string, number> = {
  "Oil Change": 48000,
};

const mockLines: ServiceLine[] = [
  {
    service_catalog_id: "svc-1",
    name: "Oil Change",
    base_price: 50000,
    quantity: 1,
    discount_amount_mnt: 0,
    discount_percent: 0,
    final_price: 50000,
  },
  {
    service_catalog_id: "svc-2",
    name: "Brake Pad Replacement",
    base_price: 120000,
    quantity: 2,
    discount_amount_mnt: 0,
    discount_percent: 0,
    final_price: 240000,
  },
];

// ── Tests ──────────────────────────────────────────────────────────────

describe("ServiceLines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultHandlers = {
    onAdd: vi.fn(),
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
  };

  it("renders empty state with no lines", () => {
    render(
      <ServiceLines
        catalog={mockCatalog}
        priceHistory={priceHistory}
        lines={[]}
        {...defaultHandlers}
      />,
    );
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search services")).toBeInTheDocument();
  });

  it("renders service lines when provided", () => {
    render(
      <ServiceLines
        catalog={mockCatalog}
        priceHistory={priceHistory}
        lines={mockLines}
        {...defaultHandlers}
      />,
    );
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Brake Pad Replacement")).toBeInTheDocument();
    expect(screen.getByText("2 services")).toBeInTheDocument();
  });

  it("renders add button and calls onAdd when catalog item is clicked", () => {
    render(
      <ServiceLines
        catalog={mockCatalog}
        priceHistory={priceHistory}
        lines={[]}
        {...defaultHandlers}
      />,
    );

    // Type a search to show catalog items
    const searchInput = screen.getByPlaceholderText("Search services");
    fireEvent.change(searchInput, { target: { value: "Oil" } });

    // The filtered catalog renders items — click one to add
    const oilChangeBtn = screen.getByText("Oil Change").closest("button");
    expect(oilChangeBtn).toBeInTheDocument();
    if (!oilChangeBtn) throw new Error("oil change button not found");
    fireEvent.click(oilChangeBtn);
    expect(defaultHandlers.onAdd).toHaveBeenCalledWith(mockCatalog[0]);
  });

  it("calls onRemove when remove button is clicked", () => {
    render(
      <ServiceLines
        catalog={mockCatalog}
        priceHistory={priceHistory}
        lines={mockLines}
        {...defaultHandlers}
      />,
    );
    const removeBtn = screen.getByLabelText("Remove Oil Change");
    fireEvent.click(removeBtn);
    expect(defaultHandlers.onRemove).toHaveBeenCalledWith(0);
  });

  it("renders search input for filtering", () => {
    render(
      <ServiceLines
        catalog={mockCatalog}
        priceHistory={priceHistory}
        lines={[]}
        {...defaultHandlers}
      />,
    );
    const searchInput = screen.getByPlaceholderText("Search services");
    fireEvent.change(searchInput, { target: { value: "Brake" } });
    expect(searchInput).toHaveValue("Brake");
  });
});
