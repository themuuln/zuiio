import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortalWorkOrderDetailPage from "../page";

// ── Test data factories ─────────────────────────────────

function createService(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    service_name: "Oil Change",
    description: null,
    unit_price: 80000,
    quantity: 1,
    final_price: 80000,
    notes: null,
    ...overrides,
  };
}

function createPart(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    part_name: "Oil Filter",
    part_number: "OF-100",
    quantity: 1,
    unit_price: 15000,
    final_price: 15000,
    notes: null,
    ...overrides,
  };
}

function createStatusHistory(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    previous_status: null,
    status: "New",
    notes: null,
    created_at: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

function createWorkOrderDetail(
  overrides: Record<string, unknown> = {},
  services: Array<Record<string, unknown>> = [createService()],
  parts: Array<Record<string, unknown>> = [createPart()],
  statusHistory: Array<Record<string, unknown>> = [createStatusHistory()],
  invoices: Array<Record<string, unknown>> = [],
) {
  return {
    id: 1,
    vehicle_id: 1,
    status: "Completed",
    description: "Oil change and filter replacement",
    complaint: "Engine making noise",
    diagnosis: "Needs oil change and filter",
    subtotal: 95000,
    discount_total: 0,
    total: 95000,
    odometer_at_service: 50000,
    started_at: "2025-01-15T10:00:00Z",
    completed_at: "2025-01-15T12:00:00Z",
    created_at: "2025-01-15T09:00:00Z",
    services,
    parts,
    status_history: statusHistory,
    invoices,
    ...overrides,
  };
}

// ── Module mocks ────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "wo-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/portal/work-orders/wo-1",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const labels: Record<string, string> = {
      "portal.workOrders": "Work Orders",
      "portal.failedToLoadWorkOrder": "Failed to load this work order.",
      "portal.workOrderNotFound": "Work order not found.",
      "portal.invoices": "Invoices",
      "workOrders.complaintAndNotes": "Complaint & Diagnosis",
      "workOrders.complaint": "Complaint",
      "workOrders.diagnosis": "Diagnosis",
      "workOrders.services": "Services",
      "workOrders.parts": "Parts",
      "workOrders.statusTimeline": "Status Timeline",
      "common.description": "Description",
      "common.quantity": "Quantity",
      "common.unitPrice": "Unit Price",
      "common.total": "Total",
      "common.somethingWentWrong": "Something went wrong",
      "common.retry": "Retry",
      pageNotFound: "Page not found",
      pageNotFoundDescription: "Page not found description",
    };
    return (key: string) => labels[key] ?? key;
  },
}));

vi.mock("@/hooks/use-portal-auth", () => ({
  usePortalAuth: () => ({
    customer: { id: "c1" },
    loading: false,
    token: "tok-1",
    error: null,
  }),
}));

vi.mock("@/lib/hooks/use-realtime", () => ({
  useRealtime: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  ClipboardList: () => <span data-testid="icon-clipboard-list" />,
  History: () => <span data-testid="icon-history" />,
  RefreshCw: () => <span data-testid="icon-refresh-cw" />,
  Wrench: () => <span data-testid="icon-wrench" />,
}));

// ── Query client wrapper ────────────────────────────────

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ── Fetch helper ────────────────────────────────────────

function mockFetchSuccess(data: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

// ── Tests ───────────────────────────────────────────────

describe("PortalWorkOrderDetailPage", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
    vi.clearAllMocks();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // ── 1. Loading state ──────────────────────────────────

  it("shows loading skeleton while data is being fetched", () => {
    fetchSpy.mockImplementation(() => new Promise<Response>(() => {}));
    render(<PortalWorkOrderDetailPage />, { wrapper: createQueryWrapper() });

    expect(screen.getByText("Work Orders")).toBeInTheDocument();
  });

  // ── 2. Renders WO header with description and status ──

  it("renders work order header with description and status badge", async () => {
    const detail = createWorkOrderDetail();
    fetchSpy.mockImplementation(() => mockFetchSuccess(detail));
    render(<PortalWorkOrderDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText("Oil change and filter replacement"),
      ).toBeInTheDocument();
    });

    // Status badge with colored dot
    expect(screen.getByText("Completed")).toBeInTheDocument();

    // Calendar icon and created date
    expect(screen.getByTestId("icon-calendar")).toBeInTheDocument();

    // Total amount displayed (appears in header and table)
    const totalLabels = screen.getAllByText("Total");
    expect(totalLabels.length).toBeGreaterThanOrEqual(1);

    // Odometer shown — rendered as "50,000 km"
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
    expect(screen.getByText(/km/)).toBeInTheDocument();

    // Complaint & Diagnosis card rendered
    expect(screen.getByText("Complaint & Diagnosis")).toBeInTheDocument();
    expect(screen.getByText("Engine making noise")).toBeInTheDocument();
    expect(screen.getByText("Needs oil change and filter")).toBeInTheDocument();
  });

  // ── 3. Shows created date in header ────────────────────

  it("shows created date in the header", async () => {
    const detail = createWorkOrderDetail();
    fetchSpy.mockImplementation(() => mockFetchSuccess(detail));
    render(<PortalWorkOrderDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText("Oil change and filter replacement"),
      ).toBeInTheDocument();
    });

    // The page renders created_at as toLocaleDateString
    expect(screen.getByTestId("icon-calendar")).toBeInTheDocument();
    // Date is shown in a span with Calendar icon, rendered as "1/15/2025"
    const dateElements = screen.getAllByText(/2025/);
    expect(dateElements.length).toBeGreaterThanOrEqual(1);
  });

  // ── 4. Renders services list ──────────────────────────

  it("renders services list with name, quantity, unit price, total", async () => {
    const services = [
      createService({
        id: 1,
        service_name: "Oil Change",
        quantity: 1,
        unit_price: 80000,
        final_price: 80000,
      }),
      createService({
        id: 2,
        service_name: "Air Filter",
        quantity: 2,
        unit_price: 25000,
        final_price: 50000,
      }),
    ];
    const detail = createWorkOrderDetail({}, services, []);
    fetchSpy.mockImplementation(() => mockFetchSuccess(detail));
    render(<PortalWorkOrderDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Services")).toBeInTheDocument();
    });

    // Service name
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Air Filter")).toBeInTheDocument();

    // Quantity
    const qtyTexts = screen.getAllByText(/^[0-9]+$/);
    expect(qtyTexts.length).toBeGreaterThanOrEqual(2);

    // Unit price / final price (both shown as ₮ 80,000 — one for unit_price, one for final_price)
    const price80000 = screen.getAllByText(/₮ 80,000/);
    expect(price80000.length).toBeGreaterThanOrEqual(1);

    // Final price for Air Filter
    expect(screen.getByText(/₮ 50,000/)).toBeInTheDocument();
  });

  // ── 5. Renders parts list ─────────────────────────────

  it("renders parts list with name, quantity, unit price, total", async () => {
    const partsData = [
      createPart({
        id: 1,
        part_name: "Oil Filter",
        part_number: "OF-100",
        quantity: 1,
        unit_price: 15000,
        final_price: 15000,
      }),
      createPart({
        id: 2,
        part_name: "Air Filter",
        part_number: "AF-200",
        quantity: 2,
        unit_price: 12000,
        final_price: 24000,
      }),
    ];
    const detail = createWorkOrderDetail({}, [], partsData);
    fetchSpy.mockImplementation(() => mockFetchSuccess(detail));
    render(<PortalWorkOrderDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Parts")).toBeInTheDocument();
    });

    // Part names
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("Air Filter")).toBeInTheDocument();

    // Part numbers
    expect(screen.getByText("OF-100")).toBeInTheDocument();
    expect(screen.getByText("AF-200")).toBeInTheDocument();

    // Quantity
    expect(screen.getByText("2")).toBeInTheDocument();

    // Unit price / final price both shown (Oil Filter: 15000 for both unit and final)
    const price15000 = screen.getAllByText(/₮ 15,000/);
    expect(price15000.length).toBeGreaterThanOrEqual(1);

    // Air Filter unit price
    expect(screen.getByText(/₮ 12,000/)).toBeInTheDocument();

    // Air Filter total
    expect(screen.getByText(/₮ 24,000/)).toBeInTheDocument();
  });

  // ── 6. Renders total amount in header ─────────────────

  it("renders the total amount in the header section", async () => {
    const detail = createWorkOrderDetail({ total: 95000 });
    fetchSpy.mockImplementation(() => mockFetchSuccess(detail));
    render(<PortalWorkOrderDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText("Oil change and filter replacement"),
      ).toBeInTheDocument();
    });

    // Total is rendered in the header card
    expect(screen.getByText(/₮ 95,000/)).toBeInTheDocument();
    // "Total" label appears at least once
    const totalLabels = screen.getAllByText("Total");
    expect(totalLabels.length).toBeGreaterThanOrEqual(1);
  });

  // ── 7. Error state ────────────────────────────────────

  it("shows error state with retry button on fetch failure", async () => {
    fetchSpy.mockRejectedValue(new Error("Failed to load this work order."));
    render(<PortalWorkOrderDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load this work order."),
      ).toBeInTheDocument();
    });

    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  // ── 8. Shows empty services state ─────────────────────

  it("shows empty services message when no services added", async () => {
    const detail = createWorkOrderDetail({}, [], []);
    fetchSpy.mockImplementation(() => mockFetchSuccess(detail));
    render(<PortalWorkOrderDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Services")).toBeInTheDocument();
    });

    // "No services added." is shown as fallback text
    expect(screen.getByText("No services added.")).toBeInTheDocument();

    // Parts card should not be rendered when no parts
    expect(screen.queryByText("Parts")).not.toBeInTheDocument();
  });
});
