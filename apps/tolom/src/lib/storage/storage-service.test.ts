import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorageBackend, UploadParams } from "./storage-types";

// ── Hoisted mock infrastructure ─────────────────────────────────────────
// Stable mock return objects so the real code gets the same reference we configure.

const { mockUpload, mockRemove, mockGetPublicUrlFn, mockSupabaseClient } =
  vi.hoisted(() => {
    const mockUpload = vi.fn();
    const mockRemove = vi.fn();
    const mockGetPublicUrlFn = vi.fn(
      (path: string) =>
        ({
          data: {
            publicUrl: `https://supabase.co/storage/v1/object/public/part-photos/${path}`,
          },
        }) as const,
    );

    const mockFromReturn = {
      upload: mockUpload,
      remove: mockRemove,
      getPublicUrl: mockGetPublicUrlFn,
    };

    const mockFrom = vi.fn(() => mockFromReturn);
    const mockSupabaseClient = {
      storage: { from: mockFrom },
    };

    return { mockUpload, mockRemove, mockGetPublicUrlFn, mockSupabaseClient };
  });

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(() => mockSupabaseClient),
}));

interface StorageServiceModule {
  supabaseBackend: StorageBackend;
}

let mod: StorageServiceModule;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mod = await import("./storage-service");
});

// ── Helpers ─────────────────────────────────────────────────────────────

const validParams: UploadParams = {
  orgId: "org-1",
  fileName: "photo.jpg",
  mimeType: "image/jpeg",
  entityType: "parts",
  entityId: "part-42",
};

const fileBuffer = new ArrayBuffer(1024);

// ══════════════════════════════════════════════════════════════════════════
//  supabaseBackend.upload
// ══════════════════════════════════════════════════════════════════════════

describe("supabaseBackend.upload", () => {
  it("uploads a file and returns public URL", async () => {
    mockUpload.mockResolvedValue({ data: {}, error: null });

    const result = await mod.supabaseBackend.upload(validParams, fileBuffer);

    expect(result.url).toMatch(
      /^https:\/\/supabase\.co\/storage\/v1\/object\/public\/part-photos\/org-1\/parts\/part-42\/.+\.jpg$/,
    );
    expect(result.path).toMatch(/^org-1\/parts\/part-42\/.+\.jpg$/);
    expect(result.bucket).toBe("part-photos");
    expect(mockUpload).toHaveBeenCalledOnce();
  });

  it("maps entityType to correct bucket", async () => {
    mockUpload.mockResolvedValue({ data: {}, error: null });

    const result = await mod.supabaseBackend.upload(
      { ...validParams, entityType: "work-orders" },
      fileBuffer,
    );

    expect(result.bucket).toBe("work-order-photos");
  });

  it("maps entityType logos to org-logos bucket", async () => {
    mockUpload.mockResolvedValue({ data: {}, error: null });

    const result = await mod.supabaseBackend.upload(
      { ...validParams, entityType: "logos" },
      fileBuffer,
    );

    expect(result.bucket).toBe("org-logos");
  });

  it("falls back to part-photos bucket for unknown entity types", async () => {
    mockUpload.mockResolvedValue({ data: {}, error: null });

    const result = await mod.supabaseBackend.upload(
      { ...validParams, entityType: "unknown" },
      fileBuffer,
    );

    expect(result.bucket).toBe("part-photos");
  });

  it("throws when Supabase upload returns an error", async () => {
    mockUpload.mockResolvedValue({
      data: null,
      error: { message: "Permission denied" },
    });

    await expect(
      mod.supabaseBackend.upload(validParams, fileBuffer),
    ).rejects.toThrow("Upload failed: Permission denied");
  });

  it("generates path with _ entityId fallback when entityId is omitted", async () => {
    mockUpload.mockResolvedValue({ data: {}, error: null });

    const result = await mod.supabaseBackend.upload(
      { ...validParams, entityId: undefined },
      fileBuffer,
    );

    expect(result.path).toMatch(/^org-1\/parts\/_\/.+\.jpg$/);
  });

  it("calls upload with upsert: false", async () => {
    mockUpload.mockResolvedValue({ data: {}, error: null });

    await mod.supabaseBackend.upload(validParams, fileBuffer);

    expect(mockUpload).toHaveBeenCalledWith(expect.any(String), fileBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  supabaseBackend.delete
// ══════════════════════════════════════════════════════════════════════════

describe("supabaseBackend.delete", () => {
  it("deletes a file by full Supabase URL", async () => {
    mockRemove.mockResolvedValue({ data: {}, error: null });

    await mod.supabaseBackend.delete(
      "https://supabase.co/storage/v1/object/public/part-photos/org-1/parts/uuid.jpg",
    );

    expect(mockRemove).toHaveBeenCalledWith(["org-1/parts/uuid.jpg"]);
  });

  it("deletes a file by raw path", async () => {
    mockRemove.mockResolvedValue({ data: {}, error: null });

    await mod.supabaseBackend.delete("org-1/parts/uuid.jpg");

    expect(mockRemove).toHaveBeenCalledWith(["org-1/parts/uuid.jpg"]);
  });

  it("handles r2: prefixed paths", async () => {
    mockRemove.mockResolvedValue({ data: {}, error: null });

    await mod.supabaseBackend.delete("r2:org-1/parts/uuid.jpg");

    expect(mockRemove).toHaveBeenCalledWith(["org-1/parts/uuid.jpg"]);
  });

  it("throws when Supabase delete returns an error", async () => {
    mockRemove.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    await expect(
      mod.supabaseBackend.delete("org-1/parts/missing.jpg"),
    ).rejects.toThrow("Delete failed: Not found");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  supabaseBackend.getPublicUrl
// ══════════════════════════════════════════════════════════════════════════

describe("supabaseBackend.getPublicUrl", () => {
  it("generates public URL using Supabase URL from env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");

    const url = mod.supabaseBackend.getPublicUrl("org-1/parts/uuid.jpg");

    expect(url).toBe(
      "https://project.supabase.co/storage/v1/object/public/part-photos/org-1/parts/uuid.jpg",
    );
  });

  it("uses provided bucket name", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");

    const url = mod.supabaseBackend.getPublicUrl(
      "org-1/logos/logo.png",
      "org-logos",
    );

    expect(url).toBe(
      "https://project.supabase.co/storage/v1/object/public/org-logos/org-1/logos/logo.png",
    );
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    expect(() =>
      mod.supabaseBackend.getPublicUrl("org-1/parts/uuid.jpg"),
    ).toThrow("Missing NEXT_PUBLIC_SUPABASE_URL");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  supabaseBackend.validateUpload
// ══════════════════════════════════════════════════════════════════════════

describe("supabaseBackend.validateUpload", () => {
  it("returns null for valid upload params", () => {
    expect(
      mod.supabaseBackend.validateUpload("photo.jpg", "image/jpeg", 1024),
    ).toBeNull();
  });

  it("returns error when file name is empty", () => {
    expect(mod.supabaseBackend.validateUpload("", "image/jpeg", 1024)).toBe(
      "File name is required",
    );
  });

  it("returns error for unsupported mime type", () => {
    expect(
      mod.supabaseBackend.validateUpload("file.gif", "image/gif", 1024),
    ).toContain("not allowed");
  });

  it("returns error when file exceeds max size (10MB)", () => {
    expect(
      mod.supabaseBackend.validateUpload(
        "big.mp4",
        "image/jpeg",
        11 * 1024 * 1024,
      ),
    ).toContain("exceeds limit");
  });

  it("returns error when file is empty (0 bytes)", () => {
    expect(
      mod.supabaseBackend.validateUpload("empty.jpg", "image/jpeg", 0),
    ).toBe("File is empty");
  });

  it("accepts files at exactly the max size boundary", () => {
    expect(
      mod.supabaseBackend.validateUpload(
        "exact.pdf",
        "application/pdf",
        10 * 1024 * 1024,
      ),
    ).toBeNull();
  });
});
