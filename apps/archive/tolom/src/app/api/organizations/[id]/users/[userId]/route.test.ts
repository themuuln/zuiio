import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMemberMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/user-service", () => ({
  updateMember: updateMemberMock,
}));

const { PATCH } = await import("./route");

interface HandlerContext {
  request: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  params: Record<string, string>;
}

describe("organizations/[id]/users/[userId] route", () => {
  const orgId = "org-1";
  const userId = "user-2";
  const baseUrl = `http://localhost/api/organizations/${orgId}/users/${userId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH", () => {
    it("updates member and returns success", async () => {
      updateMemberMock.mockResolvedValue(undefined);
      const body = { fullName: "New Name", phone: "1234", roleId: "role-1" };

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { userId },
      };
      const response = await PATCH(context);
      const responseBody = await response.json();

      expect(updateMemberMock).toHaveBeenCalledWith({}, userId, orgId, {
        fullName: "New Name",
        phone: "1234",
        roleId: "role-1",
        branchId: undefined,
      });
      expect(responseBody.data).toEqual({ success: true });
    });

    it("handles service error", async () => {
      updateMemberMock.mockRejectedValue(new Error("Update failed"));

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ fullName: "New" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { userId },
      };
      await expect(PATCH(context)).rejects.toThrow("Update failed");
    });
  });
});
