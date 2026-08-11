import {
  ArrowLeft,
  Info,
  Package,
  Scroll,
  Star,
  Tag,
} from "@phosphor-icons/react/dist/ssr";
import { capture } from "@zuiio/capture";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductReviews } from "@/components/shop/product-reviews";
import { StorefrontCartProvider } from "@/components/storefront/cart-context";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { WishlistProvider } from "@/components/storefront/wishlist-context";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getCompanyTypeLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { PublicProduct } from "../page";
import { ProductDetailDrawer } from "../product-detail-drawer";
import { ProductCard } from "../products-page-client";
import { BuyPanel } from "./buy-panel";
import { ProductGallery } from "./product-gallery";

// Types mirror the get_public_product RPC return shape (see supabase
// migrations). Stock fields are intentionally absent — privacy by design.
// Variants carry option labels + sale price from product_variants /
// product_variant_options (fixed 2026-08-10 — the RPC previously referenced
// non-existent name/price/image_url columns).
export type PublicVariant = {
  id: string;
  sku: string | null;
  sale_price: number | null;
  current_stock: number | null;
  option_labels: string | null;
};

export type PublicAttribute = {
  name: string;
  value: string;
};

export type PublicProductDetail = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  sale_price: number | null;
  category_name: string | null;
  category_id: string | null;
  image_url: string | null;
  description: string | null;
  created_at: string | null;
  variants: PublicVariant[];
  attributes: PublicAttribute[];
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
  // Same-category products (≤4) for the related section.
  related: PublicRelatedProduct[] | null;
};

export type PublicRelatedProduct = {
  id: string;
  name: string;
  sale_price: number | null;
  image_url: string | null;
  category_name: string | null;
};

export type PublicProductDetailData = {
  organization: {
    name: string;
    slug: string;
    currency: string;
    company_type: string;
  };
  product: PublicProductDetail;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_public_product", {
    p_slug: slug,
    p_product_id: id,
  });
  const detail = data as unknown as PublicProductDetailData | null;

  if (!detail?.product) {
    return { title: "Бүтээгдэхүүн" };
  }

  const { organization, product } = detail;
  const title = `${product.name} — ${organization.name}`;
  const rawDescription = product.description?.trim() ?? "";
  const description =
    rawDescription.length > 160
      ? `${rawDescription.slice(0, 157).trimEnd()}…`
      : rawDescription || title;

  // Canonical host: use the request host when a custom domain served the
  // page (rewrites preserve it); fall back to the configured site URL.
  const host = (await headers()).get("host") ?? "";
  const configuredHost = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://zuiio.mn"
  ).replace(/^https?:\/\//, "");
  const canonicalBase =
    host && host !== configuredHost
      ? `https://${host}`
      : process.env.NEXT_PUBLIC_SITE_URL || "https://zuiio.mn";
  const canonical = `${canonicalBase}/${slug}/products/${product.id}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: product.image_url
        ? [{ url: product.image_url, width: 1200, height: 630 }]
        : [],
      type: "website",
      url: canonical,
    },
  };
}

export default function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailDataFetcher params={params} />
    </Suspense>
  );
}

async function ProductDetailDataFetcher({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("get_public_product", {
      p_slug: slug,
      p_product_id: id,
    });

    if (error) {
      capture(error, { context: "public product detail: rpc" });
      notFound();
    }

    if (!data) {
      notFound();
    }

    const { organization, product } =
      data as unknown as PublicProductDetailData;
    const variants = product.variants ?? [];
    const attributes = product.attributes ?? [];
    const hasAttributes = attributes.length > 0;

    // Messenger deep link entry — the shop's Facebook page handle comes
    // from social_links (or the org website URL as fallback).
    const { data: profileRow } = await supabase
      .from("organizations")
      .select("public_profile:organization_public_profiles(social_links)")
      .eq("slug", slug)
      .maybeSingle();
    const socialLinks = Array.isArray(profileRow?.public_profile)
      ? profileRow.public_profile[0]?.social_links
      : profileRow?.public_profile?.social_links;
    const messengerPageHandle = extractFacebookHandle(socialLinks);

    // Gallery images: image_url is the primary entry; extra images come from
    // the product_images table (via `images`). Only render the gallery when
    // there is more than one image; otherwise keep the single-image layout.
    const galleryImages = (product.images ?? [])
      .map((img) => img.url)
      .filter((url): url is string => url != null);
    const hasGallery = galleryImages.length > 1;

    // Stock is only exposed when the org opts in (show_stock=true). When it
    // is unknown (null) we keep today's behavior — never block on stock.
    const currentStock = product.current_stock;
    const soldOut = currentStock !== null && currentStock === 0;

    return (
      <StorefrontCartProvider>
        <WishlistProvider slug={slug}>
          <div className="min-h-dvh bg-background">
            {/* Product structured data */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Product",
                  name: product.name,
                  image: product.image_url,
                  description: product.description,
                  offers: {
                    "@type": "Offer",
                    price: Number(product.sale_price ?? 0),
                    priceCurrency: organization.currency,
                    availability: "https://schema.org/InStock",
                  },
                }),
              }}
            />

            {/* Sticky header */}
            <div className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
              <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
                <Link
                  href={`/${slug}/products`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-4" /> Буцах
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="truncate text-sm font-medium">
                  {product.name}
                </span>
              </div>
            </div>

            <div className="mx-auto max-w-4xl space-y-0 p-4 sm:p-6 lg:p-8">
              {/* Product image(s) */}
              {hasGallery ? (
                <div className="mb-8">
                  <ProductGallery images={galleryImages} alt={product.name} />
                </div>
              ) : product.image_url ? (
                <div className="mb-8">
                  <OptimizedImage
                    src={product.image_url}
                    alt={product.name}
                    className="aspect-[4/3] w-full rounded-2xl"
                    width={800}
                    priority
                  />
                </div>
              ) : (
                <div className="mb-8 flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted/50">
                  <Package className="size-16 text-muted-foreground/15" />
                </div>
              )}

              {/* Title + org info */}
              <div className="space-y-2 mb-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {getCompanyTypeLabel(organization.company_type)} &middot;{" "}
                  {organization.name}
                </p>
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {product.name}
                  </h1>
                  <WishlistButton productId={product.id} className="shrink-0" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {product.category_name && (
                    <Badge variant="secondary">{product.category_name}</Badge>
                  )}
                  {hasAttributes && (
                    <Badge variant="outline" className="gap-1">
                      <Info className="size-3" />
                      {attributes.length} шинж чанар
                    </Badge>
                  )}
                  {/* Review stats — only when the product has reviews */}
                  {product.review_count !== null &&
                    product.review_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="size-4 text-amber-500" weight="fill" />
                        <span className="font-medium text-foreground tabular-nums">
                          {Number(product.review_average ?? 0).toFixed(1)}
                        </span>
                        <span>({product.review_count})</span>
                      </span>
                    )}
                </div>
              </div>

              {/* Promo badge line — shown when the product has an active promo */}
              {product.promo && (
                <div className="mb-8 flex flex-wrap items-center gap-2">
                  <Badge variant="default" className="gap-1">
                    <Tag className="size-3" weight="fill" />
                    {product.promo.reward_label ?? product.promo.title}
                  </Badge>
                  {product.promo.reward_label &&
                    product.promo.reward_label !== product.promo.title && (
                      <span className="text-sm font-medium">
                        {product.promo.title}
                      </span>
                    )}
                </div>
              )}

              {/* Stock status — only shown when the org exposes stock */}
              {currentStock !== null && (
                <div className="mb-8">
                  {soldOut ? (
                    <Badge variant="destructive" className="gap-1">
                      <Package className="size-3" />
                      Дууссан
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Package className="size-3" />
                      Нөөцөд байна — {currentStock}
                    </Badge>
                  )}
                </div>
              )}

              {/* Price + variants + add to cart */}
              <div className="mb-8">
                <BuyPanel
                  slug={slug}
                  productId={product.id}
                  productName={product.name}
                  basePrice={Number(product.sale_price ?? 0)}
                  unit={product.unit}
                  currency={organization.currency}
                  variants={variants}
                  soldOut={soldOut}
                  messengerPageHandle={messengerPageHandle}
                />
              </div>

              {/* Attributes section */}
              {hasAttributes && (
                <div className="mb-8 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    <Info className="size-4" />
                    Шинж чанар
                  </h2>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                    {attributes.map((attr) => (
                      <AttributeRow key={attr.name} attribute={attr} />
                    ))}
                  </dl>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-8">
                  <Section
                    icon={<Scroll className="size-4" />}
                    title="Тайлбар"
                    content={product.description}
                  />
                </div>
              )}

              {/* Basic details */}
              <div className="mb-8 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Мэдээлэл
                </h2>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                  {product.sku && (
                    <>
                      <dt className="text-muted-foreground">SKU</dt>
                      <dd className="font-medium">{product.sku}</dd>
                    </>
                  )}
                  {product.barcode && (
                    <>
                      <dt className="text-muted-foreground">Barcode</dt>
                      <dd className="font-medium font-mono">
                        {product.barcode}
                      </dd>
                    </>
                  )}
                  {product.unit && (
                    <>
                      <dt className="text-muted-foreground">Нэгж</dt>
                      <dd className="font-medium">{product.unit}</dd>
                    </>
                  )}
                  {product.category_name && (
                    <>
                      <dt className="text-muted-foreground">Ангилал</dt>
                      <dd className="font-medium">{product.category_name}</dd>
                    </>
                  )}
                  {product.created_at && (
                    <>
                      <dt className="text-muted-foreground">Бүртгэсэн</dt>
                      <dd className="font-medium">
                        {formatDate(product.created_at)}
                      </dd>
                    </>
                  )}
                </dl>
              </div>

              {/* Related products — same-category, same card style */}
              {(product.related ?? []).length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Холбоотой бүтээгдэхүүнүүд
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(product.related ?? []).map((relatedProduct) => (
                      <div key={relatedProduct.id} className="group">
                        <ProductDetailDrawer
                          product={toCardProduct(relatedProduct)}
                          organization={{
                            name: organization.name,
                            slug,
                            currency: organization.currency,
                            companyType: organization.company_type,
                          }}
                        >
                          <ProductCard
                            product={toCardProduct(relatedProduct)}
                            currency={organization.currency}
                          />
                        </ProductDetailDrawer>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews */}
            <ProductReviews slug={slug} productId={id} />

            {/* Footer */}
            <div className="border-t border-border/60 bg-card/30 py-6 text-center text-xs text-muted-foreground">
              <p>{organization.name} &middot; Нээлттэй мэдээлэл</p>
              <p className="mt-0.5">Zer ERP дэмждэг</p>
            </div>
          </div>
        </WishlistProvider>
      </StorefrontCartProvider>
    );
  } catch (err) {
    capture(err, { context: "public product detail" });
    notFound();
  }
}

function ProductDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-px bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-0 p-4 sm:p-6 lg:p-8">
        {/* Image skeleton */}
        <div className="mb-8 aspect-[4/3] w-full animate-pulse rounded-2xl bg-muted" />

        {/* Title skeleton */}
        <div className="space-y-2 mb-6">
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </div>

        {/* Price + buy skeleton */}
        <div className="mb-8 space-y-3">
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="h-3 w-12 animate-pulse rounded bg-muted mb-2" />
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
        </div>

        {/* Details skeleton */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="h-3 w-24 animate-pulse rounded bg-muted mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AttributeRow({ attribute }: { attribute: PublicAttribute }) {
  return (
    <>
      <dt className="text-muted-foreground">{attribute.name}</dt>
      <dd className="font-medium">{attribute.value || "—"}</dd>
    </>
  );
}

/**
 * Map a related product (slim RPC shape) onto the full PublicProduct card
 * shape. The RPC intentionally exposes no description/stock/promo for
 * related rows — cards render without them.
 */
function toCardProduct(related: PublicRelatedProduct): PublicProduct {
  return {
    id: related.id,
    name: related.name,
    unit: null,
    sale_price: related.sale_price,
    category_name: related.category_name,
    category_id: null,
    image_url: related.image_url,
    description: null,
    attribute_count: 0,
    images: null,
    current_stock: null,
    review_count: null,
    review_average: null,
    promo: null,
  };
}

function Section({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h2>
      <div className="prose prose-sm prose-neutral max-w-none text-foreground/90 whitespace-pre-line leading-relaxed">
        {content}
      </div>
    </div>
  );
}

/**
 * Extract a Facebook page handle from organization_public_profiles
 * social_links ("facebook" key), for m.me deep links. Accepts full URLs
 * (https://www.facebook.com/<handle>) and bare handles.
 */
function extractFacebookHandle(socialLinks: unknown): string | null {
  const candidate =
    socialLinks &&
    typeof socialLinks === "object" &&
    "facebook" in socialLinks &&
    typeof socialLinks.facebook === "string"
      ? socialLinks.facebook
      : "";
  if (!candidate) return null;

  const urlMatch = candidate.match(/facebook\.com\/([^/?#]+)/i);
  const bareMatch = candidate.match(/^@?([a-zA-Z0-9._]+)$/);
  const handle = (urlMatch?.[1] ?? bareMatch?.[1] ?? "")
    .replace(/^@/, "")
    .trim();
  return handle || null;
}
