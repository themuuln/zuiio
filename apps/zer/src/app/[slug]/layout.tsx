import Script from "next/script";
import { StorefrontAiChat } from "@/components/storefront/ai-chat/ai-chat-widget";
import { createClient } from "@/lib/supabase/server";

/**
 * Public storefront layout.
 *
 * Injects per-organization GA4 + Meta Pixel scripts when the org has
 * configured them in organization settings, and mounts the AI shopping
 * assistant widget. Dashboard/admin pages never render this layout.
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
      "id, name, public_profile:organization_public_profiles(display_name)",
    )
    .eq("slug", slug)
    .maybeSingle();

  // organization_public_profiles is 1:1 with organizations, but PostgREST
  // may still return an array shape; normalize defensively.
  const profile = Array.isArray(org?.public_profile)
    ? (org.public_profile as { display_name?: string | null }[])[0]
    : (org?.public_profile as { display_name?: string | null } | null);

  const orgName = profile?.display_name ?? org?.name ?? null;

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
      {children}
      {org && <StorefrontAiChat slug={slug} orgName={orgName} />}
    </>
  );
}
