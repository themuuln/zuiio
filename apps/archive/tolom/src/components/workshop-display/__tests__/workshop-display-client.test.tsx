import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { WorkshopDisplayClient } from "../workshop-display-client";

// ── Mock state ─────────────────────────────────────────────────────────
const hooks = vi.hoisted(() => ({
  data: null as Array<Record<string, unknown>> | null,
  pending: false,
  error: null as Error | null,
  playReady: vi.fn(),
}));

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" }, isPending: false }),
}));

vi.mock("@/lib/queries/use-workshop-display", () => ({
  useWorkshopDisplay: () => ({
    data: hooks.data,
    isPending: hooks.pending,
    error: hooks.error,
  }),
}));

vi.mock("@/lib/hooks/use-realtime-multi", () => ({
  useRealtimeMulti: () => {},
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-08-09T12:00:00Z"),
}));

vi.mock("@/lib/workshop-display/ready-notification", () => ({
  playReadyNotification: hooks.playReady,
}));

vi.mock("@/components/workshop-display/work-order-card", () => ({
  WorkOrderCard: ({
    workOrder,
  }: {
    workOrder: { plate_number: string | null };
  }) => <div data-testid="wo-card">{workOrder.plate_number ?? "—"}</div>,
}));

// ── Fixtures ───────────────────────────────────────────────────────────

const WO = {
  id: "wo-1",
  status: "In Progress",
  created_at: "2026-08-09T08:00:00Z",
  started_at: "2026-08-09T08:30:00Z",
  status_changed_at: "2026-08-09T08:30:00Z",
  customer_name: "John Doe",
  plate_number: "1234ABC",
  vehicle_make: "Toyota",
  vehicle_model: "Camry",
  mechanic_name: "Jane Smith",
  services: [{ name: "Oil change" }],
  complaint: "Engine noise",
};

// ── Tests ──────────────────────────────────────────────────────────────

describe("WorkshopDisplayClient", () => {
  beforeEach(() => {
    hooks.data = null;
    hooks.pending = false;
    hooks.error = null;
    hooks.playReady.mockReset();
  });

  it("shows a loading state while pending", () => {
    hooks.pending = true;
    render(<WorkshopDisplayClient />);
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("shows the error message when loading fails", () => {
    hooks.error = new Error("display fetch failed");
    render(<WorkshopDisplayClient />);
    expect(screen.getByText("common.somethingWentWrong")).toBeInTheDocument();
    expect(screen.getByText("display fetch failed")).toBeInTheDocument();
  });

  it("shows an empty state when there are no active orders", () => {
    hooks.data = [];
    render(<WorkshopDisplayClient />);
    expect(
      screen.getByText("workshopDisplay.noActiveOrders"),
    ).toBeInTheDocument();
    expect(screen.getByText(/0\s*workshopDisplay\.total/)).toBeInTheDocument();
  });

  it("renders status counts, totals and work order cards", () => {
    hooks.data = [WO];
    render(<WorkshopDisplayClient />);

    expect(screen.getByText("workshopDisplay.title")).toBeInTheDocument();
    // Status pill with count
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/1\s*workshopDisplay\.total/)).toBeInTheDocument();
    // Card renders the plate number
    expect(screen.getByTestId("wo-card")).toHaveTextContent("1234ABC");
  });

  it("plays the ready notification when an order transitions to Ready for Pickup", () => {
    const { rerender } = render(<WorkshopDisplayClient />);
    hooks.data = [{ ...WO, status: "In Progress" }];
    rerender(<WorkshopDisplayClient />);
    expect(hooks.playReady).not.toHaveBeenCalled();

    hooks.data = [{ ...WO, status: "Ready for Pickup" }];
    rerender(<WorkshopDisplayClient />);
    expect(hooks.playReady).toHaveBeenCalledTimes(1);

    // No re-notification when already Ready
    rerender(<WorkshopDisplayClient />);
    expect(hooks.playReady).toHaveBeenCalledTimes(1);
  });
});
