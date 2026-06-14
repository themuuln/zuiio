import { redirect } from "next/navigation";
import type * as React from "react";
import { CartProvider } from "@/app/(dashboard)/shop/cart-context";
import { BottomBar } from "@/components/shop/bottom-bar";
import { createClient } from "@/lib/supabase/server";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
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
        {/* Top header bar */}
        <header className="sticky top-0 z-40 flex h-[52px] items-center justify-center border-b border-border bg-card px-4">
          <div className="flex w-full max-w-lg items-center justify-between">
            <span className="text-sm font-semibold">Дэлгүүр</span>
          </div>
        </header>

        {/* Main content area */}
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
          {children}
        </main>

        {/* Bottom tab bar */}
        <BottomBar />
      </div>
    </CartProvider>
  );
}
