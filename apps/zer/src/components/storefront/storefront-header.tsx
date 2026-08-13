"use client";

import { Heart, MagnifyingGlass, User } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StorefrontCartLink } from "@/components/storefront/storefront-cart-link";
import { useWishlist } from "@/components/storefront/wishlist-context";
import { buttonVariants } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

export type StorefrontCategory = {
  id: string;
  name: string;
};

/**
 * Shared sticky storefront header — logo + org name, product search, wishlist
 * with live count, cart with live count, account link, and a category nav
 * row. Rendered once by the `[slug]` layout so every storefront page gets
 * consistent chrome (benchmarked against shop.mn / kom.mn storefronts,
 * 2026-08-13 — docs/competitive-analysis.md §14).
 *
 * Must be rendered inside `WishlistProvider` (layout provides it).
 */
export function StorefrontHeader({
  slug,
  name,
  logoUrl,
  categories,
}: {
  slug: string;
  name: string | null;
  logoUrl: string | null;
  categories: StorefrontCategory[];
}) {
  const { count: wishlistCount } = useWishlist();
  const pathname = usePathname();

  // The buyer account area (sign-in, orders, addresses, points) renders its
  // own AccountHeader with a back link and section nav — the full storefront
  // chrome (search, wishlist, cart, account, category nav) is redundant
  // there. Hooks stay unconditional; this return comes after all of them.
  if (pathname?.startsWith(`/${slug}/account`)) return null;

  const searchField = (className?: string) => (
    <div className={cn("relative w-full", className)}>
      <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        placeholder="Бүтээгдэхүүн хайх…"
        className="h-9 w-full rounded-full border border-border/80 bg-card pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50"
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Row 1 — logo + name, search, actions */}
        <div className="flex items-center gap-3 py-3">
          <Link
            href={`/${slug}`}
            className="flex min-w-0 items-center gap-2.5"
            aria-label={name ?? slug}
          >
            {logoUrl ? (
              <div className="size-9 shrink-0 overflow-hidden rounded-lg border bg-card">
                <OptimizedImage
                  src={logoUrl}
                  alt=""
                  className="h-full w-full object-contain"
                  width={36}
                  height={36}
                />
              </div>
            ) : name ? (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold text-primary">
                {name.charAt(0)}
              </span>
            ) : null}
            {name && (
              <span className="truncate text-base font-semibold tracking-tight sm:text-lg">
                {name}
              </span>
            )}
          </Link>

          {/* Desktop search */}
          <search className="hidden min-w-0 flex-1 justify-center sm:flex">
            <form
              action={`/${slug}/products`}
              method="get"
              className="w-full max-w-md"
            >
              {searchField()}
            </form>
          </search>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
            {/* Wishlist */}
            <Link
              href={`/${slug}/wishlist`}
              aria-label={`Хадгалсан (${wishlistCount})`}
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "relative",
              )}
            >
              <Heart
                className="size-4"
                weight={wishlistCount > 0 ? "fill" : "regular"}
              />
              <span className="hidden sm:inline">Хадгалсан</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </Link>
            {/* Cart */}
            <StorefrontCartLink slug={slug} />
            {/* Account */}
            <Link
              href={`/${slug}/account`}
              aria-label="Нэвтрэх / Бүртгэл"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <User className="size-4" />
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <search className="block pb-3 sm:hidden">
          <form action={`/${slug}/products`} method="get">
            {searchField()}
          </form>
        </search>

        {/* Row 2 — category nav (scrollable on mobile) */}
        <nav
          aria-label="Ангилал"
          className="flex items-center gap-1 overflow-x-auto border-t border-border/40 py-2"
        >
          <Link
            href={`/${slug}/products`}
            className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Бүх бараа
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${slug}/products?category=${category.id}`}
              className="shrink-0 rounded-full px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
