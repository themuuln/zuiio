import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET, POST } = await import("./route");

describe("car-brands route", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns active car brands ordered by name", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: "1", name: "Honda", country: null, is_active: true },
            { id: "2", name: "Toyota", country: "Japan", is_active: true },
          ],
          error: null,
        }),
      };

      const req = new NextRequest(new URL("http://localhost/api/car-brands"));
      const response = await GET({ request: req, supabase, user });
      const body = await response.json();

      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe("Honda");
      expect(body.data[1].name).toBe("Toyota");
    });

    it("returns 500 on query error", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Query failed" },
        }),
      };

      const req = new NextRequest(new URL("http://localhost/api/car-brands"));
      const response = await GET({ request: req, supabase, user });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("SERVER_ERROR");
    });

    it("returns empty array when no brands exist", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const req = new NextRequest(new URL("http://localhost/api/car-brands"));
      const response = await GET({ request: req, supabase, user });
      const body = await response.json();

      expect(body.data).toEqual([]);
    });

    it("propagates unexpected errors", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue(new Error("Network error")),
      };

      const req = new NextRequest(new URL("http://localhost/api/car-brands"));
      await expect(GET({ request: req, supabase, user })).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("POST", () => {
    it("creates a new brand successfully", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "new-1",
            name: "Tesla",
            country: null,
            is_active: true,
          },
          error: null,
        }),
      };

      const req = new NextRequest("http://localhost/api/car-brands", {
        method: "POST",
        body: JSON.stringify({ name: "Tesla" }),
      });
      const response = await POST({ request: req, supabase, user });
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.name).toBe("Tesla");
    });

    it("returns 400 when name is empty", async () => {
      const supabase = {
        from: vi.fn(),
        select: vi.fn(),
        ilike: vi.fn(),
        limit: vi.fn(),
        maybeSingle: vi.fn(),
        insert: vi.fn(),
        single: vi.fn(),
      };

      const req = new NextRequest("http://localhost/api/car-brands", {
        method: "POST",
        body: JSON.stringify({ name: "  " }),
      });
      const response = await POST({ request: req, supabase, user });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION");
    });

    it("returns 400 when name is missing entirely", async () => {
      const req = new NextRequest("http://localhost/api/car-brands", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const response = await POST({ request: req, supabase: {}, user });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION");
    });

    it("returns existing brand when duplicate name found", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "existing-1",
            name: "Toyota",
            country: "Japan",
            is_active: true,
          },
          error: null,
        }),
        insert: vi.fn(),
        single: vi.fn(),
      };

      const req = new NextRequest("http://localhost/api/car-brands", {
        method: "POST",
        body: JSON.stringify({ name: "Toyota" }),
      });
      const response = await POST({ request: req, supabase, user });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.id).toBe("existing-1");
    });

    it("returns 500 on insert error", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert failed" },
        }),
      };

      const req = new NextRequest("http://localhost/api/car-brands", {
        method: "POST",
        body: JSON.stringify({ name: "Tesla" }),
      });
      const response = await POST({ request: req, supabase, user });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("SERVER_ERROR");
    });

    it("propagates unexpected errors", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockRejectedValue(new Error("Network error")),
        insert: vi.fn(),
        single: vi.fn(),
      };

      const req = new NextRequest("http://localhost/api/car-brands", {
        method: "POST",
        body: JSON.stringify({ name: "Tesla" }),
      });
      await expect(POST({ request: req, supabase, user })).rejects.toThrow(
        "Network error",
      );
    });
  });
});
