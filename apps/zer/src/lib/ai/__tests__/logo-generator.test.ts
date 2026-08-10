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

import { generateLogo } from "../logo-generator";

describe("generateLogo", () => {
  beforeEach(() => {
    vi.stubEnv("FAL_API_KEY", "test-fal-key");
    mockFalRun.mockResolvedValue({
      data: { images: [{ url: "https://cdn.fal.ai/logo.png" }] },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the generated logo image URL", async () => {
    const result = await generateLogo({ businessName: "Номин Дэлгүүр" });

    expect(result).toEqual({ imageUrl: "https://cdn.fal.ai/logo.png" });
    expect(mockFalConfig).toHaveBeenCalledWith({
      credentials: "test-fal-key",
    });
  });

  it("builds a prompt with the business name, industry, and style", async () => {
    await generateLogo({
      businessName: "Номин",
      industry: "хувцас",
      style: "modern",
    });

    expect(mockFalRun).toHaveBeenCalledWith("fal-ai/flux-pro/v1.1", {
      input: {
        prompt: expect.stringContaining('"Номин"'),
        image_size: { width: 512, height: 512 },
        num_images: 1,
      },
    });

    const prompt = mockFalRun.mock.calls[0][1].input.prompt;
    expect(prompt).toContain("a хувцас business");
    expect(prompt).toContain("modern style");
  });

  it("omits industry and style from the prompt when not provided", async () => {
    await generateLogo({ businessName: "Цэцэг" });

    const prompt = mockFalRun.mock.calls[0][1].input.prompt;
    expect(prompt).toContain('"Цэцэг"');
    expect(prompt).not.toContain("business");
    expect(prompt).not.toContain("style");
  });

  it("captures and maps a provider failure to a user error", async () => {
    const boom = new Error("fal down");
    mockFalRun.mockRejectedValue(boom);

    const result = await generateLogo({ businessName: "Номин" });

    expect(result).toEqual({ error: "Лого үүсгэхэд алдаа гарлаа." });
    expect(mockCapture).toHaveBeenCalledWith(boom, { context: "generateLogo" });
  });
});
