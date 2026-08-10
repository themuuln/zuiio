import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogPartItem, CatalogServiceItem } from "../_drawer-types";
import { useVariantSelection } from "../_use-variant-selection";

const { reportServerError } = vi.hoisted(() => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/sentry-report-server", () => ({ reportServerError }));

function makeService(
  overrides: Partial<CatalogServiceItem> = {},
): CatalogServiceItem {
  return {
    id: "svc-1",
    name: "Oil Change",
    default_price: 50_000,
    _source: "org",
    ...overrides,
  } as CatalogServiceItem;
}

function makePart(overrides: Partial<CatalogPartItem> = {}): CatalogPartItem {
  return {
    id: "part-1",
    name: "Oil Filter",
    default_price: 20_000,
    _source: "org",
    ...overrides,
  } as CatalogPartItem;
}

function jsonResponse(data: unknown) {
  return { json: vi.fn().mockResolvedValue({ data }) } as unknown as Response;
}

describe("useVariantSelection", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    reportServerError.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds a service immediately when it has no id", async () => {
    const addService = vi.fn();
    const { result } = renderHook(() =>
      useVariantSelection({ orgId: "org-1", addService, addPart: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleServiceSelect(makeService({ id: "" }));
    });

    expect(addService).toHaveBeenCalledTimes(1);
    expect(result.current.pendingVariantItem).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("adds a global service immediately without variant check", async () => {
    const addService = vi.fn();
    const { result } = renderHook(() =>
      useVariantSelection({ orgId: "org-1", addService, addPart: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleServiceSelect(
        makeService({ _source: "global" }),
      );
    });

    expect(addService).toHaveBeenCalledWith(
      expect.objectContaining({ id: "svc-1" }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parks the selection when the org item has variants, then confirms with the picked price", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: "v1" }, { id: "v2" }]));
    const addService = vi.fn();
    const { result } = renderHook(() =>
      useVariantSelection({ orgId: "org-1", addService, addPart: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleServiceSelect(
        makeService({ last_price: 60_000 }),
      );
    });

    expect(addService).not.toHaveBeenCalled();
    expect(result.current.pendingVariantItem).toEqual(
      expect.objectContaining({
        entityType: "service",
        entityId: "svc-1",
        entityName: "Oil Change",
        defaultPrice: 60_000,
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/catalog-variants",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "list-items",
          entity_type: "service",
          entity_id: "svc-1",
        }),
      }),
    );

    await act(async () => {
      result.current.pendingVariantItem?.onConfirm({
        price: 65_000,
        variantId: "v1",
        label: "Synthetic",
      });
    });

    expect(addService).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "svc-1",
        last_price: 65_000,
        variant_id: "v1",
        variant_label: "Synthetic",
      }),
    );
  });

  it("adds the plain item when the variant confirm is cancelled (null selection)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: "v1" }]));
    const addService = vi.fn();
    const { result } = renderHook(() =>
      useVariantSelection({ orgId: "org-1", addService, addPart: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleServiceSelect(makeService());
    });

    await act(async () => {
      result.current.pendingVariantItem?.onConfirm(null);
    });

    expect(addService).toHaveBeenCalledWith(
      expect.objectContaining({ id: "svc-1" }),
    );
    expect(addService.mock.calls[0][0].variant_id).toBeUndefined();
  });

  it("adds the plain item on skip", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: "v1" }]));
    const addService = vi.fn();
    const { result } = renderHook(() =>
      useVariantSelection({ orgId: "org-1", addService, addPart: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleServiceSelect(makeService());
    });

    await act(async () => {
      result.current.pendingVariantItem?.onSkip();
    });

    expect(addService).toHaveBeenCalledWith(
      expect.objectContaining({ id: "svc-1" }),
    );
  });

  it("adds the item directly when the variant list is empty", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    const addService = vi.fn();
    const { result } = renderHook(() =>
      useVariantSelection({ orgId: "org-1", addService, addPart: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleServiceSelect(makeService());
    });

    expect(addService).toHaveBeenCalledTimes(1);
    expect(result.current.pendingVariantItem).toBeNull();
  });

  it("reports server errors but still adds the item", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const addService = vi.fn();
    const { result } = renderHook(() =>
      useVariantSelection({ orgId: "org-1", addService, addPart: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleServiceSelect(makeService());
    });

    expect(reportServerError).toHaveBeenCalledWith(
      "Variant check failed for service",
      expect.any(Error),
    );
    expect(addService).toHaveBeenCalledTimes(1);
  });

  it("applies the same flow to parts", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: "pv1" }]));
    const addPart = vi.fn();
    const { result } = renderHook(() =>
      useVariantSelection({ orgId: "org-1", addService: vi.fn(), addPart }),
    );

    await act(async () => {
      await result.current.handlePartSelect(makePart({ last_price: 25_000 }));
    });

    expect(addPart).not.toHaveBeenCalled();
    expect(result.current.pendingVariantItem).toEqual(
      expect.objectContaining({
        entityType: "part",
        entityId: "part-1",
        entityName: "Oil Filter",
        defaultPrice: 25_000,
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/catalog-variants",
      expect.objectContaining({
        body: JSON.stringify({
          action: "list-items",
          entity_type: "part",
          entity_id: "part-1",
        }),
      }),
    );

    await act(async () => {
      result.current.pendingVariantItem?.onConfirm({
        price: 26_000,
        variantId: "pv1",
        label: "OEM",
      });
    });
    expect(addPart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "part-1",
        last_price: 26_000,
        variant_id: "pv1",
        variant_label: "OEM",
      }),
    );
  });

  it("allows manually setting and clearing the pending item", async () => {
    const { result } = renderHook(() =>
      useVariantSelection({
        orgId: "org-1",
        addService: vi.fn(),
        addPart: vi.fn(),
      }),
    );

    await act(async () => {
      result.current.setPendingVariantItem({
        entityType: "service",
        entityId: "svc-1",
        entityName: "Oil Change",
        defaultPrice: 50_000,
        onConfirm: vi.fn(),
        onSkip: vi.fn(),
      });
    });
    expect(result.current.pendingVariantItem?.entityId).toBe("svc-1");

    await act(async () => {
      result.current.setPendingVariantItem(null);
    });
    expect(result.current.pendingVariantItem).toBeNull();
  });
});
