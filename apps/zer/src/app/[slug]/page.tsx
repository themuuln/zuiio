import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { capture } from "@zuiio/capture";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getPublicCatalog } from "@/lib/public-catalog";
import {
  absoluteImageUrl,
  requestHost,
  storefrontCanonical,
  storefrontSocialMetadata,
} from "@/lib/storefront-seo";
import { createClient } from "@/lib/supabase/server";
import type { OrgMeta, PublicProduct } from "./products/page";
import { ProductDetailDrawer } from "./products/product-detail-drawer";
import { ProductCard } from "./products/products-page-client";

type OrgProfileData = {
  name: string;
  slug: string;
  currency: string;
  company_type: string;
  public_profile: {
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
    ga_measurement_id: string | null;
    meta_description: string | null;
    meta_pixel_id: string | null;
    meta_title: string | null;
    og_image_url: string | null;
    custom_domain: string | null;
    domain_verified: boolean;
    policies: string | null;
    social_links: Record<string, string> | null;
  } | null;
};

function normalizeTime(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

/**
 * Convert stored business_hours ({"Monday": "09:00-18:00", …}) into
 * schema.org openingHoursSpecification entries. Days sharing the same
 * open/close range are grouped; malformed values are skipped.
 */
function openingHoursSpecification(
  hours: Record<string, string> | null | undefined,
):
  | Array<{
      "@type": "OpeningHoursSpecification";
      dayOfWeek: string[];
      opens: string;
      closes: string;
    }>
  | undefined {
  if (!hours) return undefined;
  const byRange = new Map<string, string[]>();
  for (const [day, value] of Object.entries(hours)) {
    const match = /^\s*(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\s*$/.exec(
      value,
    );
    if (!match) continue;
    const opens = normalizeTime(match[1]);
    const closes = normalizeTime(match[2]);
    if (!opens || !closes) continue;
    const key = `${opens}-${closes}`;
    const days = byRange.get(key) ?? [];
    days.push(day);
    byRange.set(key, days);
  }
  if (byRange.size === 0) return undefined;
  return [...byRange.entries()].map(([range, days]) => {
    const [opens, closes] = range.split("-");
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens,
      closes,
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, slug, public_profile:organization_public_profiles(*) ")
    .eq("slug", slug)
    .single();

  if (!org) {
    return { title: "Байгууллага" };
  }

  const profile = org.public_profile as {
    meta_title?: string | null;
    meta_description?: string | null;
    og_image_url?: string | null;
    logo_url?: string | null;
    banner_url?: string | null;
  } | null;

  const title = profile?.meta_title || org.name;
  const description =
    profile?.meta_description || `${org.name}-ийн нийтийн хуудас`;

  // Canonical host: on a custom domain the storefront is served at the
  // domain root (middleware rewrites / → /{slug}), so the canonical is the
  // bare origin; on the primary host it keeps the org slug.
  const host = await requestHost();
  const canonical = storefrontCanonical(host, org.slug);

  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    ...storefrontSocialMetadata({
      title,
      description,
      canonical,
      siteName: org.name,
      images: [profile?.og_image_url, profile?.logo_url, profile?.banner_url],
    }),
  };
}

export default function OrgProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<OrgProfileSkeleton />}>
      <OrgProfileDataFetcher params={params} />
    </Suspense>
  );
}

async function OrgProfileDataFetcher({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug, currency, company_type")
      .eq("slug", slug)
      .single();

    if (orgError || !org) {
      capture(orgError ?? "Organization not found", {
        context: "org profile: org lookup",
      });
      notFound();
    }

    const profileResult = (await supabase
      .from("organization_public_profiles")
      .select("*")
      .eq("organization_id", org.id)
      .maybeSingle()) as { data: OrgProfileData["public_profile"] };

    const publicProfile = profileResult.data;

    if (!publicProfile?.catalog_enabled) {
      notFound();
    }

    // Fetch ALL public products — the storefront shows the full catalog
    // inline instead of a CTA button to the products page. First page
    // returns the total, so remaining pages are fetched in parallel.
    const products: PublicProduct[] = [];
    let catalogTotal = 0;
    const firstPage = await getPublicCatalog(supabase, slug, {
      page: 1,
      pageSize: 100,
    });
    if (firstPage?.organization) {
      catalogTotal = firstPage.total;
      products.push(...firstPage.products);
      const pagesRemaining = Math.max(0, Math.ceil(catalogTotal / 100) - 1);
      if (pagesRemaining > 0) {
        // Bounded concurrency: 4 parallel RPCs at a time, so huge catalogs
        // don't fire dozens of requests at once.
        const pageNumbers = Array.from(
          { length: pagesRemaining },
          (_, i) => i + 2,
        );
        const rest: Awaited<ReturnType<typeof getPublicCatalog>>[] = [];
        for (let i = 0; i < pageNumbers.length; i += 4) {
          const batch = await Promise.all(
            pageNumbers
              .slice(i, i + 4)
              .map((p) =>
                getPublicCatalog(supabase, slug, { page: p, pageSize: 100 }),
              ),
          );
          rest.push(...batch);
        }
        for (const catalog of rest) {
          if (catalog) products.push(...catalog.products);
        }
      }
    }

    const orgMeta: OrgMeta = {
      name: org.name,
      slug: org.slug,
      currency: org.currency ?? "",
      companyType: org.company_type,
    };

    const orgData: OrgProfileData = {
      name: org.name,
      slug: org.slug,
      currency: org.currency ?? "",
      company_type: org.company_type,
      public_profile: publicProfile,
    };

    // Structured data: Organization with contact, socials, logo and opening
    // hours so the storefront can surface as a rich local-business result.
    const canonical = storefrontCanonical(await requestHost(), orgData.slug);
    const socialLinks = orgData.public_profile?.social_links ?? {};
    const sameAs = Object.values(socialLinks).filter(
      (url): url is string => !!url && /^https?:\/\//i.test(url),
    );
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": canonical,
      name: orgData.public_profile?.display_name ?? orgData.name,
      ...(orgData.public_profile?.display_name
        ? { alternateName: orgData.name }
        : {}),
      description: orgData.public_profile?.description ?? undefined,
      url: canonical,
      ...(orgData.public_profile?.website_url
        ? { website: orgData.public_profile.website_url }
        : {}),
      logo: orgData.public_profile?.logo_url
        ? absoluteImageUrl(orgData.public_profile.logo_url)
        : undefined,
      image: orgData.public_profile?.banner_url
        ? absoluteImageUrl(orgData.public_profile.banner_url)
        : undefined,
      email: orgData.public_profile?.contact_email ?? undefined,
      telephone: orgData.public_profile?.contact_phone ?? undefined,
      address: orgData.public_profile?.address
        ? {
            "@type": "PostalAddress",
            streetAddress: orgData.public_profile.address,
            addressCountry: "MN",
          }
        : undefined,
      ...(sameAs.length ? { sameAs } : {}),
      ...(openingHoursSpecification(orgData.public_profile?.business_hours)
        ? {
            openingHoursSpecification: openingHoursSpecification(
              orgData.public_profile?.business_hours,
            ),
          }
        : {}),
    };

    // Promo-bearing products get their own "Хямдралтай" section (mirrors
    // shop.mn's sale rows); the full-catalog section then shows the rest.
    const promoProducts = products.filter((product) => product.promo);
    const catalogProducts =
      promoProducts.length > 0
        ? products.filter((product) => !product.promo)
        : products;

    return (
      <div className="min-h-dvh bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Hero — banner with scrim + org identity. The shell header now
              carries logo/name/search/cart, so the old in-body logo + name +
              cart row is gone; the hero turns the banner into a proper
              above-the-fold statement (shop.mn-style). */}
        <div className="relative overflow-hidden">
          {orgData.public_profile?.banner_url ? (
            <OptimizedImage
              src={orgData.public_profile.banner_url}
              alt={orgData.name}
              className="h-56 w-full object-cover sm:h-72"
              width={1600}
              priority
            />
          ) : (
            <div className="h-36 w-full bg-gradient-to-br from-primary/15 to-primary/5 sm:h-48" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-7xl px-4 pb-7 sm:px-6 sm:pb-9 lg:px-8">
            <div className="flex items-end gap-4">
              {orgData.public_profile?.logo_url ? (
                <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-background/90 p-1 backdrop-blur-sm sm:size-20">
                  <OptimizedImage
                    src={orgData.public_profile.logo_url}
                    alt={orgData.name}
                    className="h-full w-full object-contain"
                    width={80}
                    height={80}
                  />
                </div>
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground sm:size-20">
                  {orgData.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 space-y-1.5">
                <h1 className="break-words text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl">
                  {orgData.public_profile?.display_name ?? orgData.name}
                </h1>
                <Badge
                  variant="secondary"
                  className="bg-background/80 text-foreground backdrop-blur-sm"
                >
                  {orgData.company_type === "retail"
                    ? "Жижиглэн худалдаа"
                    : orgData.company_type === "wholesale"
                      ? "Томоохон худалдаа"
                      : orgData.company_type === "service"
                        ? "Үйлчилгээ"
                        : orgData.name}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
          {/* Description */}
          {orgData.public_profile?.description && (
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p>{orgData.public_profile.description}</p>
            </div>
          )}

          {/* Policies */}
          {orgData.public_profile?.policies && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-medium">Бодлого</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {orgData.public_profile.policies}
              </p>
            </div>
          )}

          {/* Promo section — mirrors shop.mn's sale rows */}
          {promoProducts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight">Хямдралтай</h2>
                <Link
                  href={`/${orgData.slug}/products`}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
                >
                  Бүгдийг харах
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {promoProducts.map((product) => (
                  <div key={product.id} className="group">
                    <ProductDetailDrawer
                      product={product}
                      organization={orgMeta}
                    >
                      <ProductCard
                        product={product}
                        currency={orgMeta.currency}
                      />
                    </ProductDetailDrawer>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Full catalog — section header with total + view-all link */}
          {catalogProducts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight">
                  Бүтээгдэхүүнүүд
                </h2>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    Нийт {catalogTotal}
                  </span>
                  <Link
                    href={`/${orgData.slug}/products`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
                  >
                    Бүгдийг харах
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {catalogProducts.map((product) => (
                  <div key={product.id} className="group">
                    <ProductDetailDrawer
                      product={product}
                      organization={orgMeta}
                    >
                      <ProductCard
                        product={product}
                        currency={orgMeta.currency}
                      />
                    </ProductDetailDrawer>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  } catch (err) {
    capture(err, { context: "org profile page" });
    notFound();
  }
}

function OrgProfileSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-32 w-full animate-pulse bg-muted sm:h-48" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-start gap-4">
          <div className="size-16 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
