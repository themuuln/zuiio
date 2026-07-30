"use client";

import { CalendarBlank, Percent, Tag } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { formatCurrency, formatDate } from "@/lib/format";

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: "Хувь",
  fixed_amount: "Тогтмол дүн",
};

const APPLIES_TO_LABELS: Record<string, string> = {
  all: "Бүх бараа",
  selected_products: "Сонгосон бараа",
  selected_categories: "Сонгосон ангилал",
};

export interface CouponDetailData {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  per_customer_limit: number;
  applies_to: "all" | "selected_products" | "selected_categories";
  is_active: boolean;
  description: string | null;
  used_count: number;
  created_at: string;
}

export function CouponDetailDrawer({
  coupon,
  open,
  onOpenChange,
}: {
  coupon: CouponDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title={coupon.code}
      description="Купоны дэлгэрэнгүй мэдээлэл"
    >
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant={coupon.is_active ? "default" : "secondary"}>
            {coupon.is_active ? "Идэвхтэй" : "Идэвхгүй"}
          </Badge>
        </div>

        {/* Value card */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">Хямдралын утга</p>
          {coupon.discount_type === "percentage" ? (
            <>
              <p className="mt-1 text-2xl font-semibold">
                {coupon.discount_value}%
              </p>
              {coupon.max_discount_amount !== null && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Хамгийн их: {formatCurrency(coupon.max_discount_amount)}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-2xl font-semibold">
              {formatCurrency(coupon.discount_value)}
            </p>
          )}
          <p className="mt-0.5 text-sm text-muted-foreground">
            {DISCOUNT_TYPE_LABELS[coupon.discount_type] ??
              coupon.discount_type}
          </p>
        </div>

        {/* Info rows */}
        <div className="divide-y rounded-xl border border-border/80">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Tag className="size-4" />
              Код
            </span>
            <span className="font-mono font-medium">{coupon.code}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Percent className="size-4" />
              Төрөл
            </span>
            <span className="font-medium">
              {DISCOUNT_TYPE_LABELS[coupon.discount_type] ??
                coupon.discount_type}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Хамаарах хүрээ</span>
            <span className="font-medium">
              {APPLIES_TO_LABELS[coupon.applies_to] ?? coupon.applies_to}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Захиалгын доод дүн</span>
            <span className="font-medium">
              {coupon.min_purchase_amount > 0
                ? formatCurrency(coupon.min_purchase_amount)
                : "-"}
            </span>
          </div>
          {coupon.max_discount_amount !== null && (
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Хямдралын дээд дүн
              </span>
              <span className="font-medium">
                {formatCurrency(coupon.max_discount_amount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarBlank className="size-4" />
              Хүчинтэй эхлэх
            </span>
            <span className="font-medium">
              {formatDate(coupon.valid_from)}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Хүчинтэй дуусах</span>
            <span className="font-medium">
              {coupon.valid_until
                ? formatDate(coupon.valid_until)
                : "Тодорхойгүй"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Нэг хэрэглэгчийн хязгаар
            </span>
            <span className="font-medium">{coupon.per_customer_limit}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Ашигласан</span>
            <span className="font-medium">
              {coupon.used_count}
              {coupon.usage_limit !== null
                ? ` / ${coupon.usage_limit}`
                : ""}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Үүсгэсэн</span>
            <span className="font-medium">
              {formatDate(coupon.created_at)}
            </span>
          </div>
          {coupon.description && (
            <div className="px-4 py-3 text-sm">
              <span className="mb-1 block text-muted-foreground">Тайлбар</span>
              <span className="font-medium">{coupon.description}</span>
            </div>
          )}
        </div>
      </div>
    </DrawerLayout>
  );
}
