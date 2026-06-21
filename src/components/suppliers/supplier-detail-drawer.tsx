"use client";

import { Buildings, Envelope, Eye, MapPin, Phone } from "@phosphor-icons/react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { InfoRow } from "@/components/ui/info-row";
import { formatCurrency } from "@/lib/format";

export type SupplierDetailData = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number | null;
};

export function SupplierDetailDrawer({
  supplier,
  children,
}: {
  supplier: SupplierDetailData;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      trigger={
        children ?? (
          <button
            type="button"
            className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          >
            <Eye className="size-3.5" />
          </button>
        )
      }
    >
      <DrawerHeader
        title={supplier.name}
        description="Нийлүүлэгчийн дэлгэрэнгүй мэдээлэл"
      />

      <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
        <div className="divide-y">
          <InfoRow
            icon={<Buildings className="size-4" />}
            label="Нэр"
            value={supplier.name}
          />
          <InfoRow
            icon={<Phone className="size-4" />}
            label="Утас"
            value={supplier.phone ?? "-"}
          />
          <InfoRow
            icon={<Envelope className="size-4" />}
            label="Имэйл"
            value={supplier.email ?? "-"}
          />
          <InfoRow
            icon={<MapPin className="size-4" />}
            label="Хаяг"
            value={supplier.address ?? "-"}
          />
          <InfoRow
            label="Өглөг"
            value={formatCurrency(Number(supplier.balance ?? 0))}
          />
        </div>
      </div>
    </DrawerLayout>
  );
}
