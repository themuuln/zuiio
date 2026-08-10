import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

const mockGenerateLogo = vi.fn();
vi.mock("@/lib/ai/logo-generator", () => ({
  generateLogo: (...args: unknown[]) => mockGenerateLogo(...args),
}));

import { generateLogoAction } from "../actions";

function buildFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(overrides)) {
    fd.set(key, value);
  }
  return fd;
}

const VALID = {
  businessName: "  Номин  ",
  industry: "хувцас",
  style: "modern",
};

describe("generateLogoAction", () => {
  beforeEach(() => {
    mockGenerateLogo.mockResolvedValue({
      imageUrl: "https://cdn.fal.ai/logo.png",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("trims the business name and passes industry and style to the lib", async () => {
    const result = await generateLogoAction(undefined, buildFormData(VALID));

    expect(mockGenerateLogo).toHaveBeenCalledWith({
      businessName: "Номин",
      industry: "хувцас",
      style: "modern",
    });
    expect(result).toEqual({
      imageUrl: "https://cdn.fal.ai/logo.png",
      error: undefined,
      businessName: "Номин",
      industry: "хувцас",
      style: "modern",
    });
  });

  it("omits industry and style when not provided", async () => {
    const result = await generateLogoAction(
      undefined,
      buildFormData({ businessName: "Номин" }),
    );

    expect(mockGenerateLogo).toHaveBeenCalledWith({
      businessName: "Номин",
      industry: undefined,
      style: undefined,
    });
    expect(result.industry).toBeUndefined();
    expect(result.style).toBeUndefined();
  });

  it("returns a validation error and never calls the lib for a blank name", async () => {
    const result = await generateLogoAction(
      undefined,
      buildFormData({ businessName: "   " }),
    );

    expect(result).toEqual({ error: "Бизнесийн нэр оруулна уу." });
    expect(mockGenerateLogo).not.toHaveBeenCalled();
  });

  it("forwards a lib error and keeps the echo fields", async () => {
    mockGenerateLogo.mockResolvedValue({
      error: "Лого үүсгэхэд алдаа гарлаа.",
    });

    const result = await generateLogoAction(undefined, buildFormData(VALID));

    expect(result).toEqual({
      error: "Лого үүсгэхэд алдаа гарлаа.",
      imageUrl: undefined,
      businessName: "Номин",
      industry: "хувцас",
      style: "modern",
    });
  });

  it("captures and maps a thrown lib error", async () => {
    const boom = new Error("boom");
    mockGenerateLogo.mockRejectedValue(boom);

    const result = await generateLogoAction(undefined, buildFormData(VALID));

    expect(result).toEqual({
      error: "Лого үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.",
    });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "generateLogoAction",
    });
  });
});
