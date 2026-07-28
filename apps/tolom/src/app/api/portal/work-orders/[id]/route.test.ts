import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET } = await import("./route");

describe("GET /api/portal/work-orders/[id]", () => {
  const customer = {
    id: "cust-1",
    first_name: "John",
    last_name: "Doe",
    phone: "123456",
    email: "john@test.com",
    organization_id: "org-1",
    portal_token: "tok-1",
    total_visits: 5,
    last_visit_at: null,
  };

  const params = { id: "wo-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns work order with services, parts, status history and invoices", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "work_orders") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "wo-1",
                organization_id: "org-1",
                customer_id: "cust-1",
                vehicle_id: "v1",
                status: "completed",
                description: "Oil change",
                notes: null,
                bay_number: null,
                mechanic_id: null,
                complaint: "Engine noise",
                diagnosis: "Needs oil change",
                subtotal: 100,
                discount_total: 0,
                total: 100,
                odometer_at_service: 50000,
                started_at: "2024-01-01T10:00:00Z",
                completed_at: "2024-01-01T11:00:00Z",
                created_at: "2024-01-01T09:00:00Z",
              },
              error: null,
            }),
          };
        }
        if (table === "vehicle_owners") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({
              data: [{ vehicle_id: "v1" }],
              error: null,
            }),
          };
        }
        if (table === "work_order_services") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "srv-1",
                  work_order_id: "wo-1",
                  service_name: "Oil Change",
                  description: "Full synthetic oil change",
                  unit_price: 80,
                  quantity: 1,
                  final_price: 80,
                  notes: null,
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "work_order_parts") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "part-1",
                  work_order_id: "wo-1",
                  part_name: "Oil filter",
                  part_number: "OF-123",
                  quantity: 1,
                  unit_price: 20,
                  final_price: 20,
                  notes: null,
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "work_order_status_history") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "hst-1",
                  work_order_id: "wo-1",
                  previous_status: "pending",
                  status: "completed",
                  notes: null,
                  created_at: "2024-01-01T11:00:00Z",
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "invoices") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "inv-1",
                  invoice_number: "INV-001",
                  status: "paid",
                  subtotal: 100,
                  total: 100,
                  amount_paid: 100,
                  balance_due: 0,
                  issued_at: "2024-01-01T11:00:00Z",
                  due_at: "2024-01-31T11:00:00Z",
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "invoice_items") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "item-1",
                  invoice_id: "inv-1",
                  item_type: "service",
                  description: "Oil Change",
                  quantity: 1,
                  unit_price: 80,
                  total_price: 80,
                  sort_order: 1,
                },
              ],
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }),
    };

    const response = await GET({ customer, supabase, params });
    const body = await response.json();

    expect(body.data.id).toBe("wo-1");
    expect(body.data.status).toBe("completed");
    expect(body.data.vehicle_id).toBe("v1");

    expect(body.data.services).toHaveLength(1);
    expect(body.data.services[0].service_name).toBe("Oil Change");

    expect(body.data.parts).toHaveLength(1);
    expect(body.data.parts[0].part_name).toBe("Oil filter");

    expect(body.data.status_history).toHaveLength(1);
    expect(body.data.status_history[0].status).toBe("completed");

    expect(body.data.invoices).toHaveLength(1);
    expect(body.data.invoices[0].invoice_number).toBe("INV-001");
    expect(body.data.invoices[0].items).toHaveLength(1);
    expect(body.data.invoices[0].items[0].item_type).toBe("service");
  });

  it("throws not found when work order id does not exist", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "work_orders") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116", message: "No rows found" },
            }),
          };
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }),
    };

    await expect(GET({ customer, supabase, params })).rejects.toThrow(
      "Work order not found",
    );
  });

  it("throws not found when vehicle is not owned by customer", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "work_orders") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "wo-1",
                vehicle_id: "v99",
                status: "pending",
                subtotal: 0,
                discount_total: 0,
                total: 0,
                created_at: "2024-01-01T09:00:00Z",
              },
              error: null,
            }),
          };
        }
        if (table === "vehicle_owners") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({
              data: [{ vehicle_id: "v1" }],
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }),
    };

    await expect(GET({ customer, supabase, params })).rejects.toThrow(
      "Work order not found",
    );
  });
});
