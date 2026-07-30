import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortalDashboardPage from "@/app/[locale]/portal/page";
import { render } from "@/test/test-utils";

// ── Hook Mocks ──────────────────────────────────────────────────

const mockUsePortalAuth = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-portal-auth", () => ({
  usePortalAuth: mockUsePortalAuth,
}));

// next/link renders as plain <a> in tests
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ── Fixtures ────────────────────────────────────────────────────

const mockCustomer = {
  id: "cust-1",
  first_name: "Test",
  last_name: "User",
  full_name: "Test User",
  phone: "99112233",
  email: "test@example.com",
  portal_token: "tok-1",
  organization_id: "org-1",
  total_visits: 12,
  last_visit_at: "2026-07-28T10:00:00Z",
};

const mockVehicles = [
  {
    id: "v1",
    plate_number: "ABC123",
    make: "Toyota",
    model: "Camry",
    year: 2022,
  },
  {
    id: "v2",
    plate_number: "DEF456",
    make: "Honda",
    model: "Accord",
    year: 2021,
  },
  {
    id: "v3",
    plate_number: "GHI789",
    make: "Lexus",
    model: "RX",
    year: null,
  },
];

const mockInspections = [
  {
    id: "inv-1",
    status: "sent",
    created_at: "2026-07-29T10:00:00Z",
    vehicle: {
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
    },
  },
  {
    id: "inv-2",
    status: "approved",
    created_at: "2026-07-28T09:00:00Z",
    vehicle: {
      plate_number: "DEF456",
      make: "Honda",
      model: "Accord",
    },
  },
];

const messages = {
  portal: {
    welcome: "Welcome {name}",
    dashboardDesc: "Overview of your vehicles and inspections",
    myVehicles: "My Vehicles",
    totalVisits: "Total Visits",
    lastVisit: "Last Visit",
    noVehicles: "No vehicles found",
    inspections: "Inspections",
    pendingApproval: "pending approval",
    noInspections: "No inspections found",
    failedToLoadInspections: "Failed to load inspections",
  },
  common: {
    viewAll: "View All",
    unknown: "Unknown",
  },
};

// ── Tests ───────────────────────────────────────────────────────

describe("PortalDashboardPage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("shows PageShellSkeleton while auth is loading", () => {
    mockUsePortalAuth.mockReturnValue({
      customer: null,
      loading: true,
      token: null,
      error: null,
    });

    render(<PortalDashboardPage />, { messages });

    // PageShellSkeleton renders the title and description when provided
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(
      screen.getByText("Overview of your vehicles and inspections"),
    ).toBeInTheDocument();
  });

  it("shows PageErrorState when data fetch fails", async () => {
    mockUsePortalAuth.mockReturnValue({
      customer: { id: "cust-1", first_name: "Test" },
      loading: false,
      token: "tok-1",
      error: null,
    });

    // Make the vehicles query fail
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<PortalDashboardPage />, { messages });

    // Wait for the error state — PageErrorState shows the error message
    const errorEl = await screen.findByText(
      "Network error",
      {},
      { timeout: 2000 },
    );
    expect(errorEl).toBeInTheDocument();

    // Retry button should be present
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders stats, vehicle list, and inspections with data", async () => {
    mockUsePortalAuth.mockReturnValue({
      customer: mockCustomer,
      loading: false,
      token: "tok-1",
      error: null,
    });

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/portal/vehicles") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVehicles }),
        } as Response);
      }
      if (url === "/api/portal/inspections") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockInspections }),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response);
    });

    render(<PortalDashboardPage />, { messages });

    // Wait for the vehicle count stat
    await screen.findByText("3", {}, { timeout: 2000 });
    // Total visits stat
    expect(screen.getByText("12")).toBeInTheDocument();
    // Last visit — formatted date, just check that it's rendered
    // The date formatting may differ between Node/browser, so check the stat label is present
    expect(screen.getByText("Last Visit")).toBeInTheDocument();

    // Vehicle links — ABC123 also appears in inspections section
    const abcElements = screen.getAllByText("ABC123");
    expect(abcElements.length).toBeGreaterThanOrEqual(1);
    const defElements = screen.getAllByText("DEF456");
    expect(defElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("GHI789")).toBeInTheDocument();

    // Inspections section heading
    expect(screen.getByText("Inspections")).toBeInTheDocument();

    // Pending count banner (1 sent inspection)
    expect(screen.getByText(/pending approval/i)).toBeInTheDocument();

    // Inspection vehicle plate numbers (also in vehicles section)
    expect(screen.getAllByText("ABC123").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("DEF456").length).toBeGreaterThanOrEqual(1);

    // View All links
    const viewAllLinks = screen.getAllByText("View All");
    expect(viewAllLinks.length).toBe(2);
  });

  it("shows empty state when there are no vehicles or inspections", async () => {
    mockUsePortalAuth.mockReturnValue({
      customer: mockCustomer,
      loading: false,
      token: "tok-1",
      error: null,
    });

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/portal/vehicles") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response);
      }
      if (url === "/api/portal/inspections") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response);
    });

    render(<PortalDashboardPage />, { messages });

    // Empty vehicle state
    await screen.findByText("No vehicles found", {}, { timeout: 2000 });

    // Empty inspections state
    expect(screen.getByText("No inspections found")).toBeInTheDocument();

    // Vehicle count stat should show 0 (empty vehicles array)
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });
});
