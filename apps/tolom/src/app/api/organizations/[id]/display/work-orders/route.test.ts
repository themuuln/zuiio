import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

// Must import after mocks are set up
const { GET } = await import("./route");

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Build a supabase mock that returns the given data when the
 * work_orders chain resolves.
 */
function mockWorkOrdersSupabase(overrides: {
  data?: unknown[] | null;
  error?: unknown;
}) {
  const { data = [], error = null } = overrides;
  const resolve = vi.fn().mockResolvedValue({ data, error });

  return {
    from: vi.fn((table: string) => {
      if (table !== "work_orders") {
        // Unused table – return a harmless chain
        const emptyResolve = vi
          .fn()
          .mockResolvedValue({ data: [], error: null });
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              not: vi.fn(() => ({
                is: vi.fn(() => ({
                  order: vi.fn(() => ({ limit: emptyResolve })),
                })),
              })),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            not: vi.fn(() => ({
              is: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: resolve,
                })),
              })),
            })),
          })),
        })),
      };
    }),
  } as unknown as SupabaseClient;
}

type HandlerFn = (args: Record<string, unknown>) => Promise<Response>;

// ── Tests ────────────────────────────────────────────────────────

describe("organizations/[id]/display/work-orders route", () => {
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseUrl = `http://localhost/api/organizations/${orgId}/display/work-orders`;

  describe("GET", () => {
    it("returns active work orders mapped to DisplayWorkOrder format", async () => {
      const rawRows = [
        {
          id: "wo-1",
          status: "InProgress",
          created_at: "2026-07-31T10:00:00Z",
          started_at: "2026-07-31T10:05:00Z",
          updated_at: "2026-07-31T10:05:00Z",
          complaint: "Engine noise",
          customer: {
            first_name: "John",
            last_name: "Doe",
          },
          vehicle: {
            plate_number: "ABC123",
            make: "Toyota",
            model: "Camry",
          },
          mechanic: {
            full_name: "Mike Mechanic",
          },
          work_order_services: [
            { service_name: "Oil Change" },
            { service_name: "Brake Check" },
          ],
        },
        {
          id: "wo-2",
          status: "Pending",
          created_at: "2026-07-31T11:00:00Z",
          started_at: null,
          updated_at: "2026-07-31T11:00:00Z",
          complaint: null,
          customer: null,
          vehicle: {
            plate_number: "XYZ789",
            make: null,
            model: null,
          },
          mechanic: null,
          work_order_services: [],
        },
      ];

      const supabase = mockWorkOrdersSupabase({ data: rawRows });

      const request = new NextRequest(baseUrl);
      const response = await (GET as HandlerFn)({
        request,
        orgId,
        supabase,
      });
      const body = await response.json();

      expect(supabase.from).toHaveBeenCalledWith("work_orders");
      expect(body.data).toEqual([
        {
          id: "wo-1",
          status: "InProgress",
          created_at: "2026-07-31T10:00:00Z",
          started_at: "2026-07-31T10:05:00Z",
          status_changed_at: "2026-07-31T10:05:00Z",
          customer_name: "John Doe",
          plate_number: "ABC123",
          vehicle_make: "Toyota",
          vehicle_model: "Camry",
          mechanic_name: "Mike Mechanic",
          complaint: "Engine noise",
          services: [{ name: "Oil Change" }, { name: "Brake Check" }],
        },
        {
          id: "wo-2",
          status: "Pending",
          created_at: "2026-07-31T11:00:00Z",
          started_at: null,
          status_changed_at: "2026-07-31T11:00:00Z",
          customer_name: null,
          plate_number: "XYZ789",
          vehicle_make: null,
          vehicle_model: null,
          mechanic_name: null,
          complaint: null,
          services: [],
        },
      ]);
    });

    it("handles partial customer name (only first_name)", async () => {
      const rawRows = [
        {
          id: "wo-1",
          status: "InProgress",
          created_at: "2026-07-31T10:00:00Z",
          started_at: null,
          updated_at: "2026-07-31T10:00:00Z",
          complaint: null,
          customer: { first_name: "Jane", last_name: null },
          vehicle: null,
          mechanic: null,
          work_order_services: [],
        },
      ];

      const supabase = mockWorkOrdersSupabase({ data: rawRows });

      const request = new NextRequest(baseUrl);
      const response = await (GET as HandlerFn)({
        request,
        orgId,
        supabase,
      });
      const body = await response.json();

      expect(body.data[0].customer_name).toBe("Jane");
    });

    it("handles empty work_orders list", async () => {
      const supabase = mockWorkOrdersSupabase({ data: [] });

      const request = new NextRequest(baseUrl);
      const response = await (GET as HandlerFn)({
        request,
        orgId,
        supabase,
      });
      const body = await response.json();

      expect(body.data).toEqual([]);
    });

    it("handles null response (supabase returns null)", async () => {
      const supabase = mockWorkOrdersSupabase({ data: null });

      const request = new NextRequest(baseUrl);
      const response = await (GET as HandlerFn)({
        request,
        orgId,
        supabase,
      });
      const body = await response.json();

      expect(body.data).toEqual([]);
    });

    it("throws error when supabase query fails", async () => {
      const supabase = mockWorkOrdersSupabase({
        data: null,
        error: { message: "Database connection failed" },
      });

      const request = new NextRequest(baseUrl);
      await expect(
        (GET as HandlerFn)({ request, orgId, supabase }),
      ).rejects.toThrow("Database connection failed");
    });
  });
});
