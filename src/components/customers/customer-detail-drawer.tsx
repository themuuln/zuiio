"use client";

import { DrawerLayout } from "@/components/ui/drawer-layout";
import {Envelope, Eye, MapPin, Phone, User} from "@phosphor-icons/react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { InfoRow } from "@/components/ui/info-row";

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
  children,
}: {
  customer: CustomerDetailData;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      trigger={children ?? <button type="button" className={buttonVariants({ variant: "ghost", size: "icon-xs" })}><Eye className="size-3.5" /></button>}
    >
              <DrawerHeader title={customer.name} description="Харилцагчийн дэлгэрэнгүй мэдээлэл" />


              <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
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
              </div>
    </DrawerLayout>
  );
}
