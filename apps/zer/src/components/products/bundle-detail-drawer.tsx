"use client";

import { Package, Tag } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { InfoRow } from "@/components/ui/info-row";
import { formatCurrency } from "@/lib/format";

export type BundleDetailData = {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number | null;
  cost_price: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
  items: Array<{
    id: string;
    product_id: string | null;
    quantity: number;
    products: { name: string; sku: string | null } | null;
  }>;
};

export function BundleDetailDrawer({
  bundle,
  open,
  onOpenChange,
}: {
  bundle: BundleDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title={bundle.name}
      description="Багцын дэлгэрэнгүй мэдээлэл"
    >
      <div className="space-y-6">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <Badge variant={bundle.is_active ? "default" : "secondary"}>
            {bundle.is_active ? "Идэвхтэй" : "Идэвхгүй"}
          </Badge>
        </div>

        {/* Info rows */}
        <div className="divide-y">
          <InfoRow
            icon={<Package className="size-4" />}
            label="Нэр"
            value={bundle.name}
          />
          <InfoRow
            icon={<Tag className="size-4" />}
            label="SKU"
            value={bundle.sku ?? "-"}
          />
          <InfoRow
            label="Өртөг"
            value={bundle.cost_price ? formatCurrency(bundle.cost_price) : "-"}
          />
          <InfoRow
            label="Борлуулалтын үнэ"
            value={bundle.sale_price ? formatCurrency(bundle.sale_price) : "-"}
          />
          {bundle.description && (
            <InfoRow label="Тайлбар" value={bundle.description} />
          )}
        </div>

        {/* Bundle Items */}
        {(bundle.items ?? []).length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">
              Багцын бараанууд ({(bundle.items ?? []).length})
            </h4>
            <div className="divide-y rounded-lg border text-sm">
              {(bundle.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {item.products?.name ?? "Бүтээгдэхүүн"}
                    </span>
                    {item.products?.sku && (
                      <span className="text-xs text-muted-foreground">
                        SKU: {item.products.sku}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {item.quantity} ширхэг
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DrawerLayout>
  );
}
