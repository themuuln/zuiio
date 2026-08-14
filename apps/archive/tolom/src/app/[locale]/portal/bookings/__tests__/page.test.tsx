import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import PortalBookingsPage from "../page";

// ─── Sample data ──────────────────────────────────────────────

const sampleBookings = [
  {
    id: "b1",
    status: "pending",
    scheduled_at: "2026-08-05T09:00:00Z",
    time_slot: "09:00-10:00",
    service: "Oil Change",
    vehicle: {
      plate_number: "001УНА",
      make: "Toyota",
      model: "Land Cruiser",
    },
  },
  {
    id: "b2",
    status: "confirmed",
    scheduled_at: "2026-08-06T14:00:00Z",
    time_slot: "14:00-15:00",
    service: "Brake Inspection",
    vehicle: {
      plate_number: "005УНА",
      make: "Honda",
      model: "Civic",
    },
  },
  {
    id: "b3",
    status: "completed",
    scheduled_at: "2026-07-30T10:00:00Z",
    time_slot: "10:00-11:00",
    service: "Full Service",
    vehicle: {
      plate_number: "010УНА",
      make: "Lexus",
      model: "RX350",
    },
  },
  {
    id: "b4",
    status: "cancelled",
    scheduled_at: "2026-07-28T08:00:00Z",
    time_slot: "08:00-09:00",
    service: "Tire Change",
    vehicle: {
      plate_number: "015УНА",
      make: "BMW",
      model: "X5",
    },
  },
];

// ─── Mutable auth mock state (per-test override) ──────────────

let mockAuth: {
  customer: Record<string, unknown> | null;
  loading: boolean;
  token: string | null;
  error: Error | null;
} = {
  customer: { id: "1", name: "Test Customer" },
  loading: false,
  token: "test-token",
  error: null,
};

// ─── Module mocks (hoisted to top by Vitest) ──────────────────

vi.mock(import("next-intl"), async (importOriginal) => {
  const mod = await importOriginal();
  const map: Record<string, string> = {
    "portal.bookings": "Bookings",
    "portal.noBookings": "No bookings",
    "portal.failedToLoadBookings": "Failed to load bookings",
    somethingWentWrong: "Something went wrong",
    retry: "Retry",
  };
  return {
    ...mod,
    useTranslations: () => (key: string) => map[key] ?? key,
  };
});

vi.mock("lucide-react", () => ({
  AlertCircle: () => <svg data-testid="alert-circle" />,
  Calendar: () => <svg data-testid="calendar" />,
  RefreshCw: () => <svg data-testid="refresh-cw" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/portal/bookings",
  useSearchParams: () => new URLSearchParams("token=test-token"),
}));

vi.mock("@/hooks/use-portal-auth", () => ({
  usePortalAuth: () => mockAuth,
}));

// ─── Tests ────────────────────────────────────────────────────

describe("PortalBookingsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockAuth = {
      customer: { id: "1", name: "Test Customer" },
      loading: false,
      token: "test-token",
      error: null,
    };
  });

  it("shows loading skeleton when auth or data loading", () => {
    mockAuth = {
      customer: null,
      loading: true,
      token: null,
      error: null,
    };
    render(<PortalBookingsPage />);
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    // Empty state should not appear
    expect(screen.queryByText("No bookings")).not.toBeInTheDocument();
  });

  it("renders booking list with correct info", async () => {
    mockAuth = {
      customer: { id: "1" },
      loading: false,
      token: "test-token",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleBookings }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalBookingsPage />);

    // Vehicle plate numbers
    expect(await screen.findByText("001УНА")).toBeInTheDocument();
    expect(screen.getByText("005УНА")).toBeInTheDocument();
    expect(screen.getByText("010УНА")).toBeInTheDocument();
    expect(screen.getByText("015УНА")).toBeInTheDocument();

    // Service descriptions
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Brake Inspection")).toBeInTheDocument();
    expect(screen.getByText("Full Service")).toBeInTheDocument();
    expect(screen.getByText("Tire Change")).toBeInTheDocument();

    // Time slots
    expect(screen.getByText("09:00-10:00")).toBeInTheDocument();
    expect(screen.getByText("14:00-15:00")).toBeInTheDocument();
    expect(screen.getByText("10:00-11:00")).toBeInTheDocument();
    expect(screen.getByText("08:00-09:00")).toBeInTheDocument();
  });

  it("shows status badges with correct labels", async () => {
    mockAuth = {
      customer: { id: "1" },
      loading: false,
      token: "test-token",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleBookings }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalBookingsPage />);

    // All four status labels appear
    expect(await screen.findByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("shows empty state when no bookings", async () => {
    mockAuth = {
      customer: { id: "1" },
      loading: false,
      token: "test-token",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalBookingsPage />);

    expect(await screen.findByText("No bookings")).toBeInTheDocument();
    expect(screen.getByTestId("calendar")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
  });

  it("shows error state with retry button", async () => {
    mockAuth = {
      customer: { id: "1" },
      loading: false,
      token: "test-token",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );
    render(<PortalBookingsPage />);

    // Error state appears
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Failed to load bookings")).toBeInTheDocument();

    // Retry button is present
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("shows vehicle plate per booking", async () => {
    mockAuth = {
      customer: { id: "1" },
      loading: false,
      token: "test-token",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleBookings }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalBookingsPage />);

    // Each booking has its vehicle plate displayed
    await screen.findByText("001УНА");
    expect(screen.getByText("001УНА")).toBeInTheDocument();
    expect(screen.getByText("005УНА")).toBeInTheDocument();
    expect(screen.getByText("010УНА")).toBeInTheDocument();
    expect(screen.getByText("015УНА")).toBeInTheDocument();
  });
});
