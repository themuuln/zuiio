import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortalInspectionDetailPage from "../page";

// ── Test data factories ─────────────────────────────────

function createItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "item-1",
    inspection_id: "insp-1",
    category: "exterior",
    item_name: "Front bumper",
    condition: "fair",
    severity: "minor",
    estimated_cost: 250000,
    customer_approved: null,
    has_photo: true,
    photo_urls: null,
    technician_notes: "Scratches on left corner",
    sort_order: 1,
    measurement_value: null,
    measurement_unit: null,
    created_at: "2025-01-15T10:00:00Z",
    ...overrides,
  } as const;
}

function createInspection(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "insp-1",
    status: "sent",
    vehicle_id: "veh-1",
    odometer: 50000,
    fuel_level: "half",
    technician_notes: "Customer reported unusual noise",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:30:00Z",
    vehicle: {
      id: "veh-1",
      plate_number: "1234ABC",
      make: "Toyota",
      model: "Camry",
      year: 2020,
      color: "Silver",
      vin: "JT2BF22KX01000001",
      odometer: 50000,
    },
    items: [
      createItem(),
      createItem({
        id: "item-2",
        item_name: "Windshield",
        condition: "good",
        severity: null,
        estimated_cost: null,
        customer_approved: true,
        has_photo: false,
        technician_notes: null,
      }),
      createItem({
        id: "item-3",
        category: "under_hood",
        item_name: "Oil level",
        condition: null,
        severity: null,
        estimated_cost: null,
        customer_approved: false,
        has_photo: false,
        technician_notes: null,
      }),
    ],
    estimated_total_cost: 250000,
    ...overrides,
  };
}

// ── Hoisted mocks ───────────────────────────────────────

const toastMock = vi.hoisted(() => {
  const fn = vi.fn() as unknown as typeof import("sonner").toast;
  fn.success = vi.fn();
  fn.error = vi.fn();
  return fn;
});

// ── Module mocks ────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "test-inspection-id" }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/portal/inspections/test-inspection-id",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const labels: Record<string, string> = {
      "portal.inspectionDetail": "Inspection Detail",
      "portal.inspections": "Inspections",
      "portal.totalEstimatedCost": "Est. Total Cost",
      "portal.itemsToReview": "Items to Review",
      "portal.approveAll": "Approve All",
      "portal.declineAll": "Decline All",
      "portal.noItemsToReview": "No items to review",
      "portal.approvedItems": "Approved",
      "portal.declinedItems": "Declined",
      "common.approve": "Approve",
      "common.decline": "Decline",
      "common.notes": "Notes",
      "common.retry": "Retry",
      "common.somethingWentWrong": "Something went wrong",
      "common.pageNotFound": "Page not found",
      "common.pageNotFoundDescription": "Page not found",
      "portal.failedToLoadInspections": "Failed to load inspections",
      "portal.failedToApprove": "Failed to approve items",
      "portal.itemsApproved": "Items approved successfully",
      "portal.itemsDeclined": "Items declined successfully",
    };
    return (key: string) => labels[key] ?? key;
  },
}));

vi.mock("@/hooks/use-portal-auth", () => ({
  usePortalAuth: () => ({
    customer: {
      id: "customer-1",
      first_name: "Test",
      last_name: "User",
      full_name: "Test User",
      phone: "+97699111111",
      email: "test@example.com",
      portal_token: "test-token",
      organization_id: "org-1",
      total_visits: 5,
      last_visit_at: "2025-01-01T00:00:00Z",
    },
    loading: false,
    token: "test-token",
    error: null,
  }),
}));

vi.mock("lucide-react", () => ({
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  Check: () => <span data-testid="icon-check" />,
  CheckCheck: () => <span data-testid="icon-check-check" />,
  ClipboardList: () => <span data-testid="icon-clipboard-list" />,
  FileSearch: () => <span data-testid="icon-file-search" />,
  RefreshCw: () => <span data-testid="icon-refresh-cw" />,
  X: () => <span data-testid="icon-x" />,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
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

describe("PortalInspectionDetailPage", () => {
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
    render(<PortalInspectionDetailPage />, { wrapper: createQueryWrapper() });

    expect(screen.getByText("Inspection Detail")).toBeInTheDocument();
  });

  // ── 2. Error state ────────────────────────────────────

  it("shows error state with retry button on fetch failure", async () => {
    fetchSpy.mockRejectedValue(new Error("Failed to load inspections"));
    render(<PortalInspectionDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load inspections"),
      ).toBeInTheDocument();
    });

    // Retry button should be present
    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  // ── 3. Renders inspection with items grouped by category ──

  it("renders inspection detail with vehicle info, status, and items grouped by category", async () => {
    const inspection = createInspection();
    fetchSpy.mockImplementation(() => mockFetchSuccess(inspection));
    render(<PortalInspectionDetailPage />, { wrapper: createQueryWrapper() });

    // Wait for vehicle info to appear
    await waitFor(() => {
      expect(screen.getByText(/1234ABC/)).toBeInTheDocument();
    });

    // Vehicle info rendered
    expect(screen.getByText(/Toyota/)).toBeInTheDocument();
    expect(screen.getByText(/Camry/)).toBeInTheDocument();

    // Status badge
    expect(screen.getByText("Sent")).toBeInTheDocument();

    // Odometer shown
    expect(screen.getByText(/km/)).toBeInTheDocument();

    // Category groups rendered
    expect(screen.getByText("Exterior")).toBeInTheDocument();
    expect(screen.getByText("Under Hood")).toBeInTheDocument();

    // Item names rendered
    expect(screen.getByText("Front bumper")).toBeInTheDocument();
    expect(screen.getByText("Windshield")).toBeInTheDocument();
    expect(screen.getByText("Oil level")).toBeInTheDocument();

    // Technician notes rendered
    expect(
      screen.getByText("Customer reported unusual noise"),
    ).toBeInTheDocument();
  });

  // ── 4. Shows approve/decline buttons for pending items ──

  it("shows Approve and Decline buttons for pending items", async () => {
    const inspection = createInspection({
      items: [
        createItem({
          id: "item-1",
          item_name: "Brake pads",
          customer_approved: null,
        }),
      ],
    });
    fetchSpy.mockImplementation(() => mockFetchSuccess(inspection));
    render(<PortalInspectionDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Brake pads")).toBeInTheDocument();
    });

    // Pending item shows individual Approve / Decline buttons
    const approveButtons = screen.getAllByRole("button", { name: /^Approve$/ });
    expect(approveButtons.length).toBeGreaterThanOrEqual(1);

    const declineButtons = screen.getAllByRole("button", { name: /^Decline$/ });
    expect(declineButtons.length).toBeGreaterThanOrEqual(1);
  });

  // ── 5. Shows approved/declined items correctly ─────────

  it("shows approved items with green accent and declined items with red accent", async () => {
    const inspection = createInspection({
      items: [
        createItem({
          id: "item-1",
          item_name: "Front bumper",
          customer_approved: true,
        }),
        createItem({
          id: "item-2",
          item_name: "Rear bumper",
          customer_approved: false,
        }),
      ],
    });
    fetchSpy.mockImplementation(() => mockFetchSuccess(inspection));
    render(<PortalInspectionDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Front bumper")).toBeInTheDocument();
    });

    // Approved item — rendered with green icon (Check)
    const approvedText = screen.getByText("Front bumper");
    // Should be rendered inside an element with green-700 class (ApprovedItemRow)
    expect(approvedText.className).toContain("text-green-700");

    // Declined item — rendered with red icon (X)
    const declinedText = screen.getByText("Rear bumper");
    expect(declinedText.className).toContain("text-red-700");
  });

  // ── 6. Approve All button calls mutation ──────────────

  it("calls approve mutation when Approve All button is clicked", async () => {
    const pendingItem = createItem({
      id: "pending-1",
      item_name: "Test item",
      customer_approved: null,
    });
    const inspection = createInspection({ items: [pendingItem] });

    fetchSpy.mockImplementation((url: string) => {
      const urlStr = typeof url === "string" ? url : String(url);
      if (urlStr.includes("/approve")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: { updated_count: 1, status: "approved" },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }
      return mockFetchSuccess(inspection);
    });

    const user = userEvent.setup();
    render(<PortalInspectionDetailPage />, { wrapper: createQueryWrapper() });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("Test item")).toBeInTheDocument();
    });

    // Click Approve All
    await user.click(screen.getByRole("button", { name: /Approve All/ }));

    // Verify the approve fetch was called with correct body
    await waitFor(() => {
      const approveCalls = fetchSpy.mock.calls.filter(
        ([url]) => typeof url === "string" && url.includes("/approve"),
      );
      expect(approveCalls).toHaveLength(1);
      const [_, options] = approveCalls[0];
      const body = JSON.parse(options?.body as string);
      expect(body).toEqual({ item_ids: ["pending-1"], approved: true });
    });

    // Verify success toast
    expect(toastMock.success).toHaveBeenCalledWith(
      "Items approved successfully",
    );
  });

  // ── 7. Decline All button calls mutation ──────────────

  it("calls decline mutation when Decline All button is clicked", async () => {
    const pendingItem = createItem({
      id: "pending-2",
      item_name: "Failing part",
      customer_approved: null,
    });
    const inspection = createInspection({ items: [pendingItem] });

    fetchSpy.mockImplementation((url: string) => {
      const urlStr = typeof url === "string" ? url : String(url);
      if (urlStr.includes("/approve")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: { updated_count: 1, status: "declined" },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }
      return mockFetchSuccess(inspection);
    });

    const user = userEvent.setup();
    render(<PortalInspectionDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Failing part")).toBeInTheDocument();
    });

    // Click Decline All
    await user.click(screen.getByRole("button", { name: /Decline All/ }));

    await waitFor(() => {
      const approveCalls = fetchSpy.mock.calls.filter(
        ([url]) => typeof url === "string" && url.includes("/approve"),
      );
      expect(approveCalls).toHaveLength(1);
      const [_, options] = approveCalls[0];
      const body = JSON.parse(options?.body as string);
      expect(body).toEqual({ item_ids: ["pending-2"], approved: false });
    });

    // Verify decline toast
    expect(toastMock.success).toHaveBeenCalledWith(
      "Items declined successfully",
    );
  });

  // ── 8. Empty items state ──────────────────────────────

  it("shows empty message when inspection has no items", async () => {
    const inspection = createInspection({ items: [] });
    fetchSpy.mockImplementation(() => mockFetchSuccess(inspection));
    render(<PortalInspectionDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("No items to review")).toBeInTheDocument();
    });

    // Approve All / Decline All should not be present
    expect(
      screen.queryByRole("button", { name: /Approve All/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Decline All/ }),
    ).not.toBeInTheDocument();
  });

  // ── 9. Not found (404) state ──────────────────────────

  it("shows not found page when inspection returns 404", async () => {
    fetchSpy.mockResolvedValue(
      new Response(null, {
        status: 404,
        statusText: "Not Found",
      }),
    );
    render(<PortalInspectionDetailPage />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Page not found")).toBeInTheDocument();
    });
  });
});
