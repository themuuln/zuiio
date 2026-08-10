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
 * (org_profiles_resolve_domain policy) so it works with the anon key.
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
