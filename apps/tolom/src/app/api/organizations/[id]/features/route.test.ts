import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

const { GET, PATCH } = await import("./route");

/** Build a supabase-like query chain. Methods return the object itself for
 *  chaining except when they should be terminal (resolving to a value). */
interface ChainMock {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

function mockChain(overrides?: Partial<ChainMock>): ChainMock {
  const c = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    ...overrides,
  } as unknown as ChainMock;
  c.from.mockReturnValue(c);
  c.select.mockReturnValue(c);
  c.update.mockReturnValue(c);
  return c;
}

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/features route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/features`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns feature flags on success", async () => {
      const supabase = mockChain();
      const data = [
        {
          id: "ff-1",
          flag_key: "enable_auto_assign",
          enabled: true,
          description: "",
          created_at: "",
          updated_at: "",
        },
      ];
      supabase.eq = vi.fn().mockResolvedValue({ data, error: null });

      const response = await (GET as any)({ orgId, supabase });
      const body = await response.json();

      expect(body.data).toEqual(data);
      expect(response.status).toBe(200);
    });

    it("handles supabase error", async () => {
      const supabase = mockChain();
      supabase.eq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Permission denied" },
      });

      const response = await (GET as any)({ orgId, supabase });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("FETCH_ERROR");
    });
  });

  describe("PATCH", () => {
    it("upserts feature flag when no existing flag found", async () => {
      const supabase = mockChain();
      supabase.eq = vi.fn(() => supabase);
      supabase.maybeSingle = vi.fn().mockResolvedValue({ data: null });
      supabase.insert = vi.fn().mockResolvedValue({ error: null });

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ flag_key: "enable_auto_assign", enabled: true }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({ orgId, supabase, request });
      const body = await response.json();

      expect(supabase.from).toHaveBeenCalledWith("feature_flags");
      expect(body.data).toEqual({ success: true });
      expect(response.status).toBe(200);
    });

    it("updates existing feature flag", async () => {
      const supabase = mockChain();
      supabase.eq = vi.fn((key: string) => {
        // The second eq call (after update, key = "id") is terminal — resolves to { error: null }
        if (key === "id") return { error: null };
        return supabase;
      });
      supabase.maybeSingle = vi
        .fn()
        .mockResolvedValue({ data: { id: "ff-1" } });

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({
          flag_key: "enable_auto_assign",
          enabled: false,
        }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({ orgId, supabase, request });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual({ success: true });
    });

    it("returns 400 when flag_key is missing", async () => {
      const supabase = { from: vi.fn() };

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ enabled: true }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({ orgId, supabase, request });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("handles insert error", async () => {
      const supabase = mockChain();
      supabase.eq = vi.fn(() => supabase);
      supabase.maybeSingle = vi.fn().mockResolvedValue({ data: null });
      supabase.insert = vi
        .fn()
        .mockResolvedValue({ error: { message: "Insert failed" } });

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ flag_key: "enable_auto_assign", enabled: true }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({ orgId, supabase, request });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INSERT_ERROR");
    });

    it("handles update error", async () => {
      const supabase = mockChain();
      supabase.eq = vi.fn((key: string) => {
        if (key === "id") return { error: { message: "Update failed" } };
        return supabase;
      });
      supabase.maybeSingle = vi
        .fn()
        .mockResolvedValue({ data: { id: "ff-1" } });

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({
          flag_key: "enable_auto_assign",
          enabled: false,
        }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({ orgId, supabase, request });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("UPDATE_ERROR");
    });
  });
});
