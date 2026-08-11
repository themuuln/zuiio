import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetPublicCatalog = vi.fn();
const mockGetPublicCategories = vi.fn();
const mockGetPublicProduct = vi.fn();
vi.mock("@/lib/public-catalog", () => ({
  getPublicCatalog: (...args: unknown[]) => mockGetPublicCatalog(...args),
  getPublicCategories: (...args: unknown[]) => mockGetPublicCategories(...args),
  getPublicProduct: (...args: unknown[]) => mockGetPublicProduct(...args),
}));

import { createStorefrontAgentTools } from "./storefront";

const SLUG = "storefront-e2e-test";
const BASE_URL = "https://shop.example.mn";

type Tool = {
  name: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

function toolsWith(supabase: unknown): Record<string, Tool> {
  return Object.fromEntries(
    createStorefrontAgentTools(supabase as never, SLUG, BASE_URL).map((t) => [
      t.name,
      t as Tool,
    ]),
  );
}

const SAMPLE_PRODUCT = {
  id: "p-1",
  name: "Утас A",
  unit: "ширхэг",
  sale_price: 500_000,
  category_name: "Утас",
  category_id: "c-1",
  image_url: null,
  description: "Сайн утас",
  attribute_count: 0,
  images: null,
  current_stock: null,
};

function shopInfoSupabase(profile: unknown) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { name: "Storefront E2E Shop", public_profile: profile },
            error: null,
          }),
        }),
      }),
    }),
  };
}

describe("createStorefrontAgentTools", () => {
  beforeEach(() => {
    mockGetPublicCatalog.mockReset();
    mockGetPublicCategories.mockReset();
    mockGetPublicProduct.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("search_products maps products to compact results with urls", async () => {
    mockGetPublicCatalog.mockResolvedValue({
      organization: {
        name: "Shop",
        slug: SLUG,
        currency: "MNT",
        company_type: "retail",
      },
      products: [SAMPLE_PRODUCT],
      total: 1,
      page: 1,
      page_size: 5,
    });

    const tools = toolsWith({});
    const result = await tools.search_products.execute({ search: "утас" });

    expect(result).toEqual({
      total_found: 1,
      returned: 1,
      products: [
        {
          id: "p-1",
          name: "Утас A",
          sale_price: 500_000,
          unit: "ширхэг",
          category_name: "Утас",
          current_stock: null,
          url: `${BASE_URL}/${SLUG}/products/p-1`,
        },
      ],
    });
    expect(mockGetPublicCatalog).toHaveBeenCalledWith(expect.anything(), SLUG, {
      search: "утас",
      categoryId: undefined,
      page: 1,
      pageSize: 5,
    });
  });

  it("search_products caps the limit at 10 and passes category id", async () => {
    mockGetPublicCatalog.mockResolvedValue({
      organization: null,
      products: [],
      total: 0,
      page: 1,
      page_size: 10,
    });

    const tools = toolsWith({});
    await tools.search_products.execute({ limit: 99, category_id: "c-1" });

    expect(mockGetPublicCatalog).toHaveBeenCalledWith(expect.anything(), SLUG, {
      search: undefined,
      categoryId: "c-1",
      page: 1,
      pageSize: 10,
    });
  });

  it("search_products filters by price range", async () => {
    mockGetPublicCatalog.mockResolvedValue({
      organization: null,
      products: [
        { ...SAMPLE_PRODUCT, id: "cheap", sale_price: 10_000 },
        { ...SAMPLE_PRODUCT, id: "mid", sale_price: 50_000 },
        { ...SAMPLE_PRODUCT, id: "pricey", sale_price: 200_000 },
        { ...SAMPLE_PRODUCT, id: "no-price", sale_price: null },
      ],
      total: 4,
      page: 1,
      page_size: 10,
    });

    const tools = toolsWith({});
    const result = await tools.search_products.execute({
      min_price: 20_000,
      max_price: 100_000,
    });

    const ids = (result as { products: Array<{ id: string }> }).products.map(
      (p) => p.id,
    );
    expect(ids).toEqual(["mid"]);
  });

  it("search_products reports a catalog error instead of throwing", async () => {
    mockGetPublicCatalog.mockResolvedValue(null);

    const tools = toolsWith({});
    const result = await tools.search_products.execute({});

    expect(result).toEqual({ error: "Каталог авахад алдаа гарлаа." });
  });

  it("get_product returns detail with url", async () => {
    mockGetPublicProduct.mockResolvedValue({
      organization: {
        name: "Shop",
        slug: SLUG,
        currency: "MNT",
        company_type: "retail",
      },
      product: {
        ...SAMPLE_PRODUCT,
        description: "Сайн утас",
        attributes: [{ name: "Өнгө", value: "хар" }],
        variants: [],
      },
    });

    const tools = toolsWith({});
    const result = await tools.get_product.execute({ product_id: "p-1" });

    expect(result).toMatchObject({
      id: "p-1",
      name: "Утас A",
      description: "Сайн утас",
      attributes: [{ name: "Өнгө", value: "хар" }],
      url: `${BASE_URL}/${SLUG}/products/p-1`,
    });
  });

  it("get_product returns an error for an unknown product", async () => {
    mockGetPublicProduct.mockResolvedValue(null);

    const tools = toolsWith({});
    const result = await tools.get_product.execute({ product_id: "nope" });

    expect(result).toEqual({ error: "Бүтээгдэхүүн олдсонгүй." });
  });

  it("list_categories returns categories", async () => {
    mockGetPublicCategories.mockResolvedValue([
      { id: "c-1", name: "Утас", product_count: 3 },
    ]);

    const tools = toolsWith({});
    const result = await tools.list_categories.execute({});

    expect(result).toEqual({
      categories: [{ id: "c-1", name: "Утас", product_count: 3 }],
    });
  });

  it("get_shop_info returns profile fields (object shape)", async () => {
    const profile = {
      display_name: "Storefront E2E Shop",
      description: "Тест дэлгүүр",
      contact_email: "shop@example.mn",
      contact_phone: "99110000",
      address: "Улаанбаатар",
      website_url: null,
      business_hours: { Даваа: "09:00-18:00" },
      policies: "Хүргэлт 24 цаг",
    };
    const tools = toolsWith(shopInfoSupabase(profile));
    const result = await tools.get_shop_info.execute({});

    expect(result).toMatchObject({
      name: "Storefront E2E Shop",
      contact_email: "shop@example.mn",
      contact_phone: "99110000",
      address: "Улаанбаатар",
      policies: "Хүргэлт 24 цаг",
    });
  });

  it("get_shop_info normalizes an array-shaped profile (PostgREST 1:1 quirk)", async () => {
    const profile = [{ display_name: "Storefront E2E Shop", address: "УБ" }];
    const tools = toolsWith(shopInfoSupabase(profile));
    const result = await tools.get_shop_info.execute({});

    expect(result).toMatchObject({ address: "УБ" });
  });

  it("get_shop_info returns an error on query failure", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: new Error("boom") }),
          }),
        }),
      }),
    };
    const tools = toolsWith(supabase);
    const result = await tools.get_shop_info.execute({});

    expect(result).toEqual({
      error: "Дэлгүүрийн мэдээлэл авахад алдаа гарлаа.",
    });
  });
});
