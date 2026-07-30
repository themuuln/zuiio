import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import PortalInspectionsPage from "../page";

// ─── Sample data ──────────────────────────────────────────────

const sampleInspections = [
  {
    id: "1",
    status: "sent",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
    odometer: 50000,
    vehicle: {
      id: "v1",
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
      year: 2020,
    },
    item_count: 5,
  },
  {
    id: "2",
    status: "approved",
    created_at: "2025-02-20T14:30:00Z",
    updated_at: "2025-02-20T14:30:00Z",
    odometer: null,
    vehicle: null,
    item_count: 2,
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
    "portal.inspections": "Inspections",
    "portal.noInspections": "No inspections",
    "portal.failedToLoadInspections": "Failed to load inspections",
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
  ChevronRight: () => <svg data-testid="chevron-right" />,
  ClipboardList: () => <svg data-testid="clipboard-list" />,
  RefreshCw: () => <svg data-testid="refresh-cw" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/portal/inspections",
  useSearchParams: () => new URLSearchParams("token=test-token"),
}));

vi.mock("@/hooks/use-portal-auth", () => ({
  usePortalAuth: () => mockAuth,
}));

// ─── Tests ────────────────────────────────────────────────────

describe("PortalInspectionsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockAuth = {
      customer: { id: "1", name: "Test Customer" },
      loading: false,
      token: "test-token",
      error: null,
    };
  });

  it("shows loading skeleton when auth loading", () => {
    mockAuth = {
      customer: null,
      loading: true,
      token: null,
      error: null,
    };
    render(<PortalInspectionsPage />);
    expect(screen.getByText("Inspections")).toBeInTheDocument();
    // Empty state should not appear
    expect(screen.queryByText("No inspections")).not.toBeInTheDocument();
  });

  it("shows loading skeleton when data loading", () => {
    mockAuth = {
      customer: { id: "1" },
      loading: false,
      token: "test-token",
      error: null,
    };
    // Fetch returns a promise that never resolves → isPending stays true
    vi.spyOn(global, "fetch").mockReturnValue(new Promise<Response>(() => {}));
    render(<PortalInspectionsPage />);
    expect(screen.getByText("Inspections")).toBeInTheDocument();
  });

  it("renders list of inspections with correct info", async () => {
    mockAuth = {
      customer: { id: "1" },
      loading: false,
      token: "test-token",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleInspections }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalInspectionsPage />);

    // Vehicle info — first inspection has full vehicle data
    expect(await screen.findByText(/ABC123/)).toBeInTheDocument();
    expect(screen.getByText(/Toyota/)).toBeInTheDocument();
    expect(screen.getByText(/Camry/)).toBeInTheDocument();

    // Second inspection has no vehicle — shows em dash
    expect(screen.getByText("—")).toBeInTheDocument();

    // Status badges
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();

    // Item counts
    expect(screen.getByText(/5 items/)).toBeInTheDocument();
    expect(screen.getByText(/2 items/)).toBeInTheDocument();

    // Odometer (only on first inspection)
    expect(screen.getByText(/km/)).toBeInTheDocument();
  });

  it("shows empty state when no inspections", async () => {
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
    render(<PortalInspectionsPage />);

    expect(await screen.findByText("No inspections")).toBeInTheDocument();
    expect(screen.getByTestId("clipboard-list")).toBeInTheDocument();
    expect(screen.getByText("Inspections")).toBeInTheDocument();
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
    render(<PortalInspectionsPage />);

    // Error state appears
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Failed to load inspections")).toBeInTheDocument();

    // Switch fetch to success for retry
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleInspections }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    // Refetch succeeds and renders the list
    expect(await screen.findByText(/ABC123/)).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("each inspection links to detail page", async () => {
    mockAuth = {
      customer: { id: "1" },
      loading: false,
      token: "test-token",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleInspections }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalInspectionsPage />);

    await screen.findByText(/ABC123/);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/portal/inspections/1");
    expect(links[1]).toHaveAttribute("href", "/portal/inspections/2");
  });
});
