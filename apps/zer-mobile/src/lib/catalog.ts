import type { RpcClient } from "@/lib/client";

/**
 * Public catalog helpers — thin typed wrappers over the SAME public
 * Supabase RPCs the web storefront uses (get_public_products,
 * get_public_product, get_public_categories). All are granted to anon.
 */

export interface PublicOrgMeta {
  name: string;
  slug: string;
  currency: string;
  company_type: string;
  /** Organization delivery/pickup + payment config (organization_public_profiles). */
  delivery_enabled?: boolean | null;
  pickup_enabled?: boolean | null;
  delivery_fee_amount?: number | string | null;
  free_delivery_threshold?: number | string | null;
  payment_bank_name?: string | null;
  payment_bank_account?: string | null;
  payment_account_name?: string | null;
  qpay_qr_url?: string | null;
  show_stock?: boolean | null;
}

/** A pickup branch returned by get_public_branches(p_slug). */
export interface PublicBranch {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export interface PublicProduct {
  id: string;
  name: string;
  unit: string | null;
  sale_price: number | null;
  category_name: string | null;
  category_id: string | null;
  image_url: string | null;
  description: string | null;
  attribute_count: number;
  /** Not returned by the public RPC today — reserved for when it is. */
  current_stock?: number | null;
  min_stock?: number | null;
}

export interface PublicProductDetail extends PublicProduct {
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
  attributes: Array<{ name: string; value: string }> | null;
}

export interface PublicCategory {
  id: string;
  name: string;
  product_count: number;
}

export interface CatalogPage {
  organization: PublicOrgMeta | null;
  products: PublicProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogOptions {
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function asCatalogPage(data: unknown): CatalogPage | null {
  if (!data || typeof data !== "object") return null;
  const r = data as {
    organization?: PublicOrgMeta | null;
    products?: PublicProduct[] | null;
    total?: number | null;
    page?: number | null;
    page_size?: number | null;
  };
  return {
    organization: r.organization ?? null,
    products: r.products ?? [],
    total: r.total ?? 0,
    page: r.page ?? 1,
    pageSize: r.page_size ?? 24,
  };
}

export async function fetchPublicCatalog(
  client: RpcClient,
  slug: string,
  options?: CatalogOptions,
): Promise<CatalogPage | null> {
  const { data, error } = await client.rpc("get_public_products", {
    p_slug: slug,
    p_category_id: options?.categoryId ?? null,
    p_search: options?.search ?? null,
    p_page: options?.page ?? 1,
    p_page_size: options?.pageSize ?? 24,
  });
  if (error) return null;
  return asCatalogPage(data);
}

export async function fetchPublicCategories(
  client: RpcClient,
  slug: string,
): Promise<PublicCategory[]> {
  const { data, error } = await client.rpc("get_public_categories", {
    p_slug: slug,
  });
  if (error || !data) return [];
  return (data as PublicCategory[]) ?? [];
}

export async function fetchPublicProduct(
  client: RpcClient,
  slug: string,
  productId: string,
): Promise<PublicProductDetail | null> {
  const { data, error } = await client.rpc("get_public_product", {
    p_slug: slug,
    p_product_id: productId,
  });
  if (error || !data || typeof data !== "object") return null;
  const r = data as { product?: PublicProductDetail | null };
  return r.product ?? null;
}

/** Pickup branches for a store (get_public_branches RPC). */
export async function fetchPublicBranches(
  client: RpcClient,
  slug: string,
): Promise<PublicBranch[]> {
  const { data, error } = await client.rpc("get_public_branches", {
    p_slug: slug,
  });
  if (error || !data) return [];
  return (data as PublicBranch[]) ?? [];
}
