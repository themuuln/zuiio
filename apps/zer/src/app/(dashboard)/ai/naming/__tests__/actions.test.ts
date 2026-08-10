import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

const mockSuggestStoreNames = vi.fn();
const mockSuggestDomainNames = vi.fn();
vi.mock("@/lib/ai/business-naming", () => ({
  suggestStoreNames: (...args: unknown[]) => mockSuggestStoreNames(...args),
  suggestDomainNames: (...args: unknown[]) => mockSuggestDomainNames(...args),
}));

import { suggestDomainNamesAction, suggestStoreNamesAction } from "../actions";

function buildFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(overrides)) {
    fd.set(key, value);
  }
  return fd;
}

describe("suggestStoreNamesAction", () => {
  beforeEach(() => {
    mockSuggestStoreNames.mockResolvedValue({
      names: ["Номин", "Хурд"],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("parses keywords and count from the form and forwards them", async () => {
    const result = await suggestStoreNamesAction(
      buildFormData({
        businessType: "хувцас",
        keywords: "  monгол , дэлгүүр , , байгууллага ",
        count: "3",
      }),
    );

    expect(mockSuggestStoreNames).toHaveBeenCalledWith({
      businessType: "хувцас",
      keywords: ["monгол", "дэлгүүр", "байгууллага"],
      count: 3,
    });
    expect(result).toEqual({ names: ["Номин", "Хурд"], error: undefined });
  });

  it("defaults count to 5 and omits keywords when absent", async () => {
    await suggestStoreNamesAction(buildFormData({ businessType: "хоол" }));

    expect(mockSuggestStoreNames).toHaveBeenCalledWith({
      businessType: "хоол",
      keywords: undefined,
      count: 5,
    });
  });

  it("falls back to count 5 for a non-numeric count", async () => {
    await suggestStoreNamesAction(
      buildFormData({ businessType: "хоол", count: "abc" }),
    );

    expect(mockSuggestStoreNames).toHaveBeenCalledWith(
      expect.objectContaining({ count: 5 }),
    );
  });

  it("returns a validation error for a blank business type", async () => {
    const result = await suggestStoreNamesAction(
      buildFormData({ businessType: "   " }),
    );

    expect(result).toEqual({ error: "Бизнесийн төрөл оруулна уу." });
    expect(mockSuggestStoreNames).not.toHaveBeenCalled();
  });

  it("forwards a lib error", async () => {
    mockSuggestStoreNames.mockResolvedValue({
      error: "Нэр санал болгоход алдаа гарлаа.",
    });

    const result = await suggestStoreNamesAction(
      buildFormData({ businessType: "хоол" }),
    );

    expect(result).toEqual({ error: "Нэр санал болгоход алдаа гарлаа." });
  });

  it("captures and maps a thrown lib error", async () => {
    const boom = new Error("boom");
    mockSuggestStoreNames.mockRejectedValue(boom);

    const result = await suggestStoreNamesAction(
      buildFormData({ businessType: "хоол" }),
    );

    expect(result).toEqual({
      error: "Нэр санал болгоход алдаа гарлаа. Дахин оролдоно уу.",
    });
    expect(mockCapture).toHaveBeenCalledWith(boom, {
      context: "suggestStoreNamesAction",
    });
  });
});

describe("suggestDomainNamesAction", () => {
  beforeEach(() => {
    mockSuggestDomainNames.mockResolvedValue({
      domains: ["nomin.mn", "nomin.com"],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the store name and returns the domains", async () => {
    const result = await suggestDomainNamesAction(
      buildFormData({ storeName: "Номин" }),
    );

    expect(mockSuggestDomainNames).toHaveBeenCalledWith({ storeName: "Номин" });
    expect(result).toEqual({
      domains: ["nomin.mn", "nomin.com"],
      error: undefined,
    });
  });

  it("returns a validation error for a blank store name", async () => {
    const result = await suggestDomainNamesAction(
      buildFormData({ storeName: "" }),
    );

    expect(result).toEqual({ error: "Дэлгүүрийн нэр оруулна уу." });
    expect(mockSuggestDomainNames).not.toHaveBeenCalled();
  });

  it("captures and maps a thrown lib error", async () => {
    mockSuggestDomainNames.mockRejectedValue(new Error("boom"));

    const result = await suggestDomainNamesAction(
      buildFormData({ storeName: "Номин" }),
    );

    expect(result).toEqual({
      error: "Домэйн нэр санал болгоход алдаа гарлаа. Дахин оролдоно уу.",
    });
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "suggestDomainNamesAction",
    });
  });
});
