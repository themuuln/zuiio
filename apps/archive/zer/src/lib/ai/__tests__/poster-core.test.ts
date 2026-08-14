import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

const mockEditImage = vi.fn();
const mockGenerateImage = vi.fn();
vi.mock("@/lib/ai/openai-image", () => ({
  editImage: (...args: unknown[]) => mockEditImage(...args),
  generateImage: (...args: unknown[]) => mockGenerateImage(...args),
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
  productImageUrl: "https://supabase.storage/product.jpg",
  styleId: "minimal",
  platform: "instagram",
};

const RAW_BYTES = Buffer.from("fake-image-bytes");
const PNG_BYTES = RAW_BYTES.toString("base64");
const WEBP_DATA_URL = `data:image/webp;base64,${PNG_BYTES}`;

function mockOpenAiImage(dataUrl = WEBP_DATA_URL) {
  mockEditImage.mockResolvedValue({ dataUrl });
}

function stubChain() {
  chain.resize.mockReturnThis();
  chain.composite.mockReturnThis();
  chain.webp.mockReturnThis();
  chain.toBuffer.mockResolvedValue(RAW_BYTES);
}

describe("generatePosterCore", () => {
  beforeEach(() => {
    stubChain();
    mockOpenAiImage();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns a base64 webp data URL for a generated poster", async () => {
    const result = await generatePosterCore(FULL_PARAMS);

    expect(result.posterUrl).toBe(`data:image/webp;base64,${PNG_BYTES}`);
    expect(mockEditImage).toHaveBeenCalledWith({
      imageUrl: "https://supabase.storage/product.jpg",
      prompt: expect.stringContaining("Цамц"),
      size: "1024x1024",
      quality: "high",
      outputFormat: "webp",
    });
  });

  it("maps the platform to the closest OpenAI image size", async () => {
    await generatePosterCore({ ...FULL_PARAMS, platform: "print_a4" });
    expect(mockEditImage.mock.calls[0][0].size).toBe("1024x1536");

    await generatePosterCore({ ...FULL_PARAMS, platform: "facebook" });
    expect(mockEditImage.mock.calls[1][0].size).toBe("1536x1024");

    await generatePosterCore({ ...FULL_PARAMS, platform: "web" });
    expect(mockEditImage.mock.calls[2][0].size).toBe("1536x1024");
  });

  it("uses the custom prompt for the custom style", async () => {
    await generatePosterCore({
      ...FULL_PARAMS,
      styleId: "custom",
      customPrompt: "vintage neon poster",
    });

    const prompt = mockEditImage.mock.calls[0][0].prompt;
    expect(prompt).toContain("vintage neon poster");
  });

  it("falls back to a plain prompt for an unknown style", async () => {
    await generatePosterCore({ ...FULL_PARAMS, styleId: "nonexistent" });

    const prompt = mockEditImage.mock.calls[0][0].prompt;
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

  it("forwards the OpenAI config error when the API key is missing", async () => {
    mockEditImage.mockResolvedValue({
      error:
        "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.",
    });

    const result = await generatePosterCore(FULL_PARAMS);

    expect(result).toEqual({
      error:
        "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.",
    });
    expect(chain.webp).not.toHaveBeenCalled();
  });

  it("returns an error when OpenAI returns no image data", async () => {
    mockEditImage.mockResolvedValue({});

    const result = await generatePosterCore(FULL_PARAMS);

    expect(result).toEqual({
      error: "Зураг үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.",
    });
  });

  it("captures and surfaces a provider error with its message", async () => {
    const boom = new Error("upstream timeout");
    mockEditImage.mockRejectedValue(boom);

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
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the generated image data URL", async () => {
    mockGenerateImage.mockResolvedValue({
      dataUrl: "data:image/webp;base64,cHJvZHVjdA==",
    });

    const result = await generateProductImage("a red shirt");

    expect(result).toEqual({
      imageUrl: "data:image/webp;base64,cHJvZHVjdA==",
    });
    expect(mockGenerateImage).toHaveBeenCalledWith({
      prompt: "a red shirt",
      size: "1024x1024",
      quality: "medium",
      outputFormat: "webp",
    });
  });

  it("forwards the OpenAI config error when the API key is missing", async () => {
    mockGenerateImage.mockResolvedValue({
      error:
        "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.",
    });

    const result = await generateProductImage("a red shirt");

    expect(result).toEqual({
      error:
        "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.",
    });
  });

  it("returns an error when no image data comes back", async () => {
    mockGenerateImage.mockResolvedValue({});

    const result = await generateProductImage("a red shirt");

    expect(result).toEqual({ error: "Зураг үүсгэхэд алдаа гарлаа." });
  });

  it("captures and maps a provider failure", async () => {
    mockGenerateImage.mockRejectedValue(new Error("down"));

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
