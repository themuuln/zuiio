"use client";

import { Package, TriangleAlert } from "lucide-react";
import { useLocale } from "next-intl";
import type { WorkOrderPart } from "@/lib/types";
import type { CatalogPartItem } from "./_drawer-types";
import { CatalogCombobox } from "./_catalog-combobox";
import { SectionCard } from "./_section-card";
import { WorkOrderListHeader, WorkOrderRow } from "./_work-order-row";

interface PartsSectionProps {
  parts: WorkOrderPart[];
  partsCatalog: CatalogPartItem[];
  lowStockMap?: Record<string, { quantity: number; threshold: number }>;
  partSearch: string;
  showAddPart: boolean;
  onPartSearchChange: (val: string) => void;
  onToggleAddPart: () => void;
  onAddPart: (item: CatalogPartItem) => void;
  onRemovePart: (partId: string) => Promise<void>;
  onEditPriceSave: (id: string, price: number) => Promise<void>;
  onEditQtySave: (partId: string, qty: number) => Promise<void>;
  t: (key: string) => string;
}

export function PartsSection({
  parts,
  partsCatalog,
  lowStockMap,
  partSearch,
  showAddPart,
  onPartSearchChange,
  onToggleAddPart,
  onAddPart,
  onRemovePart,
  onEditPriceSave,
  onEditQtySave,
  t,
}: PartsSectionProps) {
  const locale = useLocale();
  const isEmpty = (parts?.length ?? 0) === 0;

  return (
    <SectionCard
      icon={Package}
      title={t("parts")}
      count={parts?.length}
      emptyMessage={t("noParts")}
      isEmpty={isEmpty}
      isAdding={showAddPart}
      addLabel={t("addPart")}
      onToggleAdd={onToggleAddPart}
    >
      {!isEmpty && (
        <div className="-mx-1">
          <WorkOrderListHeader
            name={t("part")}
            qty={t("qty")}
            price={t("price")}
          />
          {parts?.map((part) => {
            const lowStock = lowStockMap?.[(part as any).part_id ?? ""];
            const isLowStock = lowStock && part.quantity <= lowStock.threshold;

            return (
              <WorkOrderRow
                key={part.id}
                name={part.part_name}
                badge={
                  isLowStock ? (
                    <TriangleAlert
                      className="size-3 text-yellow-500 shrink-0"
                      aria-label="Low stock"
                    />
                  ) : undefined
                }
                subtitle={
                  lowStock ? (
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                      {t("stock")}: {lowStock.quantity}
                    </span>
                  ) : undefined
                }
                quantity={Number(part.quantity ?? 1)}
                price={Number(part.final_price)}
                onQtySave={(qty) => onEditQtySave(part.id, qty)}
                onPriceSave={(price) => onEditPriceSave(part.id, price)}
                onDelete={() => onRemovePart(part.id)}
                deleteLabel="Remove part"
              />
            );
          })}
        </div>
      )}

      {showAddPart && (
        <div className="mt-2">
          <CatalogCombobox
            items={partsCatalog}
            search={partSearch}
            onSearchChange={onPartSearchChange}
            onSelect={(item) => onAddPart(item)}
            onAddNew={(name) =>
              onAddPart({
                id: "",
                name,
                name_mn: null,
                default_price: 0,
                _source: "global",
              } as CatalogPartItem)
            }
            isAdded={(item) =>
              parts?.some((p) => (p as any).part_id === item.id) ??
              parts?.some(
                (p) =>
                  (p as any).part_id === null &&
                  p.part_name.toLowerCase() === item.name.toLowerCase(),
              ) ??
              false
            }
            placeholder={t("searchParts")}
            noMatchMessage={t("noMatchPart")}
            addAsNewLabel={t("addAsNew")}
            locale={locale}
          />
        </div>
      )}
    </SectionCard>
  );
}
