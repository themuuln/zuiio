import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock refs ───────────────────────────────────────────────────
const validateUploadMock = vi.fn();
const uploadMock = vi.fn();
const apiErrorMock = vi.fn();
const okMock = vi.fn();
const reportServerErrorMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
  apiError: apiErrorMock,
  ok: okMock,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

vi.mock("@/lib/storage/storage-factory", () => ({
  getStorage: vi.fn(() => ({
    validateUpload: validateUploadMock,
    upload: uploadMock,
  })),
}));

const { POST } = await import("./route");

// ── Helpers ─────────────────────────────────────────────────────

const validMetadata = {
  orgId: "550e8400-e29b-41d4-a716-446655440000",
  fileName: "test.pdf",
  mimeType: "application/pdf",
  fileSize: 1024,
  entityType: "document",
  entityId: "entity-1",
};

function createMockFile(): {
  type: string;
  arrayBuffer: ReturnType<typeof vi.fn>;
} {
  return {
    type: "application/pdf",
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  };
}

function createMockFormData(overrides?: {
  file?: typeof validMetadata | null;
  metadata?: string | null;
}) {
  const file =
    overrides?.file === undefined ? createMockFile() : overrides.file;
  const metadataStr =
    overrides?.metadata === undefined
      ? JSON.stringify(validMetadata)
      : overrides.metadata;

  return {
    get: vi.fn((key: string) => {
      if (key === "file") return file;
      if (key === "metadata") return metadataStr;
      return null;
    }),
  };
}

function createRequest(formData: object): NextRequest {
  const req = new NextRequest("http://localhost/api/storage/upload", {
    method: "POST",
  });
  vi.spyOn(req, "formData").mockResolvedValue(formData as FormData);
  return req;
}

// ── Tests ───────────────────────────────────────────────────────

describe("POST /api/storage/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succeeds with valid form data", async () => {
    validateUploadMock.mockReturnValue(null);
    const expectedResult = {
      url: "https://example.com/test.pdf",
      path: "test.pdf",
      bucket: "uploads",
    };
    uploadMock.mockResolvedValue(expectedResult);
    okMock.mockReturnValue(
      new Response(JSON.stringify({ data: expectedResult }), { status: 200 }),
    );

    const formData = createMockFormData();
    const request = createRequest(formData);
    const response = await POST({ request });
    const body = await response.json();

    expect(body.data).toEqual(expectedResult);
    expect(formData.get).toHaveBeenCalledWith("file");
    expect(formData.get).toHaveBeenCalledWith("metadata");
    expect(validateUploadMock).toHaveBeenCalledWith(
      "test.pdf",
      "application/pdf",
      1024,
    );
    expect(uploadMock).toHaveBeenCalledWith(
      {
        orgId: validMetadata.orgId,
        fileName: validMetadata.fileName,
        mimeType: validMetadata.mimeType,
        entityType: validMetadata.entityType,
        entityId: validMetadata.entityId,
      },
      expect.any(ArrayBuffer),
    );
    expect(okMock).toHaveBeenCalledWith(expectedResult);
  });

  it("returns validation error when file is missing", async () => {
    apiErrorMock.mockReturnValue(
      new Response(
        JSON.stringify({
          error: { code: "VALIDATION_ERROR", message: "No file provided" },
        }),
        { status: 400 },
      ),
    );

    const formData = createMockFormData({ file: null });
    const request = createRequest(formData);
    const response = await POST({ request });
    const body = await response.json();

    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(apiErrorMock).toHaveBeenCalledWith(
      "VALIDATION_ERROR",
      "No file provided",
      400,
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("returns validation error when metadata is missing", async () => {
    apiErrorMock.mockReturnValue(
      new Response(
        JSON.stringify({
          error: { code: "VALIDATION_ERROR", message: "No metadata provided" },
        }),
        { status: 400 },
      ),
    );

    const formData = createMockFormData({ metadata: null });
    const request = createRequest(formData);
    const response = await POST({ request });
    const body = await response.json();

    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(apiErrorMock).toHaveBeenCalledWith(
      "VALIDATION_ERROR",
      "No metadata provided",
      400,
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("returns validation error from storage.validateUpload", async () => {
    validateUploadMock.mockReturnValue("File too large");
    apiErrorMock.mockReturnValue(
      new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "File too large",
          },
        }),
        { status: 400 },
      ),
    );

    const formData = createMockFormData();
    const request = createRequest(formData);
    const response = await POST({ request });
    const body = await response.json();

    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(apiErrorMock).toHaveBeenCalledWith(
      "VALIDATION_ERROR",
      "File too large",
      400,
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("returns error when storage upload fails", async () => {
    validateUploadMock.mockReturnValue(null);
    const uploadError = new Error("Upload failed");
    uploadMock.mockRejectedValue(uploadError);
    apiErrorMock.mockReturnValue(
      new Response(
        JSON.stringify({
          error: { code: "STORAGE_ERROR", message: "Upload failed" },
        }),
        { status: 500 },
      ),
    );

    const formData = createMockFormData();
    const request = createRequest(formData);
    const response = await POST({ request });
    const body = await response.json();

    expect(body.error.code).toBe("STORAGE_ERROR");
    expect(apiErrorMock).toHaveBeenCalledWith(
      "STORAGE_ERROR",
      "Upload failed",
      500,
    );
    expect(reportServerErrorMock).toHaveBeenCalledWith(
      "Unexpected error",
      uploadError,
    );
  });
});
