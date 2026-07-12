"use client";

import { Wrench } from "lucide-react";
import { useMemo } from "react";
import { LineItemRow } from "@/components/work-orders/line-items";
import type { WorkOrderService } from "@/lib/types";
import type { CatalogServiceItem } from "./_drawer-types";
import { SectionCard } from "./_section-card";

interface ServicesSectionProps {
  services: WorkOrderService[];
  catalog: CatalogServiceItem[];
  locale?: string;
  isFullScreen?: boolean;
  onAddServiceOpenChange: (open: boolean) => void;
  onEditPriceSave: (id: string, price: number) => Promise<void>;
  onEditQtySave: (id: string, qty: number) => Promise<void>;
  t: (key: string) => string;
  lastAddedServiceId?: string | null;
}

export function ServicesSection({
  services,
  catalog,
  locale = "en",
  isFullScreen,
  onAddServiceOpenChange,
  onEditPriceSave,
  onEditQtySave,
  t,
  lastAddedServiceId,
}: ServicesSectionProps) {
  const isEmpty = (services?.length ?? 0) === 0;

  // Build lookups from catalog for name_mn (memoized to avoid re-creating Maps on every render)
  const serviceNameLookup = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    for (const item of catalog) {
      if (item.id) map.set(item.id, item.name_mn);
    }
    return map;
  }, [catalog]);

  const nameToNameMnLookup = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    for (const item of catalog) {
      if (item.name) map.set(item.name.toLowerCase(), item.name_mn);
    }
    return map;
  }, [catalog]);

  function getServiceDisplayName(svc: WorkOrderService): string {
    if (locale !== "mn") return svc.service_name;

    // 1) Check name_mn on the service itself (optimistic entries carry it)
    const svcWithNameMn = svc as WorkOrderService & { name_mn?: string | null };
    if (svcWithNameMn.name_mn) return svcWithNameMn.name_mn;

    // 2) Try by catalog ID (works for existing catalog items)
    const catalogId = svc.service_catalog_id;
    if (catalogId) {
      const nameMn = serviceNameLookup.get(catalogId);
      if (nameMn) return nameMn;
    }

    // 3) Fallback to name-based match (handles newly-added / unrefreshed catalog)
    const nameMatch = nameToNameMnLookup.get(svc.service_name.toLowerCase());
    if (nameMatch) return nameMatch;

    return svc.service_name;
  }

  return (
    <>
      <SectionCard
        icon={Wrench}
        title={t("services")}
        count={services?.length}
        emptyMessage={t("noServicesYet")}
        isEmpty={isEmpty}
        addLabel={t("addService")}
        addButtonClassName="!bg-success/8 !border-success/35 !text-success hover:!bg-success/12 hover:!border-success/50"
        onToggleAdd={() => onAddServiceOpenChange(true)}
      >
        {!isEmpty && (
          <div className="-mx-1">
            {services?.map((svc) => (
              <LineItemRow
                key={svc.id}
                name={svc.service_name}
                nameMn={getServiceDisplayName(svc)}
                quantity={Number(svc.quantity ?? 1)}
                unitPrice={Number(svc.unit_price ?? 0)}
                finalPrice={Number(svc.final_price)}
                discountAmount={Number(svc.discount_amount ?? 0)}
                discountPercentage={Number(svc.discount_percentage ?? 0)}
                locale={locale}
                onEditPriceSave={onEditPriceSave}
                onEditQtySave={onEditQtySave}
                lineItemId={svc.id}
                noTruncate={isFullScreen}
                autoFocusPrice={svc.id === lastAddedServiceId}
              />
            ))}
          </div>
        )}
      </SectionCard>
      {/* CatalogPickerDrawer lifted to WorkOrderDetailDrawer for proper Base UI nesting */}
    </>
  );
}
