import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const getSupplierPerformanceMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn(
    (handler: (ctx: unknown) => unknown, _options: unknown) => handler,
  ),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/supplier-service", () => ({
  getSupplierPerformance: getSupplierPerformanceMock,
}));

const { GET } = await import("./route");

describe("GET supplier performance route", () => {
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns metrics for the organization", async () => {
    const metrics = [{ supplier_id: "supplier-1", total_pos: 3 }];
    getSupplierPerformanceMock.mockResolvedValue(metrics);

    const response = await (GET as any)({
      orgId,
      supabase: createMockSupabaseClient(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: metrics });
    expect(getSupplierPerformanceMock).toHaveBeenCalledWith(
      expect.anything(),
      orgId,
    );
  });

  it("propagates service failures to the route handler", async () => {
    getSupplierPerformanceMock.mockRejectedValue(new Error("DB error"));

    await expect(
      (GET as any)({
        orgId,
        supabase: createMockSupabaseClient(),
      }),
    ).rejects.toThrow("DB error");
  });
});
