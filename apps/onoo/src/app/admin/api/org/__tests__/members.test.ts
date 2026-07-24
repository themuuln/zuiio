import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
  MockQueryBuilder,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET, POST, DELETE } from "../members/route";

const mockCreateClient = vi.mocked(createClient);

const sampleMembers = [
  {
    membership_id: "mem-1",
    user_id: "user-1",
    email: "user1@onoo.mn",
    role: "admin",
    scope_type: "org",
    scope_id: "org-1",
  },
  {
    membership_id: "mem-2",
    user_id: "user-2",
    email: "user2@onoo.mn",
    role: "member",
    scope_type: "org",
    scope_id: "org-1",
  },
];

describe("Org Members API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> } & {
    rpc: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase() as typeof mock;
    mock.rpc = vi.fn((fn: string, _params?: Record<string, unknown>) => {
      const result = mock._queryResults.get(fn) ?? {
        data: null,
        error: null,
      };
      return new MockQueryBuilder(result);
    });
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /api/admin/org/members", () => {
    it("lists members for an org scope", async () => {
      setQueryResult(mock, "cmd_list_members", sampleMembers);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members?scope_id=org-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(sampleMembers);
      expect(mock.rpc).toHaveBeenCalledWith("cmd_list_members", {
        p_scope_type: "org",
        p_scope_id: "org-1",
      });
    });

    it("accepts explicit scope_type", async () => {
      setQueryResult(mock, "cmd_list_members", sampleMembers);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members?scope_type=team&scope_id=team-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(mock.rpc).toHaveBeenCalledWith("cmd_list_members", {
        p_scope_type: "team",
        p_scope_id: "team-1",
      });
    });

    it("returns 400 when scope_id is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "scope_id is required" });
    });

    it("returns 403 on RPC error", async () => {
      setQueryResult(
        mock,
        "cmd_list_members",
        null,
        new Error("Permission denied"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members?scope_id=org-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body).toEqual({ error: "Permission denied" });
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase({ user: null }) as typeof mock;
      noUserMock.rpc = vi.fn();
      mockCreateClient.mockResolvedValue(noUserMock as never);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members?scope_id=org-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/admin/org/members", () => {
    it("assigns a role via RPC", async () => {
      const result = { membership_id: "mem-new", role: "admin" };
      setQueryResult(mock, "cmd_assign_role", result);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members",
        {
          method: "POST",
          body: JSON.stringify({
            user_id: "user-3",
            scope_type: "org",
            scope_id: "org-1",
            role: "admin",
          }),
        },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(result);
      expect(mock.rpc).toHaveBeenCalledWith("cmd_assign_role", {
        p_user_id: "user-3",
        p_scope_type: "org",
        p_scope_id: "org-1",
        p_role: "admin",
      });
    });

    it("returns 400 when required fields are missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members",
        { method: "POST", body: JSON.stringify({}) },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({
        error: "user_id, scope_type, scope_id, and role are required",
      });
    });

    it("returns 403 on RPC error", async () => {
      setQueryResult(
        mock,
        "cmd_assign_role",
        null,
        new Error("Not authorized"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members",
        {
          method: "POST",
          body: JSON.stringify({
            user_id: "user-3",
            scope_type: "org",
            scope_id: "org-1",
            role: "admin",
          }),
        },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body).toEqual({ error: "Not authorized" });
    });
  });

  describe("DELETE /api/admin/org/members", () => {
    it("removes a role via RPC", async () => {
      setQueryResult(mock, "cmd_remove_role", { success: true });

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members",
        {
          method: "DELETE",
          body: JSON.stringify({ membership_id: "mem-1" }),
        },
      );
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true });
      expect(mock.rpc).toHaveBeenCalledWith("cmd_remove_role", {
        p_membership_id: "mem-1",
      });
    });

    it("returns 400 when membership_id is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members",
        { method: "DELETE", body: JSON.stringify({}) },
      );
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "membership_id is required" });
    });

    it("returns 403 on RPC error", async () => {
      setQueryResult(
        mock,
        "cmd_remove_role",
        null,
        new Error("Cannot remove owner"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/members",
        {
          method: "DELETE",
          body: JSON.stringify({ membership_id: "mem-1" }),
        },
      );
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body).toEqual({ error: "Cannot remove owner" });
    });
  });
});
