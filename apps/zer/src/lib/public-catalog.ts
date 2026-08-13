import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type SupabaseDb = SupabaseClient<Database>;

export type PublicOrgProfile = {
  catalog_enabled: boolean;
  display_name: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website_url: string | null;
  logo_url: string | null;
  banner_url: string | null;
  business_hours: Record<string, string> | null;
  policies: string | null;
};

export type PublicProduct = {
  id: string;
  name: string;
  unit: string | null;
  sale_price: number | null;
  category_name: string | null;
  category_id: string | null;
  image_url: string | null;
  description: string | null;
  attribute_count: number;
  // Extra gallery images (image_url is always the primary/first entry).
  images: Array<{ url: string | null; sort_order: number | null }> | null;
  // Only populated when the org opts in to public stock (show_stock=true),
  // otherwise NULL — privacy default preserved.
  current_stock: number | null;
  // Review stats + active promo (backend migration 2026-08-11).
  review_count: number | null;
  review_average: number | null;
  promo: {
    id: string;
    title: string;
    reward_label: string | null;
  } | null;
};

export type PublicProductSort = "price_asc" | "price_desc" | "newest" | "name";

export type PublicPromotion = {
  id: string;
  title: string;
  description: string | null;
  reward_label: string | null;
  valid_from: string | null;
  valid_until: string | null;
  type: string | null;
};

export type PublicRelatedProduct = {
  id: string;
  name: string;
  sale_price: number | null;
  image_url: string | null;
  category_name: string | null;
};

export type PublicProductDetail = PublicProduct & {
  sku: string | null;
  barcode: string | null;
  created_at: string | null;
  variants: Array<{
    id: string;
    name: string;
    sku: string | null;
    price: number | null;
    image_url: string | null;
  }> | null;
  attributes: Array<{
    name: string;
    value: string;
  }> | null;
  // Same-category products (≤4) for the detail page's related section.
  related: PublicRelatedProduct[] | null;
};

export type PublicOrgMeta = {
  name: string;
  slug: string;
  currency: string;
  company_type: string;
};

export type PublicCategory = {
  id: string;
  name: string;
  product_count: number;
};

/**
 * Fetch the public catalog for an organization by slug.
 * Returns null if the org doesn't exist or catalog is disabled.
 */
export async function getPublicCatalog(
  supabase: SupabaseDb,
  slug: string,
  options?: {
    categoryId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    minPrice?: number;
    maxPrice?: number;
    sort?: PublicProductSort;
    productIds?: string[];
  },
): Promise<{
  organization: PublicOrgMeta | null;
  products: PublicProduct[];
  total: number;
  page: number;
  pageSize: number;
} | null> {
  const { data, error } = await supabase.rpc("get_public_products", {
    p_slug: slug,
    p_category_id: options?.categoryId,
    p_search: options?.search,
    p_page: options?.page ?? 1,
    p_page_size: options?.pageSize ?? 24,
    p_min_price: options?.minPrice,
    p_max_price: options?.maxPrice,
    p_sort: options?.sort,
    p_product_ids: options?.productIds,
  });

  if (error || !data) return null;

  const result = data as {
    organization: PublicOrgMeta | null;
    products: PublicProduct[];
    total: number;
    page: number;
    page_size: number;
  };

  return {
    organization: result.organization,
    products: result.products ?? [],
    total: result.total ?? 0,
    page: result.page ?? 1,
    pageSize: result.page_size ?? 24,
  };
}

/**
 * Fetch public categories for an organization.
 */
export async function getPublicCategories(
  supabase: SupabaseDb,
  slug: string,
): Promise<PublicCategory[]> {
  const { data, error } = await supabase.rpc("get_public_categories", {
    p_slug: slug,
  });

  if (error || !data) return [];
  return (data as PublicCategory[]) ?? [];
}

/**
 * Fetch active promotions for an organization's storefront.
 */
export async function getPublicPromotions(
  supabase: SupabaseDb,
  slug: string,
): Promise<PublicPromotion[]> {
  const { data, error } = await supabase.rpc("get_public_promotions", {
    p_slug: slug,
  });

  if (error || !data) return [];
  return (data as PublicPromotion[]) ?? [];
}

export type PublicReview = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

/**
 * Fetch approved reviews for one product.
 */
export async function getPublicReviews(
  supabase: SupabaseDb,
  slug: string,
  productId: string,
): Promise<PublicReview[]> {
  const { data, error } = await supabase.rpc("get_public_reviews", {
    p_slug: slug,
    p_product_id: productId,
  });

  if (error || !data) return [];
  return (data as PublicReview[]) ?? [];
}

export type PublicBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
};

/**
 * Fetch published blog posts for an organization.
 */
export async function getPublicBlogPosts(
  supabase: SupabaseDb,
  slug: string,
): Promise<PublicBlogPost[]> {
  const { data, error } = await supabase.rpc("get_public_blog_posts", {
    p_slug: slug,
  });

  if (error || !data) return [];
  return (data as PublicBlogPost[]) ?? [];
}

export type PublicBranch = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
};

/**
 * Fetch public branches (pickup locations) for an organization.
 */
export async function getPublicBranches(
  supabase: SupabaseDb,
  slug: string,
): Promise<PublicBranch[]> {
  const { data, error } = await supabase.rpc("get_public_branches", {
    p_slug: slug,
  });

  if (error || !data) return [];
  return (data as PublicBranch[]) ?? [];
}

/**
 * Fetch a single public product detail.
 */
export async function getPublicProduct(
  supabase: SupabaseDb,
  slug: string,
  productId: string,
): Promise<{
  organization: PublicOrgMeta;
  product: PublicProductDetail;
} | null> {
  const { data, error } = await supabase.rpc("get_public_product", {
    p_slug: slug,
    p_product_id: productId,
  });

  if (error || !data) return null;

  const result = data as {
    organization: PublicOrgMeta;
    product: PublicProductDetail;
  };

  if (!result.organization || !result.product) return null;
  return result;
}
