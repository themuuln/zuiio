import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountHeader } from "./account-header";

/**
 * Buyer account shell for the public storefront.
 * Resolves the org by slug and renders the shared account header.
 */
export default async function StoreAccountLayout({
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
    .select("name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!org) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AccountHeader slug={slug} orgName={org.name} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
