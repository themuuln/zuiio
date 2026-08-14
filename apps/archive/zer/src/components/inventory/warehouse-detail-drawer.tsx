"use client";

import { MapPin, Warehouse as WarehouseIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { formatDate } from "@/lib/format";

export type WarehouseDetailData = {
  id: string;
  name: string;
  location: string | null;
  is_default: boolean | null;
  created_at: string | null;
};

export function WarehouseDetailDrawer({
  warehouse,
  open,
  onOpenChange,
}: {
  warehouse: WarehouseDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <SlideInDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={warehouse.name}
      description="Агуулахын дэлгэрэнгүй мэдээлэл"
    >
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant={warehouse.is_default ? "default" : "outline"}>
            {warehouse.is_default ? "Үндсэн" : "Энгийн"}
          </Badge>
        </div>

        {/* Info rows */}
        <div className="divide-y rounded-xl border border-border/80">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <WarehouseIcon className="size-4" />
              Нэр
            </span>
            <span className="font-medium">{warehouse.name}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" />
              Байршил
            </span>
            <span className="font-medium">{warehouse.location ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Төрөл</span>
            <span className="font-medium">
              {warehouse.is_default ? "Үндсэн агуулах" : "Энгийн агуулах"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Үүсгэсэн</span>
            <span className="font-medium">
              {warehouse.created_at ? formatDate(warehouse.created_at) : "-"}
            </span>
          </div>
        </div>
      </div>
    </SlideInDrawer>
  );
}
