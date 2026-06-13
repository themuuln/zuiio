"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import Link from "next/link";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function CheckoutPage() {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShoppingCart className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Сагс хоосон</EmptyTitle>
          <EmptyDescription>
            Төлбөр тооцоо хийхийн тулд сагсандаа бүтээгдэхүүн нэмнэ үү.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/shop" />} size="lg">
            Бараа үзэх
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      <h1 className="text-lg font-semibold">Төлбөр тооцоо</h1>
      <p className="text-sm text-muted-foreground">
        Төлбөр тооцооны хэсэг удахгүй...
      </p>
    </div>
  );
}
