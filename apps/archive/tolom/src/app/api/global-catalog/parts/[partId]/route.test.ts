import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

const getGlobalPartByIdMock = vi.fn();
vi.mock("@/lib/services/global-catalog-service", () => ({
  getGlobalPartById: getGlobalPartByIdMock,
}));

const { GET } = await import("./route");

describe("GET /api/global-catalog/parts/[partId]", () => {
  const supabase = {} as unknown as SupabaseClient;
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a single global part by id", async () => {
    const part = {
      id: "gp-1",
      name: "Brake Pad Set",
      category: "Brake System",
      part_number: "BP-1001",
    };
    getGlobalPartByIdMock.mockResolvedValue(part);

    const response = await (GET as any)({
      supabase,
      user,
      params: { partId: "gp-1" },
    });
    const body = await response.json();

    expect(getGlobalPartByIdMock).toHaveBeenCalledWith(supabase, "gp-1");
    expect(body.data).toEqual(part);
  });

  it("returns 404 when part not found", async () => {
    getGlobalPartByIdMock.mockRejectedValue(
      new Error("Global part not found: gp-nonexistent"),
    );

    const response = await (GET as any)({
      supabase,
      user,
      params: { partId: "gp-nonexistent" },
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 500 on unexpected error", async () => {
    getGlobalPartByIdMock.mockRejectedValue(new Error("DB connection failed"));

    const response = await (GET as any)({
      supabase,
      user,
      params: { partId: "gp-1" },
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("QUERY_ERROR");
  });
});
