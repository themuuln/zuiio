import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ExportColumn } from "@/lib/export";
import type { WorkOrderDetail } from "@/lib/types";
import { render } from "@/test/test-utils";
import { RecentWorkOrdersTable } from "./_recent-work-orders";

vi.mock("@/components/export-button", () => ({
  ExportButton: ({ label }: { label: string }) => (
    <div data-testid="export-button">{label}</div>
  ),
}));
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="status-badge">{children}</span>
  ),
}));
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));
vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-07-22T12:00:00Z"),
}));

const t = (key: string) =>
  (
    ({
      "workOrders.id": "ID",
      "workOrders.customer": "Customer",
      "workOrders.vehicle": "Vehicle",
      "workOrders.status": "Status",
      "workOrders.total": "Total",
      "workOrders.date": "Date",
      "dashboard.noWorkOrders": "No work orders yet",
      "dashboard.recentWorkOrders": "Recent Work Orders",
      "common.export": "Export",
    }) as Record<string, string>
  )[key] ?? key;

function makeWorkOrder(overrides?: Partial<WorkOrderDetail>): WorkOrderDetail {
  return {
    id: "wo-abc12345",
    organization_id: "org-1",
    branch_id: null,
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    mechanic_id: null,
    status: "In Progress",
    complaint: null,
    diagnosis: null,
    description: null,
    notes: null,
    mechanic_notes: null,
    diagnosis_label_id: null,
    bay_number: null,
    queue_order: 0,
    odometer_at_service: null,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    subtotal: 0,
    total: 0,
    loss_reason: null,
    completed_at: null,
    started_at: null,
    created_at: "2026-07-22T08:00:00Z",
    updated_at: "2026-07-22T08:00:00Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    customer: {
      id: "cust-1",
      organization_id: "org-1",
      type: "individual",
      first_name: "John",
      last_name: "Doe",
      phone: null,
      email: null,
      address: null,
      source: null,
      notes: null,
      deleted_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      national_id: null,
      license_number: null,
      id_card_photo_url: null,
    },
    vehicle: {
      id: "veh-1",
      organization_id: "org-1",
      plate_number: "ABC-123",
      vin: null,
      make: "Toyota",
      model: "Camry",
      year: 2020,
      color: null,
      engine_number: null,
      engine_type: null,
      transmission: null,
      fuel_type: null,
      note: null,
      deleted_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    mechanic: null,
    helpers: [],
    services: [{ final_price: 50000 }] as WorkOrderDetail["services"],
    parts: [{ final_price: 30000 }] as WorkOrderDetail["parts"],
    status_history: [],
    service_history: [],
    ...overrides,
  } as WorkOrderDetail;
}

const pushSpy = vi.fn();
const defaultRouter = { push: pushSpy };
const emptyExportColumns: ExportColumn<WorkOrderDetail>[] = [];

describe("RecentWorkOrdersTable", () => {
  beforeEach(() => {
    pushSpy.mockClear();
  });

  it("shows empty state when workOrders is null", () => {
    render(
      <RecentWorkOrdersTable
        workOrders={null}
        router={defaultRouter}
        t={t}
        workOrdersForExport={emptyExportColumns}
      />,
    );
    expect(screen.getByText("No work orders yet")).toBeInTheDocument();
  });

  it("shows empty state when workOrders is undefined", () => {
    render(
      <RecentWorkOrdersTable
        workOrders={undefined}
        router={defaultRouter}
        t={t}
        workOrdersForExport={emptyExportColumns}
      />,
    );
    expect(screen.getByText("No work orders yet")).toBeInTheDocument();
  });

  it("shows empty state when workOrders is an empty array", () => {
    render(
      <RecentWorkOrdersTable
        workOrders={[]}
        router={defaultRouter}
        t={t}
        workOrdersForExport={emptyExportColumns}
      />,
    );
    expect(screen.getByText("No work orders yet")).toBeInTheDocument();
  });

  it("renders work order rows with customer name and vehicle plate", () => {
    render(
      <RecentWorkOrdersTable
        workOrders={[makeWorkOrder()]}
        router={defaultRouter}
        t={t}
        workOrdersForExport={emptyExportColumns}
      />,
    );
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("ABC-123")).toBeInTheDocument();
  });

  it("computes grand total from services and parts final_price", () => {
    render(
      <RecentWorkOrdersTable
        workOrders={[
          makeWorkOrder({
            services: [
              { final_price: 60000 },
              { final_price: 15000 },
            ] as WorkOrderDetail["services"],
            parts: [{ final_price: 25000 }] as WorkOrderDetail["parts"],
          }),
        ]}
        router={defaultRouter}
        t={t}
        workOrdersForExport={emptyExportColumns}
      />,
    );
    // 60000 + 15000 + 25000 = 100000
    expect(screen.getByText("₮ 100,000")).toBeInTheDocument();
  });

  it("shows em-dash when customer is null", () => {
    render(
      <RecentWorkOrdersTable
        workOrders={[makeWorkOrder({ customer: null })]}
        router={defaultRouter}
        t={t}
        workOrdersForExport={emptyExportColumns}
      />,
    );
    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });

  it("shows em-dash when vehicle is null", () => {
    render(
      <RecentWorkOrdersTable
        workOrders={[makeWorkOrder({ vehicle: null })]}
        router={defaultRouter}
        t={t}
        workOrdersForExport={emptyExportColumns}
      />,
    );
    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });

  it("truncates ID to first 8 characters", () => {
    render(
      <RecentWorkOrdersTable
        workOrders={[makeWorkOrder({ id: "wo-long-id-123456" })]}
        router={defaultRouter}
        t={t}
        workOrdersForExport={emptyExportColumns}
      />,
    );
    expect(screen.getByText("wo-long-...")).toBeInTheDocument();
  });

  it("calls router.push with correct ID on row click", async () => {
    const user = userEvent.setup();
    render(
      <RecentWorkOrdersTable
        workOrders={[makeWorkOrder({ id: "wo-click-test-id" })]}
        router={defaultRouter}
        t={t}
        workOrdersForExport={emptyExportColumns}
      />,
    );
    // id.slice(0,8) = "wo-click", text rendered as "wo-click..."
    const row = screen.getByText(/^wo-click\.\.\./).closest("tr");
    if (!row) throw new Error("row not found");
    await user.click(row);
    expect(pushSpy).toHaveBeenCalledWith(
      "/dashboard/work-orders/wo-click-test-id",
    );
  });
});
