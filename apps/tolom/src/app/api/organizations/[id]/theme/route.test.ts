import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const readOrganizationBrandConfigMock = vi.fn();
const writeOrganizationBrandConfigMock = vi.fn();

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

vi.mock("@zuiio/branding", () => ({
  DEFAULT_BRAND_CONFIG: { theme: "default" },
  getFont: vi.fn((name: string) => {
    const valid = ["inter", "roboto"];
    return valid.includes(name) ? name : null;
  }),
  getTheme: vi.fn((name: string) => {
    const valid = ["default", "dark"];
    return valid.includes(name) ? name : null;
  }),
  isValidColorValue: vi.fn((value: string) => {
    return /^#[0-9a-fA-F]{3,6}$/.test(value) || value.startsWith("oklch(");
  }),
  resolveBrandConfig: vi.fn((input: Record<string, unknown>) => input),
}));

vi.mock("@/lib/organization-branding", () => ({
  readOrganizationBrandConfig: readOrganizationBrandConfigMock,
  writeOrganizationBrandConfig: writeOrganizationBrandConfigMock,
}));

const { GET, PUT } = await import("./route");

// ── Helpers ─────────────────────────────────────────────────────

interface ChainMock {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

function mockChain(overrides?: Partial<ChainMock>): ChainMock {
  const c = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
    ...overrides,
  } as unknown as ChainMock;
  c.from.mockReturnValue(c);
  c.select.mockReturnValue(c);
  c.eq.mockReturnValue(c);
  return c;
}

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/theme route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/theme`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns branding config on success", async () => {
      const branding = { theme: "default", custom_colors: {} };
      readOrganizationBrandConfigMock.mockReturnValue(branding);

      const supabase = mockChain();
      supabase.single = vi
        .fn()
        .mockResolvedValue({ data: { settings: {} }, error: null });

      const response = await (GET as any)({ orgId, supabase });
      const body = await response.json();

      expect(body.data.branding).toEqual(branding);
      expect(body.data.isDefault).toBe(false);
      expect(response.status).toBe(200);
    });

    it("returns 404 when organization not found", async () => {
      const supabase = mockChain();
      supabase.single = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "Not found" } });

      const response = await (GET as any)({ orgId, supabase });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("handles service error", async () => {
      const supabase = mockChain();
      supabase.single = vi.fn().mockRejectedValue(new Error("DB error"));

      await expect((GET as any)({ orgId, supabase })).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("PUT", () => {
    it("updates theme on success", async () => {
      const supabase = mockChain();
      supabase.single = vi
        .fn()
        .mockResolvedValue({ data: { settings: {} }, error: null });
      supabase.update = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      readOrganizationBrandConfigMock.mockReturnValue({ theme: "default" });
      writeOrganizationBrandConfigMock.mockReturnValue({ theme: "dark" });

      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ theme: "dark" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(body.data.branding).toBeDefined();
      expect(response.status).toBe(200);
    });

    it("returns 400 for invalid theme preset", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ theme: "nonexistent" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION");
    });

    it("returns 400 for invalid color value", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ custom_colors: { primary: "not-a-color" } }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION");
    });

    it("returns 400 for invalid radius", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ radius: 5 }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION");
    });

    it("returns 400 for invalid body font", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ font_body: "nonexistent-font" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION");
    });

    it("returns 400 for invalid heading font", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ font_heading: "nonexistent-font" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION");
    });

    it("returns 400 for invalid JSON body", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: "not-json",
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION");
    });

    it("returns 404 when org not found during update", async () => {
      const supabase = mockChain();
      supabase.single = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "Not found" } });

      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ theme: "dark" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase });

      expect(response.status).toBe(404);
    });

    it("returns 500 when update fails", async () => {
      const supabase = mockChain();
      supabase.single = vi
        .fn()
        .mockResolvedValue({ data: { settings: {} }, error: null });
      supabase.update = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: { message: "Update failed" } }),
      }));

      readOrganizationBrandConfigMock.mockReturnValue({ theme: "default" });
      writeOrganizationBrandConfigMock.mockReturnValue({ theme: "dark" });

      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ theme: "dark" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL");
    });
  });
});
