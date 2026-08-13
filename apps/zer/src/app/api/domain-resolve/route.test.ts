/**
 * Tests for the domain-resolve API route — the edge middleware's host →
 * org resolution. Covers the storefront domain (slug), the admin (ERP)
 * domain (`{ admin: true }`, never a slug), and unknown hosts (404).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        // Profiles lookups chain eq().eq().maybeSingle(); the organizations
        // lookup chains eq().maybeSingle() — expose both on the eq result.
        eq: () => ({
          eq: () => ({ maybeSingle: mockMaybeSingle }),
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
  }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

import { GET } from "./route";

function get(host: string) {
  return GET(new Request(`http://localhost/api/domain-resolve?host=${host}`));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/domain-resolve", () => {
  it("resolves a verified storefront domain to its org slug", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: { organization_id: "org-1" },
        error: null,
      })
      .mockResolvedValueOnce({ data: { slug: "my-shop" }, error: null });

    const res = await get("shop.example.mn");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ slug: "my-shop" });
  });

  it("answers admin:true for a verified admin (ERP) domain without leaking the org", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: { organization_id: "org-1" },
        error: null,
      });

    const res = await get("erp.example.mn");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ admin: true });
  });

  it("returns 404 when the host is neither a storefront nor an admin domain", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const res = await get("unknown.example.mn");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });

  it("requires a host parameter", async () => {
    const res = await GET(new Request("http://localhost/api/domain-resolve"));
    expect(res.status).toBe(400);
  });
});
