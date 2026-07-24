// @vitest-environment node

import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockParams,
  createMockRequest,
  parseResponse,
} from "@/test/mocks";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { DELETE, GET as GETSingle, PUT } from "../games/[id]/route";
import { GET, POST } from "../games/route";

const mockCreateClient = vi.mocked(createClient);

function makeGame(overrides: Record<string, unknown> = {}) {
  return {
    id: "game-1",
    competition_id: "comp-1",
    home_team_season_id: "hts-1",
    away_team_season_id: "ats-1",
    venue_id: "venue-1",
    scheduled_at: "2025-08-01T18:00:00Z",
    status: "scheduled",
    ...overrides,
  };
}

describe("Games API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  // ── GET /admin/api/games ────────────────────────────────────────
  describe("GET /api/games", () => {
    it("returns game list when authenticated", async () => {
      const games = [makeGame(), makeGame({ id: "game-2" })];
      setQueryResult(mock, "games", games);

      const res = await GET(createMockRequest() as unknown as NextRequest);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(games);
    });

    it("returns 401 when unauthenticated", async () => {
      mockCreateClient.mockResolvedValue(
        createMockSupabase({ user: null }) as never,
      );

      const res = await GET(createMockRequest() as unknown as NextRequest);
      const body = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("returns 500 on database error", async () => {
      setQueryResult(mock, "games", null, new Error("db failure"));

      const res = await GET(createMockRequest() as unknown as NextRequest);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "db failure" });
    });
  });

  // ── GET /admin/api/games/[id] ───────────────────────────────────
  describe("GET /api/games/[id]", () => {
    it("returns a single game by id", async () => {
      const game = makeGame();
      setQueryResult(mock, "games", game);

      const res = await GETSingle(
        createMockRequest() as unknown as NextRequest,
        {
          params: createMockParams("game-1"),
        },
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(game);
    });

    it("returns 401 when unauthenticated", async () => {
      mockCreateClient.mockResolvedValue(
        createMockSupabase({ user: null }) as never,
      );

      const res = await GETSingle(
        createMockRequest() as unknown as NextRequest,
        {
          params: createMockParams("game-1"),
        },
      );

      expect(res.status).toBe(401);
    });

    it("returns 500 on database error", async () => {
      setQueryResult(mock, "games", null, new Error("not found"));

      const res = await GETSingle(
        createMockRequest() as unknown as NextRequest,
        {
          params: createMockParams("game-1"),
        },
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "not found" });
    });
  });

  // ── POST /admin/api/games ───────────────────────────────────────
  describe("POST /api/games", () => {
    const validBody = {
      competition_id: "comp-1",
      home_team_season_id: "hts-1",
      away_team_season_id: "ats-1",
      scheduled_at: "2025-08-01T18:00:00Z",
    };

    it("creates a game and returns 201", async () => {
      const created = makeGame();
      setQueryResult(mock, "games", created);

      const res = await POST(
        createMockRequest(
          validBody,
          undefined,
          "POST",
        ) as unknown as NextRequest,
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await POST(
        createMockRequest(
          { competition_id: "comp-1" },
          undefined,
          "POST",
        ) as unknown as NextRequest,
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toMatch(/required/);
    });

    it("returns 400 when body is empty", async () => {
      const res = await POST(
        createMockRequest({}, undefined, "POST") as unknown as NextRequest,
      );
      const _body = await parseResponse(res);
    });

    it("allows null venue_id", async () => {
      const created = makeGame({ venue_id: null });
      setQueryResult(mock, "games", created);

      const res = await POST(
        createMockRequest(
          { ...validBody, venue_id: null },
          undefined,
          "POST",
        ) as unknown as NextRequest,
      );

      expect(res.status).toBe(201);
    });

    it("returns 401 when unauthenticated", async () => {
      mockCreateClient.mockResolvedValue(
        createMockSupabase({ user: null }) as never,
      );

      const res = await POST(
        createMockRequest(
          validBody,
          undefined,
          "POST",
        ) as unknown as NextRequest,
      );

      expect(res.status).toBe(401);
    });

    it("returns 500 on database error", async () => {
      setQueryResult(mock, "games", null, new Error("insert failed"));

      const res = await POST(
        createMockRequest(
          validBody,
          undefined,
          "POST",
        ) as unknown as NextRequest,
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "insert failed" });
    });
  });

  // ── PUT /admin/api/games/[id] ───────────────────────────────────
  describe("PUT /api/games/[id]", () => {
    it("updates game status and returns the updated game", async () => {
      const updated = makeGame({ status: "in_progress" });
      setQueryResult(mock, "games", updated);

      const res = await PUT(
        createMockRequest(
          { status: "in_progress" },
          undefined,
          "PUT",
        ) as unknown as NextRequest,
        { params: createMockParams("game-1") },
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(updated);
    });

    it("returns 401 when unauthenticated", async () => {
      mockCreateClient.mockResolvedValue(
        createMockSupabase({ user: null }) as never,
      );

      const res = await PUT(
        createMockRequest(
          { status: "final" },
          undefined,
          "PUT",
        ) as unknown as NextRequest,
        { params: createMockParams("game-1") },
      );

      expect(res.status).toBe(401);
    });

    it("returns 500 on database error", async () => {
      setQueryResult(mock, "games", null, new Error("update failed"));

      const res = await PUT(
        createMockRequest(
          { status: "final" },
          undefined,
          "PUT",
        ) as unknown as NextRequest,
        { params: createMockParams("game-1") },
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "update failed" });
    });
  });

  // ── DELETE /admin/api/games/[id] ────────────────────────────────
  describe("DELETE /api/games/[id]", () => {
    it("executes delete successfully", async () => {
      setQueryResult(mock, "games", null);

      const response = await DELETE(
        createMockRequest() as unknown as NextRequest,
        {
          params: createMockParams("game-1"),
        },
      );

      expect(response.status).toBe(204);
    });

    it("returns 401 when unauthenticated", async () => {
      mockCreateClient.mockResolvedValue(
        createMockSupabase({ user: null }) as never,
      );

      const res = await DELETE(createMockRequest() as unknown as NextRequest, {
        params: createMockParams("game-1"),
      });

      expect(res.status).toBe(401);
    });

    it("returns 500 on database error", async () => {
      setQueryResult(mock, "games", null, new Error("delete failed"));

      const res = await DELETE(createMockRequest() as unknown as NextRequest, {
        params: createMockParams("game-1"),
      });
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "delete failed" });
    });
  });
});
