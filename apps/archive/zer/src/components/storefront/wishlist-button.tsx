"use client";

import { Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useWishlist } from "./wishlist-context";

/**
 * Heart toggle for the wishlist. Rendered above the card's drawer overlay
 * (z-20) so the click reaches it, and stops propagation so it never opens
 * the detail drawer.
 */
export function WishlistButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const { isWishlisted, toggle } = useWishlist();
  const saved = isWishlisted(productId);

  return (
    <button
      type="button"
      aria-label={saved ? "Хадгалсан" : "Хадгалах"}
      aria-pressed={saved}
      onClick={(e) => {
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Heart className="size-4" weight={saved ? "fill" : "regular"} />
    </button>
  );
}
