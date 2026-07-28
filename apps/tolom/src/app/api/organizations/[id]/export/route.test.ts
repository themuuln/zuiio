import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUsersByIdsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message } }), { status }),
  ),
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn().mockResolvedValue({
    rpc: getUsersByIdsMock,
  }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const { GET } = await import("./route");

/**
 * Creates a thenable query result that mimics the Supabase postgrest chain.
 * The returned object is a Promise (awaitable) and also has .single() and
 * .order() methods, matching how the export handler calls supabase:
 *   - .from().select().eq().single()        ← org lookup
 *   - .from().select().eq().order()          ← table fetches
 *   - .from().select().eq()                  ← org_users (direct await)
 */
function createQueryResult(data: unknown, error: unknown = null) {
  const promise = Promise.resolve({ data, error });
  return Object.assign(promise, {
    single: vi.fn().mockResolvedValue({
      data: Array.isArray(data) ? data[0] : data,
      error,
    }),
    order: vi.fn().mockResolvedValue({
      data: Array.isArray(data) ? data : [],
      error,
    }),
  });
}

function buildMockSupabase(
  tableResults: Record<string, unknown[]>,
  orgData: unknown,
  usersData: unknown[],
) {
  const mockFrom = vi.fn().mockImplementation((table: string) => ({
    select: vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockImplementation(() => {
        if (table === "organizations") return createQueryResult(orgData);
        if (table === "organization_users") return createQueryResult(usersData);
        return createQueryResult(tableResults[table] ?? []);
      }),
    })),
  }));
  return { from: mockFrom };
}

describe("organizations/[id]/export route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  const orgData = {
    id: orgId,
    name: "Test Garage",
    slug: "test-garage",
    settings: null,
  };

  const usersData = [
    { user_id: "u1", role: "admin", profiles: { full_name: "Alice" } },
    { user_id: "u2", role: "mechanic", profiles: { full_name: "Bob" } },
  ];

  const authUsersData = [
    { id: "u1", email: "alice@example.com" },
    { id: "u2", email: "bob@example.com" },
  ];

  const defaultTableResults: Record<string, unknown[]> = {
    branches: [{ id: "b1", name: "Main", organization_id: orgId }],
    roles: [{ id: "r1", name: "Admin", organization_id: orgId }],
    customers: [{ id: "c1", name: "Charlie", organization_id: orgId }],
    vehicles: [{ id: "v1", plate: "ABC123", organization_id: orgId }],
    vehicle_owners: [{ id: "vo1", vehicle_id: "v1", organization_id: orgId }],
    work_orders: [{ id: "wo1", status: "open", organization_id: orgId }],
    work_order_services: [
      { id: "wos1", work_order_id: "wo1", organization_id: orgId },
    ],
    work_order_parts: [
      { id: "wop1", work_order_id: "wo1", organization_id: orgId },
    ],
    work_order_status_history: [
      { id: "wosh1", work_order_id: "wo1", organization_id: orgId },
    ],
    service_catalog: [
      { id: "sc1", name: "Oil Change", organization_id: orgId },
    ],
    service_price_history: [
      { id: "sph1", service_catalog_id: "sc1", organization_id: orgId },
    ],
    part_price_history: [
      { id: "pph1", parts_catalog_id: "pc1", organization_id: orgId },
    ],
    parts_catalog: [{ id: "pc1", name: "Oil Filter", organization_id: orgId }],
    vehicle_models: [{ id: "vm1", name: "Model 3", organization_id: orgId }],
    suppliers: [{ id: "s1", name: "PartsCo", organization_id: orgId }],
    purchase_orders: [{ id: "po1", status: "pending", organization_id: orgId }],
    purchase_order_items: [
      { id: "poi1", purchase_order_id: "po1", organization_id: orgId },
    ],
    inventory_movements: [{ id: "im1", type: "in", organization_id: orgId }],
    payments: [{ id: "p1", amount: 100, organization_id: orgId }],
    invoices: [{ id: "i1", total: 100, organization_id: orgId }],
    invoice_items: [{ id: "ii1", invoice_id: "i1", organization_id: orgId }],
    invoice_payments: [{ id: "ip1", invoice_id: "i1", organization_id: orgId }],
    stock_thresholds: [{ id: "st1", part_id: "pc1", organization_id: orgId }],
    mechanic_assignments: [
      { id: "ma1", work_order_id: "wo1", organization_id: orgId },
    ],
    work_order_notes: [
      { id: "won1", work_order_id: "wo1", organization_id: orgId },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getUsersByIdsMock.mockResolvedValue({ data: authUsersData, error: null });
  });

  describe("GET", () => {
    it("returns full export with all sections populated", async () => {
      const supabase = buildMockSupabase(
        defaultTableResults,
        orgData,
        usersData,
      );
      const req = new NextRequest(
        new URL(`http://localhost/api/organizations/${orgId}/export`),
      );

      const response = await GET({ request: req, orgId, user, supabase });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Content-Disposition")).toMatch(
        /^attachment; filename="tolom-export-test-garage-\d{4}-\d{2}-\d{2}\.json"$/,
      );

      // Organization metadata
      expect(body.organization).toEqual(orgData);
      expect(body.exported_at).toBeDefined();
      expect(typeof body.exported_at).toBe("string");

      // Key sections populated
      expect(body.branches).toHaveLength(1);
      expect(body.roles).toHaveLength(1);
      expect(body.customers).toHaveLength(1);
      expect(body.vehicles).toHaveLength(1);
      expect(body.work_orders).toHaveLength(1);
      expect(body.service_catalog).toHaveLength(1);
      expect(body.parts_catalog).toHaveLength(1);
      expect(body.suppliers).toHaveLength(1);
      expect(body.purchase_orders).toHaveLength(1);
      expect(body.payments).toHaveLength(1);
      expect(body.invoices).toHaveLength(1);
      expect(body.stock_thresholds).toHaveLength(1);
      expect(body.mechanic_assignments).toHaveLength(1);

      // Users with emails merged from service role client
      expect(body.users).toHaveLength(2);
      expect(body.users[0].profiles.email).toBe("alice@example.com");
      expect(body.users[1].profiles.email).toBe("bob@example.com");
    });

    it("handles partial data when some tables are empty", async () => {
      const partialData: Record<string, unknown[]> = {
        branches: [],
        customers: [
          { id: "c1", name: "Only Customer", organization_id: orgId },
        ],
      };

      const supabase = buildMockSupabase(partialData, orgData, []);
      getUsersByIdsMock.mockResolvedValue({ data: [], error: null });

      const req = new NextRequest(
        new URL(`http://localhost/api/organizations/${orgId}/export`),
      );

      const response = await GET({ request: req, orgId, user, supabase });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.branches).toEqual([]);
      expect(body.customers).toHaveLength(1);
      expect(body.customers[0].name).toBe("Only Customer");
      expect(body.vehicles).toEqual([]);
      expect(body.work_orders).toEqual([]);
      expect(body.users).toEqual([]);
      expect(body.organization).toEqual(orgData);
    });

    it("returns 404 when organization is not found", async () => {
      const supabase = buildMockSupabase({}, null, []);
      const req = new NextRequest(
        new URL(`http://localhost/api/organizations/${orgId}/export`),
      );

      const response = await GET({ request: req, orgId, user, supabase });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("throws when a table query fails", async () => {
      // Build a supabase mock where branches query returns an error
      const mockFrom = vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => {
            if (table === "organizations") return createQueryResult(orgData);
            if (table === "organization_users")
              return createQueryResult(usersData);
            if (table === "branches")
              return createQueryResult([], new Error("DB timeout"));
            return createQueryResult(defaultTableResults[table] ?? []);
          }),
        })),
      }));
      const badSupabase = { from: mockFrom };

      const req = new NextRequest(
        new URL(`http://localhost/api/organizations/${orgId}/export`),
      );

      await expect(
        GET({ request: req, orgId, user, supabase: badSupabase }),
      ).rejects.toThrow("Failed to export branches: DB timeout");
    });

    it("gracefully degrades when service role client fails to fetch emails", async () => {
      const supabase = buildMockSupabase(
        defaultTableResults,
        orgData,
        usersData,
      );
      getUsersByIdsMock.mockRejectedValue(
        new Error("Service role not configured"),
      );

      const req = new NextRequest(
        new URL(`http://localhost/api/organizations/${orgId}/export`),
      );

      const response = await GET({ request: req, orgId, user, supabase });
      const body = await response.json();

      // Export should still succeed with null emails
      expect(response.status).toBe(200);
      expect(body.users).toHaveLength(2);
      expect(body.users[0].profiles.email).toBeNull();
      expect(body.users[1].profiles.email).toBeNull();
      expect(body.organization).toEqual(orgData);
    });
  });
});
