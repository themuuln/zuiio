import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ItpDashboardWidget } from "@/components/itp/itp-dashboard-widget";
import { render } from "@/test/test-utils";

// ── Hook Mocks ──────────────────────────────────────────────────

const mockUseItpStats = vi.hoisted(() => vi.fn());
const mockUseExpiringItpRecords = vi.hoisted(() => vi.fn());
const mockUseRouter = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries/use-itp", () => ({
  useItpStats: mockUseItpStats,
  useExpiringItpRecords: mockUseExpiringItpRecords,
}));

vi.mock("next/navigation", () => ({
  useRouter: mockUseRouter,
}));

// ── Fixtures ────────────────────────────────────────────────────

const mockStats = {
  total: 20,
  valid: 10,
  expiring_soon: 3,
  expired: 5,
  unknown: 2,
};

const mockExpiringRecords = [
  {
    vehicle_id: "v1",
    plate_number: "ABC123",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    itp_expiry_date: "2026-08-14",
    itp_last_passed_date: "2025-08-14",
    itp_notes: null,
    customer_name: "John",
    customer_phone: "99112233",
    days_until_expiry: 15,
    itp_status: "expiring_soon" as const,
  },
  {
    vehicle_id: "v2",
    plate_number: "DEF456",
    make: "Honda",
    model: "Civic",
    year: 2021,
    itp_expiry_date: "2026-08-20",
    itp_last_passed_date: "2025-08-20",
    itp_notes: null,
    customer_name: "Jane",
    customer_phone: "99445566",
    days_until_expiry: 5,
    itp_status: "expiring_soon" as const,
  },
];

const messages = {
  itp: {
    dashboardWidgetTitle: "ITP Overview",
    valid: "Valid",
    expiringSoon: "Expiring Soon",
    expired: "Expired",
    unknown: "Unknown",
    expiringVehicles: "Expiring Vehicles",
    noExpiringVehicles: "All vehicles have valid ITP",
    viewAllItpRecords: "View All ITP Records",
  },
};

// ── Tests ───────────────────────────────────────────────────────

describe("ItpDashboardWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  it("shows inline skeleton while loading", () => {
    mockUseItpStats.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    } as unknown);
    mockUseExpiringItpRecords.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    } as unknown);

    const { container } = render(<ItpDashboardWidget orgId="org-1" />, {
      messages,
    });

    expect(screen.getByText("ITP Overview")).toBeInTheDocument();

    // Stat labels should render even while loading
    expect(screen.getByText("Valid")).toBeInTheDocument();
    expect(screen.getByText("Expiring Soon")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();

    // Skeleton elements should be present instead of numeric values
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it("renders stats with data", () => {
    mockUseItpStats.mockReturnValue({
      data: mockStats,
      isPending: false,
      error: null,
    } as unknown);
    mockUseExpiringItpRecords.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    } as unknown);

    render(<ItpDashboardWidget orgId="org-1" />, { messages });

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders expiring vehicles list", () => {
    mockUseItpStats.mockReturnValue({
      data: mockStats,
      isPending: false,
    } as unknown);
    mockUseExpiringItpRecords.mockReturnValue({
      data: mockExpiringRecords,
      isPending: false,
    } as unknown);

    render(<ItpDashboardWidget orgId="org-1" />, { messages });

    // Expiring section header
    expect(screen.getByText("Expiring Vehicles")).toBeInTheDocument();

    // Vehicle plate numbers should be shown
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByText("DEF456")).toBeInTheDocument();

    // Day counts
    expect(screen.getByText("15d")).toBeInTheDocument();
    expect(screen.getByText("5d")).toBeInTheDocument();
  });

  it("shows empty state when no expiring vehicles", () => {
    mockUseItpStats.mockReturnValue({
      data: mockStats,
      isPending: false,
    } as unknown);
    mockUseExpiringItpRecords.mockReturnValue({
      data: [],
      isPending: false,
    } as unknown);

    render(<ItpDashboardWidget orgId="org-1" />, { messages });

    expect(screen.getByText("All vehicles have valid ITP")).toBeInTheDocument();
  });

  it("calls onViewAll when the view all button is clicked", async () => {
    mockUseItpStats.mockReturnValue({
      data: mockStats,
      isPending: false,
    } as unknown);
    mockUseExpiringItpRecords.mockReturnValue({
      data: mockExpiringRecords,
      isPending: false,
    } as unknown);

    const onViewAll = vi.fn();
    const user = userEvent.setup();

    render(<ItpDashboardWidget orgId="org-1" onViewAll={onViewAll} />, {
      messages,
    });

    await user.click(screen.getByText("View All ITP Records"));
    expect(onViewAll).toHaveBeenCalledOnce();
  });

  it("navigates to ITP page when onViewAll is not provided", async () => {
    mockUseItpStats.mockReturnValue({
      data: mockStats,
      isPending: false,
    } as unknown);
    mockUseExpiringItpRecords.mockReturnValue({
      data: mockExpiringRecords,
      isPending: false,
    } as unknown);

    const user = userEvent.setup();

    render(<ItpDashboardWidget orgId="org-1" />, { messages });

    await user.click(screen.getByText("View All ITP Records"));
    expect(mockPush).toHaveBeenCalledWith("/organizations/org-1/itp");
  });
});
