import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tool } from "@zuiio/ai-agent";
import {
  getPublicBlogPosts,
  getPublicBranches,
  getPublicCatalog,
  getPublicCategories,
  getPublicProduct,
  getPublicPromotions,
  getPublicReviews,
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
            description: p.description,
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
            "name, public_profile:organization_public_profiles(display_name, description, contact_email, contact_phone, address, website_url, business_hours, policies, delivery_enabled, delivery_fee_amount, free_delivery_threshold, estimated_delivery_hours, payment_bank_name, payment_bank_account, payment_account_name, qpay_qr_url)",
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
          related: product.related,
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
    {
      name: "get_promotions",
      description:
        "Дэлгүүрийн идэвхтэй урамшуулал, хямдралуудын жагсаалт авах (нэр, тайлбар, урамшууллын төрөл, хүчинтэй хугацаа).",
      parameters: [],
      execute: async () => {
        const promotions = await getPublicPromotions(supabase, slug);
        if (promotions.length === 0) {
          return { promotions: [], note: "Идэвхтэй урамшуулал байхгүй." };
        }
        return { promotions };
      },
    },
    {
      name: "get_product_reviews",
      description:
        "Бүтээгдэхүүний баталгаажсан сэтгэгдлүүдийг авах (нэр, үнэлгээ, сэтгэгдэл).",
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

        const reviews = await getPublicReviews(supabase, slug, productId);
        if (reviews.length === 0) {
          return { reviews: [], note: "Сэтгэгдэл байхгүй байна." };
        }
        return { reviews };
      },
    },
    {
      name: "get_blog_posts",
      description: "Дэлгүүрийн нийтэлсэн мэдээ, нийтлэлүүдийн жагсаалт авах.",
      parameters: [
        {
          name: "limit",
          type: "number",
          description: "Буцаах нийтлэлийн тоо (1-10, анхдагч 5)",
          required: false,
        },
      ],
      execute: async (args: Record<string, unknown>) => {
        const limit = Math.min(
          10,
          Math.max(1, Math.floor(Number(args.limit) || 5)),
        );
        const posts = (await getPublicBlogPosts(supabase, slug))
          .slice(0, limit)
          .map((p) => ({
            id: p.id,
            title: p.title,
            excerpt: p.excerpt,
            published_at: p.published_at,
            url: `${baseUrl}/${slug}/blog/${p.slug}`,
          }));
        if (posts.length === 0) {
          return { posts: [], note: "Мэдээ, нийтлэл байхгүй." };
        }
        return { posts };
      },
    },
    {
      name: "get_branches",
      description: "Дэлгүүрийн салбаруудын жагсаалт авах (нэр, хаяг, утас).",
      parameters: [],
      execute: async () => {
        const branches = await getPublicBranches(supabase, slug);
        if (branches.length === 0) {
          return { branches: [], note: "Салбар байхгүй." };
        }
        return { branches };
      },
    },
    {
      name: "track_order",
      description:
        "Худалдан авагчийн захиалгын төлөв шалгах. Захиалгын дугаар болон утасны дугаар (8-12 оронтой) шаардлагатай — хоёуланг нь худалдан авагчаас асууж, баталгаажуулсны дараа л дуудах.",
      parameters: [
        {
          name: "order_number",
          type: "string",
          description: "Захиалгын дугаар (invoice дугаар эсвэл захиалгын ID)",
          required: true,
        },
        {
          name: "contact_phone",
          type: "string",
          description: "Худалдан авагчийн утас (8-12 оронтой тоо)",
          required: true,
        },
      ],
      execute: async (args: Record<string, unknown>) => {
        const orderNumber = String(args.order_number ?? "").trim();
        const phone = String(args.contact_phone ?? "").trim();
        if (!orderNumber || !/^\d{8,12}$/.test(phone)) {
          return {
            error: "Захиалгын дугаар болон утас (8-12 оронтой) шаардлагатай.",
          };
        }

        const { data, error } = await supabase.rpc("get_public_order_status", {
          p_slug: slug,
          p_order_number: orderNumber,
          p_contact_phone: phone,
        });

        if (error) {
          return { error: "Захиалга шалгахад алдаа гарлаа." };
        }

        const row = Array.isArray(data) ? data[0] : data;
        const order = (row as { order?: unknown } | null)?.order;
        if (!order) {
          return {
            error:
              "Захиалга олдсонгүй. Захиалгын дугаар эсвэл утас буруу байж болно.",
          };
        }

        return { order };
      },
    },
    {
      name: "create_order",
      description:
        "Захиалга үүсгэх. Худалдан авагчийн нэр, утас, хүргэлтийн хаяг (хүргэлт бол), бүтээгдэхүүн(үүд) болон тоо ширхэгийг худалдан авагчаас цуглуулж, тэр нь баталгаажуулсны ДАРАА л дуудах. Захиалга үүсгэсний дараа захиалгын дугаар, нийт дүн, төлбөрийн мэдээллийг хариултдаа оруулна.",
      parameters: [
        {
          name: "items",
          type: "object",
          description:
            "Захиалсан бүтээгдэхүүнүүдийн жагсаалт: [{product_id, quantity, variant_id(заавал биш)}]. product_id болон variant_id-ийг search_products / get_product-аас авна.",
          required: true,
        },
        {
          name: "contact_name",
          type: "string",
          description: "Худалдан авагчийн нэр",
          required: true,
        },
        {
          name: "contact_phone",
          type: "string",
          description: "Худалдан авагчийн утас (8-12 оронтой тоо)",
          required: true,
        },
        {
          name: "contact_email",
          type: "string",
          description: "Худалдан авагчийн имэйл (заавал биш)",
          required: false,
        },
        {
          name: "address",
          type: "string",
          description: "Хүргэлтийн хаяг (хүргэлт хүсвэл)",
          required: false,
        },
        {
          name: "payment_method",
          type: "string",
          description:
            "Төлбөрийн арга: cash | qpay | bank_transfer | card. Анхдагч: cash",
          required: false,
        },
      ],
      execute: async (args: Record<string, unknown>) => {
        const rawItems = Array.isArray(args.items) ? args.items : [];
        if (rawItems.length === 0 || rawItems.length > 10) {
          return { error: "Захиалгын бүтээгдэхүүний жагсаалт буруу байна." };
        }

        const items: {
          product_id: string;
          quantity: number;
          variant_id?: string | null;
        }[] = [];
        for (const raw of rawItems) {
          if (
            typeof raw !== "object" ||
            raw === null ||
            !("product_id" in raw) ||
            typeof (raw as { product_id?: unknown }).product_id !== "string"
          ) {
            return { error: "Бүтээгдэхүүний мэдээлэл буруу байна." };
          }
          const productId = (raw as { product_id: string }).product_id;
          const quantity = Number(
            (raw as { quantity?: unknown }).quantity ?? 1,
          );
          if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100) {
            return { error: "Тоо ширхэг буруу байна." };
          }
          const variantId = (raw as { variant_id?: unknown }).variant_id;
          items.push({
            product_id: productId,
            quantity,
            variant_id: typeof variantId === "string" ? variantId : null,
          });
        }

        const name = String(args.contact_name ?? "").trim();
        const phone = String(args.contact_phone ?? "").trim();
        if (!name || !/^\d{8,12}$/.test(phone)) {
          return { error: "Нэр болон утас (8-12 оронтой) шаардлагатай." };
        }

        const payment = String(args.payment_method ?? "cash");
        if (!["cash", "qpay", "bank_transfer", "card"].includes(payment)) {
          return { error: "Төлбөрийн арга буруу байна." };
        }

        const { data, error } = await supabase.rpc("submit_shop_order", {
          p_org_slug: slug,
          p_items: items,
          p_payment_method: payment,
          p_contact_name: name,
          p_contact_phone: phone,
          p_contact_email:
            typeof args.contact_email === "string" &&
            args.contact_email.trim() !== ""
              ? args.contact_email.trim()
              : undefined,
          p_address:
            typeof args.address === "string" && args.address.trim() !== ""
              ? args.address.trim()
              : undefined,
          p_delivery_type:
            typeof args.address === "string" && args.address.trim() !== ""
              ? "delivery"
              : "pickup",
        });

        if (error) {
          return { error: error.message };
        }
        const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (!row || !("order_id" in row)) {
          return { error: "Захиалга үүсгэхэд алдаа гарлаа." };
        }

        const order = row as {
          order_id: string;
          total_amount?: number;
          status?: string;
          payment_instructions?: {
            bank_name?: string | null;
            bank_account?: string | null;
            account_name?: string | null;
            qpay_qr_url?: string | null;
          } | null;
        };

        return {
          order_id: order.order_id,
          total_amount: order.total_amount,
          status: order.status,
          payment_instructions: order.payment_instructions ?? null,
          note: "Захиалга амжилттай үүссэн. Төлбөрийн мэдээллийг худалдан авагчид харуулна уу.",
        };
      },
    },
  ];
}
