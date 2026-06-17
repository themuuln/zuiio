"use client";

import { Drawer } from "@base-ui/react/drawer";
import { ArrowsClockwise, X } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";

const MOVEMENT_LABELS: Record<string, string> = {
  in: "Орлого",
  out: "Зарлага",
  adjustment: "Тохируулга",
};

const MOVEMENT_VARIANTS: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  in: "default",
  out: "destructive",
  adjustment: "secondary",
};

export type MovementDetailData = {
  id: string;
  type: string;
  quantity: number;
  unit_cost: number | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  product_name: string;
  product_unit: string | null;
  product_sku: string | null;
};

export function MovementDetailDrawer({
  movement,
  open,
  onOpenChange,
}: {
  movement: MovementDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const totalCost =
    movement.unit_cost != null ? movement.unit_cost * movement.quantity : null;

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
                    Барааны хөдөлгөөний дэлгэрэнгүй
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {formatDate(movement.created_at)}
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <div className="space-y-6">
                {/* Type badge + product */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant={MOVEMENT_VARIANTS[movement.type] ?? "outline"}
                  >
                    <ArrowsClockwise className="mr-1 size-3" />
                    {MOVEMENT_LABELS[movement.type] ?? movement.type}
                  </Badge>
                </div>

                {/* Quantity card */}
                <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Тоо хэмжээ</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {movement.quantity} {movement.product_unit ?? "ширхэг"}
                  </p>
                </div>

                {/* Info rows */}
                <div className="divide-y rounded-xl border border-border/80">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Бүтээгдэхүүн</span>
                    <span className="font-medium">{movement.product_name}</span>
                  </div>
                  {movement.product_sku && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-muted-foreground">SKU</span>
                      <span className="font-medium font-mono text-xs">
                        {movement.product_sku}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Төрөл</span>
                    <span className="font-medium">
                      {MOVEMENT_LABELS[movement.type] ?? movement.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Нэгж өртөг</span>
                    <span className="font-medium">
                      {movement.unit_cost != null
                        ? formatCurrency(movement.unit_cost)
                        : "-"}
                    </span>
                  </div>
                  {totalCost != null && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Нийт өртөг</span>
                      <span className="font-medium">
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Огноо</span>
                    <span className="font-medium">
                      {formatDate(movement.created_at)}
                    </span>
                  </div>
                  {movement.reference && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Лавлагаа</span>
                      <span className="font-medium">{movement.reference}</span>
                    </div>
                  )}
                  {movement.notes && (
                    <div className="px-4 py-3 text-sm">
                      <span className="block text-muted-foreground mb-1">
                        Тэмдэглэл
                      </span>
                      <span className="font-medium">{movement.notes}</span>
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
