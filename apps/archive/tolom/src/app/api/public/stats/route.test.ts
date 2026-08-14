import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const captureMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@zuiio/capture", () => ({
  capture: captureMock,
}));

const { GET } = await import("./route");

describe("GET /api/public/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns public stats successfully", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: { total_orgs: 5, total_vehicles: 100 },
        error: null,
      }),
    };

    const req = new NextRequest(new URL("http://localhost/api/public/stats"));
    const response = await GET({ request: req, supabase });
    const body = await response.json();

    expect(body.data).toEqual({ total_orgs: 5, total_vehicles: 100 });
    expect(supabase.rpc).toHaveBeenCalledWith("get_public_stats");
  });

  it("returns cache-control headers", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: { total_orgs: 5 },
        error: null,
      }),
    };

    const req = new NextRequest(new URL("http://localhost/api/public/stats"));
    const response = await GET({ request: req, supabase });

    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=600, stale-while-revalidate=3600",
    );
  });

  it("returns 500 on query error (non-prerender)", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      }),
    };

    const req = new NextRequest(new URL("http://localhost/api/public/stats"));
    const response = await GET({ request: req, supabase });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL");
    expect(captureMock).toHaveBeenCalled();
  });

  it("gracefully handles prerender errors", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "prerender error: build timeout" },
      }),
    };

    const req = new NextRequest(new URL("http://localhost/api/public/stats"));
    const response = await GET({ request: req, supabase });
    const body = await response.json();

    expect(body.data).toBeNull();
    expect(captureMock).not.toHaveBeenCalled();
  });

  it("propagates unexpected errors", async () => {
    const supabase = {
      rpc: vi.fn().mockRejectedValue(new Error("Network error")),
    };

    const req = new NextRequest(new URL("http://localhost/api/public/stats"));
    await expect(GET({ request: req, supabase })).rejects.toThrow(
      "Network error",
    );
  });
});
