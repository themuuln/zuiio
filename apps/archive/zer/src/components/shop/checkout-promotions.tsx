"use client";

import { Gift } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { evaluateCartPromotions } from "@/app/(dashboard)/promotions/actions";
import type { CartItem } from "@/app/(dashboard)/shop/cart-context";
import { Badge } from "@/components/ui/badge";

interface CheckoutPromotionsProps {
  items: CartItem[];
  subtotal: number;
  onPromotionsEvaluated: (totalDiscount: number) => void;
}

export function CheckoutPromotions({
  items,
  subtotal,
  onPromotionsEvaluated,
}: CheckoutPromotionsProps) {
  const { data, isPending } = useQuery({
    queryKey: ["checkout", "promotions", subtotal, items.length],
    queryFn: async () => {
      const result = await evaluateCartPromotions(
        items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
        subtotal,
      );

      if (result.error || result.promotions.length === 0) {
        return { promotions: [], total_discount: 0 };
      }

      // Apply best non-stackable OR all stackable promotions
      const stackable = result.promotions.filter((p) => p.stackable);
      const nonStackable = result.promotions.filter((p) => !p.stackable);

      const stackableTotal = stackable.reduce(
        (sum, p) => sum + Number(p.reward_amount),
        0,
      );
      const bestNonStackable = nonStackable.reduce(
        (best, p) => Math.max(best, Number(p.reward_amount)),
        0,
      );

      return {
        promotions: result.promotions,
        total_discount: stackableTotal + bestNonStackable,
      };
    },
    enabled: items.length > 0 && subtotal > 0,
    staleTime: 30_000,
  });

  // Report effective discount upward via useEffect (not onSuccess)
  const onEvaluatedRef = useRef(onPromotionsEvaluated);
  onEvaluatedRef.current = onPromotionsEvaluated;

  useEffect(() => {
    onEvaluatedRef.current(data?.total_discount ?? 0);
  }, [data?.total_discount]);

  if (isPending || !data?.promotions.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Gift className="size-3.5" />
        <span>Сурталчилгаа</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {data.promotions.map((promo) => (
          <Badge
            key={promo.promotion_id}
            variant="secondary"
            className="text-xs"
          >
            {promo.promotion_name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
