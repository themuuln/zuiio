import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

// ── Mock supabase builder ─────────────────────────────────────────

function makeSupabase({
  insertData = { id: "apt-1" },
  insertError = null,
}: {
  insertData?: Record<string, unknown> | null;
  insertError?: Record<string, unknown> | null;
} = {}) {
  const chain = {
    insert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data: insertData, error: insertError }),
  };

  return {
    from: vi.fn(() => chain),
  };
}

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────────

describe("POST /api/portal/bookings", () => {
  const customer = {
    id: "cust-1",
    first_name: "John",
    organization_id: "org-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a booking and returns 201 with id and message", async () => {
    const supabase = makeSupabase({ insertData: { id: "apt-1" } });
    const request = new NextRequest("http://localhost/api/portal/bookings", {
      method: "POST",
      body: JSON.stringify({ vehicle_id: "v-1" }),
    });

    const response = await POST({ request, customer, supabase });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data).toMatchObject({
      id: "apt-1",
      message: expect.any(String),
    });

    expect(supabase.from).toHaveBeenCalledWith("appointments");
    expect(supabase.from().insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        customer_id: "cust-1",
        vehicle_id: "v-1",
        status: "requested",
      }),
    );
  });

  it("includes notes and requestedDate when provided", async () => {
    const supabase = makeSupabase({ insertData: { id: "apt-2" } });
    const request = new NextRequest("http://localhost/api/portal/bookings", {
      method: "POST",
      body: JSON.stringify({
        vehicle_id: "v-1",
        notes: "  Please check brakes  ",
        requestedDate: "2026-08-01T10:00:00Z",
      }),
    });

    const response = await POST({ request, customer, supabase });

    expect(response.status).toBe(201);

    expect(supabase.from().insert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Please check brakes",
        scheduled_at: "2026-08-01T10:00:00Z",
      }),
    );
  });

  it("returns 400 when vehicle_id is missing", async () => {
    const supabase = makeSupabase();
    const request = new NextRequest("http://localhost/api/portal/bookings", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST({ request, customer, supabase });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("VALIDATION");
  });

  it("returns 500 when supabase insert fails", async () => {
    const supabase = makeSupabase({
      insertData: null,
      insertError: { message: "DB error" },
    });
    const request = new NextRequest("http://localhost/api/portal/bookings", {
      method: "POST",
      body: JSON.stringify({ vehicle_id: "v-1" }),
    });

    const response = await POST({ request, customer, supabase });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("ERROR");
  });
});
