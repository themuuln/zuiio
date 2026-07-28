import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, parseResponse } from "@/test/mocks";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET, POST } from "../bundles/route";
import { GET as GetById, PUT, DELETE } from "../bundles/[id]/route";

const mockCreateClient = vi.mocked(createClient);

const sampleBundle = {
  id: "bundle-1",
  name: "Summer Sale Pack",
  description: "Great summer deals",
  discount_percent: 15,
  is_active: true,
  created_at: "2025-01-15T10:00:00Z",
};

const sampleBundle2 = {
  id: "bundle-2",
  name: "Starter Kit",
  description: null,
  discount_percent: 10,
  is_active: false,
  created_at: "2025-01-16T10:00:00Z",
};

const sampleCreatedBundle = {
  id: "bundle-new",
  name: "New Bundle",
  description: null,
  discount_percent: 20,
  is_active: true,
};

describe("Bundles API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /api/admin/bundles", () => {
    it("returns all bundles", async () => {
      setQueryResult(mock, "product_bundles", [sampleBundle, sampleBundle2]);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/bundles",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([sampleBundle, sampleBundle2]);
    });

    it("returns empty array when no bundles", async () => {
      setQueryResult(mock, "product_bundles", []);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/bundles",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("returns 500 on query error", async () => {
      setQueryResult(
        mock,
        "product_bundles",
        null,
        new Error("Database error"),
      );
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/bundles",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "Database error" });
    });

    it("returns 401 when user is not authenticated", async () => {
      const noUserMock = createMockSupabase();
      noUserMock.auth = {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
      };
      mockCreateClient.mockResolvedValue(noUserMock as never);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/bundles",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/admin/bundles", () => {
    const validBody = {
      name: "New Bundle",
      discount_percent: 20,
    };

    it("creates a bundle with valid body and returns 201", async () => {
      setQueryResult(mock, "product_bundles", sampleCreatedBundle);
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/bundles",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body).toEqual(sampleCreatedBundle);
    });

    it("uses default is_active=true when omitted", async () => {
      const created = {
        id: "bundle-new",
        name: "New Bundle",
        description: null,
        discount_percent: 20,
        is_active: true,
      };
      setQueryResult(mock, "product_bundles", created);
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/bundles",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body.is_active).toBe(true);
    });

    it("accepts is_active=false when provided", async () => {
      const created = {
        id: "bundle-new",
        name: "New Bundle",
        description: null,
        discount_percent: 20,
        is_active: false,
      };
      setQueryResult(mock, "product_bundles", created);
      const req = createMockRequest(
        { ...validBody, is_active: false },
        "http://localhost:3000/admin/api/bundles",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body.is_active).toBe(false);
    });

    it("returns 400 when name is missing", async () => {
      const { name: _, ...incomplete } = validBody;
      const req = createMockRequest(
        incomplete,
        "http://localhost:3000/admin/api/bundles",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Нэр шаардлагатай" });
    });

    it("returns 400 when discount_percent is missing", async () => {
      const { discount_percent: _, ...incomplete } = validBody;
      const req = createMockRequest(
        incomplete,
        "http://localhost:3000/admin/api/bundles",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Хямдрал шаардлагатай" });
    });

    it("returns 400 when discount_percent is not a number", async () => {
      const req = createMockRequest(
        { ...validBody, discount_percent: "twenty" },
        "http://localhost:3000/admin/api/bundles",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Хямдрал шаардлагатай" });
    });

    it("returns 500 on insert error", async () => {
      setQueryResult(
        mock,
        "product_bundles",
        null,
        new Error("insert violation"),
      );
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/bundles",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "insert violation" });
    });
  });

  describe("GET /api/admin/bundles/[id]", () => {
    it("returns a single bundle by id", async () => {
      setQueryResult(mock, "product_bundles", sampleBundle);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/bundles/bundle-1",
      );
      const routeParams = { params: createMockParams("bundle-1") };
      const res = await GetById(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(sampleBundle);
    });

    it("returns 200 with null when bundle is not found", async () => {
      setQueryResult(mock, "product_bundles", null);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/bundles/bundle-999",
      );
      const routeParams = { params: createMockParams("bundle-999") };
      const res = await GetById(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toBeNull();
    });

    it("returns 500 on query error", async () => {
      setQueryResult(
        mock,
        "product_bundles",
        null,
        new Error("Not found"),
      );
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/bundles/bundle-1",
      );
      const routeParams = { params: createMockParams("bundle-1") };
      const res = await GetById(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "Not found" });
    });
  });

  describe("PUT /api/admin/bundles/[id]", () => {
    const updateBody = { name: "Updated Bundle", discount_percent: 25 };
    const updatedBundle = {
      ...sampleBundle,
      name: "Updated Bundle",
      discount_percent: 25,
    };

    it("updates a bundle and returns the updated record", async () => {
      setQueryResult(mock, "product_bundles", updatedBundle);
      const req = createMockRequest(
        updateBody,
        "http://localhost:3000/admin/api/bundles/bundle-1",
        "PUT",
      );
      const routeParams = { params: createMockParams("bundle-1") };
      const res = await PUT(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(updatedBundle);
    });

    it("returns 500 on update error", async () => {
      setQueryResult(
        mock,
        "product_bundles",
        null,
        new Error("Update failed"),
      );
      const req = createMockRequest(
        updateBody,
        "http://localhost:3000/admin/api/bundles/bundle-1",
        "PUT",
      );
      const routeParams = { params: createMockParams("bundle-1") };
      const res = await PUT(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "Update failed" });
    });
  });

  describe("DELETE /api/admin/bundles/[id]", () => {
    it("deletes a bundle and returns 204", async () => {
      setQueryResult(mock, "product_bundles", sampleBundle);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/bundles/bundle-1",
        "DELETE",
      );
      const routeParams = { params: createMockParams("bundle-1") };
      const res = await DELETE(req as never, routeParams);

      expect(res.status).toBe(204);
    });

    it("returns 500 on delete error", async () => {
      setQueryResult(
        mock,
        "product_bundles",
        null,
        new Error("Delete failed"),
      );
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/bundles/bundle-1",
        "DELETE",
      );
      const routeParams = { params: createMockParams("bundle-1") };
      const res = await DELETE(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "Delete failed" });
    });
  });
});
