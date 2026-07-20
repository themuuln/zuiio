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
import { GET, POST } from "../players/route";

const mockCreateClient = vi.mocked(createClient);

const samplePlayer = {
  id: "player-1",
  canonical_name: "Batzorig Erdene",
  name_latin: "Batzorig Erdene",
  position: "PG",
  nationality: "Mongolian",
  visibility: "public",
  consent_recorded_at: null,
  consent_note: null,
};

const samplePlayer2 = {
  id: "player-2",
  canonical_name: "Bat-Erdene Bold",
  name_latin: "Bat-Erdene Bold",
  position: "SF",
  nationality: "Mongolian",
  visibility: "public",
  consent_recorded_at: null,
  consent_note: null,
};

describe("Players API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /api/admin/players", () => {
    it("returns all players", async () => {
      setQueryResult(mock, "players", [samplePlayer, samplePlayer2]);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/players",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([samplePlayer, samplePlayer2]);
    });

    it("filters by search using or() with ilike on canonical_name and name_latin", async () => {
      setQueryResult(mock, "players", [samplePlayer]);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/players?search=Batzorig",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([samplePlayer]);
    });

    it("returns empty array when no players match search", async () => {
      setQueryResult(mock, "players", []);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/players?search=zzzzz",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase();
      noUserMock.auth = {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      };
      mockCreateClient.mockResolvedValue(noUserMock as never);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/players",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("returns 500 on query error", async () => {
      setQueryResult(mock, "players", null, new Error("DB connection failed"));
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/players",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "DB connection failed" });
    });
  });

  describe("POST /api/admin/players", () => {
    const validBody = {
      canonical_name: "Batzorig Erdene",
      name_latin: "Batzorig Erdene",
      position: "PG",
      nationality: "Mongolian",
      visibility: "public",
    };

    it("creates a player with valid body and returns 201", async () => {
      const created = {
        id: "player-new",
        ...validBody,
        consent_recorded_at: null,
        consent_note: null,
      };
      setQueryResult(mock, "players", created);
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/players",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body).toEqual(created);
    });

    it("defaults optional fields to null and visibility to public", async () => {
      const minimal = { canonical_name: "New Player" };
      const created = {
        id: "player-new",
        canonical_name: "New Player",
        name_latin: null,
        position: null,
        nationality: null,
        visibility: "public",
        consent_recorded_at: null,
        consent_note: null,
      };
      setQueryResult(mock, "players", created);
      const req = createMockRequest(
        minimal,
        "http://localhost:3000/admin/api/players",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 when canonical_name is missing", async () => {
      const incomplete = { position: "PG", nationality: "Mongolian" };
      const req = createMockRequest(
        incomplete,
        "http://localhost:3000/admin/api/players",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "canonical_name is required" });
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase();
      noUserMock.auth = {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      };
      mockCreateClient.mockResolvedValue(noUserMock as never);
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/players",
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
        "players",
        null,
        new Error("unique constraint violation"),
      );
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/players",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "unique constraint violation" });
    });
  });
});
