import Script from "next/script";
import { createClient } from "@/lib/supabase/server";

/**
 * Public storefront layout.
 *
 * Injects per-organization GA4 + Meta Pixel scripts when the org has
 * configured them in organization settings. Dashboard/admin pages never
 * render this layout, so analytics stay scoped to the public storefront.
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
      "public_profile:organization_public_profiles(ga_measurement_id, meta_pixel_id)",
    )
    .eq("slug", slug)
    .maybeSingle();

  // organization_public_profiles is 1:1 with organizations, but PostgREST
  // may still return an array shape; normalize defensively.
  const profile = Array.isArray(org?.public_profile)
    ? (
        org.public_profile as {
          ga_measurement_id?: string | null;
          meta_pixel_id?: string | null;
        }[]
      )[0]
    : (org?.public_profile as {
        ga_measurement_id?: string | null;
        meta_pixel_id?: string | null;
      } | null);

  const gaId = profile?.ga_measurement_id ?? null;
  const pixelId = profile?.meta_pixel_id ?? null;

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id={`ga4-${slug}`}
            strategy="afterInteractive"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: static GA4 snippet with org measurement id
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
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static Meta Pixel snippet with org pixel id
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
      {children}
    </>
  );
}
