import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
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

describe("GET /api/estimate/public/[token]", () => {
  const token = "public-tok-123";
  const _baseUrl = `http://localhost/api/estimate/public/${token}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns estimate data on success", async () => {
    const estimateData = {
      id: "est-1",
      token,
      items: [
        { sort_order: 2, name: "Second item" },
        { sort_order: 1, name: "First item" },
      ],
    };
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: estimateData, error: null }),
    };
    const params = { token };

    const response = await (GET as any)({ params, supabase });
    const body = await response.json();

    expect(supabase.rpc).toHaveBeenCalledWith("get_public_estimate_by_token", {
      p_token: token,
    });
    expect(body.data.items).toEqual([
      { sort_order: 1, name: "First item" },
      { sort_order: 2, name: "Second item" },
    ]);
    expect(body.data.id).toBe("est-1");
    expect(response.status).toBe(200);
  });

  it("returns estimate data with no items gracefully", async () => {
    const estimateData = { id: "est-2", token, items: null };
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: estimateData, error: null }),
    };
    const params = { token };

    const response = await (GET as any)({ params, supabase });
    const body = await response.json();

    expect(body.data.items).toEqual([]);
    expect(response.status).toBe(200);
  });

  it("returns 404 when RPC returns error", async () => {
    const supabase = {
      rpc: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "Not found" } }),
    };
    const params = { token };

    const response = await (GET as any)({ params, supabase });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Estimate not found");
  });

  it("returns 404 when RPC returns no data", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const params = { token };

    const response = await (GET as any)({ params, supabase });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Estimate not found");
  });
});
