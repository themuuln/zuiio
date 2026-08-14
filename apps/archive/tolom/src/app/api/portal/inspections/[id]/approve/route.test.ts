import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { POST } = await import("./route");

function mockDb(tables: Record<string, unknown>) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    is: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => builder),
    maybeSingle: vi.fn(() => builder),
    update: vi.fn(() => builder),
    then: undefined as unknown,
  };

  return {
    from: vi.fn((table: string) => {
      const value = tables[table as keyof typeof tables];
      if (value !== undefined) {
        builder.then = (resolve: (v: unknown) => unknown) =>
          Promise.resolve(value).then(resolve);
        for (const m of [
          "select",
          "eq",
          "in",
          "is",
          "order",
          "single",
          "maybeSingle",
          "update",
        ]) {
          (builder as Record<string, unknown>)[m] = vi.fn(() => builder);
        }
      }
      return builder;
    }),
  };
}

describe("POST /api/portal/inspections/[id]/approve", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves selected items", async () => {
    const supabase = mockDb({
      vehicle_owners: {
        data: [{ vehicle_id: "v-1", owned_until: null, is_primary: true }],
        error: null,
      },
      digital_vehicle_inspections: {
        data: { id: "insp-1", vehicle_id: "v-1", status: "sent" },
        error: null,
      },
      dvi_inspection_items: {
        data: [
          { id: "item-1", customer_approved: true },
          { id: "item-2", customer_approved: true },
        ],
        error: null,
      },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections/insp-1/approve"),
      {
        method: "POST",
        body: JSON.stringify({
          item_ids: ["item-1", "item-2"],
          approved: true,
        }),
      },
    );
    const response = await POST({
      request: req,
      customer,
      supabase,
      params: { id: "insp-1" },
    });
    const body = await response.json();

    expect(body.data.updated_count).toBe(2);
  });

  it("rejects invalid body (empty item_ids)", async () => {
    const supabase = mockDb({});

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections/insp-1/approve"),
      {
        method: "POST",
        body: JSON.stringify({ item_ids: [], approved: true }),
      },
    );
    const res = await POST({
      request: req,
      customer,
      supabase,
      params: { id: "insp-1" },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("rejects invalid body (missing approved)", async () => {
    const supabase = mockDb({});

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections/insp-1/approve"),
      { method: "POST", body: JSON.stringify({ item_ids: ["item-1"] }) },
    );
    const res = await POST({
      request: req,
      customer,
      supabase,
      params: { id: "insp-1" },
    });

    expect(res.status).toBe(400);
  });

  it("rejects when inspection not found (404 response)", async () => {
    const supabase = mockDb({
      vehicle_owners: {
        data: [{ vehicle_id: "v-1", owned_until: null, is_primary: true }],
        error: null,
      },
      digital_vehicle_inspections: {
        data: null,
        error: new Error("Not found"),
      },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections/insp-1/approve"),
      {
        method: "POST",
        body: JSON.stringify({ item_ids: ["item-1"], approved: true }),
      },
    );
    const res = await POST({
      request: req,
      customer,
      supabase,
      params: { id: "nonexistent" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("rejects when inspection belongs to another customer (404 response)", async () => {
    const supabase = mockDb({
      vehicle_owners: {
        data: [{ vehicle_id: "v-other", owned_until: null, is_primary: true }],
        error: null,
      },
      digital_vehicle_inspections: {
        data: { id: "insp-1", vehicle_id: "v-not-yours" },
        error: null,
      },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections/insp-1/approve"),
      {
        method: "POST",
        body: JSON.stringify({ item_ids: ["item-1"], approved: true }),
      },
    );
    const res = await POST({
      request: req,
      customer,
      supabase,
      params: { id: "insp-1" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
