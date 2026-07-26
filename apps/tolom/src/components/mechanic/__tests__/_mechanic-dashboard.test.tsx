import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MechanicDashboard } from "@/app/[locale]/dashboard/mechanic/_mechanic-dashboard";

import type {
  ClockStatus,
  MechanicEodSummary,
  MechanicTrend,
  WorkOrderRow,
} from "@/lib/queries/use-mechanic-dashboard";

// ── Mocks ──────────────────────────────────────────────────────────

// next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// next/dynamic — MechanicTrendChart is dynamically imported
vi.mock("next/dynamic", () => ({
  default: () => {
    const MockComponent = () => <div data-testid="mock-trend-chart" />;
    return MockComponent;
  },
}));

// Router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// useClientNow — fixed date so snapshots are deterministic
const mockNow = new Date("2026-07-26T10:00:00");
vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => mockNow,
}));

// useRealtimeMulti — no-op in tests
vi.mock("@/lib/hooks/use-realtime-multi", () => ({
  useRealtimeMulti: () => {},
}));

// Sonner toast
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

// Child dialogs / modals — conditionally rendered so just null components
vi.mock("@/components/bay-view-v2/pickup-complete-dialog", () => ({
  PickupCompleteDialog: () => null,
}));
vi.mock("@/components/bay-view-v2/shift-report-dialog", () => ({
  ShiftReportDialog: () => null,
}));
vi.mock("@/components/bay-view-v2/status-notes-modal", () => ({
  StatusNotesModal: () => null,
}));
vi.mock("@/components/bay-view-v2/_elapsed-display", () => ({
  ElapsedTimer: () => null,
}));

// Sentry
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

// ── Dynamic mocks (module-level lets: vi.mock factories close over these) ──

let mockEodData: MechanicEodSummary | null = null;
let mockEodPending = false;
let mockWoData: WorkOrderRow[] | undefined;
let mockWoPending = false;
let mockTrendData: MechanicTrend | null = null;
let mockTrendPending = false;
let mockClockData: ClockStatus | null = null;

vi.mock("@/lib/queries/use-mechanic-dashboard", () => ({
  useMechanicEod: () => ({
    data: mockEodData,
    isPending: mockEodPending,
    isFetching: false,
    error: null,
  }),
  useMechanicWorkOrders: () => ({
    data: mockWoData,
    isPending: mockWoPending,
    isFetching: false,
    error: null,
  }),
  useMechanicTrend: () => ({
    data: mockTrendData,
    isPending: mockTrendPending,
    isFetching: false,
    error: null,
  }),
  useClockStatus: () => ({
    data: mockClockData,
    isPending: false,
    isFetching: false,
    error: null,
  }),
  useClockToggle: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useMechanicsList: () => ({
    data: [],
    isPending: false,
  }),
}));

vi.mock("@/lib/queries/use-work-order-detail", () => ({
  useUpdateWorkOrderStatus: () => ({ mutate: vi.fn(), isPending: false }),
}));

// ── Test helpers ──────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

function renderDashboard() {
  return render(
    <MechanicDashboard
      userId="user-1"
      orgId="org-1"
      mechanicName="John Doe"
      avatarUrl={null}
      isAdminView={false}
    />,
    { wrapper: createWrapper() },
  );
}

// ── Test data ─────────────────────────────────────────────────────

const mockEod: MechanicEodSummary = {
  mechanic_id: "user-1",
  mechanic_name: "John Doe",
  work_orders_completed: 3,
  services_count: 5,
  parts_count: 8,
  total_revenue: 450000,
};

const mockWorkOrders: WorkOrderRow[] = [
  {
    id: "wo-1",
    status: "In Progress",
    description: "Газрын тос солих",
    total: 120000,
    customer_name: "Бат",
    vehicle_plate: "01-1234-УБА",
    vehicle_id: "v-1",
    created_at: "2026-07-26T08:00:00",
    started_at: "2026-07-26T08:30:00",
  },
  {
    id: "wo-2",
    status: "New",
    description: "Тормосны шинэчлэл",
    total: 250000,
    customer_name: "Дулам",
    vehicle_plate: "02-5678-УБА",
    vehicle_id: "v-2",
    created_at: "2026-07-26T09:00:00",
    started_at: null,
  },
];

const mockTrend: MechanicTrend = {
  avgJobValue: 180000,
  jobsPerDay: 4.2,
  weeklyTrend: [
    { week: "2026-W29", orders: 5, revenue: 900000 },
    { week: "2026-W30", orders: 7, revenue: 1260000 },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────

describe("MechanicDashboard", () => {
  beforeEach(() => {
    mockEodData = null;
    mockEodPending = false;
    mockWoData = [];
    mockWoPending = false;
    mockTrendData = null;
    mockTrendPending = false;
    mockClockData = null;
  });

  it("shows skeleton loading state when queries are pending", () => {
    mockEodPending = true;
    renderDashboard();

    // KPI labels still visible during loading
    expect(screen.getByText("mechanic.completedToday")).toBeInTheDocument();
    expect(screen.getByText("mechanic.revenueToday")).toBeInTheDocument();
    expect(screen.getByText("mechanic.activeJobs")).toBeInTheDocument();

    // Skeleton elements rendered (KPI cards 1-3 and work order list)
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);

    // Work order list shows skeleton rows (3 skeleton rows)
    expect(skeletons.length).toBeGreaterThanOrEqual(3);

    // Hours KPI card (no loading prop) still shows its value
    expect(screen.getByText("0.0")).toBeInTheDocument();
  });

  it("renders KPI cards with data when queries resolve", () => {
    mockEodData = mockEod;
    mockWoData = mockWorkOrders;
    mockTrendData = mockTrend;
    mockClockData = { clockedIn: true, since: "2026-07-26T08:00:00", todayHours: 2.0 };

    renderDashboard();

    expect(screen.getByText("mechanic.completedToday")).toBeInTheDocument();
    expect(screen.getByText("mechanic.revenueToday")).toBeInTheDocument();
    expect(screen.getByText("mechanic.activeJobs")).toBeInTheDocument();
    expect(screen.getByText("mechanic.hoursToday")).toBeInTheDocument();

    // KPI values rendered
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2.0")).toBeInTheDocument();

    // Work order count (2 active jobs)
    expect(screen.getByText("mechanic.myWorkOrders")).toBeInTheDocument();
  });

  it("shows clock-in button when mechanic is not clocked in", () => {
    mockClockData = { clockedIn: false, since: null, todayHours: 0 };
    mockEodData = mockEod;

    renderDashboard();

    // Clock-in button renders with Play icon text
    expect(screen.getByText("mechanic.clockIn")).toBeInTheDocument();
    // Mechanic name rendered in heading
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders work orders list with customer names", () => {
    mockEodData = mockEod;
    mockWoData = mockWorkOrders;
    mockTrendData = mockTrend;
    mockClockData = { clockedIn: false, since: null, todayHours: 0 };

    renderDashboard();

    // Work order heading
    expect(screen.getByText("mechanic.myWorkOrders")).toBeInTheDocument();

    // Customer names rendered
    expect(screen.getByText("Бат")).toBeInTheDocument();
    expect(screen.getByText("Дулам")).toBeInTheDocument();

    // Vehicle plates visible
    expect(screen.getByText("01-1234-УБА")).toBeInTheDocument();
    expect(screen.getByText("02-5678-УБА")).toBeInTheDocument();
  });
});
