import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, parseResponse } from "@/test/mocks";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET, POST } from "../teams/route";

const mockCreateClient = vi.mocked(createClient);

const sampleTeam = {
  id: "team-1",
  league_id: "league-1",
  name: "Eagles",
  short_code: "EGL",
  slug: "eagles",
  primary_color: "#FF0000",
  leagues: { name: "Mongolia Basketball League" },
};

const sampleTeam2 = {
  id: "team-2",
  league_id: "league-2",
  name: "Lions",
  short_code: "LION",
  slug: "lions",
  primary_color: "#0000FF",
  leagues: { name: "Premier League" },
};

describe("Teams API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /api/admin/teams", () => {
    it("returns all teams", async () => {
      setQueryResult(mock, "teams", [sampleTeam, sampleTeam2]);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/teams",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([sampleTeam, sampleTeam2]);
    });

    it("filters by league_id when provided", async () => {
      setQueryResult(mock, "teams", [sampleTeam]);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/teams?league_id=league-1",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([sampleTeam]);
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase();
      noUserMock.auth = {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      };
      mockCreateClient.mockResolvedValue(noUserMock as never);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/teams",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("returns 500 on query error", async () => {
      setQueryResult(mock, "teams", null, new Error("DB connection failed"));
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/teams",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "DB connection failed" });
    });
  });

  describe("POST /api/admin/teams", () => {
    const validBody = {
      league_id: "league-1",
      name: "Eagles",
      short_code: "EGL",
      slug: "eagles",
      primary_color: "#FF0000",
    };

    it("creates a team with valid body and returns 201", async () => {
      const created = {
        id: "team-new",
        ...validBody,
        leagues: { name: "Mongolia Basketball League" },
      };
      setQueryResult(mock, "teams", created);
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/teams",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body).toEqual(created);
    });

    it("defaults primary_color to null when omitted", async () => {
      const { primary_color: _, ...bodyWithoutColor } = validBody;
      const created = {
        id: "team-new",
        ...bodyWithoutColor,
        primary_color: null,
        leagues: { name: "Mongolia Basketball League" },
      };
      setQueryResult(mock, "teams", created);
      const req = createMockRequest(
        bodyWithoutColor,
        "http://localhost:3000/admin/api/teams",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body.primary_color).toBeNull();
    });

    it("returns 400 when league_id is missing", async () => {
      const { league_id: _, ...incomplete } = validBody;
      const req = createMockRequest(
        incomplete,
        "http://localhost:3000/admin/api/teams",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({
        error: "league_id, name, short_code, and slug are required",
      });
    });

    it("returns 400 when name is missing", async () => {
      const { name: _, ...incomplete } = validBody;
      const req = createMockRequest(
        incomplete,
        "http://localhost:3000/admin/api/teams",
        "POST",
      );
      const res = await POST(req as never);
      const _body = await parseResponse(res);

      expect(res.status).toBe(400);
    });

    it("returns 400 when short_code is missing", async () => {
      const { short_code: _, ...incomplete } = validBody;
      const req = createMockRequest(
        incomplete,
        "http://localhost:3000/admin/api/teams",
        "POST",
      );
      const res = await POST(req as never);
      const _body = await parseResponse(res);

      expect(res.status).toBe(400);
    });

    it("returns 400 when slug is missing", async () => {
      const { slug: _, ...incomplete } = validBody;
      const req = createMockRequest(
        incomplete,
        "http://localhost:3000/admin/api/teams",
        "POST",
      );
      const res = await POST(req as never);
      const _body = await parseResponse(res);

      expect(res.status).toBe(400);
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase();
      noUserMock.auth = {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      };
      mockCreateClient.mockResolvedValue(noUserMock as never);
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/teams",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("returns 500 on insert error", async () => {
      setQueryResult(
        mock,
        "teams",
        null,
        new Error("unique constraint violation"),
      );
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/teams",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "unique constraint violation" });
    });
  });
});
