"use client";

import { Envelope, MapPin, Phone, User } from "@phosphor-icons/react";
import { useState } from "react";
import { DetailDrawerShell } from "@/components/ui/detail-drawer-shell";
import { InfoRow } from "@/components/ui/info-row";
import { formatCurrency } from "@/lib/format";

export type CustomerDetailData = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number | null;
};

export function CustomerDetailDrawer({
  customer,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onEdit,
}: {
  customer: CustomerDetailData;
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
      title={customer.name}
      description="Харилцагчийн дэлгэрэнгүй мэдээлэл"
      onEdit={onEdit}
    >
      <div className="divide-y">
        <InfoRow
          icon={<User className="size-4" />}
          label="Нэр"
          value={customer.name}
        />
        <InfoRow
          icon={<Phone className="size-4" />}
          label="Утас"
          value={customer.phone ?? "-"}
        />
        <InfoRow
          icon={<Envelope className="size-4" />}
          label="Имэйл"
          value={customer.email ?? "-"}
        />
        <InfoRow
          icon={<MapPin className="size-4" />}
          label="Хаяг"
          value={customer.address ?? "-"}
        />
        <InfoRow
          label="Авлага"
          value={formatCurrency(Number(customer.balance ?? 0))}
        />
      </div>
    </DetailDrawerShell>
  );
}
