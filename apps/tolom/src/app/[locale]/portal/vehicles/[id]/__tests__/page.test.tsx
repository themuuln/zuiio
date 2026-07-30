import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortalVehicleDetailPage from "../page";

// ── Test data factories ─────────────────────────────────

function createVehicle(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "veh-1",
    plate_number: "ABC123",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    vin: "JT2BF22KX01000001",
    odometer: 50000,
    color: "Silver",
    ...overrides,
  };
}

function createWorkOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "wo-1",
    status: "Completed",
    description: "Oil change and filter replacement",
    complaint: null,
    total: 150000,
    created_at: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

function createService(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "svc-1",
    service_name: "Oil Change",
    next_due_date: "2025-06-15T00:00:00Z",
    next_due_km: 55000,
    ...overrides,
  };
}

function createVehicleData(
  vehicleOverrides: Partial<Record<string, unknown>> = {},
  workOrders: Array<Record<string, unknown>> = [createWorkOrder()],
  upcomingServices: Array<Record<string, unknown>> = [createService()],
) {
  return {
    vehicle: createVehicle(vehicleOverrides),
    workOrders,
    upcomingServices,
  };
}

// ── Module mocks ────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "veh-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/portal/vehicles/veh-1",
  useSearchParams: () => new URLSearchParams("token=tok-1"),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const labels: Record<string, string> = {
      "portal.failedToLoadVehicle": "Failed to load vehicle",
      "portal.vehicleNotFound": "Vehicle not found",
      "portal.vehicles": "Vehicles",
      "portal.upcomingServices": "Upcoming Services",
      "portal.serviceHistory": "Service History",
      "portal.noServiceHistory": "No service history",
      somethingWentWrong: "Something went wrong",
      retry: "Retry",
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

vi.mock("lucide-react", () => ({
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  Car: () => <span data-testid="icon-car" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
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

describe("PortalVehicleDetailPage", () => {
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
    render(<PortalVehicleDetailPage />, { wrapper: createQueryWrapper() });

    // Skeleton shows the vehicles breadcrumb title
    expect(screen.getByText("Vehicles")).toBeInTheDocument();
  });

  // ── 2. Renders vehicle detail correctly ────────────────

  it("renders vehicle detail with plate, brand, model, year, VIN, color", async () => {
    const vehicleData = createVehicleData({}, [createWorkOrder()], []);
    fetchSpy.mockImplementation(() => mockFetchSuccess(vehicleData));
    render(<PortalVehicleDetailPage />, { wrapper: createQueryWrapper() });

    // Wait for vehicle info to appear
    await waitFor(() => {
      expect(screen.getByText(/ABC123/)).toBeInTheDocument();
    });

    // Vehicle details
    expect(screen.getByText(/Toyota/)).toBeInTheDocument();
    expect(screen.getByText(/Camry/)).toBeInTheDocument();
    expect(screen.getByText(/\(2020\)/)).toBeInTheDocument();

    // VIN
    expect(screen.getByText(/JT2BF22KX01000001/)).toBeInTheDocument();

    // Color
    expect(screen.getByText(/Silver/)).toBeInTheDocument();

    // Odometer shown
    expect(screen.getByText(/km/)).toBeInTheDocument();

    // Back link
    expect(screen.getByTestId("icon-arrow-left")).toBeInTheDocument();
    expect(screen.getByText("Vehicles")).toBeInTheDocument();
  });

  // ── 3. Shows vehicle stats (work orders) ──────────────

  it("shows vehicle stats: work orders with status badges", async () => {
    const workOrders = [
      createWorkOrder({ id: "wo-1", status: "Completed", total: 150000 }),
      createWorkOrder({
        id: "wo-2",
        status: "In Progress",
        description: "Brake inspection",
        total: 0,
      }),
    ];
    const vehicleData = createVehicleData({}, workOrders, []);
    fetchSpy.mockImplementation(() => mockFetchSuccess(vehicleData));
    render(<PortalVehicleDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Service History")).toBeInTheDocument();
    });

    // Work order descriptions
    expect(
      screen.getByText("Oil change and filter replacement"),
    ).toBeInTheDocument();
    expect(screen.getByText("Brake inspection")).toBeInTheDocument();

    // Status badges
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();

    // Total amounts (non-zero shows formatted, zero shows empty)
    expect(screen.getByText(/₮/)).toBeInTheDocument();
  });

  // ── 4. Shows related upcoming services ───────────────

  it("shows related upcoming services section", async () => {
    const services = [
      createService({ service_name: "Oil Change" }),
      createService({
        id: "svc-2",
        service_name: "Tire Rotation",
        next_due_date: "2025-07-01T00:00:00Z",
        next_due_km: null,
      }),
    ];
    const vehicleData = createVehicleData({}, [createWorkOrder()], services);
    fetchSpy.mockImplementation(() => mockFetchSuccess(vehicleData));
    render(<PortalVehicleDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Upcoming Services")).toBeInTheDocument();
    });

    // Service names
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Tire Rotation")).toBeInTheDocument();
  });

  // ── 5. Error state ─────────────────────────────────────

  it("shows error state with retry button on fetch failure", async () => {
    fetchSpy.mockRejectedValue(new Error("Failed to load vehicle"));
    render(<PortalVehicleDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Failed to load vehicle")).toBeInTheDocument();
    });

    // Retry button should be present
    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  // ── 6. No inspections / no service history state ──────

  it("shows empty message when there is no service history", async () => {
    const vehicleData = createVehicleData({}, [], []);
    fetchSpy.mockImplementation(() => mockFetchSuccess(vehicleData));
    render(<PortalVehicleDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("No service history")).toBeInTheDocument();
    });
  });
});
