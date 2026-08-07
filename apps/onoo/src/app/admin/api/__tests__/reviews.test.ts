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
import { DELETE, GET as GetById, PUT } from "../reviews/[id]/route";
import { GET, POST } from "../reviews/route";

const mockCreateClient = vi.mocked(createClient);

const sampleReview = {
  id: "review-1",
  product_id: "prod-1",
  author_name: "John Doe",
  rating: 4,
  content: "Great product!",
  is_approved: true,
  created_at: "2025-01-15T10:00:00Z",
  products: { name: "Basketball Jersey" },
};

const sampleReview2 = {
  id: "review-2",
  product_id: "prod-2",
  author_name: "Jane Smith",
  rating: 5,
  content: "Excellent quality!",
  is_approved: false,
  created_at: "2025-01-16T10:00:00Z",
  products: { name: "Training Cones" },
};

const sampleCreatedReview = {
  id: "review-new",
  product_id: "prod-1",
  author_name: "Alice",
  rating: 5,
  content: "Amazing!",
  is_approved: false,
  products: { name: "Basketball Jersey" },
};

describe("Reviews API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /api/admin/reviews", () => {
    it("returns all reviews with product name join", async () => {
      setQueryResult(mock, "product_reviews", [sampleReview, sampleReview2]);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/reviews",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([sampleReview, sampleReview2]);
    });

    it("returns empty array when no reviews", async () => {
      setQueryResult(mock, "product_reviews", []);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/reviews",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("returns 500 on query error", async () => {
      setQueryResult(
        mock,
        "product_reviews",
        null,
        new Error("Database error"),
      );
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/reviews",
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
        "http://localhost:3000/admin/api/reviews",
      );
      const res = await GET(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/admin/reviews", () => {
    const validBody = {
      product_id: "prod-1",
      author_name: "Alice",
      rating: 5,
      content: "Amazing!",
    };

    it("creates a review with valid body and returns 201", async () => {
      setQueryResult(mock, "product_reviews", sampleCreatedReview);
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/reviews",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body).toEqual(sampleCreatedReview);
    });

    it("defaults is_approved to false and content to empty string when omitted", async () => {
      const minimalBody = {
        product_id: "prod-1",
        author_name: "Alice",
        rating: 5,
      };
      const created = {
        id: "review-new",
        ...minimalBody,
        content: "",
        is_approved: false,
        products: { name: "Basketball Jersey" },
      };
      setQueryResult(mock, "product_reviews", created);
      const req = createMockRequest(
        minimalBody,
        "http://localhost:3000/admin/api/reviews",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body.content).toBe("");
      expect(body.is_approved).toBe(false);
    });

    it("returns 400 when product_id is missing", async () => {
      const { product_id: _, ...incomplete } = validBody;
      const req = createMockRequest(
        incomplete,
        "http://localhost:3000/admin/api/reviews",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Бүтээгдэхүүн шаардлагатай" });
    });

    it("returns 400 when author_name is missing", async () => {
      const { author_name: _, ...incomplete } = validBody;
      const req = createMockRequest(
        incomplete,
        "http://localhost:3000/admin/api/reviews",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Нэр шаардлагатай" });
    });

    it("returns 400 when rating is missing", async () => {
      const { rating: _, ...incomplete } = validBody;
      const req = createMockRequest(
        incomplete,
        "http://localhost:3000/admin/api/reviews",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Үнэлгээ 1-5 байх ёстой" });
    });

    it("returns 400 when rating is not a number", async () => {
      const req = createMockRequest(
        { ...validBody, rating: "five" },
        "http://localhost:3000/admin/api/reviews",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Үнэлгээ 1-5 байх ёстой" });
    });

    it("returns 400 when rating is below 1", async () => {
      const req = createMockRequest(
        { ...validBody, rating: 0 },
        "http://localhost:3000/admin/api/reviews",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Үнэлгээ 1-5 байх ёстой" });
    });

    it("returns 400 when rating is above 5", async () => {
      const req = createMockRequest(
        { ...validBody, rating: 6 },
        "http://localhost:3000/admin/api/reviews",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Үнэлгээ 1-5 байх ёстой" });
    });

    it("returns 500 on insert error", async () => {
      setQueryResult(
        mock,
        "product_reviews",
        null,
        new Error("insert violation"),
      );
      const req = createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/reviews",
        "POST",
      );
      const res = await POST(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "insert violation" });
    });
  });

  describe("GET /api/admin/reviews/[id]", () => {
    it("returns a single review by id", async () => {
      setQueryResult(mock, "product_reviews", sampleReview);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/reviews/review-1",
      );
      const routeParams = { params: createMockParams("review-1") };
      const res = await GetById(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(sampleReview);
    });

    it("returns 200 with null when review is not found", async () => {
      setQueryResult(mock, "product_reviews", null);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/reviews/review-999",
      );
      const routeParams = { params: createMockParams("review-999") };
      const res = await GetById(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toBeNull();
    });

    it("returns 500 on query error", async () => {
      setQueryResult(mock, "product_reviews", null, new Error("Not found"));
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/reviews/review-1",
      );
      const routeParams = { params: createMockParams("review-1") };
      const res = await GetById(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "Not found" });
    });
  });

  describe("PUT /api/admin/reviews/[id]", () => {
    const updateBody = { rating: 3, content: "Updated review" };
    const updatedReview = {
      ...sampleReview,
      rating: 3,
      content: "Updated review",
    };

    it("updates a review and returns the updated record", async () => {
      setQueryResult(mock, "product_reviews", updatedReview);
      const req = createMockRequest(
        updateBody,
        "http://localhost:3000/admin/api/reviews/review-1",
        "PUT",
      );
      const routeParams = { params: createMockParams("review-1") };
      const res = await PUT(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(updatedReview);
    });

    it("returns 500 on update error", async () => {
      setQueryResult(mock, "product_reviews", null, new Error("Update failed"));
      const req = createMockRequest(
        updateBody,
        "http://localhost:3000/admin/api/reviews/review-1",
        "PUT",
      );
      const routeParams = { params: createMockParams("review-1") };
      const res = await PUT(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "Update failed" });
    });
  });

  describe("DELETE /api/admin/reviews/[id]", () => {
    it("deletes a review and returns 204", async () => {
      setQueryResult(mock, "product_reviews", sampleReview);
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/reviews/review-1",
        "DELETE",
      );
      const routeParams = { params: createMockParams("review-1") };
      const res = await DELETE(req as never, routeParams);

      expect(res.status).toBe(204);
    });

    it("returns 500 on delete error", async () => {
      setQueryResult(mock, "product_reviews", null, new Error("Delete failed"));
      const req = createMockRequest(
        undefined,
        "http://localhost:3000/admin/api/reviews/review-1",
        "DELETE",
      );
      const routeParams = { params: createMockParams("review-1") };
      const res = await DELETE(req as never, routeParams);
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "Delete failed" });
    });
  });
});
