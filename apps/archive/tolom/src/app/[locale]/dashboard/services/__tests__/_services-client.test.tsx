import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceCatalog } from "@/lib/types";
import { render } from "@/test/test-utils";
import ServicesPageClient from "../_services-client";

// ── Mock state (hoisted so mock factories can reference it) ─────────
interface EditDrawerProps {
  service: ServiceCatalog | null;
  categories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ModelPricesDrawerProps {
  serviceId: string | null;
  serviceName: string;
  defaultPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TablePageStubProps {
  title?: ReactNode;
  description?: ReactNode;
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  data: ServiceCatalog[];
  getRowId?: (row: ServiceCatalog) => string;
  search?: {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    resultLabel?: ReactNode;
    emptyLabel?: ReactNode;
  };
  filters?: ReactNode;
  actions?: ReactNode;
  stats?: ReactNode;
  onRowClick?: (row: ServiceCatalog) => void;
  emptyState?: ReactNode;
  renderMobileCard?: (row: ServiceCatalog) => ReactNode;
}

const mocks = vi.hoisted(() => ({
  useServiceCatalog: vi.fn(),
  useServiceLastUsedPrices: vi.fn(),
  useServiceModelPriceCounts: vi.fn(),
  useCurrentOrg: vi.fn(),
  deleteMutate: vi.fn(),
  refetch: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  editDrawerProps: undefined as EditDrawerProps | undefined,
  modelPricesDrawerProps: undefined as ModelPricesDrawerProps | undefined,
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

// The page only uses the DELETE mutation; keep the other branch harmless.
vi.mock("@zuiio/query", () => ({
  useOrgMutation: (opts: { method?: string }) =>
    opts?.method === "DELETE"
      ? { mutate: mocks.deleteMutate, isPending: false }
      : { mutate: vi.fn(), isPending: false },
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-01-15T10:00:00.000Z"),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mocks.useCurrentOrg(...args),
}));

vi.mock("@/lib/queries/use-work-order-detail", () => ({
  useServiceCatalog: (...args: unknown[]) => mocks.useServiceCatalog(...args),
}));

vi.mock("@/lib/queries/use-price-memory", () => ({
  useServiceLastUsedPrices: (...args: unknown[]) =>
    mocks.useServiceLastUsedPrices(...args),
}));

vi.mock("@/lib/queries/use-service-vehicle-models", () => ({
  useServiceModelPriceCounts: (...args: unknown[]) =>
    mocks.useServiceModelPriceCounts(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

// Heavy children: the table shell is exercised at the props boundary —
// rows render through the client's own renderMobileCard (formatMNT etc.).
vi.mock("@/components/ui/data-table-page", () => ({
  DataTablePage: (props: TablePageStubProps) => (
    <div data-testid="data-table-page">
      <h1>{props.title}</h1>
      {props.description ? <p>{props.description}</p> : null}
      {props.loading ? <div data-testid="loading">loading</div> : null}
      {props.error ? (
        <div data-testid="error">
          <span>{props.error}</span>
          <button data-testid="retry" type="button" onClick={props.onRetry}>
            retry
          </button>
        </div>
      ) : null}
      {props.search ? (
        <input
          data-testid="services-search"
          placeholder={props.search.placeholder}
          value={props.search.value}
          onChange={(e) => props.search?.onChange(e.target.value)}
        />
      ) : null}
      {props.search?.resultLabel ? (
        <span data-testid="result-label">{props.search.resultLabel}</span>
      ) : null}
      {props.search?.emptyLabel ? (
        <span data-testid="empty-label">{props.search.emptyLabel}</span>
      ) : null}
      <div data-testid="category-filters">{props.filters}</div>
      {props.actions}
      {props.stats}
      {props.data.length === 0 ? (
        props.emptyState
      ) : (
        <div data-testid="service-rows">
          {props.data.map((row, index) => (
            <button
              type="button"
              key={props.getRowId ? props.getRowId(row) : index}
              data-testid="service-row"
              onClick={() => props.onRowClick?.(row)}
            >
              {props.renderMobileCard ? props.renderMobileCard(row) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  ),
}));

vi.mock("@/components/export-button", () => ({
  ExportButton: () => <span data-testid="export-button">export</span>,
}));

vi.mock("@/components/services/service-model-prices-drawer", () => ({
  ServiceModelPricesDrawer: (props: ModelPricesDrawerProps) => {
    mocks.modelPricesDrawerProps = props;
    return <div data-testid="model-prices-drawer" />;
  },
}));

vi.mock("../_edit-service-drawer", () => ({
  EditServiceDrawer: (props: EditDrawerProps) => {
    mocks.editDrawerProps = props;
    return (
      <div data-testid="edit-service-drawer">
        {props.open ? "drawer-open" : "drawer-closed"}
      </div>
    );
  },
}));

// Desktop table cells render inside the (stubbed) DataTablePage shell.
vi.mock("../_columns", () => ({
  createColumns: () => [],
}));

// ── Fixtures ────────────────────────────────────────────────────────

function makeService(overrides: Partial<ServiceCatalog> = {}): ServiceCatalog {
  return {
    id: "svc-1",
    organization_id: "org-1",
    branch_id: null,
    category: "Engine",
    created_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    default_cost: null,
    default_price: 45000,
    deleted_at: null,
    description: "Oil and filter replacement",
    embedding: null,
    estimated_duration_minutes: null,
    global_service_id: null,
    interval_km: null,
    interval_months: null,
    is_active: true,
    name: "Oil Change",
    name_mn: "Тос солих",
    updated_at: "2026-01-01T00:00:00.000Z",
    updated_by: null,
    ...overrides,
  };
}

function iconButton(lucideClass: string): HTMLButtonElement {
  const svg = document.querySelector(`svg.${lucideClass}`);
  const button = svg?.closest("button");
  if (!button) throw new Error(`icon button not found: ${lucideClass}`);
  return button as HTMLButtonElement;
}

function renderPage() {
  return render(<ServicesPageClient />);
}

// ── Tests ───────────────────────────────────────────────────────────

describe("ServicesPageClient", () => {
  beforeEach(() => {
    mocks.useServiceCatalog.mockReset();
    mocks.useServiceLastUsedPrices.mockReset();
    mocks.useServiceModelPriceCounts.mockReset();
    mocks.useCurrentOrg.mockReset();
    mocks.deleteMutate.mockReset();
    mocks.refetch.mockReset();
    mocks.toastError.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.editDrawerProps = undefined;
    mocks.modelPricesDrawerProps = undefined;

    mocks.useServiceCatalog.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
      refetch: mocks.refetch,
    });
    mocks.useServiceLastUsedPrices.mockReturnValue({ data: {} });
    mocks.useServiceModelPriceCounts.mockReturnValue({ data: {} });
    mocks.useCurrentOrg.mockReturnValue({
      data: { orgId: "org-1", orgName: "Test Org", branchId: null },
      isPending: false,
    });
  });

  it("shows a loading state while the catalog query is pending", () => {
    mocks.useServiceCatalog.mockReturnValue({
      data: [],
      isPending: true,
      error: null,
      refetch: mocks.refetch,
    });
    renderPage();

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.queryAllByTestId("service-row")).toHaveLength(0);
    expect(screen.queryByTestId("error")).not.toBeInTheDocument();
  });

  it("renders service rows with formatted MNT prices, categories and the uncategorized fallback", () => {
    mocks.useServiceCatalog.mockReturnValue({
      data: [
        makeService(),
        makeService({
          id: "svc-2",
          name: "Brake Pad Replacement",
          name_mn: null,
          category: "Body",
          default_price: 120000,
          description: null,
        }),
        makeService({
          id: "svc-3",
          name: "Battery Check",
          name_mn: "Батерей шалгах",
          category: null,
          default_price: 0,
          description: null,
        }),
      ],
      isPending: false,
      error: null,
      refetch: mocks.refetch,
    });
    renderPage();

    expect(screen.getAllByTestId("service-row")).toHaveLength(3);
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("₮ 45,000")).toBeInTheDocument();
    expect(screen.getByText("Brake Pad Replacement")).toBeInTheDocument();
    expect(screen.getByText("₮ 120,000")).toBeInTheDocument();
    // Category appears in both the filter badge and the mobile card label
    expect(screen.getAllByText("Engine").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Body").length).toBeGreaterThan(0);
    // No category → localized fallback label
    expect(screen.getByText("uncategorized")).toBeInTheDocument();
    expect(screen.getByText("₮ 0")).toBeInTheDocument();
    // Stats + result label both carry the translated count key
    expect(screen.getAllByText("serviceCount").length).toBeGreaterThan(0);
  });

  it("shows the last-used price and vehicle model count in the mobile card", () => {
    mocks.useServiceCatalog.mockReturnValue({
      data: [
        makeService(),
        makeService({ id: "svc-2", name: "Wheel Balance", category: "Body" }),
      ],
      isPending: false,
      error: null,
      refetch: mocks.refetch,
    });
    mocks.useServiceLastUsedPrices.mockReturnValue({
      data: { "svc-1": { unit_price: 50000 } },
    });
    mocks.useServiceModelPriceCounts.mockReturnValue({
      data: { "svc-2": 3 },
    });
    renderPage();

    expect(screen.getByText("lastPrefix₮ 50,000")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    // No last-used price for svc-2 → no prefix rendered for it
    expect(screen.queryByText("lastPrefix₮ 0")).not.toBeInTheDocument();
  });

  it("opens the model prices drawer from the mobile card action", async () => {
    const user = userEvent.setup();
    mocks.useServiceCatalog.mockReturnValue({
      data: [makeService()],
      isPending: false,
      error: null,
      refetch: mocks.refetch,
    });
    renderPage();

    await user.click(iconButton("lucide-car-front"));

    expect(mocks.modelPricesDrawerProps?.open).toBe(true);
    expect(mocks.modelPricesDrawerProps?.serviceId).toBe("svc-1");
    expect(mocks.modelPricesDrawerProps?.serviceName).toBe("Oil Change");
    expect(mocks.modelPricesDrawerProps?.defaultPrice).toBe(45000);
  });

  it("opens the create drawer from the empty state CTA and the header action", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("noServices")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "addFirstService" }));
    expect(mocks.editDrawerProps?.open).toBe(true);
    expect(mocks.editDrawerProps?.service).toBeNull();

    await act(async () => {
      mocks.editDrawerProps?.onOpenChange(false);
    });
    expect(mocks.editDrawerProps?.open).toBe(false);

    await user.click(screen.getByRole("button", { name: "addService" }));
    expect(mocks.editDrawerProps?.open).toBe(true);
    expect(mocks.editDrawerProps?.service).toBeNull();
  });

  it("filters services by search across name, Mongolian name and description", async () => {
    const user = userEvent.setup();
    mocks.useServiceCatalog.mockReturnValue({
      data: [
        makeService(),
        makeService({
          id: "svc-2",
          name: "Brake Pad Replacement",
          name_mn: null,
          description: "brake noise fix",
        }),
        makeService({
          id: "svc-3",
          name: "Battery Check",
          name_mn: "Батерей шалгах",
          description: null,
        }),
      ],
      isPending: false,
      error: null,
      refetch: mocks.refetch,
    });
    renderPage();
    const search = screen.getByTestId("services-search");
    expect(screen.getAllByTestId("service-row")).toHaveLength(3);

    // Matches the Mongolian name (case-insensitive)
    await user.type(search, "тос");
    expect(screen.getAllByTestId("service-row")).toHaveLength(1);
    expect(screen.getByText("Oil Change")).toBeInTheDocument();

    // Matches English name
    await user.clear(search);
    await user.type(search, "brake");
    expect(screen.getAllByTestId("service-row")).toHaveLength(1);
    expect(screen.getByText("Brake Pad Replacement")).toBeInTheDocument();

    // Matches description only
    await user.clear(search);
    await user.type(search, "noise");
    expect(screen.getAllByTestId("service-row")).toHaveLength(1);

    // Empty query restores all rows
    await user.clear(search);
    expect(screen.getAllByTestId("service-row")).toHaveLength(3);
  });

  it("filters services by category badge and resets with All", async () => {
    const user = userEvent.setup();
    mocks.useServiceCatalog.mockReturnValue({
      data: [
        makeService(),
        makeService({
          id: "svc-2",
          name: "Brake Pad Replacement",
          category: "Body",
          description: null,
        }),
      ],
      isPending: false,
      error: null,
      refetch: mocks.refetch,
    });
    renderPage();
    expect(screen.getAllByTestId("service-row")).toHaveLength(2);

    await user.click(
      within(screen.getByTestId("category-filters")).getByText("Engine"),
    );
    expect(screen.getAllByTestId("service-row")).toHaveLength(1);
    expect(screen.getByText("Oil Change")).toBeInTheDocument();

    await user.click(
      within(screen.getByTestId("category-filters")).getByText("All (2)"),
    );
    expect(screen.getAllByTestId("service-row")).toHaveLength(2);
  });

  it("shows the no-matches empty label and hides the create CTA when search finds nothing", async () => {
    const user = userEvent.setup();
    mocks.useServiceCatalog.mockReturnValue({
      data: [makeService()],
      isPending: false,
      error: null,
      refetch: mocks.refetch,
    });
    renderPage();

    await user.type(screen.getByTestId("services-search"), "zzz-not-found");

    expect(screen.getByTestId("empty-label").textContent).toBe("noMatches");
    expect(screen.getByText("noServices")).toBeInTheDocument();
    // Filtered-to-empty but catalog non-empty → no create CTA
    expect(
      screen.queryByRole("button", { name: "addFirstService" }),
    ).not.toBeInTheDocument();
  });

  it("renders the query error with a retry action that refetches", async () => {
    const user = userEvent.setup();
    mocks.useServiceCatalog.mockReturnValue({
      data: [],
      isPending: false,
      error: new Error("Failed to load services"),
      refetch: mocks.refetch,
    });
    renderPage();

    expect(screen.getByText("Failed to load services")).toBeInTheDocument();
    await user.click(screen.getByTestId("retry"));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it("shows noOrgFound only after the org query settles without an org", () => {
    mocks.useCurrentOrg.mockReturnValue({ data: null, isPending: true });
    const { unmount } = renderPage();
    expect(screen.queryByText("noOrgFound")).not.toBeInTheDocument();

    unmount();
    mocks.useCurrentOrg.mockReturnValue({ data: null, isPending: false });
    renderPage();
    expect(screen.getByText("noOrgFound")).toBeInTheDocument();
  });

  it("opens the edit drawer with the selected service on row click and pencil action", async () => {
    const user = userEvent.setup();
    mocks.useServiceCatalog.mockReturnValue({
      data: [
        makeService(),
        makeService({ id: "svc-2", name: "Wheel Balance", category: "Body" }),
      ],
      isPending: false,
      error: null,
      refetch: mocks.refetch,
    });
    renderPage();

    await user.click(screen.getAllByTestId("service-row")[1]);
    expect(mocks.editDrawerProps?.open).toBe(true);
    expect(mocks.editDrawerProps?.service?.id).toBe("svc-2");
    expect(mocks.editDrawerProps?.categories).toEqual(["Body", "Engine"]);

    await act(async () => {
      mocks.editDrawerProps?.onOpenChange(false);
    });
    expect(mocks.editDrawerProps?.open).toBe(false);

    await user.click(iconButton("lucide-pencil"));
    expect(mocks.editDrawerProps?.service?.id).toBe("svc-1");
  });

  it("cancels the delete dialog without mutating and confirms with the service id", async () => {
    const user = userEvent.setup();
    mocks.deleteMutate.mockImplementation(
      (_vars: unknown, opts?: { onSettled?: () => void }) => {
        opts?.onSettled?.();
      },
    );
    mocks.useServiceCatalog.mockReturnValue({
      data: [makeService()],
      isPending: false,
      error: null,
      refetch: mocks.refetch,
    });
    renderPage();

    await user.click(iconButton("lucide-trash-2"));
    expect(screen.getByText("deleteService")).toBeInTheDocument();
    expect(screen.getByText("deleteServiceDesc")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(mocks.deleteMutate).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByText("deleteService")).not.toBeInTheDocument(),
    );

    await user.click(iconButton("lucide-trash-2"));
    await user.click(screen.getByRole("button", { name: "deleteConfirm" }));
    expect(mocks.deleteMutate).toHaveBeenCalledWith(
      { id: "svc-1" },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    );
    await waitFor(() =>
      expect(screen.queryByText("deleteService")).not.toBeInTheDocument(),
    );
  });

  it("toasts the delete failure and keeps the dialog open", async () => {
    const user = userEvent.setup();
    mocks.deleteMutate.mockImplementation(
      (_vars: unknown, opts?: { onError?: (error: Error) => void }) => {
        opts?.onError?.(new Error("boom"));
      },
    );
    mocks.useServiceCatalog.mockReturnValue({
      data: [makeService()],
      isPending: false,
      error: null,
      refetch: mocks.refetch,
    });
    renderPage();

    await user.click(iconButton("lucide-trash-2"));
    await user.click(screen.getByRole("button", { name: "deleteConfirm" }));

    expect(mocks.toastError).toHaveBeenCalledWith(
      "failedToDelete",
      expect.objectContaining({ description: "boom" }),
    );
    expect(screen.getByText("deleteService")).toBeInTheDocument();
  });
});
