import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import PortalWorkOrdersPage from "../page";

// ─── Sample data ──────────────────────────────────────────────

const sampleWorkOrders = [
  {
    id: "wo-1",
    status: "Completed",
    description: "Oil change and filter replacement",
    total: 150000,
    created_at: "2025-01-15T10:00:00Z",
    vehicle: {
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
    },
  },
  {
    id: "wo-2",
    status: "In Progress",
    description: "Brake inspection and repair",
    total: 85000,
    created_at: "2025-01-16T14:30:00Z",
    vehicle: {
      plate_number: "XYZ789",
      make: "Honda",
      model: "Civic",
    },
  },
  {
    id: "wo-3",
    status: "New",
    description: "Tire rotation",
    total: 0,
    created_at: "2025-01-17T09:00:00Z",
    vehicle: {
      plate_number: "DEF456",
      make: "Mazda",
      model: "CX-5",
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
  customer: { id: "c1" },
  loading: false,
  token: "tok-1",
  error: null,
};

// ─── Module mocks (hoisted to top by Vitest) ──────────────────

vi.mock(import("next-intl"), async (importOriginal) => {
  const mod = await importOriginal();
  const map: Record<string, string> = {
    "portal.workOrders": "Work Orders",
    "portal.noWorkOrders": "No work orders yet",
    "portal.failedToLoadWorkOrders": "Failed to load work orders.",
    "portal.failedToLoad": "Failed to load data",
    "portal.noDescription": "No description",
    "common.somethingWentWrong": "Something went wrong",
    "common.retry": "Retry",
    // PageErrorState uses useTranslations("common") which scopes to the common ns
    somethingWentWrong: "Something went wrong",
    retry: "Retry",
  };
  return {
    ...mod,
    useTranslations: () => (key: string) => map[key] ?? key,
  };
});

vi.mock("lucide-react", () => ({
  AlertCircle: () => <svg data-testid="icon-alert-circle" />,
  ArrowRight: () => <svg data-testid="icon-arrow-right" />,
  ClipboardList: () => <svg data-testid="icon-clipboard-list" />,
  RefreshCw: () => <svg data-testid="icon-refresh-cw" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/portal/work-orders",
  useSearchParams: () => new URLSearchParams("token=tok-1"),
}));

vi.mock("@/hooks/use-portal-auth", () => ({
  usePortalAuth: () => mockAuth,
}));

// ─── Tests ────────────────────────────────────────────────────

describe("PortalWorkOrdersPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
  });

  // ── 1. Shows loading skeleton ──────────────────────────────

  it("shows loading skeleton when auth loading", () => {
    mockAuth = {
      customer: null,
      loading: true,
      token: null,
      error: null,
    };
    render(<PortalWorkOrdersPage />);
    expect(screen.getByText("Work Orders")).toBeInTheDocument();
    expect(screen.queryByText("No work orders yet")).not.toBeInTheDocument();
  });

  it("shows loading skeleton when data loading", () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    // Return a promise that never resolves so isLoading stays true
    vi.spyOn(global, "fetch").mockReturnValue(new Promise<Response>(() => {}));
    render(<PortalWorkOrdersPage />);
    expect(screen.getByText("Work Orders")).toBeInTheDocument();
    expect(screen.queryByText("No work orders yet")).not.toBeInTheDocument();
  });

  // ── 2. Renders work order list with correct info ─────────

  it("renders work order list with plate, status, and amount", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleWorkOrders }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalWorkOrdersPage />);

    // First WO: plate, status, description
    expect(await screen.findByText(/ABC123/)).toBeInTheDocument();
    expect(screen.getByText(/Toyota/)).toBeInTheDocument();
    expect(screen.getByText(/Camry/)).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(
      screen.getByText("Oil change and filter replacement"),
    ).toBeInTheDocument();

    // Second WO
    expect(screen.getByText(/XYZ789/)).toBeInTheDocument();
    expect(screen.getByText(/Honda/)).toBeInTheDocument();
    expect(screen.getByText(/Civic/)).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();

    // Third WO
    expect(screen.getByText(/DEF456/)).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();

    // ArrowRight icons rendered
    const arrowIcons = screen.getAllByTestId("icon-arrow-right");
    expect(arrowIcons).toHaveLength(3);
  });

  // ── 3. Shows correct status badge colors ──────────────────

  it("shows correct status badge combinations", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    const statusSamples = [
      {
        id: "wo-a",
        status: "Completed",
        description: "Done",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
        vehicle: { plate_number: "A1", make: "A", model: "A" },
      },
      {
        id: "wo-b",
        status: "In Progress",
        description: "WIP",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
        vehicle: { plate_number: "B1", make: "B", model: "B" },
      },
      {
        id: "wo-c",
        status: "Diagnosing",
        description: "Diag",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
        vehicle: { plate_number: "C1", make: "C", model: "C" },
      },
      {
        id: "wo-d",
        status: "New",
        description: "New order",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
        vehicle: { plate_number: "D1", make: "D", model: "D" },
      },
      {
        id: "wo-e",
        status: "Ready for Pickup",
        description: "Rdy",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
        vehicle: { plate_number: "E1", make: "E", model: "E" },
      },
      {
        id: "wo-f",
        status: "Cancelled",
        description: "X",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
        vehicle: { plate_number: "F1", make: "F", model: "F" },
      },
    ];
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: statusSamples }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalWorkOrdersPage />);

    // Each status should be rendered as a badge
    expect(await screen.findByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Diagnosing")).toBeInTheDocument();
    expect(screen.getByText("Ready for Pickup")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();

    // "New" appears both as badge and description text
    const newElements = screen.getAllByText("New");
    expect(newElements.length).toBeGreaterThanOrEqual(1);

    // All 6 status badges exist (one per WO)
    const allBadges = screen.getAllByText(
      /Completed|In Progress|Diagnosing|New|Ready for Pickup|Cancelled/,
    );
    expect(allBadges.length).toBeGreaterThanOrEqual(6);
  });

  // ── 4. Shows empty state ─────────────────────────────────

  it("shows empty state when no work orders", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalWorkOrdersPage />);

    expect(await screen.findByText("No work orders yet")).toBeInTheDocument();
    expect(screen.getByTestId("icon-clipboard-list")).toBeInTheDocument();
  });

  // ── 5. Error state with retry ────────────────────────────

  it("shows error state with retry button", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );
    render(<PortalWorkOrdersPage />);

    expect(await screen.findByText("Failed to load data")).toBeInTheDocument();
    expect(screen.getByText("Failed to load work orders.")).toBeInTheDocument();

    // Switch fetch to succeed for retry
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleWorkOrders }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText(/ABC123/)).toBeInTheDocument();
    expect(screen.queryByText("Failed to load data")).not.toBeInTheDocument();
  });

  // ── 6. Links to detail page ──────────────────────────────

  it("each work order links to detail page", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleWorkOrders }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalWorkOrdersPage />);

    await screen.findByText(/ABC123/);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/portal/work-orders/wo-1");
    expect(links[1]).toHaveAttribute("href", "/portal/work-orders/wo-2");
    expect(links[2]).toHaveAttribute("href", "/portal/work-orders/wo-3");
  });

  // ── 7. Shows amount formatted with ₮ ─────────────────────

  it("shows amount formatted with ₮", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleWorkOrders }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalWorkOrdersPage />);

    await screen.findByText(/ABC123/);

    // formatMNT(150000) => "₮ 150,000"
    const amounts = screen.getAllByText(/₮/);
    expect(amounts.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/₮ 0/)).toBeInTheDocument();
    expect(screen.getByText(/₮ 85,000/)).toBeInTheDocument();
    expect(screen.getByText(/₮ 150,000/)).toBeInTheDocument();
  });

  // ── 8. Shows vehicle plate for each WO ───────────────────

  it("shows vehicle plate for each work order", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleWorkOrders }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalWorkOrdersPage />);

    expect(await screen.findByText(/ABC123/)).toBeInTheDocument();
    expect(screen.getByText(/ABC123/)).toBeInTheDocument();
    expect(screen.getByText(/XYZ789/)).toBeInTheDocument();
    expect(screen.getByText(/DEF456/)).toBeInTheDocument();
  });
});
