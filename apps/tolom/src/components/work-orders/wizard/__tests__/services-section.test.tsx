import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ServicesSection } from "../services-section";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockSetServiceSearch = vi.fn();
const mockSetServiceLines = vi.fn();
const mockAddService = vi.fn();
const mockAddAllFromLastVisit = vi.fn();
const mockSetShowLastVisitSuggestions = vi.fn();
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
    useTranslations: () => (key: string, _values?: unknown) => key,
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

vi.mock("@/components/services/service-form", () => ({
  ServiceForm: ({
    mode,
    onSuccess,
    onCancel,
  }: {
    mode?: string;
    onSuccess: (svc: { id: string; name: string }) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="service-form-mock">
      <span data-testid="service-form-mode">{mode}</span>
      <button
        type="button"
        data-testid="service-form-success"
        onClick={() => onSuccess({ id: "new-svc-1", name: "New Service" })}
      >
        success
      </button>
      <button
        type="button"
        data-testid="service-form-cancel"
        onClick={onCancel}
      >
        cancel
      </button>
    </div>
  ),
}));

vi.mock("lucide-react", () => {
  const Icon = () => <svg data-testid="lucide-icon" />;
  return { Check: Icon, Clock: Icon, Plus: Icon, Wrench: Icon };
});

// ── Fixtures ───────────────────────────────────────────────────────────

const service1 = {
  id: "s-1",
  name: "Oil Change",
  name_mn: null,
  description: null,
  category: "Maintenance",
  default_price: 50000,
  estimated_duration_minutes: null,
  interval_months: null,
  interval_km: null,
  is_active: true,
};

const service2 = {
  id: "s-2",
  name: "Brake Service",
  name_mn: null,
  description: null,
  category: null,
  default_price: 120000,
  estimated_duration_minutes: null,
  interval_months: null,
  interval_km: null,
  is_active: true,
};

const globalService = {
  id: "gs-1",
  name: "AC Refill",
  name_mn: null,
  category: "Climate",
  description: null,
  estimated_duration_minutes: null,
  interval_months: null,
  interval_km: null,
};

function createMockCtx(overrides?: Record<string, unknown>) {
  return {
    serviceSearch: "",
    catalog: [],
    globalServices: [],
    serviceLines: [],
    priceHistory: {},
    vehicleServicePrices: {},
    showLastVisitSuggestions: false,
    lastVisitData: null,
    setServiceSearch: mockSetServiceSearch,
    setServiceLines: mockSetServiceLines,
    addService: mockAddService,
    addAllFromLastVisit: mockAddAllFromLastVisit,
    setShowLastVisitSuggestions: mockSetShowLastVisitSuggestions,
    ...overrides,
  };
}

function renderServices() {
  return render(<ServicesSection />);
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("ServicesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = createMockCtx();
  });

  it("renders the services card with wizard step attribute", () => {
    const { container } = renderServices();
    expect(
      container.querySelector('[data-wizard-step="services"]'),
    ).toBeInTheDocument();
  });

  it("shows empty state when no services added and no suggestions", () => {
    renderServices();
    expect(screen.getByText("noServicesFound")).toBeInTheDocument();
  });

  it("calls setServiceSearch when the search input changes", async () => {
    const user = userEvent.setup();
    renderServices();
    await user.type(screen.getByTestId("search-input-mock"), "oil");
    expect(mockSetServiceSearch).toHaveBeenCalledWith("oil");
  });

  it("renders matching catalog services with price and category", () => {
    mockCtx = createMockCtx({
      serviceSearch: "oil",
      catalog: [service1, service2],
    });
    renderServices();
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(screen.getByText("₮ 50,000")).toBeInTheDocument();
    expect(screen.queryByText("Brake Service")).not.toBeInTheDocument();
  });

  it("adds a catalog service on click and clears the search", async () => {
    mockCtx = createMockCtx({
      serviceSearch: "oil",
      catalog: [service1],
    });
    const user = userEvent.setup();
    renderServices();
    await user.click(screen.getByText("Oil Change"));
    expect(mockAddService).toHaveBeenCalledWith(service1);
    expect(mockSetServiceSearch).toHaveBeenCalledWith("");
  });

  it("disables catalog rows for services already in serviceLines", () => {
    mockCtx = createMockCtx({
      serviceSearch: "oil",
      catalog: [service1],
      serviceLines: [
        {
          service_catalog_id: "s-1",
          name: "Oil Change",
          base_price: 50000,
          quantity: 1,
          discount_amount_mnt: 0,
          discount_percent: 0,
          final_price: 50000,
        },
      ],
    });
    renderServices();
    const row = screen.getByText("Oil Change").closest("button");
    expect(row).toBeDisabled();
  });

  it("shows last-sold price hint when history differs from default", () => {
    mockCtx = createMockCtx({
      serviceSearch: "oil",
      catalog: [service1],
      priceHistory: { "s-1": { last_price: 60000 } },
    });
    renderServices();
    expect(screen.getByText(/lastSold/)).toBeInTheDocument();
  });

  it("does not show a price hint when history matches the default", () => {
    mockCtx = createMockCtx({
      serviceSearch: "oil",
      catalog: [service1],
      priceHistory: { "s-1": { last_price: 50000 } },
    });
    renderServices();
    expect(screen.queryByText(/lastSold/)).not.toBeInTheDocument();
  });

  it("prefers vehicle-specific price over history for the hint", () => {
    mockCtx = createMockCtx({
      serviceSearch: "oil",
      catalog: [service1],
      priceHistory: { "s-1": { last_price: 50000 } },
      vehicleServicePrices: { "s-1": 70000 },
    });
    renderServices();
    expect(screen.getByText(/lastSold/)).toBeInTheDocument();
  });

  it("shows no-match message when search has no results", () => {
    mockCtx = createMockCtx({ serviceSearch: "zzz" });
    renderServices();
    expect(screen.getByText("noServicesMatch")).toBeInTheDocument();
  });

  it("adds a global service as a custom line and clears the search", async () => {
    mockCtx = createMockCtx({
      serviceSearch: "ac",
      globalServices: [globalService],
    });
    const user = userEvent.setup();
    renderServices();
    await user.click(screen.getByText("AC Refill"));
    const updater = mockSetServiceLines.mock.calls[0][0] as (
      prev: unknown[],
    ) => unknown[];
    expect(updater([])).toEqual([
      {
        service_catalog_id: null,
        name: "AC Refill",
        base_price: 0,
        quantity: 1,
        discount_amount_mnt: 0,
        discount_percent: 0,
        final_price: 0,
      },
    ]);
    expect(mockSetServiceSearch).toHaveBeenCalledWith("");
  });

  it("does not duplicate a global service already added as custom", async () => {
    mockCtx = createMockCtx({
      serviceSearch: "ac",
      globalServices: [globalService],
      serviceLines: [
        {
          service_catalog_id: null,
          name: "AC Refill",
          base_price: 0,
          quantity: 1,
          discount_amount_mnt: 0,
          discount_percent: 0,
          final_price: 0,
        },
      ],
    });
    const user = userEvent.setup();
    renderServices();
    await user.click(screen.getByText("AC Refill"));
    expect(mockSetServiceLines).not.toHaveBeenCalled();
  });

  it("opens the quick create form and submits via addService", async () => {
    const user = userEvent.setup();
    renderServices();
    await user.click(screen.getByText("Quick Create Service"));
    expect(screen.getByTestId("service-form-mock")).toBeInTheDocument();
    expect(screen.getByTestId("service-form-mode")).toHaveTextContent("quick");
    await user.click(screen.getByTestId("service-form-success"));
    expect(mockAddService).toHaveBeenCalledWith({
      id: "new-svc-1",
      name: "New Service",
    });
    expect(screen.queryByTestId("service-form-mock")).not.toBeInTheDocument();
  });

  it("closes the quick create form on cancel", async () => {
    const user = userEvent.setup();
    renderServices();
    await user.click(screen.getByText("Quick Create Service"));
    await user.click(screen.getByTestId("service-form-cancel"));
    expect(screen.queryByTestId("service-form-mock")).not.toBeInTheDocument();
  });

  it("renders last-visit service suggestions when available", () => {
    mockCtx = createMockCtx({
      showLastVisitSuggestions: true,
      lastVisitData: {
        services: [
          {
            service_catalog_id: "s-1",
            service_name: "Oil Change",
            unit_price: 50000,
            quantity: 1,
          },
        ],
        parts: [],
        mechanic_id: null,
        notes: null,
      },
      catalog: [service1],
    });
    renderServices();
    expect(screen.getByText("fromLastVisit")).toBeInTheDocument();
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("₮ 50,000")).toBeInTheDocument();
  });

  it("adds a last-visit service via the catalog item on click", async () => {
    mockCtx = createMockCtx({
      showLastVisitSuggestions: true,
      lastVisitData: {
        services: [
          {
            service_catalog_id: "s-1",
            service_name: "Oil Change",
            unit_price: 50000,
            quantity: 1,
          },
        ],
        parts: [],
        mechanic_id: null,
        notes: null,
      },
      catalog: [service1],
    });
    const user = userEvent.setup();
    renderServices();
    await user.click(screen.getByText("Oil Change"));
    expect(mockAddService).toHaveBeenCalledWith(service1);
  });

  it("disables already-added last-visit suggestions", () => {
    mockCtx = createMockCtx({
      showLastVisitSuggestions: true,
      lastVisitData: {
        services: [
          {
            service_catalog_id: "s-1",
            service_name: "Oil Change",
            unit_price: 50000,
            quantity: 1,
          },
        ],
        parts: [],
        mechanic_id: null,
        notes: null,
      },
      catalog: [service1],
      serviceLines: [
        {
          service_catalog_id: "s-1",
          name: "Oil Change",
          base_price: 50000,
          quantity: 1,
          discount_amount_mnt: 0,
          discount_percent: 0,
          final_price: 50000,
        },
      ],
    });
    renderServices();
    const row = screen.getByText("Oil Change").closest("button");
    expect(row).toBeDisabled();
  });

  it("calls addAllFromLastVisit on add all", async () => {
    mockCtx = createMockCtx({
      showLastVisitSuggestions: true,
      lastVisitData: {
        services: [
          {
            service_catalog_id: "s-1",
            service_name: "Oil Change",
            unit_price: 50000,
            quantity: 1,
          },
        ],
        parts: [],
        mechanic_id: null,
        notes: null,
      },
      catalog: [service1],
    });
    const user = userEvent.setup();
    renderServices();
    await user.click(screen.getByText("addAll"));
    expect(mockAddAllFromLastVisit).toHaveBeenCalled();
  });

  it("dismisses last-visit suggestions", async () => {
    mockCtx = createMockCtx({
      showLastVisitSuggestions: true,
      lastVisitData: {
        services: [
          {
            service_catalog_id: "s-1",
            service_name: "Oil Change",
            unit_price: 50000,
            quantity: 1,
          },
        ],
        parts: [],
        mechanic_id: null,
        notes: null,
      },
      catalog: [service1],
    });
    const user = userEvent.setup();
    renderServices();
    await user.click(screen.getByText("dismiss"));
    expect(mockSetShowLastVisitSuggestions).toHaveBeenCalledWith(false);
  });

  it("renders added service lines as LineItemRow", () => {
    mockCtx = createMockCtx({
      serviceLines: [
        {
          service_catalog_id: "s-1",
          name: "Oil Change",
          base_price: 50000,
          quantity: 2,
          discount_amount_mnt: 0,
          discount_percent: 0,
          final_price: 100000,
        },
      ],
    });
    renderServices();
    const rows = screen.getAllByTestId("line-item-row");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("Oil Change — 100000");
  });
});
