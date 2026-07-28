import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  drawerCatalogKeys,
  drawerCatalogsOptions,
  drawerDetailKeys,
  drawerDetailOptions,
  prefetchDrawerCatalogs,
  prefetchDrawerData,
} from "../use-drawer-queries";

describe("drawerDetailOptions", () => {
  it("returns query options with correct key", () => {
    const options = drawerDetailOptions("org-1", "wo-1");
    expect(options.queryKey).toEqual(drawerDetailKeys.all("org-1", "wo-1"));
  });

  it("sets staleTime to 30 seconds", () => {
    const options = drawerDetailOptions("org-1", "wo-1");
    expect(options.staleTime).toBe(30_000);
  });

  it("fetches from the correct API endpoint", async () => {
    const mockData = { workOrder: { id: "wo-1" } };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData }),
    } as Response);

    const options = drawerDetailOptions("org-1", "wo-1");
    const result = await options.queryFn?.();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/organizations/org-1/work-orders/wo-1/detail",
    );
    expect(result).toEqual(mockData);
  });

  it("throws on API error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: { message: "Not found" } }),
    } as Response);

    const options = drawerDetailOptions("org-1", "wo-1");
    await expect(options.queryFn?.()).rejects.toThrow("Not found");
  });

  it("throws on network error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const options = drawerDetailOptions("org-1", "wo-1");
    await expect(options.queryFn?.()).rejects.toThrow("Network error");
  });
});

describe("drawerCatalogsOptions", () => {
  it("returns query options with correct key", () => {
    const options = drawerCatalogsOptions("org-1");
    expect(options.queryKey).toEqual(drawerCatalogKeys.all("org-1"));
  });

  it("sets staleTime to 5 minutes and gcTime to 10 minutes", () => {
    const options = drawerCatalogsOptions("org-1");
    expect(options.staleTime).toBe(300_000);
    expect(options.gcTime).toBe(600_000);
  });

  it("fetches from the correct API endpoint", async () => {
    const mockData = { servicesCatalog: [] };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData }),
    } as Response);

    const options = drawerCatalogsOptions("org-1");
    const result = await options.queryFn?.();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/organizations/org-1/catalogs",
    );
    expect(result).toEqual(mockData);
  });

  it("throws on API error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: { message: "Forbidden" } }),
    } as Response);

    const options = drawerCatalogsOptions("org-1");
    await expect(options.queryFn?.()).rejects.toThrow("Forbidden");
  });
});

describe("prefetchDrawerData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls ensureQueryData with drawerDetailOptions", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi.spyOn(queryClient, "ensureQueryData");
    // ensureQueryData runs the queryFn on cache miss — mock the fetch
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { workOrder: { id: "wo-1" } } }),
    } as Response);

    await prefetchDrawerData(queryClient, "org-1", "wo-1");

    expect(ensureSpy).toHaveBeenCalledTimes(1);
    const [options] = ensureSpy.mock.calls[0];
    expect((options as any).queryKey).toEqual(
      drawerDetailKeys.all("org-1", "wo-1"),
    );
  });

  it("returns early when orgId is null", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi.spyOn(queryClient, "ensureQueryData");

    await prefetchDrawerData(queryClient, null, "wo-1");
    expect(ensureSpy).not.toHaveBeenCalled();
  });

  it("returns early when woId is empty", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi.spyOn(queryClient, "ensureQueryData");

    await prefetchDrawerData(queryClient, "org-1", "");
    expect(ensureSpy).not.toHaveBeenCalled();
  });

  it("returns early when orgId is undefined", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi.spyOn(queryClient, "ensureQueryData");

    await prefetchDrawerData(queryClient, undefined, "wo-1");
    expect(ensureSpy).not.toHaveBeenCalled();
  });
});

describe("prefetchDrawerCatalogs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls ensureQueryData with drawerCatalogsOptions", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi.spyOn(queryClient, "ensureQueryData");
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { servicesCatalog: [] } }),
    } as Response);

    await prefetchDrawerCatalogs(queryClient, "org-1");

    expect(ensureSpy).toHaveBeenCalledTimes(1);
    const [options] = ensureSpy.mock.calls[0];
    expect((options as any).queryKey).toEqual(drawerCatalogKeys.all("org-1"));
  });

  it("returns early when orgId is null", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi.spyOn(queryClient, "ensureQueryData");

    await prefetchDrawerCatalogs(queryClient, null);
    expect(ensureSpy).not.toHaveBeenCalled();
  });

  it("returns early when orgId is undefined", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi.spyOn(queryClient, "ensureQueryData");

    await prefetchDrawerCatalogs(queryClient, undefined);
    expect(ensureSpy).not.toHaveBeenCalled();
  });
});
