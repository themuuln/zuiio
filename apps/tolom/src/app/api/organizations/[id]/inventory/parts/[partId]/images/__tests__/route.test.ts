import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getPartImagesMock = vi.fn();
const addPartImageMock = vi.fn();
const removePartImageMock = vi.fn();
const setPrimaryImageMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/inventory-service", () => ({
  getPartImages: getPartImagesMock,
  addPartImage: addPartImageMock,
  removePartImage: removePartImageMock,
  setPrimaryImage: setPrimaryImageMock,
}));

const { GET, POST, DELETE, PATCH } = await import("../route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts/[partId]/images route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const partId = "part-1";
  const imageId = "img-1";
  const params = { partId };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns images for a part", async () => {
      const images = [
        {
          id: imageId,
          organization_id: orgId,
          part_id: partId,
          image_url: "https://example.com/img.jpg",
          is_primary: true,
          sort_order: 0,
          created_by: user.id,
          created_at: "2025-01-15T10:00:00Z",
        },
      ];
      getPartImagesMock.mockResolvedValue(images);

      const response = await GET({
        orgId,
        params,
        supabase: null,
      });

      expect(response.status).toBe(200);
      const body = JSON.parse(await response.text());
      expect(body.data).toEqual(images);
      expect(getPartImagesMock).toHaveBeenCalledWith(null, orgId, partId);
    });

    it("returns empty array when no images", async () => {
      getPartImagesMock.mockResolvedValue([]);

      const response = await GET({
        orgId,
        params,
        supabase: null,
      });

      expect(response.status).toBe(200);
      const body = JSON.parse(await response.text());
      expect(body.data).toEqual([]);
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    it("creates an image", async () => {
      const newImage = {
        id: imageId,
        organization_id: orgId,
        part_id: partId,
        image_url: "https://example.com/img.jpg",
        is_primary: true,
        sort_order: 0,
        created_by: user.id,
        created_at: "2025-01-15T10:00:00Z",
      };
      addPartImageMock.mockResolvedValue(newImage);

      const request = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          image_url: "https://example.com/img.jpg",
          is_primary: true,
        }),
      });

      const response = await POST({
        request,
        orgId,
        params,
        supabase: null,
        user,
      });

      expect(response.status).toBe(201);
      const body = JSON.parse(await response.text());
      expect(body.data).toEqual(newImage);
      expect(addPartImageMock).toHaveBeenCalledWith(
        null,
        orgId,
        partId,
        "https://example.com/img.jpg",
        true,
        user.id,
      );
    });

    it("rejects missing image_url", async () => {
      const request = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST({
        request,
        orgId,
        params,
        supabase: null,
        user,
      });

      expect(response.status).toBe(400);
      const body = JSON.parse(await response.text());
      expect(body.error.code).toBe("VALIDATION");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("removes an image", async () => {
      removePartImageMock.mockResolvedValue(undefined);

      const request = new NextRequest(`http://localhost?imageId=${imageId}`, {
        method: "DELETE",
      });

      const response = await DELETE({
        request,
        orgId,
        supabase: null,
        user,
      });

      expect(response.status).toBe(200);
      expect(removePartImageMock).toHaveBeenCalledWith(
        null,
        orgId,
        imageId,
        user.id,
      );
    });

    it("rejects missing imageId", async () => {
      const request = new NextRequest("http://localhost", {
        method: "DELETE",
      });

      const response = await DELETE({
        request,
        orgId,
        supabase: null,
        user,
      });

      expect(response.status).toBe(400);
      const body = JSON.parse(await response.text());
      expect(body.error.code).toBe("VALIDATION");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    it("sets primary image", async () => {
      const updatedImage = {
        id: imageId,
        organization_id: orgId,
        part_id: partId,
        image_url: "https://example.com/img.jpg",
        is_primary: true,
        sort_order: 0,
        created_by: user.id,
        created_at: "2025-01-15T10:00:00Z",
      };
      setPrimaryImageMock.mockResolvedValue(updatedImage);

      const request = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({
          action: "set-primary",
          image_id: imageId,
        }),
      });

      const response = await PATCH({
        request,
        orgId,
        params,
        supabase: null,
        user,
      });

      expect(response.status).toBe(200);
      const body = JSON.parse(await response.text());
      expect(body.data).toEqual(updatedImage);
      expect(setPrimaryImageMock).toHaveBeenCalledWith(
        null,
        orgId,
        partId,
        imageId,
        user.id,
      );
    });

    it("rejects missing image_id", async () => {
      const request = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ action: "set-primary" }),
      });

      const response = await PATCH({
        request,
        orgId,
        params,
        supabase: null,
        user,
      });

      expect(response.status).toBe(400);
      const body = JSON.parse(await response.text());
      expect(body.error.code).toBe("VALIDATION");
    });

    it("rejects unknown action", async () => {
      const request = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ action: "unknown" }),
      });

      const response = await PATCH({
        request,
        orgId,
        params,
        supabase: null,
        user,
      });

      expect(response.status).toBe(400);
      const body = JSON.parse(await response.text());
      expect(body.error.code).toBe("VALIDATION");
    });
  });
});
