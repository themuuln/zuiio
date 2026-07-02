"use client";

import { CalendarBlank, Percent } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { formatCurrency, formatDate } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  percentage: "Хувь",
  fixed_amount: "Тогтмол дүн",
};

const APPLIES_TO_LABELS: Record<string, string> = {
  all: "Бүх бүтээгдэхүүн",
  selected_products: "Сонгосон бүтээгдэхүүн",
  selected_categories: "Сонгосон ангилал",
};

export type DiscountDetailData = {
  id: string;
  name: string;
  description: string | null;
  type: "percentage" | "fixed_amount";
  value: number;
  applies_to: "all" | "selected_products" | "selected_categories";
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
  created_at: string;
};

export function DiscountDetailDrawer({
  discount,
  open,
  onOpenChange,
}: {
  discount: DiscountDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title={discount.name}
      description="Хямдралын дэлгэрэнгүй мэдээлэл"
    >
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant={discount.is_active ? "default" : "secondary"}>
            {discount.is_active ? "Идэвхтэй" : "Идэвхгүй"}
          </Badge>
        </div>

        {/* Value card */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">Хямдралын утга</p>
          <p className="mt-1 text-2xl font-semibold">
            {discount.type === "percentage"
              ? `${discount.value}%`
              : formatCurrency(discount.value)}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {TYPE_LABELS[discount.type] ?? discount.type}
          </p>
        </div>

        {/* Info rows */}
        <div className="divide-y rounded-xl border border-border/80">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Percent className="size-4" />
              Төрөл
            </span>
            <span className="font-medium">
              {TYPE_LABELS[discount.type] ?? discount.type}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Хамаарах хүрээ</span>
            <span className="font-medium">
              {APPLIES_TO_LABELS[discount.applies_to] ?? discount.applies_to}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Захиалгын доод дүн</span>
            <span className="font-medium">
              {discount.min_purchase_amount > 0
                ? formatCurrency(discount.min_purchase_amount)
                : "-"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarBlank className="size-4" />
              Хүчинтэй эхлэх
            </span>
            <span className="font-medium">
              {formatDate(discount.valid_from)}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Хүчинтэй дуусах</span>
            <span className="font-medium">
              {discount.valid_until
                ? formatDate(discount.valid_until)
                : "Тодорхойгүй"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Ашигласан</span>
            <span className="font-medium">
              {discount.used_count}
              {discount.usage_limit !== null
                ? ` / ${discount.usage_limit}`
                : ""}
            </span>
          </div>
          {discount.description && (
            <div className="px-4 py-3 text-sm">
              <span className="block text-muted-foreground mb-1">Тайлбар</span>
              <span className="font-medium">{discount.description}</span>
            </div>
          )}
        </div>
      </div>
    </DrawerLayout>
  );
}
