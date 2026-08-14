import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const globalSearchMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/global-search-service", () => ({
  globalSearch: globalSearchMock,
}));

const { GET } = await import("./route");

const orgId = "org-1";
const user = { id: "u1" };
const supabase = {};

const EMPTY = { customers: [], vehicles: [], workOrders: [], parts: [] };

describe("GET /api/organizations/[id]/global-search", () => {
  it("returns empty sections for queries shorter than 2 characters", async () => {
    const req = new NextRequest(
      new URL("http://localhost/api/organizations/org-1/global-search?q=a"),
    );
    const response = await GET({ request: req, orgId, user, supabase });
    const body = await response.json();

    expect(globalSearchMock).not.toHaveBeenCalled();
    expect(body.data).toEqual(EMPTY);
  });

  it("passes the query and default limit to the service", async () => {
    const payload = {
      customers: [{ id: "c1", name: "Bat", phone: "9911" }],
      vehicles: [],
      workOrders: [],
      parts: [],
    };
    globalSearchMock.mockResolvedValue(payload);

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/org-1/global-search?q=7257%D0%A3%D0%91%D0%90",
      ),
    );
    const response = await GET({ request: req, orgId, user, supabase });
    const body = await response.json();

    expect(globalSearchMock).toHaveBeenCalledWith(
      supabase,
      orgId,
      "7257УБА",
      {},
    );
    expect(body.data).toEqual(payload);
  });

  it("forwards an explicit limit", async () => {
    globalSearchMock.mockResolvedValue(EMPTY);

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/org-1/global-search?q=term&limit=3",
      ),
    );
    await GET({ request: req, orgId, user, supabase });

    expect(globalSearchMock).toHaveBeenCalledWith(supabase, orgId, "term", {
      limit: 3,
    });
  });

  it("returns 500 and reports the error when the service throws", async () => {
    globalSearchMock.mockRejectedValue(new Error("DB connection failed"));

    const req = new NextRequest(
      new URL("http://localhost/api/organizations/org-1/global-search?q=term"),
    );
    const response = await GET({ request: req, orgId, user, supabase });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error?.code ?? body.code).toMatch(/QUERY_ERROR/i);
  });
});
