import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves a custom domain (or subdomain) to an org slug.
 *
 * Used by edge middleware to rewrite public storefront requests:
 *   https://shop.example.com/products → /{slug}/products
 *
 * Only verified domains are resolvable; the query goes through RLS
 * (org_public_profiles_select policy) so it works with the anon key.
 *
 * When the host is not a storefront domain, the route checks whether it
 * is an org's verified admin (ERP) domain and answers `{ admin: true }`
 * — the middleware must NOT rewrite admin hosts to the storefront, the
 * dashboard/auth pages render under them. Only a boolean is returned so
 * the org behind an admin domain stays private.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = (url.searchParams.get("host") ?? "").trim().toLowerCase();

  if (!host) {
    return NextResponse.json({ error: "host required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_public_profiles")
    .select("organization_id, custom_domain")
    .eq("custom_domain", host)
    .eq("domain_verified", true)
    .maybeSingle();

  if (error) {
    capture(error, { context: "domain-resolve: lookup" });
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }

  if (!data) {
    const { data: adminMatch } = await supabase
      .from("organization_public_profiles")
      .select("organization_id")
      .eq("admin_domain", host)
      .eq("admin_domain_verified", true)
      .maybeSingle();

    if (adminMatch) {
      return NextResponse.json({ admin: true });
    }

    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Resolve slug from the org id
  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", data.organization_id)
    .maybeSingle();

  if (!org?.slug) {
    return NextResponse.json({ error: "org missing" }, { status: 404 });
  }

  return NextResponse.json({ slug: org.slug });
}
