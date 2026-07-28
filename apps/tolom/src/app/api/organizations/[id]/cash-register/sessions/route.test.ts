import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getSessionsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/cash-register-service", () => ({
  getSessions: getSessionsMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/cash-register/sessions GET", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/cash-register/sessions`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns sessions with all query params", async () => {
    const sessions = [
      { id: "s-1", status: "open" },
      { id: "s-2", status: "closed" },
    ];
    getSessionsMock.mockResolvedValue(sessions);

    const supabase = createMockSupabaseClient();
    const request = new NextRequest(
      `${baseUrl}?status=open&from=2025-01-01&to=2025-01-31&limit=10&offset=0`,
    );
    const response = await (GET as any)({ orgId, supabase, request });
    const body = await response.json();

    expect(getSessionsMock).toHaveBeenCalledWith(supabase, orgId, {
      status: "open",
      from: "2025-01-01",
      to: "2025-01-31",
      limit: 10,
      offset: 0,
    });
    expect(body.data).toEqual(sessions);
  });

  it("returns sessions with default values when no query params provided", async () => {
    getSessionsMock.mockResolvedValue([]);

    const supabase = createMockSupabaseClient();
    const request = new NextRequest(baseUrl);
    const response = await (GET as any)({ orgId, supabase, request });
    const body = await response.json();

    expect(getSessionsMock).toHaveBeenCalledWith(supabase, orgId, {
      status: undefined,
      from: undefined,
      to: undefined,
      limit: undefined,
      offset: undefined,
    });
    expect(body.data).toEqual([]);
  });

  it("throws when getSessions service errors", async () => {
    getSessionsMock.mockRejectedValue(new Error("DB error"));

    const supabase = createMockSupabaseClient();
    const request = new NextRequest(`${baseUrl}?status=open`);
    await expect((GET as any)({ orgId, supabase, request })).rejects.toThrow(
      "DB error",
    );
  });
});
