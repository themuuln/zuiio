import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mock infrastructure ─────────────────────────────────────────

const { mockS3ClientInstance, mockGetSignedUrl, mockReportServerError } =
  vi.hoisted(() => {
    const mockSend = vi.fn();
    const instance = { send: mockSend };
    return {
      mockS3ClientInstance: instance,
      mockGetSignedUrl: vi.fn(),
      mockReportServerError: vi.fn(),
    };
  });

// Use regular functions so `new S3Client(...)` works (arrow functions are not constructible)
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => mockS3ClientInstance),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  HeadObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mockReportServerError,
}));

// ── Types ───────────────────────────────────────────────────────────────

interface R2ServiceModule {
  generatePresignedUploadUrl: (params: {
    orgId: string;
    fileName: string;
    mimeType: string;
    entityType?: string;
    entityId?: string;
  }) => Promise<{ presignedUrl: string; key: string; expiresAt: string }>;
  generatePresignedDownloadUrl: (
    key: string,
    expiresIn?: number,
  ) => Promise<string>;
  deleteR2Object: (key: string) => Promise<boolean>;
  validateUploadRequest: (
    fileName: string,
    mimeType: string,
    fileSize: number,
  ) => string | null;
  isR2StoragePath: (storagePath: string) => boolean;
  r2KeyFromStoragePath: (storagePath: string) => string;
  resolveR2Url: (value: string | null) => Promise<string | null>;
}

let mod: R2ServiceModule;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mod = await import("./r2-service");
});

// ── Helpers ─────────────────────────────────────────────────────────────

function stubR2Env(): void {
  vi.stubEnv("R2_ACCOUNT_ID", "acct-123");
  vi.stubEnv("R2_ACCESS_KEY_ID", "ak-test");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "sk-test");
  vi.stubEnv("R2_BUCKET", "my-bucket");
}

// ══════════════════════════════════════════════════════════════════════════
//  validateUploadRequest
// ══════════════════════════════════════════════════════════════════════════

describe("validateUploadRequest", () => {
  it("returns null for valid upload params", () => {
    expect(
      mod.validateUploadRequest("photo.jpg", "image/jpeg", 1024),
    ).toBeNull();
  });

  it("returns error when file name is empty", () => {
    expect(mod.validateUploadRequest("", "image/jpeg", 1024)).toBe(
      "File name is required",
    );
  });

  it("returns error when file name is whitespace", () => {
    expect(mod.validateUploadRequest("   ", "image/jpeg", 1024)).toBe(
      "File name is required",
    );
  });

  it("returns error for unsupported mime type", () => {
    expect(
      mod.validateUploadRequest("file.exe", "application/x-msdownload", 1024),
    ).toBe("Unsupported file type: application/x-msdownload");
  });

  it("returns error when file exceeds max size (10MB)", () => {
    const oversized = 11 * 1024 * 1024;
    expect(mod.validateUploadRequest("big.mp4", "image/jpeg", oversized)).toBe(
      "File too large: 11.0MB (max 10MB)",
    );
  });

  it("accepts files at exactly the max size boundary", () => {
    expect(
      mod.validateUploadRequest(
        "exact.pdf",
        "application/pdf",
        10 * 1024 * 1024,
      ),
    ).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  generatePresignedUploadUrl
// ══════════════════════════════════════════════════════════════════════════

describe("generatePresignedUploadUrl", () => {
  it("generates a presigned upload URL and returns result", async () => {
    stubR2Env();
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/upload-url");

    const result = await mod.generatePresignedUploadUrl({
      orgId: "org-1",
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
      entityType: "parts",
      entityId: "part-42",
    });

    expect(result.presignedUrl).toBe("https://r2.example.com/upload-url");
    expect(result.key).toMatch(/^org-1\/parts\/part-42\/.+\.jpg$/);
    expect(result.expiresAt).toBeDefined();
    expect(mockGetSignedUrl).toHaveBeenCalledOnce();
  });

  it("generates key with general/_ fallbacks when optional params omitted", async () => {
    stubR2Env();
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/upload-url");

    const result = await mod.generatePresignedUploadUrl({
      orgId: "org-1",
      fileName: "doc.pdf",
      mimeType: "application/pdf",
    });

    expect(result.key).toMatch(/^org-1\/general\/_\/.+\.pdf$/);
  });

  it("throws when R2 is not configured", async () => {
    await expect(
      mod.generatePresignedUploadUrl({
        orgId: "org-1",
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
      }),
    ).rejects.toThrow("R2 is not configured");
  });

  it("throws when getSignedUrl fails", async () => {
    stubR2Env();
    mockGetSignedUrl.mockRejectedValue(new Error("Network error"));

    await expect(
      mod.generatePresignedUploadUrl({
        orgId: "org-1",
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
      }),
    ).rejects.toThrow("Network error");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  generatePresignedDownloadUrl
// ══════════════════════════════════════════════════════════════════════════

describe("generatePresignedDownloadUrl", () => {
  it("generates a presigned download URL with default expiry", async () => {
    stubR2Env();
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/download-url");

    const url = await mod.generatePresignedDownloadUrl(
      "org-1/parts/part-42/uuid.jpg",
    );

    expect(url).toBe("https://r2.example.com/download-url");
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { expiresIn: 3600 },
    );
  });

  it("generates a presigned download URL with custom expiry", async () => {
    stubR2Env();
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/download-url");

    await mod.generatePresignedDownloadUrl("some-key", 600);

    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { expiresIn: 600 },
    );
  });

  it("throws when R2 is not configured", async () => {
    await expect(mod.generatePresignedDownloadUrl("some-key")).rejects.toThrow(
      "R2 is not configured",
    );
  });

  it("throws when getSignedUrl fails", async () => {
    stubR2Env();
    mockGetSignedUrl.mockRejectedValue(new Error("Credential error"));

    await expect(mod.generatePresignedDownloadUrl("some-key")).rejects.toThrow(
      "Credential error",
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  deleteR2Object
// ══════════════════════════════════════════════════════════════════════════

describe("deleteR2Object", () => {
  it("deletes an existing object and returns true", async () => {
    stubR2Env();
    // HeadObjectCommand succeeds — object exists
    mockS3ClientInstance.send.mockResolvedValueOnce({});

    const result = await mod.deleteR2Object("org-1/parts/part-42/uuid.jpg");

    expect(result).toBe(true);
    expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(2); // HeadObject + DeleteObject
  });

  it("returns false when object does not exist (HeadObject throws)", async () => {
    stubR2Env();
    mockS3ClientInstance.send.mockRejectedValueOnce(
      Object.assign(new Error("Not found"), { name: "NotFound" }),
    );

    const result = await mod.deleteR2Object("org-1/parts/missing.jpg");

    expect(result).toBe(false);
    expect(mockReportServerError).toHaveBeenCalled();
    expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
  });

  it("throws when R2 is not configured", async () => {
    await expect(mod.deleteR2Object("some-key")).rejects.toThrow(
      "R2 is not configured",
    );
  });

  it("re-throws unexpected errors from DeleteObjectCommand", async () => {
    stubR2Env();
    mockS3ClientInstance.send
      .mockResolvedValueOnce({}) // HeadObject succeeds
      .mockRejectedValueOnce(new Error("Access denied")); // DeleteObject fails

    await expect(
      mod.deleteR2Object("org-1/parts/part-42/uuid.jpg"),
    ).rejects.toThrow("Access denied");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  isR2StoragePath / r2KeyFromStoragePath
// ══════════════════════════════════════════════════════════════════════════

describe("isR2StoragePath", () => {
  it("returns true for paths starting with r2:", () => {
    expect(mod.isR2StoragePath("r2:org-1/parts/uuid.jpg")).toBe(true);
  });

  it("returns false for paths not starting with r2:", () => {
    expect(mod.isR2StoragePath("org-1/parts/uuid.jpg")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(mod.isR2StoragePath("")).toBe(false);
  });
});

describe("r2KeyFromStoragePath", () => {
  it("strips r2: prefix from storage path", () => {
    expect(mod.r2KeyFromStoragePath("r2:org-1/parts/uuid.jpg")).toBe(
      "org-1/parts/uuid.jpg",
    );
  });

  it("returns the original string if no r2: prefix", () => {
    expect(mod.r2KeyFromStoragePath("org-1/parts/uuid.jpg")).toBe(
      "org-1/parts/uuid.jpg",
    );
  });

  it("returns empty string when given empty string", () => {
    expect(mod.r2KeyFromStoragePath("")).toBe("");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  resolveR2Url
// ══════════════════════════════════════════════════════════════════════════

describe("resolveR2Url", () => {
  it("returns null when value is null", async () => {
    expect(await mod.resolveR2Url(null)).toBeNull();
  });

  it("returns the original value when it is not an R2 key", async () => {
    const url = "https://example.com/image.jpg";
    expect(await mod.resolveR2Url(url)).toBe(url);
  });

  it("resolves an R2 key to a presigned download URL", async () => {
    stubR2Env();
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/resolved-url");

    const result = await mod.resolveR2Url("r2:org-1/parts/uuid.jpg");

    expect(result).toBe("https://r2.example.com/resolved-url");
  });

  it("returns null when presigned URL generation fails", async () => {
    stubR2Env();
    mockGetSignedUrl.mockRejectedValue(new Error("Expired credentials"));

    const result = await mod.resolveR2Url("r2:org-1/parts/uuid.jpg");

    expect(result).toBeNull();
    expect(mockReportServerError).toHaveBeenCalled();
  });
});
