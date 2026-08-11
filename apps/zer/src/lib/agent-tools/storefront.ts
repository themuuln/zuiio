import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tool } from "@zuiio/ai-agent";
import {
  getPublicCatalog,
  getPublicCategories,
  getPublicProduct,
} from "@/lib/public-catalog";
import type { Database } from "@/lib/supabase/types";

/**
 * Storefront-safe agent tools for the public AI shopping assistant.
 *
 * These tools only expose the same data the public catalog RPCs already
 * make available to anon users — stock, sku, and barcode stay private.
 * They are intentionally separate from `createAllAgentTools` (merchant
 * tools) because they operate on a public slug, never on an org id.
 *
 * Every tool result includes a `url` field the assistant can cite, built
 * from the storefront origin the buyer is actually browsing.
 */
export function createStorefrontAgentTools(
  supabase: SupabaseClient<Database>,
  slug: string,
  baseUrl: string,
): Tool[] {
  const productUrl = (productId: string) =>
    `${baseUrl}/${slug}/products/${productId}`;

  return [
    {
      name: "search_products",
      description:
        "Дэлгүүрийн бүтээгдэхүүнийг хайх. Нэрийн хэсэг, ангилал, үнийн хязгаараар шүүж болно.",
      parameters: [
        {
          name: "search",
          type: "string",
          description: "Бүтээгдэхүүний нэрний хэсэг (жишээ: утас)",
          required: false,
        },
        {
          name: "category_id",
          type: "string",
          description: "Ангиллын id (list_categories-аас авна)",
          required: false,
        },
        {
          name: "min_price",
          type: "number",
          description: "Доод үнийн хязгаар",
          required: false,
        },
        {
          name: "max_price",
          type: "number",
          description: "Дээд үнийн хязгаар",
          required: false,
        },
        {
          name: "limit",
          type: "number",
          description: "Буцаах бүтээгдэхүүний тоо (1-10, анхдагч 5)",
          required: false,
        },
      ],
      execute: async (args: Record<string, unknown>) => {
        const limit = Math.min(
          10,
          Math.max(1, Math.floor(Number(args.limit) || 5)),
        );
        const result = await getPublicCatalog(supabase, slug, {
          search: typeof args.search === "string" ? args.search : undefined,
          categoryId:
            typeof args.category_id === "string" ? args.category_id : undefined,
          page: 1,
          pageSize: limit,
        });

        if (!result) {
          return { error: "Каталог авахад алдаа гарлаа." };
        }

        const minPrice =
          typeof args.min_price === "number" ? args.min_price : null;
        const maxPrice =
          typeof args.max_price === "number" ? args.max_price : null;

        const products = result.products
          .filter((p) => {
            if (p.sale_price == null)
              return minPrice == null && maxPrice == null;
            if (minPrice != null && p.sale_price < minPrice) return false;
            if (maxPrice != null && p.sale_price > maxPrice) return false;
            return true;
          })
          .map((p) => ({
            id: p.id,
            name: p.name,
            sale_price: p.sale_price,
            unit: p.unit,
            category_name: p.category_name,
            current_stock: p.current_stock,
            url: productUrl(p.id),
          }));

        return {
          total_found: result.total,
          returned: products.length,
          products,
        };
      },
    },
    {
      name: "get_shop_info",
      description:
        "Дэлгүүрийн мэдээлэл авах: хаяг, утас, имэйл, ажиллах цаг, хүргэлтийн нөхцөл, тайлбар.",
      parameters: [],
      execute: async () => {
        const { data, error } = await supabase
          .from("organizations")
          .select(
            "name, public_profile:organization_public_profiles(display_name, description, contact_email, contact_phone, address, website_url, business_hours, policies)",
          )
          .eq("slug", slug)
          .maybeSingle();

        if (error || !data) {
          return { error: "Дэлгүүрийн мэдээлэл авахад алдаа гарлаа." };
        }

        const profile = Array.isArray(data.public_profile)
          ? (data.public_profile[0] ?? {})
          : (data.public_profile ?? {});
        return {
          name: data.name,
          ...profile,
        };
      },
    },
    {
      name: "get_product",
      description:
        "Бүтээгдэхүүний дэлгэрэнгүй мэдээлэл (тайлбар, шинж чанар, хувилбарууд) авах.",
      parameters: [
        {
          name: "product_id",
          type: "string",
          description: "Бүтээгдэхүүний id (search_products-аас авна)",
          required: true,
        },
      ],
      execute: async (args: Record<string, unknown>) => {
        const productId = String(args.product_id ?? "");
        if (!productId) return { error: "product_id шаардлагатай." };

        const result = await getPublicProduct(supabase, slug, productId);
        if (!result) {
          return { error: "Бүтээгдэхүүн олдсонгүй." };
        }

        const product = result.product;
        return {
          id: product.id,
          name: product.name,
          sale_price: product.sale_price,
          unit: product.unit,
          category_name: product.category_name,
          description: product.description,
          attributes: product.attributes,
          variants: product.variants,
          current_stock: product.current_stock,
          url: productUrl(product.id),
        };
      },
    },
    {
      name: "list_categories",
      description: "Дэлгүүрийн бүтээгдэхүүний ангиллуудыг жагсаах.",
      parameters: [],
      execute: async () => {
        const categories = await getPublicCategories(supabase, slug);
        if (categories.length === 0) {
          return { categories: [], note: "Ангилал байхгүй." };
        }
        return { categories };
      },
    },
  ];
}
