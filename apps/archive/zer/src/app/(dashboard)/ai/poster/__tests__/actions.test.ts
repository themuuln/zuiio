import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

vi.mock("@sentry/nextjs", () => ({
  startSpan: (_opts: unknown, fn: (span: unknown) => Promise<unknown>) =>
    fn({ setAttribute: vi.fn(), setAttributes: vi.fn() }),
}));

const mockRequireActionContext = vi.fn();
vi.mock("@/lib/action-utils", () => ({
  requireActionContext: (...args: unknown[]) =>
    mockRequireActionContext(...args),
}));

const mockGeneratePosterCore = vi.fn();
vi.mock("@/lib/ai/poster-core", () => ({
  generatePosterCore: (...args: unknown[]) => mockGeneratePosterCore(...args),
  PLATFORM_SIZES: {},
  POSTER_STYLES: [],
}));

const mockRevalidateEntity = vi.fn();
const mockRevalidateEntityTag = vi.fn();
vi.mock("@/lib/revalidate", () => ({
  revalidateEntity: (...args: unknown[]) => mockRevalidateEntity(...args),
  revalidateEntityTag: (...args: unknown[]) => mockRevalidateEntityTag(...args),
}));

import { generatePoster } from "../actions";

const BASE64 = "aGVsbG8="; // "hello"
const DATA_URL = `data:image/webp;base64,${BASE64}`;

function buildFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(overrides)) {
    fd.set(key, value);
  }
  return fd;
}

const VALID = {
  product_name: "Цамц",
  product_image_url: "https://cdn.fal.ai/product.jpg",
  style_id: "minimal",
  platform: "instagram",
};

interface StorageMock {
  supabase: { storage: { from: Mock } };
  upload: Mock;
  getPublicUrl: Mock;
  from: Mock;
}

function buildSupabase(): StorageMock {
  const upload = vi.fn().mockResolvedValue({ error: null });
  const getPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: "https://supabase.storage/posters/org-1/x.webp" },
  });
  const from = vi.fn().mockReturnValue({ upload, getPublicUrl });
  return { supabase: { storage: { from } }, upload, getPublicUrl, from };
}

describe("generatePoster", () => {
  let storage: StorageMock;

  beforeEach(() => {
    storage = buildSupabase();
    mockRequireActionContext.mockResolvedValue({
      supabase: storage.supabase,
      organizationId: "org-1",
      permissions: ["products.update"],
    });
    mockGeneratePosterCore.mockResolvedValue({ posterUrl: DATA_URL });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("stores the poster and returns the public storage url", async () => {
    const result = await generatePoster(undefined, buildFormData(VALID));

    expect(result).toEqual({
      posterUrl: "https://supabase.storage/posters/org-1/x.webp",
    });
    expect(mockRequireActionContext).toHaveBeenCalledWith("products.update");
    expect(mockGeneratePosterCore).toHaveBeenCalledWith({
      productName: "Цамц",
      productImageUrl: "https://cdn.fal.ai/product.jpg",
      styleId: "minimal",
      platform: "instagram",
      customPrompt: "",
      promotionalText: "",
    });
    expect(storage.from).toHaveBeenCalledWith("ai-posters");
    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^posters\/org-1\/_{5}\d+_[a-z0-9]{6}\.webp$/),
      expect.any(Buffer),
      { contentType: "image/webp", upsert: false },
    );
    expect(storage.getPublicUrl).toHaveBeenCalledTimes(1);
    expect(mockRevalidateEntity).toHaveBeenCalledWith("shop");
    expect(mockRevalidateEntityTag).toHaveBeenCalledWith("products", "org-1");
  });

  it("returns the auth error from requireActionContext", async () => {
    mockRequireActionContext.mockResolvedValue({
      error: "Танд эрх байхгүй байна.",
    });

    const result = await generatePoster(undefined, buildFormData(VALID));

    expect(result).toEqual({ error: "Танд эрх байхгүй байна." });
    expect(mockGeneratePosterCore).not.toHaveBeenCalled();
  });

  it("returns a validation error when required fields are missing", async () => {
    const fd = buildFormData({ product_name: "Цамц", platform: "instagram" });

    const result = await generatePoster(undefined, fd);

    expect(result).toEqual({
      error: "Бүх шаардлагатай талбаруудыг бөглөнө үү.",
    });
    expect(mockGeneratePosterCore).not.toHaveBeenCalled();
  });

  it("forwards a core error directly", async () => {
    mockGeneratePosterCore.mockResolvedValue({
      error: "Зураг үүсгэхэд алдаа гарлаа.",
    });

    const result = await generatePoster(undefined, buildFormData(VALID));

    expect(result).toEqual({ error: "Зураг үүсгэхэд алдаа гарлаа." });
    expect(storage.from).not.toHaveBeenCalled();
  });

  it("falls back to the base64 data url when the storage upload fails", async () => {
    storage.upload.mockResolvedValue({ error: { message: "denied" } });

    const result = await generatePoster(undefined, buildFormData(VALID));

    expect(result).toEqual({ posterUrl: DATA_URL });
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Object), {
      context: "generatePoster: storage upload",
    });
    expect(mockRevalidateEntity).not.toHaveBeenCalled();
  });

  it("falls back to the base64 data url when storage throws", async () => {
    const boom = new Error("network");
    storage.upload.mockRejectedValue(boom);

    const result = await generatePoster(undefined, buildFormData(VALID));

    expect(result).toEqual({ posterUrl: DATA_URL });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "generatePoster: storage post-process",
    });
  });

  it("replaces non-alphanumeric chars in the file name with underscores", async () => {
    await generatePoster(
      undefined,
      buildFormData({ ...VALID, product_name: "Цамц!-2024" }),
    );

    const filePath = storage.upload.mock.calls[0][0] as string;
    // Cyrillic and punctuation are not [a-zA-Z0-9], so they become "_".
    expect(filePath).toMatch(
      /^posters\/org-1\/_{6}2024_\d+_[a-z0-9]{6}\.webp$/,
    );
    expect(filePath).not.toContain("Цамц");
  });
});
