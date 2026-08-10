import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const chain = {
  resize: vi.fn().mockReturnThis(),
  composite: vi.fn().mockReturnThis(),
  webp: vi.fn().mockReturnThis(),
  toBuffer: vi.fn(),
};
vi.mock("sharp", () => ({
  default: vi.fn(() => chain),
}));

import {
  generatePosterCore,
  generateProductImage,
  PLATFORM_SIZES,
  POSTER_STYLES,
} from "../poster-core";

const FULL_PARAMS = {
  productName: "Цамц",
  productImageUrl: "https://cdn.fal.ai/product.jpg",
  styleId: "minimal",
  platform: "instagram",
};

const RAW_BYTES = Buffer.from("fake-image-bytes");
const PNG_BYTES = RAW_BYTES.toString("base64");

function mockFalImage(url = "https://cdn.fal.ai/result.png") {
  mockFalRun.mockResolvedValue({ data: { images: [{ url }] } });
}

function mockFetchOk() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from("raw-image"),
    }),
  );
}

function stubChain() {
  chain.resize.mockReturnThis();
  chain.composite.mockReturnThis();
  chain.webp.mockReturnThis();
  chain.toBuffer.mockResolvedValue(RAW_BYTES);
}

describe("generatePosterCore", () => {
  beforeEach(() => {
    vi.stubEnv("FAL_API_KEY", "test-fal-key");
    mockFalConfig.mockImplementation(() => undefined);
    stubChain();
    mockFetchOk();
    mockFalImage();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("returns a base64 webp data URL for a generated poster", async () => {
    const result = await generatePosterCore(FULL_PARAMS);

    expect(result.posterUrl).toBe(`data:image/webp;base64,${PNG_BYTES}`);
    expect(mockFalConfig).toHaveBeenCalledWith({ credentials: "test-fal-key" });
    expect(mockFalRun).toHaveBeenCalledWith("fal-ai/flux-pro/v1.1/redux", {
      input: {
        prompt: expect.stringContaining("Цамц"),
        image_url: "https://cdn.fal.ai/product.jpg",
        image_size: { width: 1080, height: 1080 },
        num_images: 1,
      },
    });
  });

  it("uses the platform dimensions for the request", async () => {
    await generatePosterCore({ ...FULL_PARAMS, platform: "print_a4" });

    const input = mockFalRun.mock.calls[0][1].input;
    expect(input.image_size).toEqual({ width: 2480, height: 3508 });
  });

  it("uses the custom prompt for the custom style", async () => {
    await generatePosterCore({
      ...FULL_PARAMS,
      styleId: "custom",
      customPrompt: "vintage neon poster",
    });

    const prompt = mockFalRun.mock.calls[0][1].input.prompt;
    expect(prompt).toContain("vintage neon poster");
  });

  it("falls back to a plain prompt for an unknown style", async () => {
    await generatePosterCore({ ...FULL_PARAMS, styleId: "nonexistent" });

    const prompt = mockFalRun.mock.calls[0][1].input.prompt;
    expect(prompt).toBe(
      "A product poster for Цамц, Mongolian market, instagram",
    );
  });

  it("composites the promotional text overlay when provided", async () => {
    await generatePosterCore({
      ...FULL_PARAMS,
      promotionalText: "Хямдрал 50%",
    });

    expect(chain.composite).toHaveBeenCalled();
    expect(chain.webp).toHaveBeenCalledWith({ quality: 85 });
    const compositeArgs = chain.composite.mock.calls[0][0][0];
    expect(compositeArgs.input).toBeInstanceOf(Buffer);
  });

  it("skips the overlay when no promotional text is given", async () => {
    await generatePosterCore(FULL_PARAMS);

    expect(chain.composite).not.toHaveBeenCalled();
    expect(chain.resize).toHaveBeenCalledWith(1080, 1080, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    });
  });

  it("returns a config error when fal.config throws", async () => {
    mockFalConfig.mockImplementation(() => {
      throw new Error("bad key");
    });

    const result = await generatePosterCore(FULL_PARAMS);

    expect(result).toEqual({
      error: "AI үйлчилгээний тохиргоо дутуу байна. FAL_API_KEY тохируулна уу.",
    });
    expect(mockFalRun).not.toHaveBeenCalled();
  });

  it("returns a download error when the image fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const result = await generatePosterCore(FULL_PARAMS);

    expect(result).toEqual({
      error: "Үүсгэсэн зургийг татахад алдаа гарлаа.",
    });
  });

  it("returns an error when fal returns no image url", async () => {
    mockFalRun.mockResolvedValue({ data: { images: [] } });

    const result = await generatePosterCore(FULL_PARAMS);

    expect(result).toEqual({
      error: "Зураг үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.",
    });
  });

  it("captures and surfaces a provider error with its message", async () => {
    const boom = new Error("upstream timeout");
    mockFalRun.mockRejectedValue(boom);

    const result = await generatePosterCore(FULL_PARAMS);

    expect(result).toEqual({
      error: "Постер үүсгэхэд алдаа гарлаа: upstream timeout",
    });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "generatePosterCore",
    });
  });
});

describe("generateProductImage", () => {
  beforeEach(() => {
    vi.stubEnv("FAL_API_KEY", "test-fal-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the generated image url", async () => {
    mockFalRun.mockResolvedValue({
      data: { images: [{ url: "https://cdn.fal.ai/product.png" }] },
    });

    const result = await generateProductImage("a red shirt");

    expect(result).toEqual({ imageUrl: "https://cdn.fal.ai/product.png" });
    expect(mockFalRun).toHaveBeenCalledWith("fal-ai/flux-pro/v1.1", {
      input: {
        prompt: "a red shirt",
        image_size: { width: 1024, height: 1024 },
        num_images: 1,
      },
    });
  });

  it("returns an error when no image url comes back", async () => {
    mockFalRun.mockResolvedValue({ data: { images: [] } });

    const result = await generateProductImage("a red shirt");

    expect(result).toEqual({ error: "Зураг үүсгэхэд алдаа гарлаа." });
  });

  it("captures and maps a provider failure", async () => {
    mockFalRun.mockRejectedValue(new Error("down"));

    const result = await generateProductImage("a red shirt");

    expect(result).toEqual({ error: "Зураг үүсгэхэд алдаа гарлаа." });
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "generateProductImage",
    });
  });
});

describe("poster constants", () => {
  it("exposes the expected styles and platform sizes", () => {
    expect(POSTER_STYLES.map((s) => s.id)).toContain("minimal");
    expect(POSTER_STYLES.map((s) => s.id)).toContain("custom");
    expect(PLATFORM_SIZES.instagram).toEqual({
      label: "Instagram (1:1)",
      width: 1080,
      height: 1080,
    });
    expect(PLATFORM_SIZES.web).toEqual({
      label: "Вэб (16:9)",
      width: 1920,
      height: 1080,
    });
  });
});
