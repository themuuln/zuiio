import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const checkSuperAdminMock = vi.fn();
const removeSellerAssignmentMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message, status } }), {
        status,
      }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/admin-service", () => ({
  checkSuperAdmin: checkSuperAdminMock,
  removeSellerAssignment: removeSellerAssignmentMock,
}));

const { DELETE } = await import("./route");

describe("DELETE /api/admin/sellers/assign/[assignmentId]", () => {
  const supabase = {};
  const params = { assignmentId: "assign-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes assignment successfully as super admin", async () => {
    checkSuperAdminMock.mockResolvedValue(true);
    removeSellerAssignmentMock.mockResolvedValue(undefined);

    const response = await DELETE({ supabase, params });
    const body = await response.json();

    expect(body.data).toEqual({ success: true });
    expect(checkSuperAdminMock).toHaveBeenCalledWith(supabase);
    expect(removeSellerAssignmentMock).toHaveBeenCalledWith(
      supabase,
      "assign-1",
    );
  });

  it("returns 403 when user is not super admin", async () => {
    checkSuperAdminMock.mockResolvedValue(false);

    const response = await DELETE({ supabase, params });
    const body = await response.json();

    expect(body.error).toEqual({
      code: "FORBIDDEN",
      message: "Super admin access required",
      status: 403,
    });
    expect(response.status).toBe(403);
    expect(removeSellerAssignmentMock).not.toHaveBeenCalled();
  });

  it("handles service error from checkSuperAdmin", async () => {
    checkSuperAdminMock.mockRejectedValue(new Error("DB connection failed"));

    await expect(DELETE({ supabase, params })).rejects.toThrow(
      "DB connection failed",
    );
  });

  it("handles service error from removeSellerAssignment", async () => {
    checkSuperAdminMock.mockResolvedValue(true);
    removeSellerAssignmentMock.mockRejectedValue(new Error("Failed to remove"));

    await expect(DELETE({ supabase, params })).rejects.toThrow(
      "Failed to remove",
    );
  });
});
