import {
  Clock,
  Envelope,
  FacebookLogo,
  Globe,
  InstagramLogo,
  LinkedinLogo,
  MapPin,
  Phone,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import { capture } from "@zuiio/capture";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { createClient } from "@/lib/supabase/server";

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

const SOCIAL_ICONS = {
  facebook: FacebookLogo,
  instagram: InstagramLogo,
  twitter: XLogo,
  youtube: YoutubeLogo,
  tiktok: TiktokLogo,
  linkedin: LinkedinLogo,
} as const;

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

const DAY_LABELS: Record<string, string> = {
  Monday: "Даваа",
  Tuesday: "Мягмар",
  Wednesday: "Лхагва",
  Thursday: "Пүрэв",
  Friday: "Баасан",
  Saturday: "Бямба",
  Sunday: "Ням",
};

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
  } | null;

  const title = profile?.meta_title || org.name;
  const description =
    profile?.meta_description || `${org.name}-ийн нийтийн хуудас`;
  const images = profile?.og_image_url
    ? [{ url: profile.og_image_url, width: 1200, height: 630 }]
    : profile?.logo_url
      ? [{ url: profile.logo_url, width: 1200, height: 630 }]
      : [];

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

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `${canonicalBase}/${org.slug}` },
    openGraph: {
      title,
      description,
      images,
      type: "website",
      url: `${canonicalBase}/${org.slug}`,
    },
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

    // Fetch public profile (table not yet in generated types)
    const profileResult = (await supabase
      .from("organization_public_profiles" as never)
      .select("*")
      .eq("organization_id", org.id)
      .maybeSingle()) as { data: OrgProfileData["public_profile"] };

    const publicProfile = profileResult.data;

    if (!publicProfile?.catalog_enabled) {
      notFound();
    }

    const orgData: OrgProfileData = {
      name: org.name,
      slug: org.slug,
      currency: org.currency ?? "",
      company_type: org.company_type,
      public_profile: publicProfile,
    };

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: orgData.public_profile?.display_name ?? orgData.name,
      description: orgData.public_profile?.description ?? undefined,
      url: orgData.public_profile?.website_url ?? undefined,
      email: orgData.public_profile?.contact_email ?? undefined,
      telephone: orgData.public_profile?.contact_phone ?? undefined,
      address: orgData.public_profile?.address
        ? {
            "@type": "PostalAddress",
            streetAddress: orgData.public_profile.address,
          }
        : undefined,
    };

    return (
      <div className="min-h-dvh bg-background">
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: required for JSON-LD structured data
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Banner */}
        {orgData.public_profile?.banner_url ? (
          <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-64">
            <OptimizedImage
              src={orgData.public_profile.banner_url}
              alt={orgData.name}
              className="h-full w-full object-cover"
              width={1200}
              priority
            />
          </div>
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-primary/10 to-primary/5" />
        )}

        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            {orgData.public_profile?.logo_url ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border bg-muted">
                <OptimizedImage
                  src={orgData.public_profile.logo_url}
                  alt={orgData.name}
                  className="h-full w-full object-contain"
                  width={64}
                  height={64}
                />
              </div>
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                {orgData.name.charAt(0)}
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {orgData.public_profile?.display_name ?? orgData.name}
              </h1>
              <Badge variant="secondary">
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

          {/* Description */}
          {orgData.public_profile?.description && (
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p>{orgData.public_profile.description}</p>
            </div>
          )}

          {/* Contact info */}
          <div className="grid gap-4 sm:grid-cols-2">
            {orgData.public_profile?.contact_email && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Envelope className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">
                    Имэйл
                  </p>
                  <p className="text-sm">
                    {orgData.public_profile.contact_email}
                  </p>
                </div>
              </div>
            )}
            {orgData.public_profile?.contact_phone && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Phone className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">
                    Утас
                  </p>
                  <p className="text-sm">
                    {orgData.public_profile.contact_phone}
                  </p>
                </div>
              </div>
            )}
            {orgData.public_profile?.address && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <MapPin className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">
                    Хаяг
                  </p>
                  <p className="text-sm">{orgData.public_profile.address}</p>
                </div>
              </div>
            )}
            {orgData.public_profile?.website_url && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Globe className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">
                    Вебсайт
                  </p>
                  <a
                    href={orgData.public_profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {orgData.public_profile.website_url}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Social Links */}
          {orgData.public_profile?.social_links &&
            Object.keys(orgData.public_profile.social_links).length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {Object.entries(orgData.public_profile.social_links).map(
                  ([platform, url]) => {
                    const Icon =
                      SOCIAL_ICONS[platform as keyof typeof SOCIAL_ICONS];
                    if (!Icon) return null;
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                        aria-label={platform}
                      >
                        <Icon className="size-3.5" />
                        {SOCIAL_LABELS[
                          platform as keyof typeof SOCIAL_LABELS
                        ] ?? platform}
                      </a>
                    );
                  },
                )}
              </div>
            )}

          {/* Business hours */}
          {orgData.public_profile?.business_hours &&
            Object.keys(orgData.public_profile.business_hours).length > 0 && (
              <div className="rounded-lg border p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Clock className="size-4" />
                  Ажлын цаг
                </h3>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {Object.entries(orgData.public_profile.business_hours).map(
                    ([day, hours]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {DAY_LABELS[day] ?? day}
                        </span>
                        <span>{hours}</span>
                      </div>
                    ),
                  )}
                </div>
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

          {/* CTA */}
          <div className="flex justify-center gap-3 pt-4">
            <Link
              href={`/${slug}/products`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Бүтээгдэхүүний каталог үзэх →
            </Link>
            <Link
              href={`/${slug}/blog`}
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium transition-colors hover:border-primary/30 hover:text-primary"
            >
              Блог үзэх
            </Link>
          </div>
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
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-start gap-4">
          <div className="size-16 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
