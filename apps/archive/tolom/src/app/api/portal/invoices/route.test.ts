import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

// ── Mock supabase builder ─────────────────────────────────────────

function makeSupabase({
  ownerData = [{ vehicle_id: "v1" }],
  ownerError = null,
  woData = [{ id: "wo-1" }],
  woError = null,
  invoiceData = [],
  invoiceError = null,
  itemData = [],
  itemError = null,
}: {
  ownerData?: Record<string, unknown>[] | null;
  ownerError?: Record<string, unknown> | null;
  woData?: Record<string, unknown>[] | null;
  woError?: Record<string, unknown> | null;
  invoiceData?: Record<string, unknown>[] | null;
  invoiceError?: Record<string, unknown> | null;
  itemData?: Record<string, unknown>[] | null;
  itemError?: Record<string, unknown> | null;
}) {
  const woChain = {
    select: vi.fn(() => woChain),
    in: vi.fn(() => woChain),
    is: vi.fn().mockResolvedValue({ data: woData, error: woError }),
  };

  const invChain = {
    select: vi.fn(() => invChain),
    in: vi.fn(() => invChain),
    is: vi.fn(() => invChain),
    order: vi
      .fn()
      .mockResolvedValue({ data: invoiceData, error: invoiceError }),
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "vehicle_owners") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockResolvedValue({
            data: ownerData,
            error: ownerError,
          }),
        };
      }

      if (table === "work_orders") return woChain;
      if (table === "invoices") return invChain;

      if (table === "invoice_items") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: itemData, error: itemError }),
        };
      }

      return { select: vi.fn().mockReturnThis() };
    }),
  };
}

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────────

describe("GET /api/portal/invoices", () => {
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

  it("returns invoices with items for the customer", async () => {
    const supabase = makeSupabase({
      invoiceData: [
        {
          id: "inv-1",
          invoice_number: "INV-001",
          status: "paid",
          subtotal: 50000,
          total: 55000,
          amount_paid: 55000,
          balance_due: 0,
          organization_id: "org-1",
          work_order_id: "wo-1",
          customer_name: "John",
          vehicle_plate: "ABC123",
          public_token: "tok-inv",
          issued_at: "2024-01-01",
          due_at: "2024-02-01",
          paid_at: "2024-01-15",
          created_at: "2024-01-01",
        },
      ],
      itemData: [
        {
          id: "item-1",
          invoice_id: "inv-1",
          item_type: "service",
          description: "Oil change",
          quantity: 1,
          unit_price: 50000,
          discount_amount: 0,
          total_price: 50000,
          sort_order: 1,
        },
      ],
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/invoices"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("inv-1");
    expect(body.data[0].items).toHaveLength(1);
    expect(body.data[0].items[0].description).toBe("Oil change");
  });

  it("returns empty array when customer has no vehicles", async () => {
    const supabase = makeSupabase({ ownerData: [] });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/invoices"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toEqual([]);
  });

  it("returns empty array when customer has vehicles but no work orders", async () => {
    const supabase = makeSupabase({ woData: [] });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/invoices"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toEqual([]);
  });

  it("returns invoices with empty items when no items exist", async () => {
    const supabase = makeSupabase({
      invoiceData: [
        {
          id: "inv-1",
          invoice_number: "INV-001",
          status: "draft",
          organization_id: "org-1",
          issued_at: "2024-01-01",
          created_at: "2024-01-01",
        },
      ],
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/invoices"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].items).toEqual([]);
  });

  it("handles vehicle_owners silently when error present (route ignores error)", async () => {
    const supabase = makeSupabase({
      ownerError: { message: "Ownership error" },
      woData: [],
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/invoices"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    // Route uses .data?.map() without checking error, so processes whatever data is returned
    expect(body.data).toEqual([]);
  });

  it("throws on invoices query error", async () => {
    const supabase = makeSupabase({
      invoiceError: { message: "Invoice error" },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/invoices"),
    );
    await expect(GET({ request: req, customer, supabase })).rejects.toThrow(
      "Invoice error",
    );
  });
});
