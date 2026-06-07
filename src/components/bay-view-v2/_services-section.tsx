"use client";

import { Wrench } from "lucide-react";
import { useLocale } from "next-intl";
import type { WorkOrderService } from "@/lib/types";
import type { CatalogServiceItem } from "./_drawer-types";
import { CatalogCombobox } from "./_catalog-combobox";
import { SectionCard } from "./_section-card";
import { WorkOrderListHeader, WorkOrderRow } from "./_work-order-row";

interface ServicesSectionProps {
  services: WorkOrderService[];
  catalog: CatalogServiceItem[];
  serviceSearch: string;
  showAddService: boolean;
  onServiceSearchChange: (val: string) => void;
  onToggleAddService: () => void;
  onAddService: (svc: CatalogServiceItem) => void;
  onRemoveService: (serviceId: string) => Promise<void>;
  onEditPriceSave: (id: string, price: number) => Promise<void>;
  onEditQtySave: (id: string, qty: number) => Promise<void>;
  t: (key: string) => string;
}

export function ServicesSection({
  services,
  catalog,
  serviceSearch,
  showAddService,
  onServiceSearchChange,
  onToggleAddService,
  onAddService,
  onRemoveService,
  onEditPriceSave,
  onEditQtySave,
  t,
}: ServicesSectionProps) {
  const locale = useLocale();
  const isEmpty = (services?.length ?? 0) === 0;

  return (
    <SectionCard
      icon={Wrench}
      title={t("services")}
      count={services?.length}
      emptyMessage={t("noServicesYet")}
      isEmpty={isEmpty}
      isAdding={showAddService}
      addLabel={t("addService")}
      onToggleAdd={onToggleAddService}
    >
      {!isEmpty && (
        <div className="-mx-1">
          <WorkOrderListHeader
            name={t("service")}
            qty={t("qty")}
            price={t("price")}
          />
          {services?.map((svc) => (
            <WorkOrderRow
              key={svc.id}
              name={svc.service_name}
              quantity={Number(svc.quantity ?? 1)}
              price={Number(svc.final_price)}
              onQtySave={(qty) => onEditQtySave(svc.id, qty)}
              onPriceSave={(price) => onEditPriceSave(svc.id, price)}
              onDelete={() => onRemoveService(svc.id)}
              deleteLabel="Remove service"
            />
          ))}
        </div>
      )}

      {showAddService && (
        <div className="mt-2">
          <CatalogCombobox
            items={catalog}
            search={serviceSearch}
            onSearchChange={onServiceSearchChange}
            onSelect={(svc) => onAddService(svc)}
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
            locale={locale}
          />
        </div>
      )}
    </SectionCard>
  );
}
