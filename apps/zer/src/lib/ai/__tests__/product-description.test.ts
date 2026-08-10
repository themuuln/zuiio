import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

const mockChatCompletion = vi.fn();
vi.mock("@zuiio/ai-agent", () => ({
  chatCompletion: (...args: unknown[]) => mockChatCompletion(...args),
}));

import { generateProductDescription } from "../product-description";

describe("generateProductDescription", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-deepseek-key");
    mockChatCompletion.mockResolvedValue(
      "  Энэхүү бүтээгдэхүүн өндөр чанартай.  ",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the trimmed description from the model", async () => {
    const result = await generateProductDescription({ productName: "Цамц" });

    expect(result).toEqual({
      description: "Энэхүү бүтээгдэхүүн өндөр чанартай.",
    });
  });

  it("sends the product fields into the prompt", async () => {
    await generateProductDescription({
      productName: "Цамц",
      category: "хувцас",
      price: 50000,
      sku: "SKU-1",
      existingDescription: "Хуучин тайлбар",
    });

    const opts = mockChatCompletion.mock.calls[0][0];
    expect(opts.apiKey).toBe("test-deepseek-key");
    expect(opts.temperature).toBe(0.7);
    expect(opts.maxTokens).toBe(500);
    const content = opts.messages[0].content;
    expect(content).toContain("Бүтээгдэхүүний нэр: Цамц");
    expect(content).toContain("Ангилал: хувцас");
    expect(content).toContain("Үнэ: 50000₮");
    expect(content).toContain("SKU: SKU-1");
    expect(content).toContain("Одоогийн тайлбар: Хуучин тайлбар");
  });

  it("omits optional fields from the prompt when absent", async () => {
    await generateProductDescription({ productName: "Цамц" });

    const content = mockChatCompletion.mock.calls[0][0].messages[0].content;
    expect(content).not.toContain("Ангилал");
    expect(content).not.toContain("Үнэ");
    expect(content).not.toContain("SKU");
    expect(content).not.toContain("Одоогийн тайлбар");
  });

  it("captures and maps a model failure to a user error", async () => {
    const boom = new Error("quota exceeded");
    mockChatCompletion.mockRejectedValue(boom);

    const result = await generateProductDescription({ productName: "Цамц" });

    expect(result).toEqual({
      error: "Тайлбар үүсгэхэд алдаа гарлаа. Дахиж оролдоно уу.",
    });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "generateProductDescription",
    });
  });
});
