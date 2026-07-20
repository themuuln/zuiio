import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseResponse } from "@/test/mocks";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET } from "../ops/route";

const mockCreateClient = vi.mocked(createClient);

describe("Ops API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns all metrics when all queries succeed", async () => {
    const sessions = [
      {
        id: "session-1",
        game_id: "game-1",
        scorer_id: "user-1",
        role: "home",
        started_at: "2025-08-01T18:00:00Z",
        last_acknowledged_sequence: 5,
        profiles: { display_name: "Home Scorer" },
        games: { scheduled_at: "2025-08-01T18:00:00Z" },
      },
    ];

    // Tracker sessions → data query
    setQueryResult(mock, "tracker_sessions", sessions);
    // Source submissions → count query (head: true), store as array → count = length
    setQueryResult(mock, "source_submissions", new Array(3).fill({}));
    // Game revisions → count query (head: true)
    setQueryResult(mock, "game_revisions", new Array(2).fill({}));
    // Audit log → data query
    setQueryResult(mock, "audit_log", [
      {
        id: "audit-1",
        actor_id: "user-1",
        action: "create",
        entity: "game",
        entity_id: "game-1",
        created_at: "2025-08-01T18:00:00Z",
      },
    ]);
    // Stale games → data query
    setQueryResult(mock, "games", [
      {
        id: "game-old",
        scheduled_at: "2025-07-01T18:00:00Z",
        created_at: "2025-06-01T00:00:00Z",
      },
    ]);

    const res = await GET();
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.activeSessions).toEqual(sessions);
    expect(body.pendingSubmissions).toBe(3);
    expect(body.pendingRevisions).toBe(2);
    expect(body.auditLog).toHaveLength(1);
    expect(body.staleGames).toHaveLength(1);
  });

  it("returns zero counts when no pending items exist", async () => {
    setQueryResult(mock, "tracker_sessions", []);
    setQueryResult(mock, "source_submissions", []);
    setQueryResult(mock, "game_revisions", []);
    setQueryResult(mock, "audit_log", []);
    setQueryResult(mock, "games", []);

    const res = await GET();
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.activeSessions).toEqual([]);
    expect(body.pendingSubmissions).toBe(0);
    expect(body.pendingRevisions).toBe(0);
    expect(body.auditLog).toEqual([]);
    expect(body.staleGames).toEqual([]);
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ user: null }) as never,
    );

    const res = await GET();
    const body = await parseResponse(res);

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 when a query fails (sessions error)", async () => {
    setQueryResult(
      mock,
      "tracker_sessions",
      null,
      new Error("sessions table down"),
    );
    setQueryResult(mock, "source_submissions", []);
    setQueryResult(mock, "game_revisions", []);
    setQueryResult(mock, "audit_log", []);
    setQueryResult(mock, "games", []);

    const res = await GET();
    const body = await parseResponse(res);

    expect(res.status).toBe(500);
    expect(body.error).toContain("sessions table down");
  });

  it("returns 500 when a query fails (audit error)", async () => {
    setQueryResult(mock, "tracker_sessions", []);
    setQueryResult(mock, "source_submissions", []);
    setQueryResult(mock, "game_revisions", []);
    setQueryResult(mock, "audit_log", null, new Error("audit_log error"));
    setQueryResult(mock, "games", []);

    const res = await GET();
    const body = await parseResponse(res);

    expect(res.status).toBe(500);
    expect(body.error).toContain("audit_log error");
  });

  it("concatenates multiple error messages", async () => {
    setQueryResult(mock, "tracker_sessions", null, new Error("sessions down"));
    setQueryResult(mock, "source_submissions", []);
    setQueryResult(mock, "game_revisions", []);
    setQueryResult(mock, "audit_log", null, new Error("audit down"));
    setQueryResult(mock, "games", []);

    const res = await GET();
    const body = await parseResponse(res);

    expect(res.status).toBe(500);
    expect(body.error).toContain("sessions down");
    expect(body.error).toContain("audit down");
    expect(body.error).toContain("; ");
  });
});
