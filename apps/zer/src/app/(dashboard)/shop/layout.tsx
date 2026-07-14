import { capture } from "@zuiio/capture";
import { redirect } from "next/navigation";
import type * as React from "react";
import { Suspense } from "react";
import { CartProvider } from "@/app/(dashboard)/shop/cart-context";
import { ShopHeaderClient } from "@/app/(dashboard)/shop/shop-header-client";
import { BottomBar } from "@/components/shop/bottom-bar";
import { ShopHistoryProvider } from "@/components/shop/shop-history-drawer";
import { createClient } from "@/lib/supabase/server";

/**
 * The shell that renders immediately while auth loads.
 * Includes the full page structure: skip link, header, main, bottom bar.
 */
function ShopShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Үндсэн агуулга руу очих
      </a>
      <div className="flex min-h-svh flex-col bg-background">
        <ShopHeaderClient />
        <main
          id="main-content"
          aria-label="Дэлгүүрийн үндсэн агуулга"
          className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 lg:max-w-[1500px] lg:px-6"
        >
          {children}
        </main>
        <BottomBar />
      </div>
    </>
  );
}

/** Fetches auth/profile and wraps children with org-scoped providers */
async function ShopAuthWrapper({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const claims = data?.claims;
  const userId = claims?.sub;
  if (error || !userId) {
    if (error) capture(error, { context: "shop: layout auth check" });
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.organization_id) {
    redirect("/organization/new");
  }
  const orgId = profile.organization_id;

  return (
    <ShopHistoryProvider orgId={orgId}>
      <ShopShell>{children}</ShopShell>
    </ShopHistoryProvider>
  );
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Suspense fallback={<ShopShell>{children}</ShopShell>}>
        <ShopAuthWrapper>{children}</ShopAuthWrapper>
      </Suspense>
    </CartProvider>
  );
}
