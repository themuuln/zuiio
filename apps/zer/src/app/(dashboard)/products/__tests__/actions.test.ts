import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSupabase = { from: vi.fn() };

vi.mock("@/lib/erp", () => ({
  requireAppContext: vi.fn().mockResolvedValue({
    supabase: mockSupabase,
    organizationId: "org-1",
    permissions: ["products.update"],
  }),
  checkPermission: vi.fn().mockReturnValue(null),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
  withDbCapture: vi.fn((_name: string, q: unknown) => q),
}));
vi.mock("@/lib/domain-rules", () => ({
  validateProductInput: vi.fn(() => null),
}));
vi.mock("@/lib/notification", () => ({
  checkLowStockAndNotify: vi.fn(),
}));
vi.mock("@/lib/revalidate", () => ({
  revalidateEntity: vi.fn(),
  revalidateEntityTag: vi.fn(),
}));

/**
 * Builds a Supabase chainable mock for the product_images actions.
 * `productOwned` controls whether the products ownership check passes.
 * `existingSortOrders` feeds the addProductImage max+1 computation.
 * `insertPayloads` / `updatePayloads` capture insert/update args.
 */
function buildMock({
  productOwned = true,
  existingSortOrders = [0, 1, 2],
}: {
  productOwned?: boolean;
  existingSortOrders?: number[];
} = {}) {
  const insertPayloads: Record<string, unknown>[] = [];
  const updatePayloads: Record<string, unknown>[] = [];

  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "products") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: productOwned ? { id: "prod-1" } : null,
          error: null,
        }),
      };
    }
    if (table === "product_images") {
      let mode: "select" | "write" = "write";
      const chain = {
        select: vi.fn(() => {
          mode = "select";
          return chain;
        }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn((payload: unknown) => {
          insertPayloads.push(payload as Record<string, unknown>);
          return chain;
        }),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn((payload: unknown) => {
          updatePayloads.push(payload as Record<string, unknown>);
          return chain;
        }),
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable to mimic Supabase's awaitable query builder chain.
        then: (resolve: (v: unknown) => void) => {
          if (mode === "select") {
            resolve({
              data: [...existingSortOrders]
                .sort((a, b) => b - a)
                .map((s) => ({ sort_order: s })),
              error: null,
            });
          } else {
            resolve({ error: null });
          }
        },
      };
      return chain;
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { insertPayloads, updatePayloads };
}

describe("addProductImage action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts with next sort_order (max + 1) and org id", async () => {
    const { insertPayloads } = buildMock({ existingSortOrders: [0, 1, 2] });

    const { addProductImage } = await import("../actions");
    const formData = new FormData();
    formData.append("product_id", "prod-1");
    formData.append("url", "https://cdn.example.com/img.png");

    const result = await addProductImage(undefined, formData);

    expect(result).toEqual({ success: true });
    expect(insertPayloads).toHaveLength(1);
    expect(insertPayloads[0]).toMatchObject({
      product_id: "prod-1",
      organization_id: "org-1",
      url: "https://cdn.example.com/img.png",
      sort_order: 3,
    });
  });

  it("uses sort_order 0 when no images exist yet", async () => {
    const { insertPayloads } = buildMock({ existingSortOrders: [] });

    const { addProductImage } = await import("../actions");
    const formData = new FormData();
    formData.append("product_id", "prod-1");
    formData.append("url", "https://cdn.example.com/a.png");

    const result = await addProductImage(undefined, formData);

    expect(result).toEqual({ success: true });
    expect(insertPayloads[0]).toMatchObject({ sort_order: 0 });
  });

  it("rejects when the product is not owned by the org", async () => {
    const { insertPayloads } = buildMock({ productOwned: false });

    const { addProductImage } = await import("../actions");
    const formData = new FormData();
    formData.append("product_id", "prod-1");
    formData.append("url", "https://cdn.example.com/a.png");

    const result = await addProductImage(undefined, formData);

    expect(result).toHaveProperty("error");
    expect(insertPayloads).toHaveLength(0);
  });

  it("rejects when url is missing", async () => {
    buildMock();

    const { addProductImage } = await import("../actions");
    const formData = new FormData();
    formData.append("product_id", "prod-1");

    const result = await addProductImage(undefined, formData);

    expect(result).toHaveProperty("error");
  });
});

describe("removeProductImage action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes org-scoped by image id", async () => {
    buildMock();

    const { removeProductImage } = await import("../actions");
    const formData = new FormData();
    formData.append("id", "img-1");

    const result = await removeProductImage(undefined, formData);

    expect(result).toEqual({ success: true });
    const deleteCalls = mockSupabase.from.mock.results.filter(
      (r) => r.value && typeof r.value.delete === "function",
    );
    expect(deleteCalls.length).toBeGreaterThan(0);
    const chain = deleteCalls[deleteCalls.length - 1].value;
    expect(chain.eq).toHaveBeenCalledWith("id", "img-1");
    expect(chain.eq).toHaveBeenCalledWith("organization_id", "org-1");
  });
});

describe("reorderProductImages action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates sort_order by array index for each image", async () => {
    const { updatePayloads } = buildMock();

    const { reorderProductImages } = await import("../actions");
    const formData = new FormData();
    formData.append("product_id", "prod-1");
    formData.append("ordered_ids", JSON.stringify(["img-a", "img-b", "img-c"]));

    const result = await reorderProductImages(undefined, formData);

    expect(result).toEqual({ success: true });
    expect(updatePayloads).toEqual([
      { sort_order: 0 },
      { sort_order: 1 },
      { sort_order: 2 },
    ]);
  });

  it("rejects malformed ordered_ids", async () => {
    buildMock();

    const { reorderProductImages } = await import("../actions");
    const formData = new FormData();
    formData.append("product_id", "prod-1");
    formData.append("ordered_ids", "not-json");

    const result = await reorderProductImages(undefined, formData);

    expect(result).toHaveProperty("error");
  });
});

describe("updateProduct action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates description and extra info fields", async () => {
    const updatePayloads: Record<string, unknown>[] = [];
    mockSupabase.from.mockImplementation((table: string) => {
      const chain = {
        update: vi.fn((payload: unknown) => {
          updatePayloads.push(payload as Record<string, unknown>);
          return chain;
        }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "prod-1" } }),
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable to mimic Supabase's awaitable query builder chain.
        then: (resolve: (v: unknown) => void) => resolve({ error: null }),
      };
      return chain;
    });

    const formData = new FormData();
    formData.append("id", "prod-1");
    formData.append("name", "Тест бүтээгдэхүүн");
    formData.append("sku", "TST-003");
    formData.append("cost_price", "1000");
    formData.append("sale_price", "2000");
    formData.append("description", "  Шинэ тайлбар  ");
    formData.append("material_type", "арьс");
    formData.append("additional_info", "2л багц");
    formData.append("usage_instructions", "Буцалсан усаар угаана");
    formData.append("care_instructions", "Сэрүүн газар хадгална");

    const { updateProduct } = await import("../actions");
    const result = await updateProduct(undefined, formData);

    expect(result).toEqual({ success: true });
    expect(updatePayloads[0]).toMatchObject({
      description: "Шинэ тайлбар",
      material_type: "арьс",
      additional_info: "2л багц",
      usage_instructions: "Буцалсан усаар угаана",
      care_instructions: "Сэрүүн газар хадгална",
    });
  });
});
