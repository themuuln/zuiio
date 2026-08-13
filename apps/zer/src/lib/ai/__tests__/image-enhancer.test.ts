import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

const mockEditImage = vi.fn();
vi.mock("@/lib/ai/openai-image", () => ({
  editImage: (...args: unknown[]) => mockEditImage(...args),
}));

import { enhanceProductPhoto, removeBackground } from "../image-enhancer";

const SOURCE_URL = "https://supabase.storage/product.jpg";
const TRANSPARENT_PNG = "data:image/png;base64,dHJhbnNwYXJlbnQ=";
const ENHANCED_WEBP = "data:image/webp;base64,ZW5oYW5jZWQ=";

describe("removeBackground", () => {
  beforeEach(() => {
    mockEditImage.mockResolvedValue({ dataUrl: TRANSPARENT_PNG });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the removed-background image and asks for a transparent png", async () => {
    const result = await removeBackground(SOURCE_URL);

    expect(result).toEqual({ imageUrl: TRANSPARENT_PNG });
    expect(mockEditImage).toHaveBeenCalledWith({
      imageUrl: SOURCE_URL,
      prompt: expect.stringContaining("Remove the background"),
      background: "transparent",
      outputFormat: "png",
      inputFidelity: "high",
    });
  });

  it("forwards the OpenAI config error when the API key is missing", async () => {
    mockEditImage.mockResolvedValue({
      error:
        "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.",
    });

    const result = await removeBackground(SOURCE_URL);

    expect(result).toEqual({
      error:
        "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.",
    });
  });

  it("captures and maps a provider failure to a user error", async () => {
    const boom = new Error("openai down");
    mockEditImage.mockRejectedValue(boom);

    const result = await removeBackground(SOURCE_URL);

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
    mockEditImage.mockResolvedValue({ dataUrl: ENHANCED_WEBP });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the enhanced image and passes the product image", async () => {
    const result = await enhanceProductPhoto(SOURCE_URL);

    expect(result).toEqual({ imageUrl: ENHANCED_WEBP });
    expect(mockEditImage).toHaveBeenCalledWith({
      imageUrl: SOURCE_URL,
      prompt: expect.stringContaining("Enhance this product photo"),
      quality: "high",
      outputFormat: "webp",
      inputFidelity: "high",
    });
  });

  it("forwards the OpenAI config error when the API key is missing", async () => {
    mockEditImage.mockResolvedValue({
      error:
        "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.",
    });

    const result = await enhanceProductPhoto(SOURCE_URL);

    expect(result).toEqual({
      error:
        "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.",
    });
  });

  it("captures and maps a provider failure to a user error", async () => {
    const boom = new Error("openai down");
    mockEditImage.mockRejectedValue(boom);

    const result = await enhanceProductPhoto(SOURCE_URL);

    expect(result).toEqual({ error: "Зураг сайжруулахад алдаа гарлаа." });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "enhanceProductPhoto",
    });
  });
});
