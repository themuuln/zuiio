import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CartClient } from "./cart-client";

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
    const { data: org } = await supabase
      .from("organizations")
      .select("name, slug, currency")
      .eq("slug", slug)
      .maybeSingle();

    if (!org) {
      notFound();
    }

    return (
      <CartClient
        slug={slug}
        organization={{
          name: org.name,
          slug: org.slug,
          currency: org.currency ?? "MNT",
        }}
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
