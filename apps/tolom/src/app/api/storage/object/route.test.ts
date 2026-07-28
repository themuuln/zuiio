import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const storageDeleteMock = vi.fn();
const reportServerErrorMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

vi.mock("@/lib/storage/storage-factory", () => ({
  getStorage: vi.fn(() => ({
    delete: storageDeleteMock,
  })),
}));

const { DELETE } = await import("./route");

describe("DELETE /api/storage/object", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a storage object and returns success", async () => {
    storageDeleteMock.mockResolvedValue(undefined);

    const req = new NextRequest(
      "http://localhost/api/storage/object?key=org-1/parts/uuid.jpg",
    );
    const response = await DELETE({
      request: req,
      supabase: {},
      user: { id: "user-1" },
    });
    const body = await response.json();

    expect(body.data).toEqual({ deleted: true });
    expect(storageDeleteMock).toHaveBeenCalledOnce();
    expect(storageDeleteMock).toHaveBeenCalledWith("org-1/parts/uuid.jpg");
  });

  it("returns validation error when key query param is missing", async () => {
    const req = new NextRequest("http://localhost/api/storage/object");
    const response = await DELETE({
      request: req,
      supabase: {},
      user: { id: "user-1" },
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("key query param required");
    expect(storageDeleteMock).not.toHaveBeenCalled();
  });

  it("returns storage error when delete fails", async () => {
    storageDeleteMock.mockRejectedValue(new Error("Not found"));

    const req = new NextRequest(
      "http://localhost/api/storage/object?key=org-1/parts/missing.jpg",
    );
    const response = await DELETE({
      request: req,
      supabase: {},
      user: { id: "user-1" },
    });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("STORAGE_ERROR");
    expect(body.error.message).toBe("Not found");
    expect(reportServerErrorMock).toHaveBeenCalled();
  });
});
