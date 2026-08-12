"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import Link from "next/link";
import { useStorefrontCart } from "@/components/storefront/cart-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Cart link with live item count for storefront page headers. Must be
 * rendered inside a `StorefrontCartProvider`.
 */
export function StorefrontCartLink({ slug }: { slug: string }) {
  const { count } = useStorefrontCart();

  return (
    <Link
      href={`/${slug}/cart`}
      aria-label={`Сагс (${count})`}
      className={cn(
        buttonVariants({ variant: "outline", size: "default" }),
        "relative",
      )}
    >
      <ShoppingCart className="size-4" />
      <span className="hidden sm:inline">Сагс</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}
