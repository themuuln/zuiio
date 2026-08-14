"use client";

import { Minus, Plus, ShoppingCart, Trash } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import { CheckoutDrawer } from "@/components/shop/checkout-drawer";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { getCartItemKey } from "@/lib/shop-cart";
import { cn } from "@/lib/utils";

/**
 * Floating cart button with a bottom sheet cart view.
 * Pinned near the bottom of the catalog page for always-visible cart access.
 */
export function CartFloatingButton() {
  const {
    items,
    itemCount,
    totalAmount,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || (items.length === 0 && !checkoutOpen)) return null;

  return (
    <>
      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Сагс нээх (${itemCount} бараа, нийт ${totalAmount.toLocaleString()}₮)`}
        className={cn(
          "fixed bottom-20 left-1/2 z-40 -translate-x-1/2",
          "flex h-14 items-center gap-3 rounded-2xl px-5",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
          "transition-all active:scale-95",
          "hover:bg-primary/90",
        )}
      >
        <span className="relative">
          <ShoppingCart className="size-5" weight="fill" />
          <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold leading-none text-destructive-foreground">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {totalAmount.toLocaleString()}₮
        </span>
      </button>

      {/* Cart bottom sheet */}
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={
          <div className="flex items-center justify-between">
            <span>Сагс</span>
            <span className="text-sm font-normal text-muted-foreground">
              {items.reduce((s, i) => s + i.quantity, 0)} ширхэг
            </span>
          </div>
        }
        maxHeight="calc(90dvh + 3rem)"
        footer={
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Нийт дүн
              </span>
              <span className="text-xl font-bold tabular-nums">
                {totalAmount.toLocaleString()}₮
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => {
                  clearCart();
                  setOpen(false);
                }}
              >
                <Trash className="mr-2 size-4" />
                Хоослох
              </Button>
              <Button
                type="button"
                size="lg"
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  setCheckoutOpen(true);
                }}
              >
                Төлбөр тооцоо
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-2 px-4 pb-2">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Сагс хоосон байна.
            </p>
          ) : (
            items.map((item) => {
              const key = getCartItemKey(item);
              const lineTotal = item.unitPrice * item.quantity;
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  {/* Item info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {item.unitPrice.toLocaleString()}₮ × {item.quantity}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">
                      {lineTotal.toLocaleString()}₮
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity <= 1) {
                          removeItem(key);
                        } else {
                          updateQuantity(key, item.quantity - 1);
                        }
                      }}
                      className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                      aria-label="Багасгах"
                    >
                      <Minus className="size-4" weight="bold" />
                    </button>
                    <span className="flex w-8 items-center justify-center text-base font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(key, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Нэмэх"
                    >
                      <Plus className="size-4" weight="bold" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </BottomSheet>

      <CheckoutDrawer open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
