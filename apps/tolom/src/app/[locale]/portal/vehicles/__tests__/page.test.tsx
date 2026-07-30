import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import PortalVehiclesPage from "../page";

// ─── Sample data ──────────────────────────────────────────────

const sampleVehicles = [
  {
    id: "v1",
    plate_number: "ABC123",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    color: "Silver",
  },
  {
    id: "v2",
    plate_number: "XYZ789",
    make: "Honda",
    model: "Civic",
    year: 2021,
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
    "portal.myVehicles": "My Vehicles",
    "portal.vehiclesDesc": "Browse your registered vehicles",
    "portal.noVehicles": "No vehicles registered",
    "portal.failedToLoadVehicles": "Failed to load vehicles",
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
  Car: () => <svg data-testid="icon-car" />,
  RefreshCw: () => <svg data-testid="icon-refresh-cw" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/portal/vehicles",
  useSearchParams: () => new URLSearchParams("token=tok-1"),
}));

vi.mock("@/hooks/use-portal-auth", () => ({
  usePortalAuth: () => mockAuth,
}));

// ─── Tests ────────────────────────────────────────────────────

describe("PortalVehiclesPage", () => {
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
    render(<PortalVehiclesPage />);
    expect(screen.getByText("My Vehicles")).toBeInTheDocument();
    // Skeleton title is shown; empty state should not appear
    expect(
      screen.queryByText("No vehicles registered"),
    ).not.toBeInTheDocument();
  });

  it("shows loading skeleton when data loading", () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    // Return a promise that never resolves so isPending stays true
    vi.spyOn(global, "fetch").mockReturnValue(new Promise<Response>(() => {}));
    render(<PortalVehiclesPage />);
    expect(screen.getByText("My Vehicles")).toBeInTheDocument();
    expect(
      screen.queryByText("No vehicles registered"),
    ).not.toBeInTheDocument();
  });

  // ── 2. Renders vehicle list with plate and brand ──────────

  it("renders vehicle list with plate and brand", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleVehicles }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalVehiclesPage />);

    // First vehicle: plate, brand, model, year
    expect(await screen.findByText(/ABC123/)).toBeInTheDocument();
    expect(screen.getByText(/Toyota/)).toBeInTheDocument();
    expect(screen.getByText(/Camry/)).toBeInTheDocument();
    expect(screen.getByText(/\(2020\)/)).toBeInTheDocument();

    // Second vehicle
    expect(screen.getByText(/XYZ789/)).toBeInTheDocument();
    expect(screen.getByText(/Honda/)).toBeInTheDocument();
    expect(screen.getByText(/Civic/)).toBeInTheDocument();

    // Icons rendered
    const carIcons = screen.getAllByTestId("icon-car");
    expect(carIcons).toHaveLength(2);
  });

  // ── 3. Shows empty state ─────────────────────────────────

  it("shows empty state when no vehicles", async () => {
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
    render(<PortalVehiclesPage />);

    expect(
      await screen.findByText("No vehicles registered"),
    ).toBeInTheDocument();
    // Car icon in empty state
    expect(screen.getByTestId("icon-car")).toBeInTheDocument();
  });

  // ── 4. Error state with retry ────────────────────────────

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
    render(<PortalVehiclesPage />);

    // Error title from PageErrorState
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    // Error description from the thrown error
    expect(screen.getByText("Failed to load vehicles")).toBeInTheDocument();

    // Switch fetch to succeed for retry
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleVehicles }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    // After retry, the list should render
    expect(await screen.findByText(/ABC123/)).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  // ── 5. Each vehicle links to detail page ─────────────────

  it("each vehicle links to detail page", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleVehicles }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalVehiclesPage />);

    await screen.findByText(/ABC123/);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/portal/vehicles/v1");
    expect(links[1]).toHaveAttribute("href", "/portal/vehicles/v2");
  });
});
