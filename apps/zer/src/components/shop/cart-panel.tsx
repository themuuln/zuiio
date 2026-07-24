"use client";

import { Minus, Plus, ShoppingCart, Trash } from "@phosphor-icons/react";
import { memo, useCallback, useEffect, useState } from "react";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import { CheckoutDrawer } from "@/components/shop/checkout-drawer";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/lib/shop-cart";
import { getCartItemKey } from "@/lib/shop-cart";

const CartItemRow = memo(function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
}) {
  const key = getCartItemKey(item);
  const lineTotal = item.unitPrice * item.quantity;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        {item.variantLabels && (
          <p className="truncate text-xs text-muted-foreground">
            {item.variantLabels}
          </p>
        )}
        <p className="text-xs text-muted-foreground tabular-nums">
          {item.unitPrice.toLocaleString()}₮ × {item.quantity}
        </p>
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">
          {lineTotal.toLocaleString()}₮
        </p>
      </div>

      {/* Quantity stepper */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => {
            if (item.quantity <= 1) {
              onRemove(key);
            } else {
              onUpdateQuantity(key, item.quantity - 1);
            }
          }}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
          aria-label={item.quantity <= 1 ? "Хасах" : "Тоо ширхэг багасгах"}
        >
          {item.quantity <= 1 ? (
            <Trash className="size-3.5" />
          ) : (
            <Minus className="size-3.5" weight="bold" />
          )}
        </button>
        <span className="flex w-7 items-center justify-center text-sm font-semibold tabular-nums">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onUpdateQuantity(key, item.quantity + 1)}
          disabled={item.quantity >= item.maxStock}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Тоо ширхэг нэмэх"
        >
          <Plus className="size-3.5" weight="bold" />
        </button>
      </div>
    </li>
  );
});

/**
 * Persistent order panel for the desktop POS layout.
 * Shows cart line items with quantity controls, totals, and checkout action.
 */
export function CartPanel() {
  const {
    items,
    itemCount,
    totalAmount,
    discountedTotal,
    discount,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Force empty state on server/initial client render to avoid hydration mismatch
  // (CartProvider loads from sessionStorage in useEffect, which fires after paint)
  const showEmpty = !mounted || items.length === 0;

  const handleUpdateQuantity = useCallback(
    (key: string, qty: number) => updateQuantity(key, qty),
    [updateQuantity],
  );

  const handleRemove = useCallback(
    (key: string) => removeItem(key),
    [removeItem],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Захиалга</h2>
          {mounted && itemCount > 0 && (
            <span className="flex min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold leading-none text-primary-foreground tabular-nums">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </div>
        {!showEmpty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash className="size-4" />
            Хоослох
          </Button>
        )}
      </div>

      {/* Line items */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {showEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShoppingCart className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Сагс хоосон байна</p>
              <p className="text-xs text-muted-foreground">
                Бүтээгдэхүүн дээр дарж захиалгад нэмнэ үү.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <CartItemRow
                key={getCartItemKey(item)}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Totals + checkout */}
      <div className="flex shrink-0 flex-col gap-3 border-t border-border px-4 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Дэд дүн</span>
            <span className="tabular-nums">
              {(showEmpty ? 0 : totalAmount).toLocaleString()}₮
            </span>
          </div>
          {discount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Хөнгөлөлт
                {discount.discountName ? ` (${discount.discountName})` : ""}
              </span>
              <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                -{discount.discountAmount.toLocaleString()}₮
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium">Нийт дүн</span>
            <span className="text-xl font-bold tabular-nums">
              {(showEmpty ? 0 : discount ? discountedTotal : totalAmount).toLocaleString()}₮
            </span>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={showEmpty}
          onClick={() => setCheckoutOpen(true)}
        >
          Төлбөр тооцоо
        </Button>
      </div>

      <CheckoutDrawer open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
