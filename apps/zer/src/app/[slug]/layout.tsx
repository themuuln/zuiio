import type { Metadata } from "next";
import Script from "next/script";
import { StorefrontAiChat } from "@/components/storefront/ai-chat/ai-chat-widget";
import { StorefrontCartProvider } from "@/components/storefront/cart-context";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { WishlistProvider } from "@/components/storefront/wishlist-context";
import { type BrandConfig, generateBrandCSS } from "@/lib/branding";
import { APP_NAME } from "@/lib/constants";
import { getPublicCategories } from "@/lib/public-catalog";
import { createClient } from "@/lib/supabase/server";

/**
 * Storefront pages carry their own org/product titles — the root layout's
 * "%s | Zer" suffix would leak the platform brand onto org sites (including
 * custom domains), so it is neutralized here.
 */
export const metadata: Metadata = {
  title: { default: APP_NAME, template: "%s" },
};

/**
 * Public storefront layout.
 *
 * Injects the org's brand theme (colors, radius, fonts) so branding
 * configured in Settings → Брэндинг applies to public pages, injects
 * per-organization GA4 + Meta Pixel scripts when the org has configured
 * them, and mounts the AI shopping assistant widget. Dashboard/admin
 * pages never render this layout.
 *
 * The analytics columns (ga_measurement_id, meta_pixel_id) were added in a
 * migration that is not applied on every environment — they are queried in
 * a separate, tolerant lookup so a missing column never breaks the
 * storefront shell or the chat widget.
 */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "id, name, brand_config, public_profile:organization_public_profiles(display_name, logo_url, description, contact_email, contact_phone, address, website_url, social_links, business_hours)",
    )
    .eq("slug", slug)
    .maybeSingle();

  const brandCSS = generateBrandCSS(
    (org?.brand_config ?? null) as BrandConfig | null,
  );

  // organization_public_profiles is 1:1 with organizations, but PostgREST
  // may still return an array shape; normalize defensively. The select
  // result is Json-shaped, so the shape cast goes through unknown.
  type ShellProfile = {
    display_name?: string | null;
    logo_url?: string | null;
    description?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    website_url?: string | null;
    social_links?: Record<string, string> | null;
    business_hours?: Record<string, string> | null;
  };
  const profile = Array.isArray(org?.public_profile)
    ? (org.public_profile as unknown as ShellProfile[])[0]
    : (org?.public_profile as unknown as ShellProfile | null);

  const orgName = profile?.display_name ?? org?.name ?? null;

  // Category nav for the storefront header. Tolerant lookup — the
  // get_public_categories RPC may be absent on environments where the
  // migration is not applied; the header then simply shows "Бүх бараа".
  let categories: { id: string; name: string }[] = [];
  try {
    categories = await getPublicCategories(supabase, slug);
  } catch {
    categories = [];
  }

  // Analytics ids (ga_measurement_id / meta_pixel_id) were added by
  // migration 20260730000004, which is not applied on local or remote DBs
  // and absent from the generated types snapshot. Query them tolerantly so
  // a missing column never breaks the storefront shell or the chat widget;
  // analytics simply stay off until the migration lands.
  let gaId: string | null = null;
  let pixelId: string | null = null;
  if (org?.id) {
    const { data: analytics } = (await supabase
      .from("organization_public_profiles")
      .select("ga_measurement_id, meta_pixel_id")
      .eq("organization_id", org.id)
      .maybeSingle()) as unknown as {
      data: {
        ga_measurement_id?: string | null;
        meta_pixel_id?: string | null;
      } | null;
      error: unknown;
    };
    gaId = analytics?.ga_measurement_id ?? null;
    pixelId = analytics?.meta_pixel_id ?? null;
  }

  return (
    <>
      {brandCSS && (
        <style
          id="brand-theme"
          dangerouslySetInnerHTML={{ __html: brandCSS }}
        />
      )}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id={`ga4-${slug}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `,
            }}
          />
        </>
      )}
      {pixelId && (
        <Script
          id={`meta-pixel-${slug}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
      <StorefrontCartProvider>
        <WishlistProvider slug={slug}>
          <div className="flex min-h-dvh flex-col bg-background">
            {org && (
              <StorefrontHeader
                slug={slug}
                name={orgName}
                logoUrl={profile?.logo_url ?? null}
                categories={categories}
              />
            )}
            <div className="flex flex-1 flex-col">{children}</div>
            {org && (
              <StorefrontFooter
                data={{
                  name: orgName,
                  description: profile?.description ?? null,
                  contactEmail: profile?.contact_email ?? null,
                  contactPhone: profile?.contact_phone ?? null,
                  address: profile?.address ?? null,
                  websiteUrl: profile?.website_url ?? null,
                  socialLinks: profile?.social_links ?? null,
                  businessHours: profile?.business_hours ?? null,
                }}
              />
            )}
          </div>
        </WishlistProvider>
      </StorefrontCartProvider>
      {org && <StorefrontAiChat slug={slug} orgName={orgName} />}
    </>
  );
}
