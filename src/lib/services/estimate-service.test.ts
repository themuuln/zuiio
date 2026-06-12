import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ─────────────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
  withBranchFilter: vi.fn((query: unknown) => query),
}));

const mockClient = createMockSupabaseClient();

// Helper to make a chain resolve like a Supabase query
function chainableResolve(
  // biome-ignore lint/suspicious/noExplicitAny: test mock
  obj: Record<string, any>,
  result: unknown,
) {
  // Walk through all chain methods and make them return obj
  for (const key of [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "is",
    "in",
    "contains",
    "or",
    "and",
    "not",
    "order",
    "limit",
    "range",
  ]) {
    obj[key] = vi.fn().mockReturnValue(obj);
  }
  // Terminal methods
  obj.single = vi.fn().mockResolvedValue({
    data: result,
    error: null,
  });
  obj.maybeSingle = vi.fn().mockResolvedValue({
    data: result,
    error: null,
  });
  // Make the chain thenable (resolves like Supabase queries)
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable for Supabase mock chain
  obj.then = vi.fn().mockImplementation((resolve: (v: unknown) => unknown) =>
    resolve({
      data: result,
      count: Array.isArray(result) ? result.length : 0,
      error: null,
    }),
  );
  return obj;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────

describe("EstimateService", () => {
  describe("createEstimate", () => {
    it("creates an estimate with items and calculates totals", async () => {
      const { createEstimate } = await import(
        "@/lib/services/estimate-service"
      );

      // Mock generate_estimate_number
      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: "EST-00001",
        error: null,
      });

      // Track which table is being queried
      let fromCallCount = 0;

      vi.mocked(mockClient.from).mockImplementation((table: string) => {
        fromCallCount++;
        if (table === "estimates" && fromCallCount === 1) {
          // First call: insert the estimate
          const chain: Record<string, unknown> = {};
          chain.insert = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "est-1" },
                error: null,
              }),
            }),
          });
          return chain as never;
        }
        if (table === "estimate_items" && fromCallCount === 2) {
          // Second call: insert items
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as never;
        }
        if (table === "estimate_items" && fromCallCount === 3) {
          // Third call: recalculate items
          return chainableResolve({}, []) as never;
        }
        if (table === "estimates" && fromCallCount === 4) {
          // Fourth call: recalculate estimate
          return chainableResolve(
            {},
            { discount_amount: 0, discount_percentage: 0, tax_total: 0 },
          ) as never;
        }
        if (table === "estimates" && fromCallCount === 5) {
          // Fifth call: update totals
          return chainableResolve({}, null) as never;
        }
        if (table === "estimates" && fromCallCount >= 6) {
          // Final call: getEstimate
          return chainableResolve(
            {},
            {
              id: "est-1",
              estimate_number: "EST-00001",
              status: "draft",
              customer_id: "cust-1",
              vehicle_id: "veh-1",
              subtotal: 65000,
              discount_total: 0,
              tax_total: 0,
              grand_total: 65000,
              customer: { first_name: "Test" },
              vehicle: { plate_number: "1234АБ" },
              items: [],
              converted_work_order: null,
              appointment: null,
            },
          ) as never;
        }
        return chainableResolve({}, null) as never;
      });

      const result = await createEstimate(mockClient as never, "org-1", {
        customer_id: "cust-1",
        vehicle_id: "veh-1",
        items: [
          {
            item_type: "service",
            description: "Oil change",
            quantity: 1,
            unit_price: 50000,
          },
          {
            item_type: "part",
            description: "Oil filter",
            quantity: 1,
            unit_price: 15000,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.estimate_number).toBe("EST-00001");
      expect(mockClient.rpc).toHaveBeenCalledWith("generate_estimate_number");
    });

    it("uses the provided status when creating an estimate", async () => {
      const { createEstimate } = await import(
        "@/lib/services/estimate-service"
      );

      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: "EST-00002",
        error: null,
      });

      let insertedEstimate: Record<string, unknown> | null = null;
      let fromCallCount = 0;

      vi.mocked(mockClient.from).mockImplementation((table: string) => {
        fromCallCount++;

        if (table === "estimates" && fromCallCount === 1) {
          const chain: Record<string, unknown> = {};
          chain.insert = vi.fn().mockImplementation((value: unknown) => {
            insertedEstimate = value as Record<string, unknown>;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "est-2" },
                  error: null,
                }),
              }),
            };
          });
          return chain as never;
        }

        if (table === "estimate_items" && fromCallCount === 2) {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as never;
        }

        if (table === "estimate_items" && fromCallCount === 3) {
          return chainableResolve({}, []) as never;
        }

        if (table === "estimates" && fromCallCount === 4) {
          return chainableResolve(
            {},
            { discount_amount: 0, discount_percentage: 0, tax_total: 0 },
          ) as never;
        }

        if (table === "estimates" && fromCallCount === 5) {
          return chainableResolve({}, null) as never;
        }

        return chainableResolve(
          {},
          {
            id: "est-2",
            estimate_number: "EST-00002",
            status: "sent",
            customer_id: "cust-1",
            vehicle_id: "veh-1",
            subtotal: 120000,
            discount_total: 0,
            tax_total: 0,
            grand_total: 120000,
            customer: null,
            vehicle: null,
            items: [],
            converted_work_order: null,
            appointment: null,
          },
        ) as never;
      });

      await createEstimate(mockClient as never, "org-1", {
        customer_id: "cust-1",
        vehicle_id: "veh-1",
        status: "sent",
        items: [
          {
            item_type: "service",
            description: "Diagnostics",
            quantity: 1,
            unit_price: 120000,
          },
        ],
      });

      expect(insertedEstimate?.status).toBe("sent");
    });

    it("rejects when customer is missing", async () => {
      const { createEstimate } = await import(
        "@/lib/services/estimate-service"
      );

      await expect(
        createEstimate(mockClient as never, "org-1", {
          customer_id: "",
          vehicle_id: "veh-1",
          items: [
            { item_type: "service", description: "Test", unit_price: 100 },
          ],
        }),
      ).rejects.toThrow("Customer is required");
    });

    it("rejects when vehicle is missing", async () => {
      const { createEstimate } = await import(
        "@/lib/services/estimate-service"
      );

      await expect(
        createEstimate(mockClient as never, "org-1", {
          customer_id: "cust-1",
          vehicle_id: "",
          items: [
            { item_type: "service", description: "Test", unit_price: 100 },
          ],
        }),
      ).rejects.toThrow("Vehicle is required");
    });

    it("rejects when no items provided", async () => {
      const { createEstimate } = await import(
        "@/lib/services/estimate-service"
      );

      await expect(
        createEstimate(mockClient as never, "org-1", {
          customer_id: "cust-1",
          vehicle_id: "veh-1",
          items: [],
        }),
      ).rejects.toThrow("At least one item is required");
    });
  });

  describe("deleteEstimate", () => {
    it("soft-deletes an estimate", async () => {
      const { deleteEstimate } = await import(
        "@/lib/services/estimate-service"
      );

      vi.mocked(mockClient.from).mockReturnValue(
        chainableResolve({}, null) as never,
      );

      await expect(
        deleteEstimate(mockClient as never, "est-1", "org-1"),
      ).resolves.toBeUndefined();
    });
  });

  describe("getEstimates", () => {
    it("fetches estimates with status filter", async () => {
      const { getEstimates } = await import("@/lib/services/estimate-service");

      const mockEstimates = [
        {
          id: "est-1",
          estimate_number: "EST-00001",
          status: "draft",
          grand_total: 65000,
          created_at: "2026-01-01T00:00:00Z",
          customer: { first_name: "Test", last_name: "Customer" },
          vehicle: { plate_number: "1234АБ", make: "Toyota", model: "Camry" },
          items: [{ id: "item-1" }],
          converted_work_order: null,
          appointment: null,
        },
      ];

      vi.mocked(mockClient.from).mockReturnValue(
        chainableResolve({}, mockEstimates) as never,
      );

      const result = await getEstimates(mockClient as never, "org-1", {
        status: "draft",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].estimate_number).toBe("EST-00001");
    });

    it("fetches estimates with search", async () => {
      const { getEstimates } = await import("@/lib/services/estimate-service");

      vi.mocked(mockClient.from).mockReturnValue(
        chainableResolve({}, []) as never,
      );

      const result = await getEstimates(mockClient as never, "org-1", {
        search: "toyota",
      });

      expect(result.data).toHaveLength(0);
    });
  });

  describe("updateEstimateStatus", () => {
    it("updates estimate status via updateEstimate", async () => {
      const { updateEstimateStatus } = await import(
        "@/lib/services/estimate-service"
      );

      const updatedEstimate = {
        id: "est-1",
        status: "approved",
        subtotal: 0,
        discount_total: 0,
        tax_total: 0,
        grand_total: 0,
        customer: null,
        vehicle: null,
        items: [],
        converted_work_order: null,
        appointment: null,
      };

      vi.mocked(mockClient.from).mockImplementation((table: string) => {
        if (table === "estimate_items") {
          // recalculateEstimateTotals queries items
          return chainableResolve({}, []) as never;
        }
        return chainableResolve({}, updatedEstimate) as never;
      });

      const result = await updateEstimateStatus(
        mockClient as never,
        "est-1",
        "org-1",
        "approved",
      );

      expect(result).toBeDefined();
      expect(result.status).toBe("approved");
    });
  });
});
