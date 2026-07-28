import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET, POST } = await import("./route");

describe("car-brands/[brandId]/models route", () => {
  const user = { id: "user-1" };
  const params = { brandId: "brand-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns models for the brand ordered by name", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: "m1", name: "Civic", body_type: "Sedan", is_active: true },
            { id: "m2", name: "CR-V", body_type: "SUV", is_active: true },
          ],
          error: null,
        }),
      };

      const req = new NextRequest(
        new URL("http://localhost/api/car-brands/brand-1/models"),
      );
      const response = await GET({ request: req, supabase, user, params });
      const body = await response.json();

      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe("Civic");
      expect(body.data[1].name).toBe("CR-V");
      expect(supabase.from).toHaveBeenCalledWith("car_models");
      expect(supabase.eq).toHaveBeenCalledWith("brand_id", "brand-1");
      expect(supabase.eq).toHaveBeenCalledWith("is_active", true);
      expect(supabase.order).toHaveBeenCalledWith("name");
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

      const req = new NextRequest(
        new URL("http://localhost/api/car-brands/brand-1/models"),
      );
      const response = await GET({ request: req, supabase, user, params });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL");
    });
  });

  describe("POST", () => {
    it("creates a new model successfully", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "new-m1",
            name: "Civic",
            body_type: "Sedan",
            is_active: true,
          },
          error: null,
        }),
      };

      const req = new NextRequest(
        "http://localhost/api/car-brands/brand-1/models",
        {
          method: "POST",
          body: JSON.stringify({ name: "Civic" }),
        },
      );
      const response = await POST({ request: req, supabase, user, params });
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.name).toBe("Civic");
      expect(body.data.id).toBe("new-m1");
    });

    it("returns existing model on duplicate name", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "existing-m1", name: "Civic" },
          error: null,
        }),
        insert: vi.fn(),
        single: vi.fn(),
      };

      const req = new NextRequest(
        "http://localhost/api/car-brands/brand-1/models",
        {
          method: "POST",
          body: JSON.stringify({ name: "Civic" }),
        },
      );
      const response = await POST({ request: req, supabase, user, params });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.id).toBe("existing-m1");
      expect(supabase.insert).not.toHaveBeenCalled();
    });

    it("returns 400 when name is missing", async () => {
      const supabase = {
        from: vi.fn(),
        select: vi.fn(),
        eq: vi.fn(),
        ilike: vi.fn(),
        limit: vi.fn(),
        maybeSingle: vi.fn(),
        insert: vi.fn(),
        single: vi.fn(),
      };

      const req = new NextRequest(
        "http://localhost/api/car-brands/brand-1/models",
        {
          method: "POST",
          body: JSON.stringify({ name: "  " }),
        },
      );
      const response = await POST({ request: req, supabase, user, params });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION");
      expect(body.error.message).toBe("Model name is required");
    });

    it("returns 500 on insert error", async () => {
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert failed" },
        }),
      };

      const req = new NextRequest(
        "http://localhost/api/car-brands/brand-1/models",
        {
          method: "POST",
          body: JSON.stringify({ name: "Civic" }),
        },
      );
      const response = await POST({ request: req, supabase, user, params });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL");
    });
  });
});
