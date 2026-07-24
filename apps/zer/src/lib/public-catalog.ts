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
    p_category_id: options?.categoryId ?? null,
    p_search: options?.search ?? null,
    p_page: options?.page ?? 1,
    p_page_size: options?.pageSize ?? 24,
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
