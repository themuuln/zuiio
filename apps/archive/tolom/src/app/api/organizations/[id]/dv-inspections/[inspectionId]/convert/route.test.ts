import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const convertInspectionToWorkOrderMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/dvi-service", () => ({
  convertInspectionToWorkOrder: convertInspectionToWorkOrderMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/dv-inspections/[inspectionId]/convert POST", () => {
  const orgId = "org-1";
  const inspectionId = "insp-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const url = `http://localhost/api/organizations/${orgId}/dv-inspections/${inspectionId}/convert`;

  it("converts inspection to work order", async () => {
    convertInspectionToWorkOrderMock.mockResolvedValue({
      work_order_id: "wo-1",
      item_count: 3,
    });

    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, { method: "POST" });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
      params: { inspectionId },
    });
    const data = await response.json();

    expect(convertInspectionToWorkOrderMock).toHaveBeenCalledWith(
      supabase,
      inspectionId,
      orgId,
      user.id,
    );
    expect(data.data.work_order_id).toBe("wo-1");
    expect(data.data.item_count).toBe(3);
    expect(response.status).toBe(200);
  });

  it("returns 400 when inspectionId is missing", async () => {
    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, { method: "POST" });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
      params: {},
    });
    expect(response.status).toBe(400);
  });

  it("handles service error", async () => {
    convertInspectionToWorkOrderMock.mockRejectedValue(
      new Error("No approved items"),
    );

    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, { method: "POST" });
    await expect(
      (POST as any)({
        request,
        orgId,
        user,
        supabase,
        params: { inspectionId },
      }),
    ).rejects.toThrow("No approved items");
  });
});
