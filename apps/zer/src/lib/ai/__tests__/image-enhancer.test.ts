import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

const mockFalConfig = vi.fn();
const mockFalRun = vi.fn();
vi.mock("@fal-ai/client", () => ({
  fal: {
    config: (...args: unknown[]) => mockFalConfig(...args),
    run: (...args: unknown[]) => mockFalRun(...args),
  },
}));

import { enhanceProductPhoto, removeBackground } from "../image-enhancer";

describe("removeBackground", () => {
  beforeEach(() => {
    vi.stubEnv("FAL_API_KEY", "test-fal-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the removed-background image URL", async () => {
    mockFalRun.mockResolvedValue({
      data: { image: { url: "https://cdn.fal.ai/bg-removed.png" } },
    });

    const result = await removeBackground("https://cdn.fal.ai/input.png");

    expect(result).toEqual({ imageUrl: "https://cdn.fal.ai/bg-removed.png" });
    expect(mockFalConfig).toHaveBeenCalledWith({
      credentials: "test-fal-key",
    });
    expect(mockFalRun).toHaveBeenCalledWith("fal-ai/bria/background/remove", {
      input: { image_url: "https://cdn.fal.ai/input.png" },
    });
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("captures and maps a provider failure to a user error", async () => {
    const boom = new Error("fal down");
    mockFalRun.mockRejectedValue(boom);

    const result = await removeBackground("https://cdn.fal.ai/input.png");

    expect(result).toEqual({
      error: "Зургийн дэвсгэр арилгахад алдаа гарлаа.",
    });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "removeBackground",
    });
  });
});

describe("enhanceProductPhoto", () => {
  beforeEach(() => {
    vi.stubEnv("FAL_API_KEY", "test-fal-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the enhanced image URL and passes the product image", async () => {
    mockFalRun.mockResolvedValue({
      data: { images: [{ url: "https://cdn.fal.ai/enhanced.jpg" }] },
    });

    const result = await enhanceProductPhoto("https://cdn.fal.ai/product.jpg");

    expect(result).toEqual({ imageUrl: "https://cdn.fal.ai/enhanced.jpg" });
    expect(mockFalConfig).toHaveBeenCalledWith({
      credentials: "test-fal-key",
    });
    expect(mockFalRun).toHaveBeenCalledWith(
      "fal-ai/image-apps-v2/product-photography",
      { input: { product_image_url: "https://cdn.fal.ai/product.jpg" } },
    );
  });

  it("captures and maps a provider failure to a user error", async () => {
    const boom = new Error("timeout");
    mockFalRun.mockRejectedValue(boom);

    const result = await enhanceProductPhoto("https://cdn.fal.ai/product.jpg");

    expect(result).toEqual({ error: "Зураг сайжруулахад алдаа гарлаа." });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "enhanceProductPhoto",
    });
  });
});
