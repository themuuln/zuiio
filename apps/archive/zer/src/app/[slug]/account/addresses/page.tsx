import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AddressesClient } from "./addresses-client";

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
    title: org?.name ? `${org.name} — Хаягийн дэвтэр` : "Хаягийн дэвтэр",
    robots: { index: false, follow: true },
  };
}

export default async function StoreAccountAddressesPage() {
  return <AddressesClient />;
}
