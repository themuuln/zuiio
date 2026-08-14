import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OrdersClient } from "./orders-client";

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
    title: org?.name ? `${org.name} — Захиалгын түүх` : "Захиалгын түүх",
    robots: { index: false, follow: true },
  };
}

export default async function StoreAccountOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OrdersClient slug={slug} />;
}
