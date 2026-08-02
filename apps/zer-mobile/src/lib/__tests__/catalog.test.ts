import {
  fetchPublicCatalog,
  fetchPublicCategories,
  fetchPublicProduct,
} from "@/lib/catalog";
import type { RpcClient } from "@/lib/client";

function makeRpcClient(
  handler: (
    fn: string,
    args?: Record<string, unknown>,
  ) => { data: unknown; error: { message: string } | null },
): RpcClient {
  return {
    rpc: (fn, args) => Promise.resolve(handler(fn, args)),
  };
}

const samplePage = {
  organization: {
    name: "Миний Дэлгүүр",
    slug: "my-shop",
    currency: "MNT",
    company_type: "retail",
  },
  products: [
    {
      id: "p1",
      name: "Бүтээгдэхүүн",
      unit: "ш",
      sale_price: 1500,
      category_name: "Ангилал",
      category_id: "c1",
      image_url: "https://img.example/p1.png",
      description: null,
      attribute_count: 0,
    },
  ],
  total: 1,
  page: 1,
  page_size: 24,
};

describe("fetchPublicCatalog", () => {
  it("calls get_public_products with the exact args", async () => {
    const rpc = jest.fn(() => ({ data: samplePage, error: null }));
    const client = makeRpcClient(rpc);
    const result = await fetchPublicCatalog(client, "my-shop", {
      categoryId: "c1",
      search: "гар утас",
      page: 2,
      pageSize: 12,
    });

    expect(rpc).toHaveBeenCalledWith("get_public_products", {
      p_slug: "my-shop",
      p_category_id: "c1",
      p_search: "гар утас",
      p_page: 2,
      p_page_size: 12,
    });
    expect(result?.organization?.name).toBe("Миний Дэлгүүр");
    expect(result?.products).toHaveLength(1);
    expect(result?.pageSize).toBe(24); // mapped from page_size
    expect(result?.total).toBe(1);
  });

  it("defaults args when options are omitted", async () => {
    const rpc = jest.fn(() => ({ data: samplePage, error: null }));
    await fetchPublicCatalog(makeRpcClient(rpc), "my-shop");
    expect(rpc).toHaveBeenCalledWith("get_public_products", {
      p_slug: "my-shop",
      p_category_id: null,
      p_search: null,
      p_page: 1,
      p_page_size: 24,
    });
  });

  it("returns null on RPC error", async () => {
    const result = await fetchPublicCatalog(
      makeRpcClient(() => ({ data: null, error: { message: "boom" } })),
      "my-shop",
    );
    expect(result).toBeNull();
  });

  it("returns null on empty payload", async () => {
    const result = await fetchPublicCatalog(
      makeRpcClient(() => ({ data: null, error: null })),
      "my-shop",
    );
    expect(result).toBeNull();
  });

  it("tolerates a missing products array", async () => {
    const result = await fetchPublicCatalog(
      makeRpcClient(() => ({
        data: { organization: samplePage.organization, total: 0 },
        error: null,
      })),
      "my-shop",
    );
    expect(result?.products).toEqual([]);
  });
});

describe("fetchPublicCategories", () => {
  it("maps the RPC result to categories", async () => {
    const data = [{ id: "c1", name: "Ангилал", product_count: 3 }];
    const result = await fetchPublicCategories(
      makeRpcClient((fn) => ({
        data: fn === "get_public_categories" ? data : null,
        error: null,
      })),
      "my-shop",
    );
    expect(result).toEqual(data);
  });

  it("returns [] on error", async () => {
    const result = await fetchPublicCategories(
      makeRpcClient(() => ({ data: null, error: { message: "boom" } })),
      "my-shop",
    );
    expect(result).toEqual([]);
  });
});

describe("fetchPublicProduct", () => {
  it("returns the product from get_public_product", async () => {
    const product = {
      ...samplePage.products[0],
      sku: "SKU-1",
      variants: [],
      attributes: [],
    };
    const result = await fetchPublicProduct(
      makeRpcClient((fn) =>
        fn === "get_public_product"
          ? {
              data: { organization: samplePage.organization, product },
              error: null,
            }
          : { data: null, error: null },
      ),
      "my-shop",
      "p1",
    );
    expect(result?.id).toBe("p1");
    expect(result?.sku).toBe("SKU-1");
  });

  it("returns null when the product is missing", async () => {
    const result = await fetchPublicProduct(
      makeRpcClient(() => ({
        data: { organization: null, product: null },
        error: null,
      })),
      "my-shop",
      "missing",
    );
    expect(result).toBeNull();
  });

  it("returns null on RPC error", async () => {
    const result = await fetchPublicProduct(
      makeRpcClient(() => ({ data: null, error: { message: "boom" } })),
      "my-shop",
      "p1",
    );
    expect(result).toBeNull();
  });
});
