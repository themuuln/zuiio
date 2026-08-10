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
}: {
  item: Omit<CartItem, "quantity">;
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const { addItem } = useStorefrontCart();
  const disabled = item.maxStock <= 0;

  return (
    <Button
      type="button"
      size={size}
      className={className}
      disabled={disabled}
      onClick={(e) => {
        // Stop the click from bubbling to the card's drawer trigger.
        e.stopPropagation();
        addItem(item);
        toast.success("Сагсанд нэмэгдлээ");
      }}
    >
      <ShoppingCart className="size-4" weight="bold" />
      Сагсанд нэмэх
    </Button>
  );
}
