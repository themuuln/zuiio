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
import {
  GET as GETOrders,
  POST as POSTOrders,
} from "../admin/api/orders/route";
import {
  DELETE as DELETEProduct,
  PUT as PUTProduct,
} from "../admin/api/products/[id]/route";
import {
  GET as GETProducts,
  POST as POSTProducts,
} from "../admin/api/products/route";

const mockCreateClient = vi.mocked(createClient);

interface MockWithRpc extends MockFrom {
  _queryResults: Map<string, unknown>;
  rpc: ReturnType<typeof vi.fn>;
}

function mkMock(): MockWithRpc {
  const m = createMockSupabase() as MockWithRpc;
  m.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
  return m;
}

// ──────────────────────────────────────────────
//  Admin Products API
// ──────────────────────────────────────────────

describe("Admin Products API", () => {
  let mock: MockWithRpc;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = mkMock();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /admin/api/products", () => {
    it("returns a list of products", async () => {
      const products = [
        {
          id: "p1",
          name: "Jersey",
          slug: "jersey",
          price_mnt: 50000,
          is_available: true,
        },
        {
          id: "p2",
          name: "Shorts",
          slug: "shorts",
          price_mnt: 35000,
          is_available: true,
        },
      ];
      setQueryResult(mock, "products", products);

      const res = await GETProducts(createMockRequest());
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(products);
    });

    it("returns an empty list when no products exist", async () => {
      setQueryResult(mock, "products", []);

      const res = await GETProducts(createMockRequest());
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("returns 401 when unauthenticated", async () => {
      const unauthMock = createMockSupabase({
        user: null,
      }) as MockWithRpc;
      unauthMock._queryResults = new Map();
      mockCreateClient.mockResolvedValue(unauthMock as never);

      const res = await GETProducts(createMockRequest());
      const body = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("returns 500 when the database query fails", async () => {
      setQueryResult(mock, "products", null, new Error("connection refused"));

      const res = await GETProducts(createMockRequest());
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body.error).toContain("connection refused");
    });
  });

  describe("POST /admin/api/products", () => {
    const validBody = {
      name: "Test Product",
      slug: "test-product",
      price_mnt: 10000,
    };

    it("creates a product with valid data", async () => {
      const created = { id: "new-id", ...validBody, is_available: true };
      setQueryResult(mock, "products", created);

      const res = await POSTProducts(createMockRequest(validBody));
      const body = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(body).toEqual(created);
    });

    it("rejects product with missing name", async () => {
      const res = await POSTProducts(
        createMockRequest({ slug: "no-name", price_mnt: 1000 }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("name is required");
    });

    it("rejects product with missing slug", async () => {
      const res = await POSTProducts(
        createMockRequest({ name: "No Slug", price_mnt: 1000 }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("slug is required");
    });

    it("rejects product with missing price_mnt", async () => {
      const res = await POSTProducts(
        createMockRequest({ name: "No Price", slug: "no-price" }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("price_mnt must be a positive number");
    });

    it("rejects product with zero price_mnt", async () => {
      const res = await POSTProducts(
        createMockRequest({
          name: "Free",
          slug: "free",
          price_mnt: 0,
        }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("price_mnt must be a positive number");
    });

    it("rejects product with negative price_mnt", async () => {
      const res = await POSTProducts(
        createMockRequest({
          name: "Negative",
          slug: "negative",
          price_mnt: -500,
        }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("price_mnt must be a positive number");
    });

    it("rejects product with non-numeric price_mnt", async () => {
      const res = await POSTProducts(
        createMockRequest({
          name: "Bad Type",
          slug: "bad-type",
          price_mnt: "free",
        }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("price_mnt must be a positive number");
    });
  });

  describe("PUT /admin/api/products/:id", () => {
    it("updates an existing product", async () => {
      const updated = {
        id: "p1",
        name: "Updated",
        slug: "updated",
        price_mnt: 2000,
      };
      setQueryResult(mock, "products", updated);

      const res = await PUTProduct(
        createMockRequest({ name: "Updated", price_mnt: 2000 }),
        { params: createMockParams("p1") },
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(updated);
    });

    it("returns 500 when the database update fails", async () => {
      setQueryResult(mock, "products", null, new Error("update constraint"));

      const res = await PUTProduct(createMockRequest({ name: "Fail" }), {
        params: createMockParams("p1"),
      });
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body.error).toContain("update constraint");
    });
  });

  describe("DELETE /admin/api/products/:id", () => {
    it("deletes an existing product", async () => {
      setQueryResult(mock, "products", { id: "p1" });

      const res = await DELETEProduct(createMockRequest(undefined), {
        params: createMockParams("p1"),
      });

      expect(res.status).toBe(204);
    });

    it("returns 500 when the database delete fails", async () => {
      setQueryResult(mock, "products", null, new Error("delete denied"));

      const res = await DELETEProduct(createMockRequest(undefined), {
        params: createMockParams("p1"),
      });
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body.error).toContain("delete denied");
    });
  });
});

// ──────────────────────────────────────────────
//  Admin Orders API
// ──────────────────────────────────────────────

describe("Admin Orders API", () => {
  let mock: MockWithRpc;
  beforeEach(() => {
    vi.clearAllMocks();
    mock = mkMock();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  describe("GET /admin/api/orders", () => {
    it("returns a list of orders", async () => {
      const orders = [
        {
          id: "o1",
          product_id: "p1",
          customer_name: "Test",
          phone: "99112233",
          status: "pending",
        },
        {
          id: "o2",
          product_id: "p2",
          customer_name: "User",
          phone: "99554433",
          status: "shipped",
        },
      ];
      setQueryResult(mock, "orders", orders);

      const res = await GETOrders(createMockRequest());
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual(orders);
    });

    it("returns an empty list when no orders exist", async () => {
      setQueryResult(mock, "orders", []);

      const res = await GETOrders(createMockRequest());
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe("POST /admin/api/orders", () => {
    it("ships an order successfully", async () => {
      mock.rpc.mockResolvedValue({ data: null, error: null });

      const res = await POSTOrders(
        createMockRequest({ action: "ship", orderId: "o1" }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual({ status: "shipped" });
      expect(mock.rpc).toHaveBeenCalledWith("cmd_mark_shop_order_shipped", {
        p_order_id: "o1",
      });
    });

    it("cancels an order successfully", async () => {
      mock.rpc.mockResolvedValue({ data: null, error: null });

      const res = await POSTOrders(
        createMockRequest({ action: "cancel", orderId: "o1" }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual({ status: "cancelled" });
      expect(mock.rpc).toHaveBeenCalledWith("cmd_cancel_shop_order", {
        p_order_id: "o1",
      });
    });

    it("returns error when shipping a non-existent order", async () => {
      mock.rpc.mockResolvedValue({
        data: null,
        error: new Error("Order not found"),
      });

      const res = await POSTOrders(
        createMockRequest({ action: "ship", orderId: "nonexistent" }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body.error).toContain("Order not found");
    });

    it("returns error when cancelling a non-existent order", async () => {
      mock.rpc.mockResolvedValue({
        data: null,
        error: new Error("Order not found"),
      });

      const res = await POSTOrders(
        createMockRequest({ action: "cancel", orderId: "nonexistent" }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body.error).toContain("Order not found");
    });

    it("returns error for an invalid action", async () => {
      const res = await POSTOrders(
        createMockRequest({ action: "refund", orderId: "o1" }),
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toContain("Invalid action");
      expect(body.error).toContain("ship");
      expect(body.error).toContain("cancel");
    });

    it("returns error when action or orderId is missing", async () => {
      const res = await POSTOrders(createMockRequest({ action: "ship" }));
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("action and orderId required");
    });

    it("returns error when both action and orderId are missing", async () => {
      const res = await POSTOrders(createMockRequest({}));
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("action and orderId required");
    });
  });
});
