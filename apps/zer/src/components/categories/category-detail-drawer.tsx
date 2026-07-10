"use client";

import { Folder, Package } from "@phosphor-icons/react";
import { DetailDrawerShell } from "@/components/ui/detail-drawer-shell";
import { InfoRow } from "@/components/ui/info-row";

export type CategoryDetailData = {
  id: string;
  name: string;
  product_count: number;
};

export function CategoryDetailDrawer({
  category,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  isDeletePending,
}: {
  category: CategoryDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeletePending?: boolean;
}) {
  return (
    <DetailDrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={category.name}
      description="Ангиллын дэлгэрэнгүй мэдээлэл"
      onEdit={onEdit}
      onDelete={onDelete}
      isDeletePending={isDeletePending}
    >
      <div className="divide-y rounded-xl border border-border/80">
        <InfoRow
          icon={<Folder className="size-4" />}
          label="Нэр"
          value={category.name}
        />
        <InfoRow
          icon={<Package className="size-4" />}
          label="Бүтээгдэхүүний тоо"
          value={category.product_count}
        />
      </div>
    </DetailDrawerShell>
  );
}
