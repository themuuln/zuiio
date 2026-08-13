"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { toast } from "sonner";
import { useStorefrontCart } from "@/components/storefront/cart-context";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/lib/shop-cart";

export function AddToCartButton({
  item,
  size,
  className,
  compact = false,
}: {
  item: Omit<CartItem, "quantity">;
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  /** Icon-only variant for dense product grids; keeps the same accessible name. */
  compact?: boolean;
}) {
  const { addItem } = useStorefrontCart();
  const disabled = item.maxStock <= 0;

  return (
    <Button
      type="button"
      size={size}
      className={className}
      disabled={disabled}
      aria-label={compact ? "Сагсанд нэмэх" : undefined}
      onClick={(e) => {
        // Stop the click from bubbling to the card's drawer trigger.
        e.stopPropagation();
        addItem(item);
        toast.success("Сагсанд нэмэгдлээ");
      }}
    >
      <ShoppingCart className="size-4" weight="bold" />
      {!compact && "Сагсанд нэмэх"}
    </Button>
  );
}
