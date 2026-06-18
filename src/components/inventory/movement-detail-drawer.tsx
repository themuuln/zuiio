"use client";

import { DrawerLayout } from "@/components/ui/drawer-layout";
import {ArrowsClockwise} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { DrawerHeader } from "@/components/ui/drawer-header";

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
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
    >
              <DrawerHeader title="Барааны хөдөлгөөний дэлгэрэнгүй" description={formatDate(movement.created_at)} />


              <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
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
    </DrawerLayout>
  );
}
