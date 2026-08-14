import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET } = await import("./route");

describe("GET /api/portal/customer", () => {
  const customer = {
    id: "cust-1",
    first_name: "John",
    last_name: "Doe",
    full_name: "John Doe",
    phone: "123456",
    email: "john@test.com",
    organization_id: "org-1",
    portal_token: "tok-1",
    total_visits: 5,
    last_visit_at: "2024-06-01",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authenticated portal customer", async () => {
    const req = new NextRequest(
      new URL("http://localhost/api/portal/customer"),
    );
    const response = await GET({ request: req, customer, supabase: {} });
    const body = await response.json();

    expect(body.data).toEqual(customer);
  });

  it("returns minimal customer data when fields are null", async () => {
    const minimalCustomer = {
      id: "cust-2",
      first_name: null,
      last_name: null,
      full_name: null,
      phone: null,
      email: null,
      organization_id: "org-1",
      portal_token: "tok-2",
      total_visits: 0,
      last_visit_at: null,
    };

    const req = new NextRequest(
      new URL("http://localhost/api/portal/customer"),
    );
    const response = await GET({
      request: req,
      customer: minimalCustomer,
      supabase: {},
    });
    const body = await response.json();

    expect(body.data.id).toBe("cust-2");
    expect(body.data.first_name).toBeNull();
    expect(body.data.total_visits).toBe(0);
  });
});
