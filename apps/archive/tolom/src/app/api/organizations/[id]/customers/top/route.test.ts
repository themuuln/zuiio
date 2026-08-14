import { beforeEach, describe, expect, it, vi } from "vitest";

const mockOrder = vi.fn();
const chain = {
  select: vi.fn(() => chain),
  eq: vi.fn(() => chain),
  not: vi.fn(() => chain),
  order: mockOrder,
};
const mockFrom = vi.fn(() => chain);
const mockSupabase = { from: mockFrom };

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

const { GET } = await import("./route");

describe("top customers route", () => {
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns top 5 customers by revenue", async () => {
      const rows = [
        {
          customer_id: "c-1",
          total: "500.00",
          completed_at: "2024-01-15T00:00:00Z",
          customers: {
            id: "c-1",
            first_name: "John",
            last_name: "Doe",
            company_name: null,
            phone: "1111111111",
          },
        },
        {
          customer_id: "c-2",
          total: "300.00",
          completed_at: "2024-02-10T00:00:00Z",
          customers: {
            id: "c-2",
            first_name: "Jane",
            last_name: "Smith",
            company_name: null,
            phone: "2222222222",
          },
        },
        {
          customer_id: "c-3",
          total: "200.00",
          completed_at: "2024-03-05T00:00:00Z",
          customers: {
            id: "c-3",
            first_name: "Bob",
            last_name: null,
            company_name: "Bob's Garage",
            phone: "3333333333",
          },
        },
        {
          customer_id: "c-4",
          total: "100.00",
          completed_at: "2024-04-20T00:00:00Z",
          customers: {
            id: "c-4",
            first_name: "Alice",
            last_name: "Wong",
            company_name: null,
            phone: "4444444444",
          },
        },
        {
          customer_id: "c-5",
          total: "50.00",
          completed_at: "2024-05-01T00:00:00Z",
          customers: {
            id: "c-5",
            first_name: "Tom",
            last_name: "Lee",
            company_name: null,
            phone: "5555555555",
          },
        },
        {
          customer_id: "c-6",
          total: "10.00",
          completed_at: "2024-06-01T00:00:00Z",
          customers: {
            id: "c-6",
            first_name: "Sara",
            last_name: "Kim",
            company_name: null,
            phone: "6666666666",
          },
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: rows, error: null });

      const response = await (GET as any)({
        supabase: mockSupabase,
        orgId,
      });
      const body = await response.json();

      expect(body.data.customers).toHaveLength(5);
      expect(body.data.customers[0].id).toBe("c-1");
      expect(body.data.customers[0].totalRevenue).toBe(500);
      expect(body.data.customers[0].name).toBe("John Doe");
      expect(body.data.customers[0].phone).toBe("1111111111");
      expect(body.data.customers[0].visitCount).toBe(1);
      expect(body.data.customers[1].id).toBe("c-2");
      expect(body.data.customers[2].id).toBe("c-3");
      expect(body.data.customers[3].id).toBe("c-4");
      expect(body.data.customers[4].id).toBe("c-5");
      expect(body.data.customers[4].totalRevenue).toBe(50);
      expect(mockFrom).toHaveBeenCalledWith("work_orders");
      expect(chain.select).toHaveBeenCalledWith(
        expect.stringContaining("customer_id"),
      );
      expect(chain.eq).toHaveBeenCalledWith("organization_id", orgId);
      expect(chain.eq).toHaveBeenCalledWith("status", "completed");
      expect(chain.not).toHaveBeenCalledWith("customer_id", "is", null);
      expect(chain.order).toHaveBeenCalledWith("total", { ascending: false });
    });

    it("groups multiple orders for same customer summing revenue and counting visits", async () => {
      const rows = [
        {
          customer_id: "c-1",
          total: "400.00",
          completed_at: "2024-01-15T00:00:00Z",
          customers: {
            id: "c-1",
            first_name: "John",
            last_name: "Doe",
            company_name: null,
            phone: "1111111111",
          },
        },
        {
          customer_id: "c-1",
          total: "250.00",
          completed_at: "2024-02-20T00:00:00Z",
          customers: {
            id: "c-1",
            first_name: "John",
            last_name: "Doe",
            company_name: null,
            phone: "1111111111",
          },
        },
        {
          customer_id: "c-2",
          total: "100.00",
          completed_at: "2024-03-10T00:00:00Z",
          customers: {
            id: "c-2",
            first_name: "Jane",
            last_name: "Smith",
            company_name: null,
            phone: "2222222222",
          },
        },
        {
          customer_id: "c-1",
          total: "150.00",
          completed_at: "2024-04-05T00:00:00Z",
          customers: {
            id: "c-1",
            first_name: "John",
            last_name: "Doe",
            company_name: null,
            phone: "1111111111",
          },
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: rows, error: null });

      const response = await (GET as any)({
        supabase: mockSupabase,
        orgId,
      });
      const body = await response.json();

      expect(body.data.customers).toHaveLength(2);
      // c-1: 400 + 250 + 150 = 800, 3 visits
      expect(body.data.customers[0].id).toBe("c-1");
      expect(body.data.customers[0].totalRevenue).toBe(800);
      expect(body.data.customers[0].visitCount).toBe(3);
      // c-2: 100, 1 visit
      expect(body.data.customers[1].id).toBe("c-2");
      expect(body.data.customers[1].totalRevenue).toBe(100);
      expect(body.data.customers[1].visitCount).toBe(1);
    });

    it("uses 'Unknown' when customer has no name fields", async () => {
      const rows = [
        {
          customer_id: "c-1",
          total: "100.00",
          completed_at: "2024-01-15T00:00:00Z",
          customers: {
            id: "c-1",
            first_name: null,
            last_name: null,
            company_name: null,
            phone: null,
          },
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: rows, error: null });

      const response = await (GET as any)({
        supabase: mockSupabase,
        orgId,
      });
      const body = await response.json();

      expect(body.data.customers).toHaveLength(1);
      expect(body.data.customers[0].name).toBe("Unknown");
      expect(body.data.customers[0].phone).toBeNull();
      expect(body.data.customers[0].totalRevenue).toBe(100);
      expect(body.data.customers[0].visitCount).toBe(1);
    });

    it("returns empty array when no completed work orders exist", async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      const response = await (GET as any)({
        supabase: mockSupabase,
        orgId,
      });
      const body = await response.json();

      expect(body.data.customers).toEqual([]);
      expect(response.status).toBe(200);
    });

    it("returns 500 when supabase query fails", async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed" },
      });

      const response = await (GET as any)({
        supabase: mockSupabase,
        orgId,
      });
      const body = await response.json();

      expect(body.error.code).toBe("QUERY_FAILED");
      expect(body.error.message).toBe("Database connection failed");
      expect(response.status).toBe(500);
    });

    it("skips rows where customer is null in the nested object", async () => {
      const rows = [
        {
          customer_id: null,
          total: "100.00",
          completed_at: "2024-01-15T00:00:00Z",
          customers: null,
        },
        {
          customer_id: "c-2",
          total: "200.00",
          completed_at: "2024-02-10T00:00:00Z",
          customers: {
            id: "c-2",
            first_name: "Jane",
            last_name: "Smith",
            company_name: null,
            phone: "3333333333",
          },
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: rows, error: null });

      const response = await (GET as any)({
        supabase: mockSupabase,
        orgId,
      });
      const body = await response.json();

      expect(body.data.customers).toHaveLength(1);
      expect(body.data.customers[0].id).toBe("c-2");
    });

    it("uses company_name when first_name and last_name are null", async () => {
      const rows = [
        {
          customer_id: "c-1",
          total: "150.00",
          completed_at: "2024-01-15T00:00:00Z",
          customers: {
            id: "c-1",
            first_name: null,
            last_name: null,
            company_name: "Pro Auto Repair",
            phone: "9999999999",
          },
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: rows, error: null });

      const response = await (GET as any)({
        supabase: mockSupabase,
        orgId,
      });
      const body = await response.json();

      expect(body.data.customers).toHaveLength(1);
      expect(body.data.customers[0].name).toBe("Pro Auto Repair");
    });

    it("uses only first_name when last_name is null", async () => {
      const rows = [
        {
          customer_id: "c-1",
          total: "75.00",
          completed_at: "2024-01-15T00:00:00Z",
          customers: {
            id: "c-1",
            first_name: "Mono",
            last_name: null,
            company_name: null,
            phone: null,
          },
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: rows, error: null });

      const response = await (GET as any)({
        supabase: mockSupabase,
        orgId,
      });
      const body = await response.json();

      expect(body.data.customers).toHaveLength(1);
      expect(body.data.customers[0].name).toBe("Mono");
    });
  });
});
