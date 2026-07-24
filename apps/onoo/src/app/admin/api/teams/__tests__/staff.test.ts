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
import { GET, POST, DELETE } from "../staff/route";

const mockCreateClient = vi.mocked(createClient);

const sampleStaff = {
  id: "staff-1",
  team_season_id: "ts-1",
  user_id: "user-1",
  role: "coach",
  created_at: "2026-07-23T00:00:00.000Z",
  team_seasons: {
    id: "ts-1",
    team_id: "team-1",
    teams: { name: "Eagles" },
  },
};

const sampleStaff2 = {
  id: "staff-2",
  team_season_id: "ts-2",
  user_id: "user-2",
  role: "manager",
  created_at: "2026-07-22T00:00:00.000Z",
  team_seasons: {
    id: "ts-2",
    team_id: "team-2",
    teams: { name: "Falcons" },
  },
};

describe("Teams Staff API", () => {
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

  describe("GET /api/admin/teams/staff", () => {
    it("returns all staff", async () => {
      setQueryResult(mock, "team_staff", [sampleStaff, sampleStaff2]);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/staff",
      );
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([sampleStaff, sampleStaff2]);
    });

    it("returns empty array when no staff exist", async () => {
      setQueryResult(mock, "team_staff", []);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/staff",
      );
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("returns 500 on query error", async () => {
      setQueryResult(
        mock,
        "team_staff",
        null,
        new Error("DB connection failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/staff",
      );
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "DB connection failed" });
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase({ user: null }) as typeof mock;
      noUserMock.rpc = vi.fn();
      mockCreateClient.mockResolvedValue(noUserMock as never);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/staff",
      );
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/admin/teams/staff", () => {
    it("assigns staff via RPC", async () => {
      const assigned = { id: "staff-new", role: "coach" };
      setQueryResult(mock, "cmd_assign_team_staff", assigned);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/staff",
        {
          method: "POST",
          body: JSON.stringify({
            team_season_id: "ts-1",
            user_id: "user-1",
            role: "coach",
          }),
        },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(assigned);
      expect(mock.rpc).toHaveBeenCalledWith("cmd_assign_team_staff", {
        p_team_season_id: "ts-1",
        p_user_id: "user-1",
        p_role: "coach",
      });
    });

    it("returns 400 when required fields are missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/staff",
        { method: "POST", body: JSON.stringify({}) },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({
        error: "team_season_id, user_id, and role are required",
      });
    });

    it("returns 500 on RPC error", async () => {
      setQueryResult(
        mock,
        "cmd_assign_team_staff",
        null,
        new Error("RPC failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/staff",
        {
          method: "POST",
          body: JSON.stringify({
            team_season_id: "ts-1",
            user_id: "user-1",
            role: "coach",
          }),
        },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "RPC failed" });
    });
  });

  describe("DELETE /api/admin/teams/staff", () => {
    it("deletes staff", async () => {
      setQueryResult(mock, "team_staff", null);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/staff",
        {
          method: "DELETE",
          body: JSON.stringify({ id: "staff-1" }),
        },
      );
      const res = await DELETE(req);

      expect(res.status).toBe(204);
    });

    it("returns 400 when id is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/staff",
        { method: "DELETE", body: JSON.stringify({}) },
      );
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "id is required" });
    });

    it("returns 500 on delete error", async () => {
      setQueryResult(
        mock,
        "team_staff",
        null,
        new Error("Delete failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/staff",
        {
          method: "DELETE",
          body: JSON.stringify({ id: "staff-1" }),
        },
      );
      const res = await DELETE(req);

      expect(res.status).toBe(500);
    });
  });
});
