"use client";

import {
  Archive,
  Minus,
  Plus,
  ShoppingCart,
  Trash,
  X,
} from "@phosphor-icons/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HELD_SALES_KEY, useCart } from "@/app/(dashboard)/shop/cart-context";
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
    removeDiscount,
    holdSale,
    restoreHeldSale,
    removeHeldSale,
  } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);
  const [heldSales, setHeldSales] = useState<
    { id: string; items: CartItem[]; discount: unknown; heldAt: string }[]
  >([]);
  const [mounted, setMounted] = useState(false);
  const heldRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  // Unified held-sales refresh: reads from localStorage
  const refreshHeldSales = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(HELD_SALES_KEY);
      setHeldSales(raw ? (JSON.parse(raw) as typeof heldSales) : []);
    } catch {
      setHeldSales([]);
    }
  }, []);

  // Refresh the held-sales list whenever the popover opens
  useEffect(() => {
    if (heldOpen) refreshHeldSales();
  }, [heldOpen, refreshHeldSales]);

  // Close popover on outside click
  useEffect(() => {
    if (!heldOpen) return;
    const onClick = (e: MouseEvent) => {
      if (heldRef.current && !heldRef.current.contains(e.target as Node)) {
        setHeldOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [heldOpen]);

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
            <span className="flex min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold leading-none text-primary-foreground tabular-nums">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!showEmpty && (
            <div className="relative" ref={heldRef}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground"
                aria-haspopup="menu"
                aria-expanded={heldOpen}
                onClick={() => setHeldOpen((v) => !v)}
              >
                <Archive className="size-4" />
                Тавигдсан
              </Button>
              {heldOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-border bg-popover p-2 shadow-lg"
                >
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Тавигдсан захиалгууд
                  </p>
                  {heldSales.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      Тавигдсан захиалга байхгүй байна.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {heldSales.map((sale) => (
                        <li
                          key={sale.id}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">
                              {sale.items.length} төрөл ·{" "}
                              {sale.items
                                .reduce((n, i) => n + i.quantity, 0)
                                .toLocaleString()}
                              ш
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sale.heldAt).toLocaleTimeString(
                                "mn-MN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                restoreHeldSale(sale.id);
                                setHeldOpen(false);
                              }}
                            >
                              Сэргээх
                            </Button>
                            <button
                              type="button"
                              aria-label="Устгах"
                              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                removeHeldSale(sale.id);
                                setHeldSales((prev) =>
                                  prev.filter((s) => s.id !== sale.id),
                                );
                              }}
                            >
                              <Trash className="size-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
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
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                Хөнгөлөлт
                {discount.discountName ? ` (${discount.discountName})` : ""}
              </span>
              <span className="flex shrink-0 items-center gap-1 tabular-nums text-primary">
                -{discount.discountAmount.toLocaleString()}₮
                <button
                  type="button"
                  aria-label="Хөнгөлөлт хасах"
                  onClick={removeDiscount}
                  className="flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-3" weight="bold" />
                </button>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium">Нийт дүн</span>
            <span className="text-xl font-bold tabular-nums">
              {(showEmpty
                ? 0
                : discount
                  ? discountedTotal
                  : totalAmount
              ).toLocaleString()}
              ₮
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={showEmpty}
            onClick={() => {
              holdSale();
              refreshHeldSales();
              toast.success("Захиалгыг тавилаа.");
            }}
          >
            <Archive className="size-4" />
            Тавих
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-[2]"
            disabled={showEmpty}
            onClick={() => setCheckoutOpen(true)}
          >
            Төлбөр тооцоо
          </Button>
        </div>
      </div>

      <CheckoutDrawer open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
