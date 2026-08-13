import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CartClient, type StorefrontBranch } from "./cart-client";

export default function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<CartSkeleton />}>
      <CartDataFetcher params={params} />
    </Suspense>
  );
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
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  return {
    title: org?.name ? `${org.name} — Сагс` : "Сагс",
    robots: { index: false, follow: true },
  };
}

async function CartDataFetcher({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    // Delivery config columns (delivery_enabled, pickup_enabled, ...) and the
    // get_public_branches RPC were added by the backend migration after the
    // generated types snapshot; query through the untyped client until types
    // regenerate (repo pattern for schema that landed ahead of typegen).
    const untyped = supabase as SupabaseClient;
    const { data: org } = await untyped
      .from("organizations")
      .select(
        "name, slug, currency, public_profile:organization_public_profiles(delivery_enabled, pickup_enabled, delivery_fee_amount, free_delivery_threshold, estimated_delivery_hours)",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (!org) {
      notFound();
    }

    const rawProfile = org.public_profile;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

    let branches: StorefrontBranch[] = [];
    try {
      const { data: branchRows, error: branchError } = await untyped.rpc(
        "get_public_branches",
        { p_slug: slug },
      );
      if (branchError) {
        capture(branchError, { context: "storefront cart: fetch branches" });
      }
      branches = Array.isArray(branchRows)
        ? (branchRows as StorefrontBranch[])
        : [];
    } catch (err) {
      // Branch listing is optional UI — never fail the whole cart page.
      capture(err, { context: "storefront cart: fetch branches" });
    }

    return (
      <CartClient
        slug={slug}
        organization={{
          name: org.name,
          slug: org.slug,
          currency: org.currency ?? "MNT",
          deliveryEnabled: profile?.delivery_enabled === true,
          pickupEnabled: profile?.pickup_enabled === true,
          deliveryFeeAmount:
            profile?.delivery_fee_amount != null
              ? Number(profile.delivery_fee_amount)
              : null,
          freeDeliveryThreshold:
            profile?.free_delivery_threshold != null
              ? Number(profile.free_delivery_threshold)
              : null,
          estimatedDeliveryHours:
            profile?.estimated_delivery_hours != null
              ? Number(profile.estimated_delivery_hours)
              : null,
        }}
        branches={branches}
        bnplAvailable={Boolean(
          process.env.BNPL_PROVIDER && process.env.BNPL_API_KEY,
        )}
      />
    );
  } catch {
    notFound();
  }
}

function CartSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-24 animate-pulse rounded-xl bg-muted/60" />
        ))}
        <div className="h-32 animate-pulse rounded-xl bg-muted/40" />
      </div>
    </div>
  );
}
