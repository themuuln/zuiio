import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const completeDisassemblyMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/parts-cars-service", () => ({
  completeDisassembly: completeDisassemblyMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts-cars/[carId]/complete route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const carId = "car-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("completes disassembly of a parts-car", async () => {
      const car = { id: carId, status: "completed", make: "Toyota" };
      completeDisassemblyMock.mockResolvedValue(car);

      const supabase = createMockSupabaseClient();
      const response = await (POST as any)({
        supabase,
        orgId,
        user,
        params: { carId },
      });
      const body = await response.json();

      expect(completeDisassemblyMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        user.id,
        carId,
      );
      expect(body.data).toEqual(car);
    });

    it("handles service error", async () => {
      completeDisassemblyMock.mockRejectedValue(new Error("Complete failed"));

      const supabase = createMockSupabaseClient();
      await expect(
        (POST as any)({ supabase, orgId, user, params: { carId } }),
      ).rejects.toThrow("Complete failed");
    });
  });
});
