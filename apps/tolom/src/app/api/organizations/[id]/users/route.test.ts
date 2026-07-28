import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrganizationUsersMock = vi.fn();
const createInviteMock = vi.fn();
const removeUserMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/invite-service", () => ({
  createInvite: createInviteMock,
}));

vi.mock("@/lib/services/user-service", () => ({
  getOrganizationUsers: getOrganizationUsersMock,
  removeUser: removeUserMock,
}));

const { GET, POST, DELETE } = await import("./route");

interface HandlerContext {
  request?: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  user?: { id: string };
  params?: Record<string, string>;
}

describe("organizations/[id]/users route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/users`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns organization users", async () => {
      const users = [{ id: "u-1", full_name: "Alice" }];
      getOrganizationUsersMock.mockResolvedValue(users);

      const context: HandlerContext = { supabase: {} as SupabaseClient, orgId };
      const response = await GET(context);
      const body = await response.json();

      expect(getOrganizationUsersMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual(users);
    });

    it("handles service error", async () => {
      getOrganizationUsersMock.mockRejectedValue(new Error("DB error"));

      const context: HandlerContext = { supabase: {} as SupabaseClient, orgId };
      await expect(GET(context)).rejects.toThrow("DB error");
    });
  });

  describe("POST", () => {
    const body = { email: "new@test.com", roleId: "role-1" };

    it("creates invite and returns 201", async () => {
      const invite = { id: "inv-1", email: "new@test.com" };
      createInviteMock.mockResolvedValue(invite);

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify(body),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      const response = await POST(context);
      const responseBody = await response.json();

      expect(createInviteMock).toHaveBeenCalledWith({}, orgId, body, user.id);
      expect(responseBody.data).toEqual(invite);
    });

    it("handles service error", async () => {
      createInviteMock.mockRejectedValue(new Error("Invite failed"));

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify(body),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      await expect(POST(context)).rejects.toThrow("Invite failed");
    });
  });

  describe("DELETE", () => {
    it("removes user and returns success", async () => {
      removeUserMock.mockResolvedValue(undefined);

      const req = new NextRequest(new URL(baseUrl), {
        method: "DELETE",
        body: JSON.stringify({ userId: "u-2" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      const response = await DELETE(context);
      const body = await response.json();

      expect(removeUserMock).toHaveBeenCalledWith({}, "u-2", orgId);
      expect(body.data).toEqual({ success: true });
    });

    it("handles service error", async () => {
      removeUserMock.mockRejectedValue(new Error("Remove failed"));

      const req = new NextRequest(new URL(baseUrl), {
        method: "DELETE",
        body: JSON.stringify({ userId: "u-2" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      await expect(DELETE(context)).rejects.toThrow("Remove failed");
    });
  });
});
