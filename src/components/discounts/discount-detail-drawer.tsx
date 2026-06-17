"use client";

import { Drawer } from "@base-ui/react/drawer";
import { CalendarBlank, Percent, X } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
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
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.1] [--bleed:3rem] dark:[--backdrop-opacity:0.4] z-50 fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] z-50 fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(28rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[28rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    {discount.name}
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    Хямдралын дэлгэрэнгүй мэдээлэл
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge variant={discount.is_active ? "default" : "secondary"}>
                    {discount.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </div>

                {/* Value card */}
                <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">
                    Хямдралын утга
                  </p>
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
                    <span className="text-muted-foreground">
                      Хамаарах хүрээ
                    </span>
                    <span className="font-medium">
                      {APPLIES_TO_LABELS[discount.applies_to] ??
                        discount.applies_to}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">
                      Захиалгын доод дүн
                    </span>
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
                    <span className="text-muted-foreground">
                      Хүчинтэй дуусах
                    </span>
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
                      <span className="block text-muted-foreground mb-1">
                        Тайлбар
                      </span>
                      <span className="font-medium">
                        {discount.description}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
