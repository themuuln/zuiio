import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublicUrlMock = vi.hoisted(() => vi.fn());
const reportServerErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-response", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message } }), { status }),
  ),
}));

vi.mock("@/lib/storage/storage-factory", () => ({
  getStorage: vi.fn(() => ({
    getPublicUrl: getPublicUrlMock,
  })),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

// Dynamic import required: vitest hoists vi.mock above module imports,
// so the route module must be loaded after mock setup.
const { GET } = await import("./route");

describe("GET /api/storage/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Supabase public URL directly without calling storage backend", async () => {
    const key =
      "https://example.supabase.co/storage/v1/object/public/parts/photo.jpg";
    const request = new NextRequest(
      `http://localhost/api/storage/download?key=${encodeURIComponent(key)}`,
    );
    const response = await GET({ request });
    const body = await response.json();

    expect(body.data).toEqual({ url: key });
    expect(getPublicUrlMock).not.toHaveBeenCalled();
  });

  it("generates URL for raw path via storage backend", async () => {
    getPublicUrlMock.mockReturnValue("https://cdn.example.com/parts/photo.jpg");

    const request = new NextRequest(
      "http://localhost/api/storage/download?key=org-1/parts/photo.jpg",
    );
    const response = await GET({ request });
    const body = await response.json();

    expect(getPublicUrlMock).toHaveBeenCalledWith(
      "org-1/parts/photo.jpg",
      "part-photos",
    );
    expect(body.data).toEqual({
      url: "https://cdn.example.com/parts/photo.jpg",
    });
  });

  it("returns validation error when key query param is missing", async () => {
    const request = new NextRequest("http://localhost/api/storage/download");
    const response = await GET({ request });
    const body = await response.json();

    expect(body.error).toEqual({
      code: "VALIDATION_ERROR",
      message: "key query param required",
    });
    expect(getPublicUrlMock).not.toHaveBeenCalled();
  });

  it("handles storage error and reports to Sentry", async () => {
    getPublicUrlMock.mockImplementation(() => {
      throw new Error("Backend unreachable");
    });

    const request = new NextRequest(
      "http://localhost/api/storage/download?key=org-1/parts/photo.jpg",
    );
    const response = await GET({ request });
    const body = await response.json();

    expect(getPublicUrlMock).toHaveBeenCalled();
    expect(reportServerErrorMock).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
    expect(body.error).toEqual({
      code: "STORAGE_ERROR",
      message: "Backend unreachable",
    });
  });
});
