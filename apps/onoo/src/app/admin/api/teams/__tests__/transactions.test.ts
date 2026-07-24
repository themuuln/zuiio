import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET, POST, PUT } from "../transactions/route";

const mockCreateClient = vi.mocked(createClient);

const sampleTransaction = {
  id: "tx-1",
  team_season_id: "ts-1",
  type: "expense",
  description: "Court rental fee",
  amount_mnt: 50000,
  paid_at: null,
  paid_by: null,
  created_by: "admin-user-id",
  created_at: "2026-07-23T00:00:00.000Z",
  team_seasons: { id: "ts-1", teams: { name: "Eagles" } },
};

const sampleTransaction2 = {
  id: "tx-2",
  team_season_id: "ts-2",
  type: "income",
  description: "Sponsorship",
  amount_mnt: 200000,
  paid_at: null,
  paid_by: null,
  created_by: "admin-user-id",
  created_at: "2026-07-22T00:00:00.000Z",
  team_seasons: { id: "ts-2", teams: { name: "Falcons" } },
};

describe("Teams Transactions API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /api/admin/teams/transactions", () => {
    it("returns all transactions", async () => {
      setQueryResult(mock, "team_transactions", [
        sampleTransaction,
        sampleTransaction2,
      ]);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
      );
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([sampleTransaction, sampleTransaction2]);
    });

    it("returns empty array when no transactions exist", async () => {
      setQueryResult(mock, "team_transactions", []);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
      );
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("returns 500 on query error", async () => {
      setQueryResult(
        mock,
        "team_transactions",
        null,
        new Error("DB connection failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
      );
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "DB connection failed" });
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase({ user: null });
      mockCreateClient.mockResolvedValue(noUserMock as never);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
      );
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/admin/teams/transactions", () => {
    const validBody = {
      team_season_id: "ts-1",
      type: "expense",
      description: "New uniforms",
      amount_mnt: 120000,
    };

    it("creates a transaction", async () => {
      const created = {
        id: "tx-new",
        ...validBody,
        created_by: "admin-user-id",
        team_seasons: { id: "ts-1", teams: { name: "Eagles" } },
      };
      setQueryResult(mock, "team_transactions", created);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
        { method: "POST", body: JSON.stringify(validBody) },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(created);
    });

    it("returns 400 when required fields are missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
        { method: "POST", body: JSON.stringify({}) },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({
        error:
          "team_season_id, type, description, and amount_mnt are required",
      });
    });

    it("returns 500 on insert error", async () => {
      setQueryResult(
        mock,
        "team_transactions",
        null,
        new Error("Insert failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
        { method: "POST", body: JSON.stringify(validBody) },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "Insert failed" });
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase({ user: null });
      mockCreateClient.mockResolvedValue(noUserMock as never);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
        { method: "POST", body: JSON.stringify(validBody) },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("PUT /api/admin/teams/transactions", () => {
    it("marks a transaction as paid", async () => {
      const now = new Date().toISOString();
      const paid = {
        id: "tx-1",
        team_season_id: "ts-1",
        type: "expense",
        description: "Court rental fee",
        amount_mnt: 50000,
        paid_at: now,
        paid_by: "admin-user-id",
        created_by: "admin-user-id",
        created_at: "2026-07-23T00:00:00.000Z",
        team_seasons: { id: "ts-1", teams: { name: "Eagles" } },
      };
      setQueryResult(mock, "team_transactions", paid);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
        { method: "PUT", body: JSON.stringify({ id: "tx-1" }) },
      );
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(typeof body.paid_at).toBe("string");
      expect(body.paid_by).toBe("admin-user-id");
      expect(body.paid_at).toBe(now);
    });

    it("returns 400 when id is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
        { method: "PUT", body: JSON.stringify({}) },
      );
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "id is required" });
    });

    it("returns 500 on update error", async () => {
      setQueryResult(
        mock,
        "team_transactions",
        null,
        new Error("Update failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
        { method: "PUT", body: JSON.stringify({ id: "non-existent" }) },
      );
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "Update failed" });
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase({ user: null });
      mockCreateClient.mockResolvedValue(noUserMock as never);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/teams/transactions",
        { method: "PUT", body: JSON.stringify({ id: "tx-1" }) },
      );
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });
});
