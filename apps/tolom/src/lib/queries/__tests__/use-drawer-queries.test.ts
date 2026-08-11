import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  drawerCatalogKeys,
  drawerCatalogsOptions,
  drawerDetailKeys,
  drawerDetailOptions,
  prefetchDrawerCatalogs,
  prefetchDrawerData,
  prefetchDrawerDataMany,
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

describe("prefetchDrawerDataMany", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("warms the detail cache for every id", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi
      .spyOn(queryClient, "ensureQueryData")
      .mockResolvedValue({ workOrder: { id: "x" } } as never);

    await prefetchDrawerDataMany(queryClient, "org-1", [
      "wo-1",
      "wo-2",
      "wo-3",
    ]);

    expect(ensureSpy).toHaveBeenCalledTimes(3);
    const keys = ensureSpy.mock.calls.map(([options]) => {
      const opts = options as object;
      return opts && "queryKey" in opts ? opts.queryKey : undefined;
    });
    expect(keys).toEqual([
      drawerDetailKeys.all("org-1", "wo-1"),
      drawerDetailKeys.all("org-1", "wo-2"),
      drawerDetailKeys.all("org-1", "wo-3"),
    ]);
  });

  it("limits concurrent fetches to the concurrency option", async () => {
    const queryClient = new QueryClient();
    const inFlight = { count: 0, max: 0 };
    const releases: Array<() => void> = [];
    const ensureSpy = vi
      .spyOn(queryClient, "ensureQueryData")
      .mockImplementation(() => {
        inFlight.count += 1;
        inFlight.max = Math.max(inFlight.max, inFlight.count);
        const { promise, resolve } = Promise.withResolvers<void>();
        releases.push(resolve);
        return promise.then(() => {
          inFlight.count -= 1;
          return { workOrder: { id: "x" } } as never;
        });
      });

    const batch = prefetchDrawerDataMany(
      queryClient,
      "org-1",
      ["wo-1", "wo-2", "wo-3", "wo-4"],
      { concurrency: 2 },
    );

    // Both workers start immediately (the pool never exceeds concurrency).
    expect(inFlight.count).toBe(2);
    // Drain the gates round by round (4 ids at concurrency 2 = 2 rounds).
    for (let i = 0; i < 4; i++) {
      const round = releases.splice(0);
      for (const release of round) release();
      await Promise.resolve();
      await Promise.resolve();
    }
    await batch;

    expect(ensureSpy).toHaveBeenCalledTimes(4);
    expect(inFlight.max).toBeLessThanOrEqual(2);
  });

  it("does not reject the batch when a single prefetch fails", async () => {
    const queryClient = new QueryClient();
    vi.spyOn(queryClient, "ensureQueryData").mockRejectedValue(
      new Error("boom"),
    );

    await expect(
      prefetchDrawerDataMany(queryClient, "org-1", ["wo-1", "wo-2"]),
    ).resolves.toBeUndefined();
  });

  it("returns early when orgId is null", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi.spyOn(queryClient, "ensureQueryData");

    await prefetchDrawerDataMany(queryClient, null, ["wo-1"]);
    expect(ensureSpy).not.toHaveBeenCalled();
  });

  it("returns early when orgId is undefined", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi.spyOn(queryClient, "ensureQueryData");

    await prefetchDrawerDataMany(queryClient, undefined, ["wo-1"]);
    expect(ensureSpy).not.toHaveBeenCalled();
  });

  it("returns early when the id list is empty", async () => {
    const queryClient = new QueryClient();
    const ensureSpy = vi.spyOn(queryClient, "ensureQueryData");

    await prefetchDrawerDataMany(queryClient, "org-1", []);
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
