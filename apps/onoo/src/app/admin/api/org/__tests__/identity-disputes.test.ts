import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, parseResponse } from "@/test/mocks";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";
import type { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET, POST } from "../identity-disputes/route";

const mockCreateClient = vi.mocked(createClient);

/**
 * Wraps createMockRequest to also set the standard Request.url string,
 * which the route handler reads via new URL(request.url).
 */
function makeRequest(
  body: Record<string, unknown> | undefined,
  url: string,
  method = "GET",
): NextRequest {
  const req = createMockRequest(body, url, method) as NextRequest & {
    url: string;
  };
  req.url = url;
  return req as NextRequest;
}

const sampleDispute = {
  id: "dispute-1",
  player_id: "player-1",
  competition_id: "comp-1",
  dispute_reason: "wrong_player",
  description: "This player is not who they claim to be",
  status: "open",
  submitted_by: "admin-1",
  resolved_by: null,
  resolution_notes: null,
  submitted_at: "2026-07-23T00:00:00Z",
  resolved_at: null,
  updated_at: "2026-07-23T00:00:00Z",
  players: {
    canonical_name: "Batzorig Erdene",
    photo_url: null,
  },
  competitions: {
    name: "Mongolia Basketball League",
  },
};

const sampleDispute2 = {
  id: "dispute-2",
  player_id: "player-2",
  competition_id: null,
  dispute_reason: "duplicate",
  description: "Duplicate entry for this player",
  status: "resolved",
  submitted_by: "admin-2",
  resolved_by: "admin-1",
  resolution_notes: "Merged with existing profile",
  submitted_at: "2026-07-22T00:00:00Z",
  resolved_at: "2026-07-23T00:00:00Z",
  updated_at: "2026-07-23T00:00:00Z",
  players: {
    canonical_name: "Bat-Erdene Bold",
    photo_url: null,
  },
  competitions: null,
};

describe("identity disputes API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /api/admin/org/identity-disputes", () => {
    it("GET lists disputes", async () => {
      setQueryResult(mock, "identity_disputes", [sampleDispute, sampleDispute2]);
      const req = makeRequest(
        undefined,
        "http://localhost:3000/admin/api/org/identity-disputes",
      );
      const res = await GET(req);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([sampleDispute, sampleDispute2]);
    });

    it("GET filters by status", async () => {
      setQueryResult(mock, "identity_disputes", [sampleDispute]);
      const req = makeRequest(
        undefined,
        "http://localhost:3000/admin/api/org/identity-disputes?status=open",
      );
      const res = await GET(req);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([sampleDispute]);
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase({ user: null });
      mockCreateClient.mockResolvedValue(noUserMock as never);
      const req = makeRequest(
        undefined,
        "http://localhost:3000/admin/api/org/identity-disputes",
      );
      const res = await GET(req);
      const body = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("returns 500 on query error", async () => {
      setQueryResult(
        mock,
        "identity_disputes",
        null,
        new Error("connection refused"),
      );
      const req = makeRequest(
        undefined,
        "http://localhost:3000/admin/api/org/identity-disputes",
      );
      const res = await GET(req);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "connection refused" });
    });
  });

  describe("POST /api/admin/org/identity-disputes", () => {
    const createBody = {
      player_id: "player-1",
      dispute_reason: "wrong_player",
      description: "This player is not who they claim to be",
    };

    const resolveBody = {
      id: "dispute-1",
      status: "resolved",
      resolution_notes: "Verified identity, all good",
    };

    it("POST creates a new dispute", async () => {
      const created = {
        id: "new-dispute-id",
        ...createBody,
        status: "open",
        submitted_by: "admin-user-id",
      };
      setQueryResult(mock, "identity_disputes", created);
      const req = makeRequest(
        createBody,
        "http://localhost:3000/admin/api/org/identity-disputes",
        "POST",
      );
      const res = await POST(req);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(created);
    });

    it("POST resolves a dispute", async () => {
      const resolved = {
        id: "dispute-1",
        status: "resolved",
        resolution_notes: "Verified identity, all good",
        resolved_by: "admin-user-id",
      };
      setQueryResult(mock, "identity_disputes", resolved);
      const req = makeRequest(
        resolveBody,
        "http://localhost:3000/admin/api/org/identity-disputes",
        "POST",
      );
      const res = await POST(req);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(resolved);
    });

    it("POST returns 400 for missing required fields", async () => {
      const req = makeRequest(
        {},
        "http://localhost:3000/admin/api/org/identity-disputes",
        "POST",
      );
      const res = await POST(req);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({
        error: "player_id, dispute_reason, and description are required",
      });
    });

    it("POST returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase({ user: null });
      mockCreateClient.mockResolvedValue(noUserMock as never);
      const req = makeRequest(
        createBody,
        "http://localhost:3000/admin/api/org/identity-disputes",
        "POST",
      );
      const res = await POST(req);
      const body = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("POST returns 500 on insert error", async () => {
      setQueryResult(
        mock,
        "identity_disputes",
        null,
        new Error("foreign key violation"),
      );
      const req = makeRequest(
        createBody,
        "http://localhost:3000/admin/api/org/identity-disputes",
        "POST",
      );
      const res = await POST(req);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "foreign key violation" });
    });
  });
});
