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
import { GET, POST, PUT, DELETE } from "../consent/route";

const mockCreateClient = vi.mocked(createClient);

const samplePolicy = {
  id: "policy-1",
  organization_id: "org-1",
  title: "Data Processing Consent",
  description: "Consent for processing player data",
  retention_days: 365,
  data_categories: ["biographic", "health"],
  is_active: true,
  created_at: "2026-07-23T00:00:00.000Z",
  updated_at: "2026-07-23T00:00:00.000Z",
};

const samplePolicy2 = {
  id: "policy-2",
  organization_id: "org-1",
  title: "Photo Usage Consent",
  description: "Consent for using player photos",
  retention_days: 365,
  data_categories: ["photos"],
  is_active: true,
  created_at: "2026-07-22T00:00:00.000Z",
  updated_at: "2026-07-22T00:00:00.000Z",
};

describe("Org Consent API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /api/admin/org/consent", () => {
    it("lists consent policies for an org", async () => {
      setQueryResult(mock, "consent_policies", [
        samplePolicy,
        samplePolicy2,
      ]);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent?org_id=org-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([samplePolicy, samplePolicy2]);
    });

    it("returns empty array when no policies exist", async () => {
      setQueryResult(mock, "consent_policies", []);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent?org_id=org-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("returns 400 when org_id is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "org_id parameter is required" });
    });

    it("returns 400 on query error", async () => {
      setQueryResult(
        mock,
        "consent_policies",
        null,
        new Error("Query failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent?org_id=org-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Query failed" });
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase({ user: null });
      mockCreateClient.mockResolvedValue(noUserMock as never);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent?org_id=org-1",
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/admin/org/consent", () => {
    it("creates a consent policy", async () => {
      const created = {
        id: "policy-new",
        organization_id: "org-1",
        title: "New Policy",
        description: null,
        retention_days: 365,
        data_categories: [],
        is_active: true,
      };
      setQueryResult(mock, "consent_policies", created);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent",
        {
          method: "POST",
          body: JSON.stringify({
            organization_id: "org-1",
            title: "New Policy",
          }),
        },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(created);
    });

    it("creates policy with optional fields", async () => {
      const created = {
        id: "policy-new",
        organization_id: "org-1",
        title: "Detailed Policy",
        description: "Full description",
        retention_days: 180,
        data_categories: ["health"],
        is_active: false,
      };
      setQueryResult(mock, "consent_policies", created);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent",
        {
          method: "POST",
          body: JSON.stringify({
            organization_id: "org-1",
            title: "Detailed Policy",
            description: "Full description",
            retention_days: 180,
            data_categories: ["health"],
            is_active: false,
          }),
        },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.retention_days).toBe(180);
      expect(body.data_categories).toEqual(["health"]);
      expect(body.is_active).toBe(false);
    });

    it("returns 400 when required fields are missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent",
        { method: "POST", body: JSON.stringify({}) },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({
        error: "organization_id and title are required",
      });
    });

    it("returns 400 on insert error", async () => {
      setQueryResult(
        mock,
        "consent_policies",
        null,
        new Error("Insert failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent",
        {
          method: "POST",
          body: JSON.stringify({
            organization_id: "org-1",
            title: "New Policy",
          }),
        },
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Insert failed" });
    });
  });

  describe("PUT /api/admin/org/consent", () => {
    it("updates a consent policy", async () => {
      const now = new Date().toISOString();
      const updated = {
        ...samplePolicy,
        title: "Updated Title",
        updated_at: now,
      };
      setQueryResult(mock, "consent_policies", updated);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent?id=policy-1",
        {
          method: "PUT",
          body: JSON.stringify({ title: "Updated Title" }),
        },
      );
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.title).toBe("Updated Title");
      expect(typeof body.updated_at).toBe("string");
      expect(body.updated_at).toBe(now);
    });

    it("returns 400 when id query param is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent",
        { method: "PUT", body: JSON.stringify({ title: "X" }) },
      );
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({
        error: "id query parameter is required",
      });
    });

    it("returns 400 on update error", async () => {
      setQueryResult(
        mock,
        "consent_policies",
        null,
        new Error("Update failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent?id=policy-1",
        {
          method: "PUT",
          body: JSON.stringify({ title: "Updated Title" }),
        },
      );
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Update failed" });
    });
  });

  describe("DELETE /api/admin/org/consent", () => {
    it("deletes a consent policy", async () => {
      setQueryResult(mock, "consent_policies", null);

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent",
        {
          method: "DELETE",
          body: JSON.stringify({ id: "policy-1" }),
        },
      );
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true });
    });

    it("returns 400 when id is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent",
        { method: "DELETE", body: JSON.stringify({}) },
      );
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "id is required" });
    });

    it("returns 400 on delete error", async () => {
      setQueryResult(
        mock,
        "consent_policies",
        null,
        new Error("Delete failed"),
      );

      const req = new NextRequest(
        "http://localhost:3000/admin/api/org/consent",
        {
          method: "DELETE",
          body: JSON.stringify({ id: "policy-1" }),
        },
      );
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Delete failed" });
    });
  });
});
