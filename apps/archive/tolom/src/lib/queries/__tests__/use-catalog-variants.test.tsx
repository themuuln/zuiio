import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useBulkGenerateVariants,
  useCreateVariantGroup,
  useCreateVariantOption,
  useDeleteItemVariant,
  useDeleteVariantGroup,
  useDeleteVariantOption,
  useItemVariants,
  useUpdateItemVariant,
  useVariantGroups,
  useVariantOptions,
} from "../use-catalog-variants";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useVariantGroups", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleGroups = [
    {
      id: "grp-1",
      name: "Size",
      applies_to: "service" as const,
      sort_order: 0,
    },
    { id: "grp-2", name: "Tier", applies_to: "both" as const, sort_order: 1 },
  ];

  it("returns variant groups on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleGroups }),
    } as Response);

    const { result } = renderHook(() => useVariantGroups("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleGroups);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useVariantGroups(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the variant API endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useVariantGroups("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("/api/organizations/org-1/catalog-variants");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useVariantGroups("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useVariantOptions", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleOptions = [
    { id: "opt-1", group_id: "grp-1", name: "Small", sort_order: 0 },
    { id: "opt-2", group_id: "grp-1", name: "Large", sort_order: 1 },
  ];

  it("returns variant options on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleOptions }),
    } as Response);

    const { result } = renderHook(() => useVariantOptions("org-1", "grp-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleOptions);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useVariantOptions(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useVariantOptions("org-1", "grp-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useItemVariants", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleItemVariants = [
    { id: "iv-1", entity_type: "service", entity_id: "svc-1", price: 60 },
  ];

  it("returns item variants on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleItemVariants }),
    } as Response);

    const { result } = renderHook(
      () => useItemVariants("org-1", "service", "svc-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleItemVariants);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useItemVariants(undefined, "service", "svc-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when entityId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useItemVariants("org-1", "service", undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useItemVariants("org-1", "service", "svc-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreateVariantGroup", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const newGroup = {
    id: "grp-new",
    name: "Color",
    applies_to: "service" as const,
    sort_order: 2,
  };

  it("creates a variant group successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: newGroup }),
    } as Response);

    const { result } = renderHook(() => useCreateVariantGroup("org-1"), {
      wrapper: createWrapper(),
    });

    const response = await result.current.mutateAsync({
      name: "Color",
      applies_to: "service",
    });
    expect(response).toEqual(newGroup);
  });

  it("calls the correct API endpoint with action create-group", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: newGroup }),
    } as Response);

    const { result } = renderHook(() => useCreateVariantGroup("org-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      name: "Size",
      applies_to: "both",
      sort_order: 1,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("/api/organizations/org-1/catalog-variants");
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body).toMatchObject({
      action: "create-group",
      name: "Size",
      applies_to: "both",
    });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Failed to create group" } }),
    } as Response);

    const { result } = renderHook(() => useCreateVariantGroup("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({ name: "Bad", applies_to: "service" }),
    ).rejects.toThrow("Failed to create group");
  });
});

describe("useDeleteVariantGroup", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("deletes a variant group successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useDeleteVariantGroup("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("grp-1")).resolves.toBeNull();
  });

  it("calls the API with action delete-group", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useDeleteVariantGroup("org-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync("grp-2");

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body).toMatchObject({
      action: "delete-group",
      id: "grp-2",
    });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Group not found" } }),
    } as Response);

    const { result } = renderHook(() => useDeleteVariantGroup("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("grp-missing")).rejects.toThrow(
      "Group not found",
    );
  });

  it("does not call mutate when orgId is undefined — renders fine", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useDeleteVariantGroup(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useCreateVariantOption", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const newOption = {
    id: "opt-new",
    group_id: "grp-1",
    label: "Red",
    sort_order: 0,
  };

  it("creates a variant option successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: newOption }),
    } as Response);

    const { result } = renderHook(() => useCreateVariantOption("org-1"), {
      wrapper: createWrapper(),
    });

    const response = await result.current.mutateAsync({
      group_id: "grp-1",
      label: "Red",
    });
    expect(response).toEqual(newOption);
  });

  it("calls the API with action create-option", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: newOption }),
    } as Response);

    const { result } = renderHook(() => useCreateVariantOption("org-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      group_id: "grp-1",
      label: "Blue",
      sort_order: 1,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body).toMatchObject({
      action: "create-option",
      group_id: "grp-1",
      label: "Blue",
    });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Failed to create option" } }),
    } as Response);

    const { result } = renderHook(() => useCreateVariantOption("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({ group_id: "grp-1", label: "Bad" }),
    ).rejects.toThrow("Failed to create option");
  });
});

describe("useDeleteVariantOption", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("deletes a variant option successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useDeleteVariantOption("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("opt-1")).resolves.toBeNull();
  });

  it("calls the API with action delete-option", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useDeleteVariantOption("org-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync("opt-2");

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body).toMatchObject({
      action: "delete-option",
      id: "opt-2",
    });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Option not found" } }),
    } as Response);

    const { result } = renderHook(() => useDeleteVariantOption("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("opt-missing")).rejects.toThrow(
      "Option not found",
    );
  });
});

describe("useUpdateItemVariant", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const updatedVariant = {
    id: "iv-1",
    entity_type: "service" as const,
    entity_id: "svc-1",
    price: 80,
    cost: 40,
    sku: "NEW-SKU",
    is_active: true,
  };

  it("updates an item variant successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: updatedVariant }),
    } as Response);

    const { result } = renderHook(() => useUpdateItemVariant("org-1"), {
      wrapper: createWrapper(),
    });

    const response = await result.current.mutateAsync({
      id: "iv-1",
      price: 80,
      cost: 40,
    });
    expect(response).toEqual(updatedVariant);
  });

  it("calls the API with action update-item", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: updatedVariant }),
    } as Response);

    const { result } = renderHook(() => useUpdateItemVariant("org-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      id: "iv-1",
      price: 100,
      sku: "VIP-SKU",
      is_active: false,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body).toMatchObject({
      action: "update-item",
      id: "iv-1",
      price: 100,
      sku: "VIP-SKU",
      is_active: false,
    });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Variant not found" } }),
    } as Response);

    const { result } = renderHook(() => useUpdateItemVariant("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({ id: "iv-missing", price: 50 }),
    ).rejects.toThrow("Variant not found");
  });
});

describe("useDeleteItemVariant", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("deletes an item variant successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useDeleteItemVariant("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("iv-1")).resolves.toBeNull();
  });

  it("calls the API with action delete-item", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useDeleteItemVariant("org-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync("iv-2");

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body).toMatchObject({
      action: "delete-item",
      id: "iv-2",
    });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Item variant not found" } }),
    } as Response);

    const { result } = renderHook(() => useDeleteItemVariant("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("iv-missing")).rejects.toThrow(
      "Item variant not found",
    );
  });
});

describe("useBulkGenerateVariants", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const generatedVariants = [
    {
      id: "iv-b1",
      entity_type: "service",
      entity_id: "svc-1",
      price: 50,
      label: "Small",
    },
    {
      id: "iv-b2",
      entity_type: "service",
      entity_id: "svc-1",
      price: 80,
      label: "Large",
    },
  ];

  it("generates variants in bulk successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: generatedVariants }),
    } as Response);

    const { result } = renderHook(() => useBulkGenerateVariants("org-1"), {
      wrapper: createWrapper(),
    });

    const response = await result.current.mutateAsync({
      entity_type: "service",
      entity_id: "svc-1",
      dimension_options: { "grp-1": ["opt-1", "opt-2"] },
    });
    expect(response).toEqual(generatedVariants);
  });

  it("calls the API with action bulk-items and correct params", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: generatedVariants }),
    } as Response);

    const { result } = renderHook(() => useBulkGenerateVariants("org-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      entity_type: "part",
      entity_id: "part-1",
      dimension_options: { "grp-1": ["opt-1"] },
      get_price: { "opt-1": 100 },
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body).toMatchObject({
      action: "bulk-items",
      entity_type: "part",
      entity_id: "part-1",
      dimension_options: { "grp-1": ["opt-1"] },
      get_price: { "opt-1": 100 },
    });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Bulk generation failed" } }),
    } as Response);

    const { result } = renderHook(() => useBulkGenerateVariants("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        entity_type: "service",
        entity_id: "svc-1",
        dimension_options: {},
      }),
    ).rejects.toThrow("Bulk generation failed");
  });
});
