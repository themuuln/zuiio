import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("GET /api/invoice/public/[token]", () => {
  const token = "public-inv-456";
  const baseUrl = `http://localhost/api/invoice/public/${token}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invoice data on success", async () => {
    const invoiceData = { id: "inv-1", token, total: 15000 };
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: invoiceData, error: null }),
    };
    const request = new NextRequest(new URL(baseUrl));

    const response = await (GET as any)({ request, supabase });
    const body = await response.json();

    expect(supabase.rpc).toHaveBeenCalledWith("get_public_invoice_by_token", {
      p_token: token,
    });
    expect(body.data).toEqual(invoiceData);
    expect(response.status).toBe(200);
  });

  it("returns 404 when RPC returns no invoice", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const request = new NextRequest(new URL(baseUrl));

    const response = await (GET as any)({ request, supabase });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Invoice not found");
  });

  it("throws when RPC returns an error", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "DB error", code: "PGRST116" },
      }),
    };
    const request = new NextRequest(new URL(baseUrl));

    await expect((GET as any)({ request, supabase })).rejects.toThrow();
  });
});
