import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetPublicCatalog = vi.fn();
const mockGetPublicCategories = vi.fn();
const mockGetPublicProduct = vi.fn();
const mockGetPublicPromotions = vi.fn();
const mockGetPublicReviews = vi.fn();
const mockGetPublicBlogPosts = vi.fn();
const mockGetPublicBranches = vi.fn();
vi.mock("@/lib/public-catalog", () => ({
  getPublicCatalog: (...args: unknown[]) => mockGetPublicCatalog(...args),
  getPublicCategories: (...args: unknown[]) => mockGetPublicCategories(...args),
  getPublicProduct: (...args: unknown[]) => mockGetPublicProduct(...args),
  getPublicPromotions: (...args: unknown[]) => mockGetPublicPromotions(...args),
  getPublicReviews: (...args: unknown[]) => mockGetPublicReviews(...args),
  getPublicBlogPosts: (...args: unknown[]) => mockGetPublicBlogPosts(...args),
  getPublicBranches: (...args: unknown[]) => mockGetPublicBranches(...args),
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
    mockGetPublicPromotions.mockReset();
    mockGetPublicReviews.mockReset();
    mockGetPublicBlogPosts.mockReset();
    mockGetPublicBranches.mockReset();
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
          description: "Сайн утас",
          sale_price: 500_000,
          unit: "ширхэг",
          category_name: "Утас",
          current_stock: null,
          url: `${BASE_URL}/products/p-1`,
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
      url: `${BASE_URL}/products/p-1`,
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

  it("create_order submits an order and returns id/total/payment instructions", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          order_id: "ord-1",
          total_amount: 500_000,
          status: "pending",
          payment_instructions: {
            bank_name: "Хаан банк",
            bank_account: "1234567890",
            account_name: "Shop LLC",
            qpay_qr_url: null,
          },
        },
      ],
      error: null,
    });
    const tools = toolsWith({ rpc });

    const result = await tools.create_order.execute({
      items: [{ product_id: "p-1", quantity: 1 }],
      contact_name: "Бат",
      contact_phone: "99112233",
      payment_method: "bank_transfer",
      address: "СБД, 1-р хороо",
    });

    expect(result).toMatchObject({
      order_id: "ord-1",
      total_amount: 500_000,
      status: "pending",
    });
    expect(rpc).toHaveBeenCalledWith("submit_shop_order", {
      p_org_slug: SLUG,
      p_items: [{ product_id: "p-1", quantity: 1, variant_id: null }],
      p_payment_method: "bank_transfer",
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_contact_email: undefined,
      p_address: "СБД, 1-р хороо",
      p_delivery_type: "delivery",
    });
  });

  it("create_order rejects missing contact phone and invalid items", async () => {
    const rpc = vi.fn();
    const tools = toolsWith({ rpc });

    const noPhone = await tools.create_order.execute({
      items: [{ product_id: "p-1", quantity: 1 }],
      contact_name: "Бат",
    });
    expect(noPhone).toEqual({
      error: "Нэр болон утас (8-12 оронтой) шаардлагатай.",
    });

    const badItems = await tools.create_order.execute({
      items: [],
      contact_name: "Бат",
      contact_phone: "99112233",
    });
    expect(badItems).toEqual({
      error: "Захиалгын бүтээгдэхүүний жагсаалт буруу байна.",
    });

    expect(rpc).not.toHaveBeenCalled();
  });

  it("create_order surfaces the RPC error message", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Нөөц хүрэлцэхгүй байна" },
    });
    const tools = toolsWith({ rpc });

    const result = await tools.create_order.execute({
      items: [{ product_id: "p-1", quantity: 99 }],
      contact_name: "Бат",
      contact_phone: "99112233",
    });

    expect(result).toEqual({ error: "Нөөц хүрэлцэхгүй байна" });
  });

  it("get_promotions returns active promotions", async () => {
    mockGetPublicPromotions.mockResolvedValue([
      {
        id: "promo-1",
        title: "Шампунь хямдрал",
        description: "30% хямдрал",
        reward_label: "30% хямдрал",
        valid_from: "2026-08-01T00:00:00Z",
        valid_until: null,
        type: "discount",
      },
    ]);

    const tools = toolsWith({});
    const result = await tools.get_promotions.execute({});

    expect(result).toEqual({
      promotions: [
        {
          id: "promo-1",
          title: "Шампунь хямдрал",
          description: "30% хямдрал",
          reward_label: "30% хямдрал",
          valid_from: "2026-08-01T00:00:00Z",
          valid_until: null,
          type: "discount",
        },
      ],
    });
  });

  it("get_promotions reports an empty list", async () => {
    mockGetPublicPromotions.mockResolvedValue([]);

    const tools = toolsWith({});
    const result = await tools.get_promotions.execute({});

    expect(result).toEqual({
      promotions: [],
      note: "Идэвхтэй урамшуулал байхгүй.",
    });
  });

  it("get_product_reviews returns approved reviews", async () => {
    mockGetPublicReviews.mockResolvedValue([
      {
        id: "r-1",
        customer_name: "Бат",
        rating: 5,
        comment: "Сайн бүтээгдэхүүн",
        created_at: "2026-08-10T00:00:00Z",
      },
    ]);

    const tools = toolsWith({});
    const result = await tools.get_product_reviews.execute({
      product_id: "p-1",
    });

    expect(result).toEqual({
      reviews: [
        {
          id: "r-1",
          customer_name: "Бат",
          rating: 5,
          comment: "Сайн бүтээгдэхүүн",
          created_at: "2026-08-10T00:00:00Z",
        },
      ],
    });
    expect(mockGetPublicReviews).toHaveBeenCalledWith(
      expect.anything(),
      SLUG,
      "p-1",
    );
  });

  it("get_product_reviews validates product_id", async () => {
    const tools = toolsWith({});
    const result = await tools.get_product_reviews.execute({});

    expect(result).toEqual({ error: "product_id шаардлагатай." });
    expect(mockGetPublicReviews).not.toHaveBeenCalled();
  });

  it("get_blog_posts returns posts with storefront urls and caps the limit", async () => {
    mockGetPublicBlogPosts.mockResolvedValue([
      {
        id: "b-1",
        title: "Шинэ ирэлт",
        slug: "shine-irelt",
        excerpt: "…",
        cover_image_url: null,
        published_at: "2026-08-11T00:00:00Z",
      },
      {
        id: "b-2",
        title: "Хямдрал зарлалаа",
        slug: "khiamdral",
        excerpt: "…",
        cover_image_url: null,
        published_at: "2026-08-12T00:00:00Z",
      },
      {
        id: "b-3",
        title: "Гурав",
        slug: "guraw",
        excerpt: "…",
        cover_image_url: null,
        published_at: "2026-08-13T00:00:00Z",
      },
    ]);

    const tools = toolsWith({});
    const result = await tools.get_blog_posts.execute({ limit: 2 });

    expect(result).toEqual({
      posts: [
        {
          id: "b-1",
          title: "Шинэ ирэлт",
          excerpt: "…",
          published_at: "2026-08-11T00:00:00Z",
          url: `${BASE_URL}/blog/shine-irelt`,
        },
        {
          id: "b-2",
          title: "Хямдрал зарлалаа",
          excerpt: "…",
          published_at: "2026-08-12T00:00:00Z",
          url: `${BASE_URL}/blog/khiamdral`,
        },
      ],
    });
  });

  it("get_branches returns branch locations", async () => {
    mockGetPublicBranches.mockResolvedValue([
      {
        id: "br-1",
        slug: "branch-1",
        name: "Салбар 1",
        address: "УБ, СБД",
        phone: "99110000",
      },
    ]);

    const tools = toolsWith({});
    const result = await tools.get_branches.execute({});

    expect(result).toEqual({
      branches: [
        {
          id: "br-1",
          slug: "branch-1",
          name: "Салбар 1",
          address: "УБ, СБД",
          phone: "99110000",
        },
      ],
    });
  });

  it("track_order returns the order when number and phone match", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        order: {
          id: "sale-1",
          invoice_number: "INV-001",
          status: "completed",
          total_amount: 500_000,
          status_history: [
            { status: "pending", at: "2026-08-12T02:00:00Z", by: "system" },
          ],
          items: [
            {
              name: "Утас A",
              quantity: 1,
              unit_price: 500_000,
              total_price: 500_000,
            },
          ],
        },
      },
      error: null,
    });
    const tools = toolsWith({ rpc });

    const result = await tools.track_order.execute({
      order_number: "INV-001",
      contact_phone: "99112233",
    });

    expect(result).toEqual({
      order: {
        id: "sale-1",
        invoice_number: "INV-001",
        status: "completed",
        total_amount: 500_000,
        status_history: [
          { status: "pending", at: "2026-08-12T02:00:00Z", by: "system" },
        ],
        items: [
          {
            name: "Утас A",
            quantity: 1,
            unit_price: 500_000,
            total_price: 500_000,
          },
        ],
      },
    });
    expect(rpc).toHaveBeenCalledWith("get_public_order_status", {
      p_slug: SLUG,
      p_order_number: "INV-001",
      p_contact_phone: "99112233",
    });
  });

  it("track_order rejects a missing number or bad phone", async () => {
    const rpc = vi.fn();
    const tools = toolsWith({ rpc });

    const result = await tools.track_order.execute({
      order_number: "INV-001",
      contact_phone: "123",
    });

    expect(result).toEqual({
      error: "Захиалгын дугаар болон утас (8-12 оронтой) шаардлагатай.",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("track_order reports when the order is not found", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const tools = toolsWith({ rpc });

    const result = await tools.track_order.execute({
      order_number: "INV-999",
      contact_phone: "99112233",
    });

    expect(result).toEqual({
      error:
        "Захиалга олдсонгүй. Захиалгын дугаар эсвэл утас буруу байж болно.",
    });
  });

  it("get_product includes related products", async () => {
    mockGetPublicProduct.mockResolvedValue({
      organization: {
        name: "Shop",
        slug: SLUG,
        currency: "MNT",
        company_type: "retail",
      },
      product: {
        ...SAMPLE_PRODUCT,
        attributes: [],
        variants: [],
        related: [
          {
            id: "p-2",
            name: "Утас B",
            sale_price: 600_000,
            image_url: null,
            category_name: "Утас",
          },
        ],
      },
    });

    const tools = toolsWith({});
    const result = await tools.get_product.execute({ product_id: "p-1" });

    expect(result).toMatchObject({
      id: "p-1",
      related: [
        {
          id: "p-2",
          name: "Утас B",
          sale_price: 600_000,
          image_url: null,
          category_name: "Утас",
        },
      ],
    });
  });

  it("get_shop_info includes delivery and payment configuration", async () => {
    const profile = {
      display_name: "Storefront E2E Shop",
      delivery_enabled: true,
      delivery_fee_amount: 10_000,
      free_delivery_threshold: 200_000,
      estimated_delivery_hours: 24,
      payment_bank_name: "Хаан банк",
      payment_bank_account: "1234567890",
      payment_account_name: "Shop LLC",
      qpay_qr_url: "https://qpay.mn/qr/abc",
    };
    const tools = toolsWith(shopInfoSupabase(profile));

    const result = await tools.get_shop_info.execute({});

    expect(result).toMatchObject({
      name: "Storefront E2E Shop",
      delivery_enabled: true,
      delivery_fee_amount: 10_000,
      free_delivery_threshold: 200_000,
      estimated_delivery_hours: 24,
      payment_bank_name: "Хаан банк",
      payment_account_name: "Shop LLC",
      qpay_qr_url: "https://qpay.mn/qr/abc",
    });
  });
});
