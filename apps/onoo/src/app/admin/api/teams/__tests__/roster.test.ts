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
import { GET, POST, DELETE } from "../roster/route";

const mockCreateClient = vi.mocked(createClient);

const sampleRosterEntry = {
  id: "roster-1",
  team_season_id: "ts-1",
  player_id: "player-1",
  jersey_number: 7,
  players: { canonical_name: "Batzorig Erdene", photo_url: null },
};

const sampleRosterEntry2 = {
  id: "roster-2",
  team_season_id: "ts-1",
  player_id: "player-2",
  jersey_number: 10,
  players: { canonical_name: "Bat-Erdene Bold", photo_url: null },
};

describe("Teams Roster API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> } & {
    rpc: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase() as typeof mock;
    // Add rpc support to the mock since createMockSupabase doesn't expose it
    mock.rpc = vi.fn((fn: string, _params?: Record<string, unknown>) => {
      const result = mock._queryResults.get(fn) ?? {
        data: null,
        error: null,
      };
      return new MockQueryBuilder(result);
    });
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /api/admin/teams/roster", () => {
    it("returns roster entries for a team season", async () => {
      setQueryResult(mock, "roster_snapshots", [
        sampleRosterEntry,
        sampleRosterEntry2,
      ]);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/roster?team_season_id=ts-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([sampleRosterEntry, sampleRosterEntry2]);
    });

    it("returns 400 when team_season_id is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/roster",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({
        error: "team_season_id query parameter is required",
      });
    });

    it("returns 500 on query error", async () => {
      setQueryResult(
        mock,
        "roster_snapshots",
        null,
        new Error("DB error"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/roster?team_season_id=ts-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "DB error" });
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase({ user: null }) as typeof mock;
      noUserMock.rpc = vi.fn();
      mockCreateClient.mockResolvedValue(noUserMock as never);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/roster?team_season_id=ts-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/admin/teams/roster", () => {
    it("snapshots roster via RPC", async () => {
      const snapshotResult = { success: true, count: 5 };
      setQueryResult(mock, "cmd_snapshot_roster", snapshotResult);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/roster",
        {
          method: "POST",
          body: JSON.stringify({ team_season_id: "ts-1" }),
        },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(snapshotResult);
      expect(mock.rpc).toHaveBeenCalledWith("cmd_snapshot_roster", {
        p_team_season_id: "ts-1",
      });
    });

    it("returns 400 when team_season_id is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/roster",
        { method: "POST", body: JSON.stringify({}) },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "team_season_id is required" });
    });

    it("returns 500 on RPC error", async () => {
      setQueryResult(
        mock,
        "cmd_snapshot_roster",
        null,
        new Error("RPC failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/roster",
        {
          method: "POST",
          body: JSON.stringify({ team_season_id: "ts-1" }),
        },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "RPC failed" });
    });
  });

  describe("DELETE /api/admin/teams/roster", () => {
    it("deletes a roster entry", async () => {
      setQueryResult(mock, "roster_snapshots", null);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/roster?id=roster-1",
        { method: "DELETE" },
      );
      const res = await DELETE(req);

      expect(res.status).toBe(204);
    });

    it("returns 400 when id is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/roster",
        { method: "DELETE" },
      );
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "id query parameter is required" });
    });

    it("returns 500 on delete error", async () => {
      setQueryResult(
        mock,
        "roster_snapshots",
        null,
        new Error("Delete failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/roster?id=roster-1",
        { method: "DELETE" },
      );
      const res = await DELETE(req);

      expect(res.status).toBe(500);
    });
  });
});
