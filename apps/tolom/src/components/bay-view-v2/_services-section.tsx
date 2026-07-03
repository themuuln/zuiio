"use client";

import { Wrench } from "lucide-react";
import type { WorkOrderService } from "@/lib/types";
import { ServiceLineRow } from "@/components/work-orders/line-items";
import { CatalogPickerDrawer } from "./_catalog-picker-drawer";
import type { CatalogServiceItem } from "./_drawer-types";
import { SectionCard } from "./_section-card";
import { WorkOrderListHeader } from "./_work-order-row";

interface ServicesSectionProps {
  services: WorkOrderService[];
  catalog: CatalogServiceItem[];
  serviceSearch: string;
  showAddService: boolean;
  locale?: string;
  onServiceSearchChange: (val: string) => void;
  onAddServiceOpenChange: (open: boolean) => void;
  onAddService: (svc: CatalogServiceItem) => void;
  onRemoveService: (serviceId: string) => Promise<void>;
  onEditPriceSave: (id: string, price: number) => Promise<void>;
  onEditQtySave: (id: string, qty: number) => Promise<void>;
  onEditDiscountSave?: (
    id: string,
    discountAmount: number,
    discountPercent: number,
  ) => Promise<void>;
  t: (key: string) => string;
}

export function ServicesSection({
  services,
  catalog,
  serviceSearch,
  showAddService,
  locale = "en",
  onServiceSearchChange,
  onAddServiceOpenChange,
  onAddService,
  onRemoveService,
  onEditPriceSave,
  onEditQtySave,
  onEditDiscountSave,
  t,
}: ServicesSectionProps) {
  const isEmpty = (services?.length ?? 0) === 0;

  // Build lookups from catalog for name_mn
  const serviceNameLookup = new Map<string, string | null | undefined>();
  const nameToNameMnLookup = new Map<string, string | null | undefined>();
  for (const item of catalog) {
    if (item.id) {
      serviceNameLookup.set(item.id, item.name_mn);
    }
    if (item.name) {
      nameToNameMnLookup.set(item.name.toLowerCase(), item.name_mn);
    }
  }

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
        onToggleAdd={() => onAddServiceOpenChange(true)}
      >
        {!isEmpty && (
          <div className="-mx-1">
            <WorkOrderListHeader
              name={t("service")}
              qty={t("qty")}
              price={t("price")}
            />
            {services?.map((svc) => (
              <ServiceLineRow
                key={svc.id}
                name={svc.service_name}
                nameMn={getServiceDisplayName(svc)}
                quantity={Number(svc.quantity ?? 1)}
                unitPrice={Number(svc.unit_price ?? 0)}
                finalPrice={Number(svc.final_price)}
                discountAmount={Number(svc.discount_amount ?? 0)}
                discountPercent={Number(svc.discount_percentage ?? 0)}
                lastPrice={undefined}
                locale={locale}
                onQuantityChange={(qty) => onEditQtySave(svc.id, qty)}
                onPriceChange={(price) => onEditPriceSave(svc.id, price)}
                onDiscountAmountChange={
                  onEditDiscountSave
                    ? (amount) =>
                        onEditDiscountSave(
                          svc.id,
                          amount,
                          Number(svc.discount_percentage ?? 0),
                        )
                    : undefined
                }
                onDiscountPercentChange={
                  onEditDiscountSave
                    ? (percent) =>
                        onEditDiscountSave(
                          svc.id,
                          Number(svc.discount_amount ?? 0),
                          percent,
                        )
                    : undefined
                }
                onDelete={() => onRemoveService(svc.id)}
                deleteLabel={t("removeServiceAria")}
                t={t}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <CatalogPickerDrawer
        open={showAddService}
        onOpenChange={onAddServiceOpenChange}
        title={t("addService")}
        description={t("addServiceDrawerDescription")}
        items={catalog}
        search={serviceSearch}
        onSearchChange={onServiceSearchChange}
        onSelect={onAddService}
        onAddNew={(name) =>
          onAddService({
            id: "",
            name,
            name_mn: null,
            default_price: 0,
            category: null,
            _source: "global",
          } as CatalogServiceItem)
        }
        isAdded={(svc) =>
          services?.some((s) => s.service_catalog_id === svc.id) ?? false
        }
        placeholder={t("searchServices")}
        noMatchMessage={t("noMatchService")}
        addAsNewLabel={t("addAsNew")}
        closeLabel={t("close")}
      />
    </>
  );
}
