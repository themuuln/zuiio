import { describe, expect, it, vi } from "vitest";
import { createOrgQuery } from "../factory";

describe("createOrgQuery", () => {
  beforeEach(() => {
    vi.stubGlobal("indexedDB", {});
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a fetcher function", () => {
    const fetcher = createOrgQuery("/test");
    expect(typeof fetcher).toBe("function");
  });

  it("fetches and unwraps data with direct mode (default)", async () => {
    const data = { id: "1", name: "Test" };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data }),
    } as Response);

    const fetcher = createOrgQuery<{ id: string; name: string }>("/test");
    const result = await fetcher("org-1");

    expect(result).toEqual(data);
  });

  it("fetches and unwraps paginated data", async () => {
    const items = [{ id: "1" }, { id: "2" }];
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: items } }),
    } as Response);

    const fetcher = createOrgQuery<{ id: string }[]>("/test", {
      unwrap: "paginated",
    });
    const result = await fetcher("org-1");

    expect(result).toEqual(items);
  });

  it("throws on non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const fetcher = createOrgQuery("/test");
    await expect(fetcher("org-1")).rejects.toThrow();
  });

  it("throws on error in response json", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: "Not found" } }),
    } as Response);

    const fetcher = createOrgQuery("/test");
    await expect(fetcher("org-1")).rejects.toThrow("Not found");
  });

  it("throws on network error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const fetcher = createOrgQuery("/test");
    await expect(fetcher("org-1")).rejects.toThrow("Network error");
  });

  it("uses custom error message when provided", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const fetcher = createOrgQuery("/test", { unwrap: "direct" });
    await expect(
      fetcher("org-1", { errorMessage: "Custom error" }),
    ).rejects.toThrow("Custom error");
  });
});
