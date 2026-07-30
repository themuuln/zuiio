import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DviDashboardWidget } from "@/components/dvi/dvi-dashboard-widget";
import { render } from "@/test/test-utils";

// ── Hook Mocks ──────────────────────────────────────────────────

const mockUseCurrentOrg = vi.hoisted(() => vi.fn());
const mockUseDVInspections = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: mockUseCurrentOrg,
}));

vi.mock("@/lib/queries/use-dvi", () => ({
  useDVInspections: mockUseDVInspections,
}));

// ── Fixtures ────────────────────────────────────────────────────

function todayIso(): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

const mockInspections = [
  {
    id: "dvi-1",
    organization_id: "org-1",
    status: "draft" as const,
    created_at: "2026-07-28T10:00:00Z",
    updated_at: "2026-07-28T10:00:00Z",
  },
  {
    id: "dvi-2",
    organization_id: "org-1",
    status: "approved" as const,
    created_at: "2026-07-29T10:00:00Z",
    updated_at: todayIso(),
  },
  {
    id: "dvi-3",
    organization_id: "org-1",
    status: "approved" as const,
    created_at: "2026-07-29T11:00:00Z",
    updated_at: todayIso(),
  },
];

const messages = {
  dvi: {
    title: "DVI",
    status: {
      draft: "Draft",
      approved: "Approved Today",
    },
  },
};

// ── Tests ───────────────────────────────────────────────────────

describe("DviDashboardWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentOrg.mockReturnValue({
      data: { orgId: "org-1", orgName: "Test Org", branchId: null },
      isPending: false,
      isLoading: false,
      error: null,
    } as unknown);
  });

  it("shows inline skeleton while loading", () => {
    mockUseDVInspections.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    } as unknown);

    const { container } = render(<DviDashboardWidget />, { messages });
    expect(screen.getByText("DVI")).toBeInTheDocument();

    // StatCard label text is rendered even while loading
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Approved Today")).toBeInTheDocument();
    expect(screen.getByText("Conversion Rate")).toBeInTheDocument();

    // Skeleton elements should be present (not numeric values)
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("renders stat cards with inspection data", () => {
    mockUseDVInspections.mockReturnValue({
      data: mockInspections,
      isPending: false,
      error: null,
    } as unknown);

    render(<DviDashboardWidget />, { messages });

    // 1 draft → pending = 1
    expect(screen.getByText("1")).toBeInTheDocument();
    // 2 approved today (today) → approvedToday = 2
    expect(screen.getByText("2")).toBeInTheDocument();
    // sent=2 approved=2 → 100%
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders zero state when there are no inspections", () => {
    mockUseDVInspections.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    } as unknown);

    render(<DviDashboardWidget />, { messages });

    // All stats should be zero
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders without crashing when org data is not available", () => {
    mockUseCurrentOrg.mockReturnValue({
      data: null,
      isPending: false,
    } as unknown);

    // useDVInspections should not be called when orgId is null
    // but the widget still renders the shell
    render(<DviDashboardWidget />, { messages });
    expect(screen.getByText("DVI")).toBeInTheDocument();
  });
});
