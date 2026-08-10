import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PartsCatalogItem } from "@/lib/types";
import { render } from "@/test/test-utils";
import { PartsSection } from "../parts-section";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockSetPartSearch = vi.fn();
const mockSetPartLines = vi.fn();
const mockAddPartFromCatalog = vi.fn();
const mockAddAllFromLastVisit = vi.fn();
let mockCtx: Record<string, unknown>;

vi.mock("../wizard-context", () => ({
  useWizardContext: () => mockCtx,
}));

vi.mock("next-intl", () => {
  const NextIntlClientProvider = ({ children }: { children: ReactNode }) => (
    <>{children}</>
  );
  return {
    NextIntlClientProvider,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/components/search-input", () => ({
  SearchInput: ({
    placeholder,
    loading,
    onSearch,
  }: {
    placeholder?: string;
    loading?: boolean;
    onSearch?: (v: string) => void;
  }) => (
    <input
      data-testid="search-input-mock"
      placeholder={placeholder}
      data-loading={loading ? "true" : "false"}
      onChange={(e) => onSearch?.(e.target.value)}
    />
  ),
}));

vi.mock("@/components/work-orders/line-items", () => ({
  LineItemRow: ({ name, finalPrice }: { name: string; finalPrice: number }) => (
    <div data-testid="line-item-row">
      {name} — {finalPrice}
    </div>
  ),
}));

vi.mock("@/components/inventory/part-form", () => ({
  PartForm: ({
    mode,
    onSuccess,
    onCancel,
  }: {
    mode?: string;
    onSuccess: (part: { id: string; name: string }) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="part-form-mock">
      <span data-testid="part-form-mode">{mode}</span>
      <button
        type="button"
        data-testid="part-form-success"
        onClick={() => onSuccess({ id: "new-part-1", name: "New Part" })}
      >
        success
      </button>
      <button type="button" data-testid="part-form-cancel" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open?: boolean; children: ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => {
  const Icon = () => <svg data-testid="lucide-icon" />;
  return { Check: Icon, Clock: Icon, Plus: Icon };
});

// ── Fixtures ───────────────────────────────────────────────────────────

const catalogPart = {
  id: "p-1",
  organization_id: "org-1",
  name: "Oil Filter",
  name_mn: null,
  part_number: "OF-100",
  barcode: null,
  category: "Filter",
  description: null,
  unit: "pcs",
  default_price: 15000,
  purchase_price: null,
  image_url: null,
  location: null,
  is_active: true,
  created_at: "",
  updated_at: "",
} as unknown as PartsCatalogItem;

const catalogPart2 = {
  id: "p-2",
  organization_id: "org-1",
  name: "Brake Pad",
  name_mn: null,
  part_number: null,
  barcode: null,
  category: null,
  description: null,
  unit: "set",
  default_price: 45000,
  purchase_price: null,
  image_url: null,
  location: null,
  is_active: true,
  created_at: "",
  updated_at: "",
} as unknown as PartsCatalogItem;

const globalPart = {
  id: "gp-1",
  name: "Air Filter",
  name_mn: null,
  category: "Filter",
  description: null,
  part_number: "AF-200",
  unit: "pcs",
};

function createMockCtx(overrides?: Record<string, unknown>) {
  return {
    partSearch: "",
    partsCatalog: [],
    globalParts: [],
    partLines: [],
    partHistory: {},
    showLastVisitSuggestions: false,
    lastVisitData: null,
    setPartSearch: mockSetPartSearch,
    setPartLines: mockSetPartLines,
    addPartFromCatalog: mockAddPartFromCatalog,
    addAllFromLastVisit: mockAddAllFromLastVisit,
    ...overrides,
  };
}

function renderParts() {
  return render(<PartsSection />);
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("PartsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = createMockCtx();
  });

  it("renders the parts card with wizard step attribute", () => {
    const { container } = renderParts();
    expect(
      container.querySelector('[data-wizard-step="parts"]'),
    ).toBeInTheDocument();
  });

  it("shows empty state when no parts added and no suggestions", () => {
    renderParts();
    expect(screen.getByText("noPartsAdded")).toBeInTheDocument();
  });

  it("calls setPartSearch when the search input changes", async () => {
    const user = userEvent.setup();
    renderParts();
    await user.type(screen.getByTestId("search-input-mock"), "oil");
    expect(mockSetPartSearch).toHaveBeenCalledWith("oil");
  });

  it("renders matching catalog parts with price and part number", () => {
    mockCtx = createMockCtx({
      partSearch: "oil",
      partsCatalog: [catalogPart, catalogPart2],
    });
    renderParts();
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("#OF-100")).toBeInTheDocument();
    expect(screen.getByText("Filter")).toBeInTheDocument();
    expect(screen.getByText("₮ 15,000")).toBeInTheDocument();
    // Non-matching part is filtered out
    expect(screen.queryByText("Brake Pad")).not.toBeInTheDocument();
  });

  it("adds a catalog part on click", async () => {
    mockCtx = createMockCtx({
      partSearch: "oil",
      partsCatalog: [catalogPart],
    });
    const user = userEvent.setup();
    renderParts();
    await user.click(screen.getByText("Oil Filter"));
    expect(mockAddPartFromCatalog).toHaveBeenCalledWith(catalogPart);
  });

  it("disables catalog rows for parts already in partLines", () => {
    mockCtx = createMockCtx({
      partSearch: "oil",
      partsCatalog: [catalogPart],
      partLines: [
        {
          part_name: "Oil Filter",
          part_number: "OF-100",
          quantity: 1,
          unit_price: 15000,
          final_price: 15000,
        },
      ],
    });
    renderParts();
    const row = screen.getByText("Oil Filter").closest("button");
    expect(row).toBeDisabled();
  });

  it("shows no-match message when search has no results", () => {
    mockCtx = createMockCtx({ partSearch: "zzz" });
    renderParts();
    expect(screen.getByText("noPartsMatch")).toBeInTheDocument();
  });

  it("adds a global part as a custom line and clears the search", async () => {
    mockCtx = createMockCtx({
      partSearch: "air",
      globalParts: [globalPart],
    });
    const user = userEvent.setup();
    renderParts();
    await user.click(screen.getByText("Air Filter"));
    expect(mockSetPartLines).toHaveBeenCalledWith(expect.any(Function));
    // The updater appends a custom part with quantity 1 and zero price
    const updater = mockSetPartLines.mock.calls[0][0] as (
      prev: unknown[],
    ) => unknown[];
    const next = updater([]);
    expect(next).toEqual([
      {
        part_name: "Air Filter",
        part_number: "AF-200",
        quantity: 1,
        unit_price: 0,
        final_price: 0,
      },
    ]);
    expect(mockSetPartSearch).toHaveBeenCalledWith("");
  });

  it("opens the quick-create dialog and submits via addPartFromCatalog", async () => {
    const user = userEvent.setup();
    renderParts();
    await user.click(screen.getByText("addPart"));
    expect(screen.getByTestId("part-form-mock")).toBeInTheDocument();
    expect(screen.getByTestId("part-form-mode")).toHaveTextContent("quick");
    await user.click(screen.getByTestId("part-form-success"));
    expect(mockAddPartFromCatalog).toHaveBeenCalledWith({
      id: "new-part-1",
      name: "New Part",
    });
    expect(screen.queryByTestId("part-form-mock")).not.toBeInTheDocument();
  });

  it("closes the quick-create dialog on cancel", async () => {
    const user = userEvent.setup();
    renderParts();
    await user.click(screen.getByText("addPart"));
    await user.click(screen.getByTestId("part-form-cancel"));
    expect(screen.queryByTestId("part-form-mock")).not.toBeInTheDocument();
  });

  it("renders last-visit part suggestions when available", () => {
    mockCtx = createMockCtx({
      showLastVisitSuggestions: true,
      lastVisitData: {
        services: [],
        parts: [
          {
            part_name: "Spark Plug",
            part_number: "SP-1",
            unit_price: 8000,
            quantity: 4,
          },
        ],
        mechanic_id: null,
        notes: null,
      },
    });
    renderParts();
    expect(screen.getByText("fromLastVisitParts")).toBeInTheDocument();
    expect(screen.getByText("Spark Plug")).toBeInTheDocument();
    expect(screen.getByText("₮ 8,000")).toBeInTheDocument();
  });

  it("adds a last-visit part with computed final price on click", async () => {
    mockCtx = createMockCtx({
      showLastVisitSuggestions: true,
      lastVisitData: {
        services: [],
        parts: [
          {
            part_name: "Spark Plug",
            part_number: "SP-1",
            unit_price: 8000,
            quantity: 4,
          },
        ],
        mechanic_id: null,
        notes: null,
      },
    });
    const user = userEvent.setup();
    renderParts();
    await user.click(screen.getByText("Spark Plug"));
    const updater = mockSetPartLines.mock.calls[0][0] as (
      prev: unknown[],
    ) => unknown[];
    expect(updater([])).toEqual([
      {
        part_name: "Spark Plug",
        part_number: "SP-1",
        quantity: 4,
        unit_price: 8000,
        final_price: 32000,
        last_price: 8000,
      },
    ]);
  });

  it("calls addAllFromLastVisit when add all is clicked", async () => {
    mockCtx = createMockCtx({
      showLastVisitSuggestions: true,
      lastVisitData: {
        services: [],
        parts: [
          {
            part_name: "Spark Plug",
            part_number: "SP-1",
            unit_price: 8000,
            quantity: 4,
          },
        ],
        mechanic_id: null,
        notes: null,
      },
    });
    const user = userEvent.setup();
    renderParts();
    await user.click(screen.getByText("addAll"));
    expect(mockAddAllFromLastVisit).toHaveBeenCalled();
  });

  it("renders added part lines as LineItemRow", () => {
    mockCtx = createMockCtx({
      partLines: [
        {
          part_name: "Oil Filter",
          part_number: "OF-100",
          quantity: 2,
          unit_price: 15000,
          final_price: 30000,
        },
      ],
    });
    renderParts();
    const rows = screen.getAllByTestId("line-item-row");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("Oil Filter — 30000");
  });
});
