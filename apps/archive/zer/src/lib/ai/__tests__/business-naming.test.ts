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

import { suggestDomainNames, suggestStoreNames } from "../business-naming";

describe("suggestStoreNames", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-deepseek-key");
    mockChatCompletion.mockResolvedValue(
      "1. Номин\n2. Хурд\n3. Тэнгэр Дэлгүүр\n\n4. Загвар",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("strips numbering and blank lines from the chat response", async () => {
    const result = await suggestStoreNames({
      businessType: "хувцас",
      keywords: ["monгол", "дэлгүүр"],
      count: 5,
    });

    expect(result).toEqual({
      names: ["Номин", "Хурд", "Тэнгэр Дэлгүүр", "Загвар"],
    });
  });

  it("sends the business type, keywords, and count to the model", async () => {
    await suggestStoreNames({
      businessType: "цахим",
      keywords: ["hurda", "bichig"],
      count: 3,
    });

    expect(mockChatCompletion).toHaveBeenCalledTimes(1);
    const opts = mockChatCompletion.mock.calls[0][0];
    expect(opts.apiKey).toBe("test-deepseek-key");
    expect(opts.temperature).toBe(0.8);
    expect(opts.maxTokens).toBe(300);
    expect(opts.messages[0].content).toContain("Бизнесийн төрөл: цахим");
    expect(opts.messages[0].content).toContain("Түлхүүр үгс: hurda, bichig");
    expect(opts.messages[0].content).toContain("3");
  });

  it("defaults to 5 names and omits keywords when not provided", async () => {
    await suggestStoreNames({ businessType: "хоол" });

    const opts = mockChatCompletion.mock.calls[0][0];
    expect(opts.messages[0].content).toContain("5");
    expect(opts.messages[0].content).not.toContain("Түлхүүр үгс");
  });

  it("captures and maps a model failure to a user error", async () => {
    const boom = new Error("rate limited");
    mockChatCompletion.mockRejectedValue(boom);

    const result = await suggestStoreNames({ businessType: "хувцас" });

    expect(result).toEqual({ error: "Нэр санал болгоход алдаа гарлаа." });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "suggestStoreNames",
    });
  });
});

describe("suggestDomainNames", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-deepseek-key");
    mockChatCompletion.mockResolvedValue(
      "1. nomin.mn\n2. nomin.com\n3. nomin.co",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the domain suggestions with numbering stripped", async () => {
    const result = await suggestDomainNames({ storeName: "Номин" });

    expect(result).toEqual({ domains: ["nomin.mn", "nomin.com", "nomin.co"] });
    const opts = mockChatCompletion.mock.calls[0][0];
    expect(opts.apiKey).toBe("test-deepseek-key");
    expect(opts.temperature).toBe(0.7);
    expect(opts.maxTokens).toBe(200);
    expect(opts.messages[0].content).toContain("Дэлгүүрийн нэр: Номин");
  });

  it("captures and maps a model failure to a user error", async () => {
    mockChatCompletion.mockRejectedValue(new Error("down"));

    const result = await suggestDomainNames({ storeName: "Номин" });

    expect(result).toEqual({
      error: "Домэйн нэр санал болгоход алдаа гарлаа.",
    });
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "suggestDomainNames",
    });
  });
});
