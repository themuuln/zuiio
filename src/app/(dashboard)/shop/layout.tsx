import { redirect } from "next/navigation";
import type * as React from "react";
import { CartProvider } from "@/app/(dashboard)/shop/cart-context";
import { ShopHeaderClient } from "@/app/(dashboard)/shop/shop-header-client";
import { BottomBar } from "@/components/shop/bottom-bar";
import { createClient } from "@/lib/supabase/server";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const claims = data?.claims;
  const userId = claims?.sub;
  if (error || !userId) {
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

  return (
    <CartProvider>
      {/* Shop container: full-width, mobile-first, no sidebar */}
      <div className="flex min-h-svh flex-col bg-background">
        {/* Top header bar with sidebar toggle */}
        <ShopHeaderClient />

        {/* Main content area */}
        <main className="mx-auto w-full flex-1 px-4 py-4">{children}</main>

        {/* Bottom tab bar */}
        <BottomBar />
      </div>
    </CartProvider>
  );
}
