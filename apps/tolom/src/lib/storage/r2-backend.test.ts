import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  StorageBackend,
  UploadParams,
  UploadResult,
} from "./storage-types";

// ── Hoisted mock infrastructure ─────────────────────────────────────────

const {
  mockS3ClientInstance,
  mockGetSignedUrl,
  mockReportServerError,
  mockPutCmd,
} = vi.hoisted(() => {
  const mockSend = vi.fn();
  const instance = { send: mockSend };
  const mockPutCmd = vi.fn((input: Record<string, unknown>) => ({
    input,
    constructor: { name: "PutObjectCommand" },
  }));
  return {
    mockS3ClientInstance: instance,
    mockGetSignedUrl: vi.fn(),
    mockReportServerError: vi.fn(),
    mockPutCmd,
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => mockS3ClientInstance),
  PutObjectCommand: mockPutCmd,
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

interface R2BackendModule {
  r2Backend: StorageBackend;
}

let mod: R2BackendModule;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mod = await import("./r2-backend");
});

// ── Helpers ─────────────────────────────────────────────────────────────

function stubR2Env(): void {
  vi.stubEnv("R2_ACCOUNT_ID", "acct-123");
  vi.stubEnv("R2_ACCESS_KEY_ID", "ak-test");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "sk-test");
  vi.stubEnv("R2_BUCKET", "my-bucket");
}

const validParams: UploadParams = {
  orgId: "org-1",
  fileName: "photo.jpg",
  mimeType: "image/jpeg",
  entityType: "parts",
  entityId: "part-42",
};

const fileBuffer = new ArrayBuffer(1024);

// ══════════════════════════════════════════════════════════════════════════
//  r2Backend.upload
// ══════════════════════════════════════════════════════════════════════════

describe("r2Backend.upload", () => {
  it("uploads a file and returns presigned URL", async () => {
    stubR2Env();
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/presigned-url");

    const result: UploadResult = await mod.r2Backend.upload(
      validParams,
      fileBuffer,
    );

    expect(result.url).toBe("https://r2.example.com/presigned-url");
    expect(result.path).toMatch(/^org-1\/parts\/part-42\/.+\.jpg$/);
    expect(result.bucket).toBe("my-bucket");
    expect(mockS3ClientInstance.send).toHaveBeenCalledOnce();
    expect(mockGetSignedUrl).toHaveBeenCalledOnce();
  });

  it("throws when R2 is not configured", async () => {
    await expect(mod.r2Backend.upload(validParams, fileBuffer)).rejects.toThrow(
      "R2 is not configured",
    );
  });

  it("throws when S3 PutObjectCommand fails", async () => {
    stubR2Env();
    mockS3ClientInstance.send.mockRejectedValueOnce(
      new Error("Bucket not found"),
    );

    await expect(mod.r2Backend.upload(validParams, fileBuffer)).rejects.toThrow(
      "Bucket not found",
    );
  });

  it("throws when getSignedUrl fails after upload", async () => {
    stubR2Env();
    mockS3ClientInstance.send.mockResolvedValueOnce({});
    mockGetSignedUrl.mockRejectedValueOnce(new Error("Signing failed"));

    await expect(mod.r2Backend.upload(validParams, fileBuffer)).rejects.toThrow(
      "Signing failed",
    );
  });

  it("generates key with _ entityId fallback when entityId is omitted", async () => {
    stubR2Env();
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/url");

    const result = await mod.r2Backend.upload(
      { ...validParams, entityId: undefined },
      fileBuffer,
    );

    expect(result.path).toMatch(/^org-1\/parts\/_\/.+\.jpg$/);
  });

  it("converts ArrayBuffer to Uint8Array for S3 Body", async () => {
    stubR2Env();
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/url");

    await mod.r2Backend.upload(validParams, fileBuffer);

    // mockPutCmd captures the constructor args as `input`
    const putCmdInstance = mockPutCmd.mock.results[0]?.value;
    expect(putCmdInstance?.input?.Body).toBeInstanceOf(Uint8Array);
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  r2Backend.delete
// ══════════════════════════════════════════════════════════════════════════

describe("r2Backend.delete", () => {
  it("deletes an existing object by raw key", async () => {
    stubR2Env();
    mockS3ClientInstance.send.mockResolvedValueOnce({}); // HeadObject succeeds

    await mod.r2Backend.delete("org-1/parts/part-42/uuid.jpg");

    expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(2); // HeadObject + DeleteObject
  });

  it("deletes an existing object by r2: prefixed key", async () => {
    stubR2Env();
    mockS3ClientInstance.send.mockResolvedValueOnce({}); // HeadObject succeeds

    await mod.r2Backend.delete("r2:org-1/parts/part-42/uuid.jpg");

    expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(2);
  });

  it("deletes an existing object by presigned URL", async () => {
    stubR2Env();
    mockS3ClientInstance.send.mockResolvedValueOnce({}); // HeadObject

    await mod.r2Backend.delete(
      "https://acct-123.r2.cloudflarestorage.com/my-bucket/org-1/parts/part-42/uuid.jpg?X-Amz-Signature=abc",
    );

    expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(2);
  });

  it("does nothing when object does not exist (HeadObject throws)", async () => {
    stubR2Env();
    mockS3ClientInstance.send.mockRejectedValueOnce(
      Object.assign(new Error("Not found"), { name: "NotFound" }),
    );

    await mod.r2Backend.delete("org-1/parts/missing.jpg");

    // Only HeadObject called, no DeleteObject
    expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    expect(mockReportServerError).toHaveBeenCalled();
  });

  it("throws when R2 is not configured", async () => {
    await expect(mod.r2Backend.delete("some-key")).rejects.toThrow(
      "R2 is not configured",
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  r2Backend.getPublicUrl
// ══════════════════════════════════════════════════════════════════════════

describe("r2Backend.getPublicUrl", () => {
  it("returns the path as-is (R2 has no public URLs)", () => {
    expect(mod.r2Backend.getPublicUrl("org-1/parts/uuid.jpg")).toBe(
      "org-1/parts/uuid.jpg",
    );
  });

  it("ignores bucket parameter and returns path", () => {
    expect(
      mod.r2Backend.getPublicUrl("org-1/parts/uuid.jpg", "other-bucket"),
    ).toBe("org-1/parts/uuid.jpg");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  r2Backend.validateUpload
// ══════════════════════════════════════════════════════════════════════════

describe("r2Backend.validateUpload", () => {
  it("returns null for valid upload params", () => {
    expect(
      mod.r2Backend.validateUpload("photo.jpg", "image/jpeg", 1024),
    ).toBeNull();
  });

  it("returns error when file name is empty", () => {
    expect(mod.r2Backend.validateUpload("", "image/jpeg", 1024)).toBe(
      "File name is required",
    );
  });

  it("returns error for unsupported mime type", () => {
    expect(
      mod.r2Backend.validateUpload("file.gif", "image/gif", 1024),
    ).toContain("not allowed");
  });

  it("returns error when file exceeds max size (10MB)", () => {
    expect(
      mod.r2Backend.validateUpload("big.mp4", "image/jpeg", 11 * 1024 * 1024),
    ).toContain("exceeds limit");
  });

  it("returns error when file is empty (0 bytes)", () => {
    expect(mod.r2Backend.validateUpload("empty.jpg", "image/jpeg", 0)).toBe(
      "File is empty",
    );
  });

  it("accepts files at exactly the max size boundary", () => {
    expect(
      mod.r2Backend.validateUpload(
        "exact.pdf",
        "application/pdf",
        10 * 1024 * 1024,
      ),
    ).toBeNull();
  });
});
