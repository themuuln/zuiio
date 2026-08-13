import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PointsClient } from "./points-client";

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
    title: org?.name ? `${org.name} — Миний оноо` : "Миний оноо",
    robots: { index: false, follow: true },
  };
}

export default async function StoreAccountPointsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-4 text-xl font-bold tracking-tight">Миний оноо</h1>
      <PointsClient slug={slug} />
    </div>
  );
}
