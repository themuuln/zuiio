import { describe, expect, it, vi } from "vitest";

const mockSupabase = {
  from: vi.fn(),
};

vi.mock("@/lib/erp", () => ({
  requireAppContext: vi.fn().mockResolvedValue({
    supabase: mockSupabase,
    organizationId: "org-1",
    permissions: ["products.create"],
  }),
  checkPermission: vi.fn().mockReturnValue(null),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("server-only", () => ({}));

// Wire a Supabase mock where `products` inserts are captured via the returned
// insertMock, `categories` resolves a stable id, and variant tables
// (product_variant_groups / product_variant_options / product_variants /
// product_variant_assignments) accept insert + select().single() chains so the
// variant flow succeeds.
function buildMock() {
  const insertMock = vi.fn().mockReturnThis();
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "categories") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "cat-1" },
          error: null,
        }),
      };
    }
    if (table === "products") {
      return {
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "prod-1" },
          error: null,
        }),
      };
    }
    // Variant-related tables: accept insert + select().single().
    return {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "variant-row" },
        error: null,
      }),
      eq: vi.fn().mockReturnThis(),
    };
  });
  return insertMock;
}

describe("createProduct action", () => {
  it("sets has_variants true when both variant_groups and variant_data are present", async () => {
    const formData = new FormData();
    formData.append("name", "Тест бүтээгдэхүүн");
    formData.append("sku", "TST-001");
    formData.append("category_name", "Хүнс");
    formData.append("cost_price", "1000");
    formData.append("sale_price", "2000");
    formData.append("current_stock", "10");
    formData.append("min_stock", "5");
    formData.append(
      "variant_groups",
      JSON.stringify([
        { id: "g1", name: "Өнгө", options: [{ id: "o1", value: "Улаан" }] },
      ]),
    );
    formData.append(
      "variant_data",
      JSON.stringify([
        {
          sku: "TST-001-R",
          option_ids: ["g1:Улаан"],
          cost_price: 1000,
          sale_price: 2000,
          current_stock: 3,
        },
      ]),
    );

    const insertMock = buildMock();

    const { createProduct } = await import("../actions");
    const result = await createProduct(undefined, formData);

    expect(result).toEqual({ success: true });
    expect(insertMock.mock.calls[0]?.[0]).toMatchObject({ has_variants: true });
  });

  it("passes description and extra info fields into the insert payload", async () => {
    const formData = new FormData();
    formData.append("name", "Тест бүтээгдэхүүн");
    formData.append("description", "  Өндөр чанартай цай  ");
    formData.append("material_type", "хөвөн");
    formData.append("additional_info", "500гр багц");
    formData.append("usage_instructions", "Буцалсан усаар");
    formData.append("care_instructions", "Сэрүүн газар хадгална");

    const insertMock = buildMock();

    const { createProduct } = await import("../actions");
    const result = await createProduct(undefined, formData);

    expect(result).toEqual({ success: true });
    expect(insertMock.mock.calls[0]?.[0]).toMatchObject({
      description: "Өндөр чанартай цай",
      material_type: "хөвөн",
      additional_info: "500гр багц",
      usage_instructions: "Буцалсан усаар",
      care_instructions: "Сэрүүн газар хадгална",
    });
  });

  it("sets has_variants false when no variant payload is provided", async () => {
    const formData = new FormData();
    formData.append("name", "Тест бүтээгдэхүүн");
    formData.append("sku", "TST-002");
    formData.append("category_name", "Хүнс");

    const insertMock = buildMock();

    const { createProduct } = await import("../actions");
    const result = await createProduct(undefined, formData);

    expect(result).toEqual({ success: true });
    expect(insertMock.mock.calls[0]?.[0]).toMatchObject({
      has_variants: false,
    });
  });

  it("rejects missing name", async () => {
    const formData = new FormData();
    formData.append("name", "");

    const { createProduct } = await import("../actions");
    const result = await createProduct(undefined, formData);

    expect(result).toHaveProperty("error");
    expect(result.error).toBe("Бүтээгдэхүүний нэр шаардлагатай.");
  });
});
