import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const validateUploadRequestMock = vi.fn();
const generatePresignedUploadUrlMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message } }), { status }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/storage/r2-service", () => ({
  validateUploadRequest: validateUploadRequestMock,
  generatePresignedUploadUrl: generatePresignedUploadUrlMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("POST /api/storage/presigned-url", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns presigned URL on success", async () => {
    const uploadResult = {
      presignedUrl: "https://r2.example.com/upload/abc123",
      key: "uploads/abc123",
      expiresAt: "2026-07-27T12:00:00Z",
    };

    validateUploadRequestMock.mockReturnValue(null);

    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { organization_id: "org-1" },
        error: null,
      }),
    };

    generatePresignedUploadUrlMock.mockResolvedValue(uploadResult);

    const request = new NextRequest(
      "http://localhost/api/storage/presigned-url",
      {
        method: "POST",
        body: JSON.stringify({
          fileName: "photo.jpg",
          mimeType: "image/jpeg",
          fileSize: 102400,
        }),
      },
    );

    const response = await POST({ request, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(uploadResult);
    expect(validateUploadRequestMock).toHaveBeenCalledWith(
      "photo.jpg",
      "image/jpeg",
      102400,
    );
    expect(supabase.from).toHaveBeenCalledWith("organization_users");
    expect(generatePresignedUploadUrlMock).toHaveBeenCalledWith({
      orgId: "org-1",
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
      entityType: undefined,
      entityId: undefined,
    });
  });

  it("returns validation error for invalid body", async () => {
    const request = new NextRequest(
      "http://localhost/api/storage/presigned-url",
      {
        method: "POST",
        body: JSON.stringify({
          fileName: "",
          mimeType: "",
        }),
      },
    );

    const response = await POST({ request, supabase: {}, user });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 403 when user has no org membership", async () => {
    validateUploadRequestMock.mockReturnValue(null);

    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    const request = new NextRequest(
      "http://localhost/api/storage/presigned-url",
      {
        method: "POST",
        body: JSON.stringify({
          fileName: "photo.jpg",
          mimeType: "image/jpeg",
          fileSize: 102400,
        }),
      },
    );

    const response = await POST({ request, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.message).toBe("Not a member of any organization");
  });

  it("returns storage error when service throws", async () => {
    validateUploadRequestMock.mockReturnValue(null);

    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { organization_id: "org-1" },
        error: null,
      }),
    };

    generatePresignedUploadUrlMock.mockRejectedValue(
      new Error("R2 bucket full"),
    );

    const request = new NextRequest(
      "http://localhost/api/storage/presigned-url",
      {
        method: "POST",
        body: JSON.stringify({
          fileName: "photo.jpg",
          mimeType: "image/jpeg",
          fileSize: 102400,
        }),
      },
    );

    const response = await POST({ request, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("STORAGE_ERROR");
    expect(body.error.message).toBe("R2 bucket full");
  });
});
