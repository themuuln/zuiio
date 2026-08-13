import type { Metadata } from "next";
import Script from "next/script";
import { StorefrontAiChat } from "@/components/storefront/ai-chat/ai-chat-widget";
import { StorefrontCartProvider } from "@/components/storefront/cart-context";
import { StorefrontBaseProvider } from "@/components/storefront/storefront-base-provider";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { WishlistProvider } from "@/components/storefront/wishlist-context";
import { type BrandConfig, generateBrandCSS } from "@/lib/branding";
import { APP_NAME } from "@/lib/constants";
import { getStorefrontShell } from "@/lib/storefront-cache";
import { requestHost, storefrontBasePath } from "@/lib/storefront-seo";

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
 * All org data comes from `getStorefrontShell` — one cached fetch (org +
 * public profile + categories) with stale-while-revalidate, invalidated by
 * profile/branding/settings mutations via the `storefront:<orgId>` tag.
 * The profile row is read via `*`, so analytics columns that may be absent
 * on environments with an older schema resolve to null without breaking
 * the shell or the chat widget.
 */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shell = await getStorefrontShell(slug);
  const org = shell?.org ?? null;
  const profile = shell?.profile ?? null;
  const categories = shell?.categories ?? [];

  const brandCSS = generateBrandCSS(
    (org?.brand_config ?? null) as BrandConfig | null,
  );

  const orgName = profile?.display_name ?? org?.name ?? null;
  const gaId = profile?.ga_measurement_id ?? null;
  const pixelId = profile?.meta_pixel_id ?? null;

  // Storefront link base for this request host: "/{slug}" on the primary
  // host, "" on custom domains/subdomains (the proxy rewrites the domain
  // root to /{slug}, so links must be root-relative there).
  const basePath = storefrontBasePath(await requestHost(), slug);

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
      <StorefrontBaseProvider basePath={basePath}>
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
                    socialLinks: (profile?.social_links ??
                      null) as unknown as Record<string, string> | null,
                    businessHours: (profile?.business_hours ??
                      null) as unknown as Record<string, string> | null,
                  }}
                />
              )}
            </div>
          </WishlistProvider>
        </StorefrontCartProvider>
      </StorefrontBaseProvider>
      {org && <StorefrontAiChat slug={slug} orgName={orgName} />}
    </>
  );
}
