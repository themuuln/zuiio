import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

const mockRemoveBackground = vi.fn();
const mockEnhanceProductPhoto = vi.fn();
vi.mock("@/lib/ai/image-enhancer", () => ({
  removeBackground: (...args: unknown[]) => mockRemoveBackground(...args),
  enhanceProductPhoto: (...args: unknown[]) => mockEnhanceProductPhoto(...args),
}));

import { enhanceProductPhotoAction, removeBackgroundAction } from "../actions";

describe("removeBackgroundAction", () => {
  beforeEach(() => {
    mockRemoveBackground.mockResolvedValue({
      imageUrl: "https://cdn.fal.ai/bg-removed.png",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the image url and error from the lib", async () => {
    const result = await removeBackgroundAction("https://cdn.fal.ai/input.png");

    expect(mockRemoveBackground).toHaveBeenCalledWith(
      "https://cdn.fal.ai/input.png",
    );
    expect(result).toEqual({
      imageUrl: "https://cdn.fal.ai/bg-removed.png",
      error: undefined,
    });
  });

  it("passes a lib error through unchanged", async () => {
    mockRemoveBackground.mockResolvedValue({
      error: "Зургийн дэвсгэр арилгахад алдаа гарлаа.",
    });

    const result = await removeBackgroundAction("https://cdn.fal.ai/input.png");

    expect(result).toEqual({
      error: "Зургийн дэвсгэр арилгахад алдаа гарлаа.",
    });
  });

  it("captures and maps a thrown lib error", async () => {
    const boom = new Error("unexpected");
    mockRemoveBackground.mockRejectedValue(boom);

    const result = await removeBackgroundAction("https://cdn.fal.ai/input.png");

    expect(result).toEqual({
      error: "Дэвсгэр арилгахад алдаа гарлаа. Дахин оролдоно уу.",
    });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "removeBackgroundAction",
    });
  });
});

describe("enhanceProductPhotoAction", () => {
  beforeEach(() => {
    mockEnhanceProductPhoto.mockResolvedValue({
      imageUrl: "https://cdn.fal.ai/enhanced.jpg",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the image url from the lib", async () => {
    const result = await enhanceProductPhotoAction(
      "https://cdn.fal.ai/product.jpg",
    );

    expect(mockEnhanceProductPhoto).toHaveBeenCalledWith(
      "https://cdn.fal.ai/product.jpg",
    );
    expect(result).toEqual({
      imageUrl: "https://cdn.fal.ai/enhanced.jpg",
      error: undefined,
    });
  });

  it("captures and maps a thrown lib error", async () => {
    const boom = new Error("boom");
    mockEnhanceProductPhoto.mockRejectedValue(boom);

    const result = await enhanceProductPhotoAction(
      "https://cdn.fal.ai/product.jpg",
    );

    expect(result).toEqual({
      error: "Зураг сайжруулахад алдаа гарлаа. Дахин оролдоно уу.",
    });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "enhanceProductPhotoAction",
    });
  });
});
