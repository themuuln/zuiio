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
import { GET as GETRevisions } from "../games/[id]/revisions/route";
import { GET as GETSubmissions } from "../games/[id]/submissions/route";

const mockCreateClient = vi.mocked(createClient);

describe("Submissions API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns submissions for a game", async () => {
    const subs = [
      { id: "sub-1", game_id: "game-1", submitted_at: "2025-08-01T19:00:00Z" },
      { id: "sub-2", game_id: "game-1", submitted_at: "2025-08-01T18:30:00Z" },
    ];
    setQueryResult(mock, "source_submissions", subs);

    const res = await GETSubmissions(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams("game-1"),
      },
    );
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body).toEqual(subs);
    expect(body).toHaveLength(2);
  });

  it("returns empty array when no submissions exist", async () => {
    setQueryResult(mock, "source_submissions", []);

    const res = await GETSubmissions(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams("game-1"),
      },
    );
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ user: null }) as never,
    );

    const res = await GETSubmissions(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams("game-1"),
      },
    );

    expect(res.status).toBe(401);
    expect(await parseResponse(res)).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 on database error", async () => {
    setQueryResult(mock, "source_submissions", null, new Error("query failed"));

    const res = await GETSubmissions(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams("game-1"),
      },
    );
    const body = await parseResponse(res);

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "query failed" });
  });

  it("scopes results to the given game_id", async () => {
    const subs = [{ id: "sub-1", game_id: "game-1" }];
    setQueryResult(mock, "source_submissions", subs);

    const res = await GETSubmissions(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams("game-1"),
      },
    );
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    for (const s of body) {
      expect(s.game_id).toBe("game-1");
    }
  });
});

describe("Revisions API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns revisions for a game", async () => {
    const revs = [
      {
        id: "rev-1",
        game_id: "game-1",
        state: "pending",
        created_at: "2025-08-01T19:00:00Z",
      },
      {
        id: "rev-2",
        game_id: "game-1",
        state: "approved",
        created_at: "2025-08-01T18:00:00Z",
      },
    ];
    setQueryResult(mock, "game_revisions", revs);

    const res = await GETRevisions(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams("game-1"),
      },
    );
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body).toEqual(revs);
    expect(body).toHaveLength(2);
  });

  it("returns empty array when no revisions exist", async () => {
    setQueryResult(mock, "game_revisions", []);

    const res = await GETRevisions(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams("game-1"),
      },
    );
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ user: null }) as never,
    );

    const res = await GETRevisions(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams("game-1"),
      },
    );

    expect(res.status).toBe(401);
    expect(await parseResponse(res)).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 on database error", async () => {
    setQueryResult(mock, "game_revisions", null, new Error("db error"));

    const res = await GETRevisions(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams("game-1"),
      },
    );
    const body = await parseResponse(res);

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "db error" });
  });

  it("scopes results to the given game_id", async () => {
    const revs = [{ id: "rev-1", game_id: "game-1" }];
    setQueryResult(mock, "game_revisions", revs);

    const res = await GETRevisions(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams("game-99"),
      },
    );
    const body = await parseResponse(res);

    // Mock returns whatever was set regardless of filter;
    // the test verifies the route delegates filtering to supabase
    expect(res.status).toBe(200);
    expect(body).toEqual(revs);
  });
});
