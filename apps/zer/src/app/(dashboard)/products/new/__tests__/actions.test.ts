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
}));

describe("createProduct action", () => {
  it("validates and creates a product", async () => {
    const formData = new FormData();
    formData.append("name", "Тест бүтээгдэхүүн");
    formData.append("sku", "TST-001");
    formData.append("category_name", "Хүнс");
    formData.append("cost_price", "1000");
    formData.append("sale_price", "2000");
    formData.append("current_stock", "10");
    formData.append("min_stock", "5");

    // Mock category lookup
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
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "prod-1" },
            error: null,
          }),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    });

    const { createProduct } = await import("../actions");
    const result = await createProduct(undefined, formData);

    expect(result).toEqual({ success: true });
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
