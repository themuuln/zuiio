import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

const mockGenerateImage = vi.fn();
vi.mock("@/lib/ai/openai-image", () => ({
  generateImage: (...args: unknown[]) => mockGenerateImage(...args),
}));

import { generateLogo } from "../logo-generator";

const LOGO_DATA_URL = "data:image/png;base64,bG9nbw==";

describe("generateLogo", () => {
  beforeEach(() => {
    mockGenerateImage.mockResolvedValue({ dataUrl: LOGO_DATA_URL });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the generated logo image data URL", async () => {
    const result = await generateLogo({ businessName: "Номин Дэлгүүр" });

    expect(result).toEqual({ imageUrl: LOGO_DATA_URL });
    expect(mockGenerateImage).toHaveBeenCalledWith({
      prompt: expect.stringContaining('"Номин Дэлгүүр"'),
      size: "1024x1024",
      quality: "high",
      outputFormat: "png",
    });
  });

  it("builds a prompt with the business name, industry, and style", async () => {
    await generateLogo({
      businessName: "Номин",
      industry: "хувцас",
      style: "modern",
    });

    const prompt = mockGenerateImage.mock.calls[0][0].prompt;
    expect(prompt).toContain('"Номин"');
    expect(prompt).toContain("a хувцас business");
    expect(prompt).toContain("modern style");
  });

  it("omits industry and style from the prompt when not provided", async () => {
    await generateLogo({ businessName: "Цэцэг" });

    const prompt = mockGenerateImage.mock.calls[0][0].prompt;
    expect(prompt).toContain('"Цэцэг"');
    expect(prompt).not.toContain("business");
    expect(prompt).not.toContain("style");
  });

  it("forwards the OpenAI config error when the API key is missing", async () => {
    mockGenerateImage.mockResolvedValue({
      error:
        "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.",
    });

    const result = await generateLogo({ businessName: "Номин" });

    expect(result).toEqual({
      error:
        "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.",
    });
  });

  it("captures and maps a provider failure to a user error", async () => {
    const boom = new Error("openai down");
    mockGenerateImage.mockRejectedValue(boom);

    const result = await generateLogo({ businessName: "Номин" });

    expect(result).toEqual({ error: "Лого үүсгэхэд алдаа гарлаа." });
    expect(mockCapture).toHaveBeenCalledWith(boom, { context: "generateLogo" });
  });
});
