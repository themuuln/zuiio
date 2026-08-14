import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock all service functions
const getSharedCustomersMock = vi.fn();
const getCustomersFastMock = vi.fn();
const searchCustomersMock = vi.fn();
const getCustomersMock = vi.fn();
const createCustomerMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
}));

vi.mock("@/lib/services/customer-service", () => ({
  getSharedCustomers: getSharedCustomersMock,
  getCustomersFast: getCustomersFastMock,
  searchCustomers: searchCustomersMock,
  getCustomers: getCustomersMock,
  createCustomer: createCustomerMock,
}));

const { GET, POST } = await import("./route");

describe("customers route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns shared customers when shared=true", async () => {
      const data = [{ id: "1", name: "shared-customer" }];
      getSharedCustomersMock.mockResolvedValue(data);

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?shared=true",
        ),
      );
      const response = await GET({ request: req, orgId, user, supabase: {} });
      const body = await response.json();

      expect(body.data).toEqual(data);
      expect(getSharedCustomersMock).toHaveBeenCalledWith(
        {},
        orgId,
        expect.objectContaining({ search: undefined }),
      );
    });

    it("returns shared customers with search when shared=true and q=term", async () => {
      const data = [{ id: "1", name: "match" }];
      getSharedCustomersMock.mockResolvedValue(data);

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?shared=true&q=term",
        ),
      );
      const response = await GET({ request: req, orgId, user, supabase: {} });
      const body = await response.json();

      expect(body.data).toEqual(data);
      expect(getSharedCustomersMock).toHaveBeenCalledWith(
        {},
        orgId,
        expect.objectContaining({ search: "term" }),
      );
    });

    it("forwards branch_id to shared customers", async () => {
      getSharedCustomersMock.mockResolvedValue([]);

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?shared=true&branch_id=branch-1",
        ),
      );
      await GET({ request: req, orgId, user, supabase: {} });

      expect(getSharedCustomersMock).toHaveBeenCalledWith(
        {},
        orgId,
        expect.objectContaining({ branchId: "branch-1" }),
      );
    });

    it("handles getSharedCustomers error", async () => {
      getSharedCustomersMock.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?shared=true",
        ),
      );
      await expect(
        GET({ request: req, orgId, user, supabase: {} }),
      ).rejects.toThrow("DB error");
    });

    it("returns fast customers when fast=true and no branch_id", async () => {
      const rows = [{ id: "1", name: "fast" }];
      getCustomersFastMock.mockResolvedValue(rows);

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?fast=true",
        ),
      );
      const response = await GET({ request: req, orgId, user, supabase: {} });
      const body = await response.json();

      expect(body.data.data).toEqual(rows);
      expect(body.data.total).toBe(1);
      expect(body.data.page).toBe(1);
      expect(body.data.pageSize).toBe(50);
      expect(body.data.totalPages).toBe(1);
      expect(getCustomersFastMock).toHaveBeenCalledWith(
        {},
        orgId,
        expect.objectContaining({ limit: 50 }),
      );
    });

    it("returns fast customers with search when fast=true and q=term", async () => {
      const rows = [{ id: "1", name: "match" }];
      getCustomersFastMock.mockResolvedValue(rows);

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?fast=true&q=term",
        ),
      );
      const response = await GET({ request: req, orgId, user, supabase: {} });
      const body = await response.json();

      expect(body.data.data).toEqual(rows);
      expect(getCustomersFastMock).toHaveBeenCalledWith(
        {},
        orgId,
        expect.objectContaining({ search: "term" }),
      );
    });

    it("uses page and pageSize with fast=true", async () => {
      getCustomersFastMock.mockResolvedValue([]);

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?fast=true&page=2&pageSize=10",
        ),
      );
      await GET({ request: req, orgId, user, supabase: {} });

      expect(getCustomersFastMock).toHaveBeenCalledWith(
        {},
        orgId,
        expect.objectContaining({ limit: 10 }),
      );
    });

    it("does NOT use fast path when fast=true but branch_id is present", async () => {
      getCustomersMock.mockResolvedValue({ data: [] });

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?fast=true&branch_id=branch-1",
        ),
      );
      await GET({ request: req, orgId, user, supabase: {} });

      expect(getCustomersFastMock).not.toHaveBeenCalled();
      expect(getCustomersMock).toHaveBeenCalled();
    });

    it("handles getCustomersFast error", async () => {
      getCustomersFastMock.mockRejectedValue(new Error("Fast error"));

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?fast=true",
        ),
      );
      await expect(
        GET({ request: req, orgId, user, supabase: {} }),
      ).rejects.toThrow("Fast error");
    });

    it("searches customers when q param is present", async () => {
      const result = { data: [{ id: "1", name: "searched" }], total: 1 };
      searchCustomersMock.mockResolvedValue(result);

      const req = new NextRequest(
        new URL("http://localhost/api/organizations/test-org/customers?q=term"),
      );
      const response = await GET({ request: req, orgId, user, supabase: {} });
      const body = await response.json();

      expect(body.data).toEqual(result);
      expect(searchCustomersMock).toHaveBeenCalledWith({}, orgId, "term", {});
    });

    it("forwards page/pageSize and branchId to searchCustomers", async () => {
      searchCustomersMock.mockResolvedValue({ data: [] });

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?q=term&page=2&pageSize=20&branch_id=branch-1",
        ),
      );
      await GET({ request: req, orgId, user, supabase: {} });

      expect(searchCustomersMock).toHaveBeenCalledWith(
        {},
        orgId,
        "term",
        expect.objectContaining({
          page: 2,
          pageSize: 20,
          branchId: "branch-1",
        }),
      );
    });

    it("handles searchCustomers error", async () => {
      searchCustomersMock.mockRejectedValue(new Error("Search error"));

      const req = new NextRequest(
        new URL("http://localhost/api/organizations/test-org/customers?q=term"),
      );
      await expect(
        GET({ request: req, orgId, user, supabase: {} }),
      ).rejects.toThrow("Search error");
    });

    it("returns all customers when no special params", async () => {
      const result = { data: [{ id: "1", name: "all" }], total: 1 };
      getCustomersMock.mockResolvedValue(result);

      const req = new NextRequest(
        new URL("http://localhost/api/organizations/test-org/customers"),
      );
      const response = await GET({ request: req, orgId, user, supabase: {} });
      const body = await response.json();

      expect(body.data).toEqual(result);
      expect(getCustomersMock).toHaveBeenCalledWith(
        {},
        orgId,
        expect.objectContaining({ search: undefined }),
      );
    });

    it("forwards page/pageSize and branchId to getCustomers", async () => {
      getCustomersMock.mockResolvedValue({ data: [] });

      const req = new NextRequest(
        new URL(
          "http://localhost/api/organizations/test-org/customers?page=3&pageSize=25&branch_id=branch-2",
        ),
      );
      await GET({ request: req, orgId, user, supabase: {} });

      expect(getCustomersMock).toHaveBeenCalledWith(
        {},
        orgId,
        expect.objectContaining({
          page: 3,
          pageSize: 25,
          branchId: "branch-2",
        }),
      );
    });

    it("handles getCustomers error", async () => {
      getCustomersMock.mockRejectedValue(new Error("List error"));

      const req = new NextRequest(
        new URL("http://localhost/api/organizations/test-org/customers"),
      );
      await expect(
        GET({ request: req, orgId, user, supabase: {} }),
      ).rejects.toThrow("List error");
    });
  });

  describe("POST", () => {
    const body = { name: "New Customer", email: "test@example.com" };

    it("creates and returns a customer", async () => {
      const customer = { id: "c-1", ...body };
      createCustomerMock.mockResolvedValue(customer);

      const req = new NextRequest(
        new URL("http://localhost/api/organizations/test-org/customers"),
        { method: "POST", body: JSON.stringify(body) },
      );
      const response = await POST({ request: req, orgId, user, supabase: {} });
      const responseBody = await response.json();

      expect(responseBody.data).toEqual(customer);
      expect(createCustomerMock).toHaveBeenCalledWith({}, orgId, body, user.id);
    });

    it("handles createCustomer error", async () => {
      createCustomerMock.mockRejectedValue(new Error("Create error"));

      const req = new NextRequest(
        new URL("http://localhost/api/organizations/test-org/customers"),
        { method: "POST", body: JSON.stringify(body) },
      );
      await expect(
        POST({ request: req, orgId, user, supabase: {} }),
      ).rejects.toThrow("Create error");
    });
  });
});
