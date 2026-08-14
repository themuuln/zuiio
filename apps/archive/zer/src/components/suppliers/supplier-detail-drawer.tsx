"use client";

import { Buildings, Envelope, MapPin, Phone } from "@phosphor-icons/react";
import { useState } from "react";
import { DetailDrawerShell } from "@/components/ui/detail-drawer-shell";
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
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onEdit,
}: {
  supplier: SupplierDetailData;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEdit?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  return (
    <DetailDrawerShell
      open={open}
      onOpenChange={setOpen}
      title={supplier.name}
      description="Нийлүүлэгчийн дэлгэрэнгүй мэдээлэл"
      onEdit={onEdit}
    >
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
    </DetailDrawerShell>
  );
}
