import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Shared mutable state for the withAuth mock
const shared = vi.hoisted(() => ({
  queryResult: [] as unknown[],
  rpcResult: { data: null, error: null } as { data: unknown; error: unknown },
  rpcParams: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/supabase/admin-route", () => ({
  withAuth: vi.fn(
    (handler: (supabase: Record<string, unknown>) => Promise<Response>) =>
      handler({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            or: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({ data: shared.queryResult, error: null }),
                ),
              })),
              order: vi.fn(() =>
                Promise.resolve({ data: shared.queryResult, error: null }),
              ),
            })),
            order: vi.fn(() =>
              Promise.resolve({ data: shared.queryResult, error: null }),
            ),
          })),
        })),
        rpc: vi.fn((_fn: string, params: Record<string, unknown>) => {
          shared.rpcParams = params;
          return Promise.resolve(shared.rpcResult);
        }),
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({
              data: { user: { id: "admin" } },
              error: null,
            }),
          ),
        },
      }),
  ),
}));

import { GET, POST } from "../transfers/route";

const sampleTransfer = {
  id: "transfer-1",
  player_id: "player-1",
  from_team_season_id: null,
  to_team_season_id: "team-season-2",
  transfer_type: "permanent",
  effective_from: "2026-07-23",
  created_at: "2026-07-23T00:00:00.000Z",
  players: { canonical_name: "Batzorig Erdene" },
};

describe("Transfers API", () => {
  beforeEach(() => {
    shared.queryResult = [];
    shared.rpcResult = { data: null, error: null };
    shared.rpcParams = null;
  });

  describe("GET /api/admin/org/transfers", () => {
    it("returns transfers", async () => {
      shared.queryResult = [sampleTransfer];

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/transfers",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([sampleTransfer]);
    });
  });

  describe("POST /api/admin/org/transfers", () => {
    it("creates transfer via cmd_record_transfer RPC", async () => {
      shared.rpcResult = { data: { id: "new-transfer" }, error: null };

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/transfers",
        {
          method: "POST",
          body: JSON.stringify({
            player_id: "player-1",
            to_team_season_id: "team-season-2",
            transfer_type: "permanent",
            effective_from: "2026-07-23",
          }),
        },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ id: "new-transfer" });
      expect(shared.rpcParams).toEqual({
        p_player_id: "player-1",
        p_from_team_season_id: null,
        p_to_team_season_id: "team-season-2",
        p_transfer_type: "permanent",
        p_effective_from: "2026-07-23",
        p_note: null,
      });
    });

    it("returns 400 for missing required fields", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/transfers",
        { method: "POST", body: JSON.stringify({}) },
      );
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });
});
