import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getPublicBranchesCached,
  getStorefrontShell,
} from "@/lib/storefront-cache";
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
  const shell = await getStorefrontShell(slug);
  const orgName = shell?.org?.name ?? null;
  return {
    title: orgName ? `${orgName} — Сагс` : "Сагс",
    robots: { index: false, follow: true },
  };
}

async function CartDataFetcher({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const shell = await getStorefrontShell(slug);
    const org = shell?.org ?? null;
    const profile = shell?.profile ?? null;

    if (!org) {
      notFound();
    }

    const branches = (await getPublicBranchesCached(
      slug,
    )) as unknown as StorefrontBranch[];

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
