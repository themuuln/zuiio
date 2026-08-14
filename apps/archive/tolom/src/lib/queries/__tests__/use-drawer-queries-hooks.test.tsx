import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@/test/test-utils";
import { useDrawerCatalogs, useDrawerQueries } from "../use-drawer-queries";

const orgMock = vi.hoisted(() => ({
  data: { orgId: "org-1" } as { orgId: string } | null,
  isLoading: false,
  isError: false,
  error: null as Error | null,
}));
vi.mock("../use-organization", () => ({
  useCurrentOrg: () => orgMock,
}));

const WORK_ORDER = { id: "wo-1", plate_number: "ABC 1234" };

function mockFetchResponse(payload: Record<string, unknown>) {
  vi.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => payload,
  } as Response);
}

describe("useDrawerQueries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    orgMock.data = { orgId: "org-1" };
    orgMock.isLoading = false;
    orgMock.isError = false;
    orgMock.error = null;
  });

  it("returns the work order once the detail query resolves", async () => {
    mockFetchResponse({ data: { workOrder: WORK_ORDER } });
    const { result } = renderHook(() => useDrawerQueries("wo-1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.wo).toBeNull();

    await waitFor(() => expect(result.current.wo).toEqual(WORK_ORDER));
    expect(result.current.orgId).toBe("org-1");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/organizations/org-1/work-orders/wo-1/detail",
    );
  });

  it("disables the detail query when no work order id is given", async () => {
    vi.spyOn(global, "fetch");
    const { result } = renderHook(() => useDrawerQueries(null));

    expect(result.current.wo).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("surfaces detail query errors", async () => {
    mockFetchResponse({ error: { message: "Not found" } });
    const { result } = renderHook(() => useDrawerQueries("wo-1"));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Not found");
    expect(result.current.wo).toBeNull();
  });

  it("surfaces org query errors even when the detail query is disabled", async () => {
    orgMock.data = null;
    orgMock.isError = true;
    orgMock.error = new Error("org failed");

    const { result } = renderHook(() => useDrawerQueries("wo-1"));

    expect(result.current.orgId).toBeNull();
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe("org failed");
  });

  it("treats an in-flight org query as loading", async () => {
    orgMock.isLoading = true;
    const { result } = renderHook(() => useDrawerQueries("wo-1"));

    expect(result.current.isLoading).toBe(true);
  });

  it("setWo updates the cached work order", async () => {
    mockFetchResponse({ data: { workOrder: WORK_ORDER } });
    const { result } = renderHook(() => useDrawerQueries("wo-1"));

    await waitFor(() => expect(result.current.wo).toEqual(WORK_ORDER));

    await act(async () => {
      result.current.setWo((prev) =>
        prev ? { ...prev, plate_number: "ZZZ 999" } : prev,
      );
    });

    await waitFor(() =>
      expect(result.current.wo?.plate_number).toBe("ZZZ 999"),
    );
  });

  it("setWo is a no-op when no work order is selected", async () => {
    const { result } = renderHook(() => useDrawerQueries(null));

    await act(async () => {
      result.current.setWo((prev) => prev);
    });

    expect(result.current.wo).toBeNull();
  });
});

describe("useDrawerCatalogs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty catalogs while disabled", () => {
    vi.spyOn(global, "fetch");
    const { result } = renderHook(() => useDrawerCatalogs(null, false));

    expect(result.current.catalog).toEqual([]);
    expect(result.current.partsCatalog).toEqual([]);
    expect(result.current.lowStockMap).toEqual({});
    expect(result.current.mechanics).toEqual([]);
    expect(result.current.orgSettings).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not fetch when the enabled flag is false", () => {
    vi.spyOn(global, "fetch");
    renderHook(() => useDrawerCatalogs("org-1", false));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("merges org and global catalogs with price memory and low stock", async () => {
    mockFetchResponse({
      data: {
        servicesCatalog: [
          {
            id: "svc-1",
            name: "Oil Change",
            category: "maintenance",
            default_price: 20000,
          },
        ],
        globalServices: [
          {
            id: "gs-1",
            name: "Oil Change",
            name_mn: "Тос солих",
            category: "maintenance",
            description: null,
            estimated_duration_minutes: 30,
          },
          {
            id: "gs-2",
            name: "Tire Rotation",
            name_mn: null,
            category: null,
            description: null,
            estimated_duration_minutes: 20,
          },
        ],
        partsCatalog: [{ id: "p1", name: "Oil Filter", default_price: 8000 }],
        globalParts: [
          {
            id: "gp-1",
            name: "Brake Pads",
            name_mn: null,
            category: null,
            description: null,
            part_number: "BP-1",
          },
        ],
        balances: [
          { part_id: "p1", quantity_on_hand: 3 },
          { part_id: "other", quantity_on_hand: 50 },
        ],
        thresholds: [{ part_id: "p1", minimum_quantity: 5 }],
        mechanics: [{ id: "m1", full_name: "Batcha" }],
        priceMemory: {
          services: {
            "svc-1": {
              unit_price: 15000,
              last_make: "Toyota",
              last_model: "Camry",
            },
          },
          parts: { "oil filter": { unit_price: 9000 } },
        },
        orgSettings: {
          default_tax_rate: 5,
          payment_method_fees: null,
          transfer_bank_accounts: null,
        },
      },
    });

    const { result } = renderHook(() => useDrawerCatalogs("org-1", true));

    await waitFor(() => expect(result.current.catalog.length).toBe(2));

    // Org service keeps its identity and gains the remembered price
    const orgSvc = result.current.catalog.find((s) => s.id === "svc-1");
    expect(orgSvc?.last_price).toBe(15000);
    // No vehicle make/model yet — match quality stays null
    expect(orgSvc?.match_quality).toBeNull();
    // Duplicate global service is deduped by name, the new one is appended
    expect(
      result.current.catalog.filter((s) => s.name === "Oil Change"),
    ).toHaveLength(1);
    expect(result.current.catalog.find((s) => s.id === "gs-2")?._source).toBe(
      "global",
    );
    // Parts: price memory merged by lowercased name, globals appended
    expect(
      result.current.partsCatalog.find((p) => p.id === "p1")?.last_price,
    ).toBe(9000);
    expect(
      result.current.partsCatalog.find((p) => p.id === "gp-1")?._source,
    ).toBe("global");
    // Only the part below its threshold is flagged
    expect(result.current.lowStockMap).toEqual({
      p1: { quantity: 3, threshold: 5 },
    });
    expect(result.current.mechanics).toEqual([
      { id: "m1", full_name: "Batcha" },
    ]);
    expect(result.current.orgSettings?.default_tax_rate).toBe(5);
  });

  it("uses the default threshold of 5 when a part has no threshold", async () => {
    mockFetchResponse({
      data: {
        servicesCatalog: [],
        globalServices: [],
        partsCatalog: [],
        globalParts: [],
        balances: [{ part_id: "p-new", quantity_on_hand: 2 }],
        thresholds: [],
        mechanics: [],
        priceMemory: { services: {}, parts: {} },
        orgSettings: null,
      },
    });

    const { result } = renderHook(() => useDrawerCatalogs("org-1", true));

    await waitFor(() =>
      expect(result.current.lowStockMap).toEqual({
        "p-new": { quantity: 2, threshold: 5 },
      }),
    );
  });
});
