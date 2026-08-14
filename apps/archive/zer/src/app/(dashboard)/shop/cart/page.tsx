"use client";

import { Minus, Plus, ShoppingCart, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import { CheckoutDrawer } from "@/components/shop/checkout-drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getCartItemKey } from "@/lib/shop-cart";

export default function CartPage() {
  const { items, totalAmount, updateQuantity, removeItem } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (items.length === 0 && !checkoutOpen) {
    return (
      <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShoppingCart className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Сагс хоосон</EmptyTitle>
          <EmptyDescription>
            Таны сагсанд бүтээгдэхүүн байхгүй байна.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild size="lg">
            <Link href="/shop">Бараа үзэх</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Сагс</h1>
        <span className="text-sm text-muted-foreground">
          {items.reduce((sum, i) => sum + i.quantity, 0)} ширхэг
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const itemKey = getCartItemKey(item);
          return (
            <Card key={itemKey} size="sm">
              <CardContent className="flex items-start gap-3 px-3 py-3">
                <div className="flex flex-1 flex-col gap-0.5">
                  <h3 className="text-sm font-medium leading-tight">
                    {item.name}
                  </h3>
                  {item.variantLabels && (
                    <p className="text-xs text-muted-foreground">
                      {item.variantLabels}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {item.unitPrice.toLocaleString()}₮ × {item.quantity}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {(item.unitPrice * item.quantity).toLocaleString()}₮
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon-xs"
                    variant="outline"
                    onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label={`Багасгах: ${item.name}`}
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span
                    className="flex h-[44px] w-[44px] items-center justify-center text-sm font-medium tabular-nums"
                    aria-hidden="true"
                  >
                    {item.quantity}
                  </span>
                  <Button
                    size="icon-xs"
                    variant="outline"
                    onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    aria-label={`Нэмэх: ${item.name}`}
                  >
                    <Plus className="size-3" />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="ml-1 text-destructive hover:text-destructive"
                    onClick={() => removeItem(itemKey)}
                    aria-label={`Устгах: ${item.name}`}
                  >
                    <Trash className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Total + Checkout */}
      <div className="sticky bottom-20 mt-auto rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Нийт дүн</span>
          <span className="text-lg font-bold">
            {totalAmount.toLocaleString()}₮
          </span>
        </div>
        <Button
          type="button"
          size="lg"
          className="mt-3 h-[52px] w-full text-sm"
          onClick={() => setCheckoutOpen(true)}
        >
          Төлбөр тооцоо
        </Button>
      </div>

      <CheckoutDrawer open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
