import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  getPublicBranches,
  getPublicCatalog,
  getPublicCategories,
  getPublicProduct,
  getPublicPromotions,
  getPublicReviews,
  type PublicBlogPost,
  type PublicBranch,
  type PublicCategory,
  type PublicOrgMeta,
  type PublicProduct,
  type PublicProductDetail,
  type PublicProductSort,
  type PublicPromotion,
  type PublicReview,
} from "@/lib/public-catalog";
import { createServiceClient } from "@/lib/supabase/server-service";
import type { Database } from "@/lib/supabase/types";

type OrgRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProfileRow =
  Database["public"]["Tables"]["organization_public_profiles"]["Row"];

/**
 * Storefront shell — org row + public profile + header categories in one
 * cache entry, keyed by slug with stale-while-revalidate. Every field is
 * part of the public storefront contract (the RPCs and tables it reads are
 * the same anon-facing surfaces the storefront already exposes), so the
 * service client is safe here.
 *
 * Invalidated via `storefront:<orgId>` when the org profile, branding, or
 * settings change (see the settings/branding server actions).
 */
export type StorefrontShell = {
  org: Pick<
    OrgRow,
    "id" | "name" | "slug" | "currency" | "company_type" | "brand_config"
  >;
  profile: ProfileRow | null;
  categories: PublicCategory[];
};

export async function getStorefrontShell(
  slug: string,
): Promise<StorefrontShell | null> {
  "use cache";
  cacheLife("standard");

  const supabase = createServiceClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, currency, company_type, brand_config")
    .eq("slug", slug)
    .maybeSingle();

  if (!org) return null;
  cacheTag(`storefront:${org.id}`);

  const [profileResult, categories] = await Promise.all([
    supabase
      .from("organization_public_profiles")
      .select("*")
      .eq("organization_id", org.id)
      .maybeSingle(),
    getPublicCategories(supabase, slug).catch(() => [] as PublicCategory[]),
  ]);

  return {
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      currency: org.currency,
      company_type: org.company_type,
      brand_config: org.brand_config,
    },
    profile: profileResult.data ?? null,
    categories,
  };
}

export type StorefrontCatalogOptions = {
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: PublicProductSort;
  productIds?: string[];
};

export type StorefrontCatalog = {
  organization: PublicOrgMeta | null;
  products: PublicProduct[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Cached public catalog. Invalidated via `products:<orgId>` (product,
 * category, promo, review and stock mutations already revalidate that tag)
 * and `storefront:<orgId>` (profile/branding changes).
 */
export async function getPublicCatalogCached(
  slug: string,
  options?: StorefrontCatalogOptions,
): Promise<StorefrontCatalog | null> {
  "use cache";
  cacheLife("standard");

  const supabase = createServiceClient();
  const shell = await getStorefrontShell(slug);
  if (!shell) return null;

  cacheTag(`products:${shell.org.id}`);
  cacheTag(`storefront:${shell.org.id}`);
  return getPublicCatalog(supabase, slug, options);
}

export type StorefrontProductDetail = {
  organization: PublicOrgMeta;
  product: PublicProductDetail;
};

/** Cached single public product (detail + variants + related). */
export async function getPublicProductCached(
  slug: string,
  productId: string,
): Promise<StorefrontProductDetail | null> {
  "use cache";
  cacheLife("standard");

  const supabase = createServiceClient();
  const shell = await getStorefrontShell(slug);
  if (!shell) return null;

  cacheTag(`products:${shell.org.id}`);
  return getPublicProduct(supabase, slug, productId);
}

/** Cached header categories — invalidated with the shell. */
export async function getPublicCategoriesCached(
  slug: string,
): Promise<PublicCategory[]> {
  "use cache";
  cacheLife("standard");

  const shell = await getStorefrontShell(slug);
  return shell?.categories ?? [];
}

/** Cached active promotions — invalidated via `products:<orgId>`. */
export async function getPublicPromotionsCached(
  slug: string,
): Promise<PublicPromotion[]> {
  "use cache";
  cacheLife("standard");

  const supabase = createServiceClient();
  const shell = await getStorefrontShell(slug);
  if (!shell) return [];

  cacheTag(`products:${shell.org.id}`);
  return getPublicPromotions(supabase, slug);
}

/** Cached approved reviews for one product. */
export async function getPublicReviewsCached(
  slug: string,
  productId: string,
): Promise<PublicReview[]> {
  "use cache";
  cacheLife("standard");

  const supabase = createServiceClient();
  const shell = await getStorefrontShell(slug);
  if (!shell) return [];

  cacheTag(`products:${shell.org.id}`);
  return getPublicReviews(supabase, slug, productId);
}

/**
 * Cached published blog posts. Returns null when the org is missing or the
 * RPC fails (caller treats it as not-found); an empty array means a
 * published storefront with no posts yet.
 */
export async function getPublicBlogPostsCached(
  slug: string,
): Promise<PublicBlogPost[] | null> {
  "use cache";
  cacheLife("standard");

  const supabase = createServiceClient();
  const shell = await getStorefrontShell(slug);
  if (!shell) return null;

  cacheTag(`blog:${shell.org.id}`);
  const { data, error } = await supabase.rpc("get_public_blog_posts", {
    p_slug: slug,
  });
  if (error || !data) return null;
  return (data as PublicBlogPost[]) ?? [];
}

export type PublicBlogPostDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
};

/** Cached single blog post — invalidated via `blog:<orgId>`. */
export async function getPublicBlogPostCached(
  slug: string,
  postSlug: string,
): Promise<PublicBlogPostDetail | null> {
  "use cache";
  cacheLife("standard");

  const supabase = createServiceClient();
  const shell = await getStorefrontShell(slug);
  if (!shell) return null;

  cacheTag(`blog:${shell.org.id}`);
  const { data, error } = await supabase.rpc("get_public_blog_post", {
    p_slug: slug,
    p_post_slug: postSlug,
  });
  if (error || !data) return null;
  return data as PublicBlogPostDetail;
}

/** Cached public branches (pickup locations). */
export async function getPublicBranchesCached(
  slug: string,
): Promise<PublicBranch[]> {
  "use cache";
  cacheLife("standard");

  const supabase = createServiceClient();
  const shell = await getStorefrontShell(slug);
  if (!shell) return [];

  cacheTag(`storefront:${shell.org.id}`);
  return getPublicBranches(supabase, slug);
}
