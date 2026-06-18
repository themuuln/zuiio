"use client";

import { DrawerLayout } from "@/components/ui/drawer-layout";
import {Folder, Package} from "@phosphor-icons/react";
import { DrawerHeader } from "@/components/ui/drawer-header";

export type CategoryDetailData = {
  id: string;
  name: string;
  product_count: number;
};

export function CategoryDetailDrawer({
  category,
  open,
  onOpenChange,
}: {
  category: CategoryDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
    >
              <DrawerHeader title={category.name} description="Ангиллын дэлгэрэнгүй мэдээлэл" />


              <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
                <div className="divide-y rounded-xl border border-border/80">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Folder className="size-4" />
                      Нэр
                    </span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Package className="size-4" />
                      Бүтээгдэхүүний тоо
                    </span>
                    <span className="font-medium">
                      {category.product_count}
                    </span>
                  </div>
                </div>
              </div>
    </DrawerLayout>
  );
}
