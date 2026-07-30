import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

// Mock getCustomer directly
vi.mock("@/lib/services/customer-service", () => ({
  getCustomer: vi.fn(),
}));

// Mock createRouteHandler to pass through
vi.mock("@/lib/api-response", async () => {
  const actual =
    await vi.importActual<Record<string, unknown>>("@/lib/api-response");
  return {
    ...actual,
    createRouteHandler: vi.fn((handler: unknown) => handler),
  };
});

const { POST } = await import("./route");
const { getCustomer } = await import("@/lib/services/customer-service");

function makeSupabase() {
  const mock = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    update: vi.fn(() => mock),
    then: undefined as unknown,
  };
  mock.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: null, error: null }).then(resolve);
  return mock;
}

describe("POST /api/organizations/[id]/customers/[customerId]/portal-access", () => {
  const user = { id: "user-1" };
  const orgId = "org-1";
  const params = { customerId: "cust-1" };
  const customerData = {
    id: "cust-1",
    organization_id: orgId,
    portal_token: null,
    customer_user_id: null,
    first_name: "John",
    last_name: "Doe",
    full_name: "John Doe",
    email: "john@example.com",
    phone: "99112233",
    branch_id: null,
    address: null,
    company_name: null,
    contact_person: null,
    type: null,
    source: null,
    notes: null,
    tags: null,
    total_visits: 3,
    last_visit_at: "2026-07-01T10:00:00Z",
    created_by: "user-1",
    updated_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-07-01T10:00:00Z",
    deleted_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a new portal token for a customer", async () => {
    vi.mocked(getCustomer).mockResolvedValue(customerData);
    const supabase = makeSupabase();

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/org-1/customers/cust-1/portal-access",
      ),
      { method: "POST" },
    );
    const response = await POST({
      request: req,
      supabase,
      orgId,
      user,
      params,
    });
    const body = await response.json();

    expect(body.data.portal_token).toBeDefined();
    expect(body.data.portal_token).toHaveLength(64);
    expect(body.data.login_url).toContain("/auth/customer/set-password?token=");
    expect(body.data.has_existing_account).toBe(false);
    expect(body.data.customer.name).toBe("John Doe");
  });

  it("returns existing portal token if customer already has one", async () => {
    const existingToken = "existing-token-123";
    vi.mocked(getCustomer).mockResolvedValue({
      ...customerData,
      portal_token: existingToken,
    });
    const supabase = makeSupabase();

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/org-1/customers/cust-1/portal-access",
      ),
      { method: "POST" },
    );
    const response = await POST({
      request: req,
      supabase,
      orgId,
      user,
      params,
    });
    const body = await response.json();

    expect(body.data.portal_token).toBe(existingToken);
  });

  it("returns has_existing_account=true when customer_user_id is set", async () => {
    vi.mocked(getCustomer).mockResolvedValue({
      ...customerData,
      portal_token: "tok-1",
      customer_user_id: "auth-user-1",
    });
    const supabase = makeSupabase();

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/org-1/customers/cust-1/portal-access",
      ),
      { method: "POST" },
    );
    const response = await POST({
      request: req,
      supabase,
      orgId,
      user,
      params,
    });
    const body = await response.json();

    expect(body.data.has_existing_account).toBe(true);
  });

  it("throws when customer not found", async () => {
    vi.mocked(getCustomer).mockRejectedValue(new Error("Customer not found"));
    const supabase = makeSupabase();

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/org-1/customers/cust-1/portal-access",
      ),
      { method: "POST" },
    );
    await expect(
      POST({ request: req, supabase, orgId, user, params }),
    ).rejects.toThrow("Customer not found");
  });
});
