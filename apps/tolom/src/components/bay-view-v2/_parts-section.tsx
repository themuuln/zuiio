"use client";

import { Package } from "lucide-react";
import type { WorkOrderPart } from "@/lib/types";
import { PartLineRow } from "@/components/work-orders/line-items";
import { CatalogPickerDrawer } from "./_catalog-picker-drawer";
import type { CatalogPartItem } from "./_drawer-types";
import { SectionCard } from "./_section-card";
import { WorkOrderListHeader } from "./_work-order-row";

interface PartsSectionProps {
  parts: WorkOrderPart[];
  partsCatalog: CatalogPartItem[];
  lowStockMap?: Record<string, { quantity: number; threshold: number }>;
  partSearch: string;
  showAddPart: boolean;
  locale?: string;
  onPartSearchChange: (val: string) => void;
  onAddPartOpenChange: (open: boolean) => void;
  onAddPart: (item: CatalogPartItem) => void;
  onRemovePart: (partId: string) => Promise<void>;
  onEditPriceSave: (id: string, price: number) => Promise<void>;
  onEditQtySave: (partId: string, qty: number) => Promise<void>;
  onEditDiscountSave?: (
    id: string,
    discountAmount: number,
    discountPercent: number,
  ) => Promise<void>;
  t: (key: string) => string;
}

type WorkOrderPartWithSource = WorkOrderPart & {
  part_id?: string | null;
  name_mn?: string | null;
};

export function PartsSection({
  parts,
  partsCatalog,
  lowStockMap,
  partSearch,
  showAddPart,
  locale = "en",
  onPartSearchChange,
  onAddPartOpenChange,
  onAddPart,
  onRemovePart,
  onEditPriceSave,
  onEditQtySave,
  onEditDiscountSave,
  t,
}: PartsSectionProps) {
  const isEmpty = (parts?.length ?? 0) === 0;

  // Build lookups from partsCatalog for name_mn
  const partNameLookup = new Map<string, string | null | undefined>();
  const nameToNameMnLookup = new Map<string, string | null | undefined>();
  for (const item of partsCatalog) {
    if (item.id) {
      partNameLookup.set(item.id, item.name_mn);
    }
    if (item.name) {
      nameToNameMnLookup.set(item.name.toLowerCase(), item.name_mn);
    }
  }

  function getPartDisplayName(part: WorkOrderPartWithSource): string {
    if (locale !== "mn") return part.part_name;

    // 1) Check name_mn on the part itself (optimistic entries carry it)
    if (part.name_mn) return part.name_mn;

    // 2) Try by catalog ID (works for existing catalog items)
    const catalogId = part.part_id;
    if (catalogId) {
      const nameMn = partNameLookup.get(catalogId);
      if (nameMn) return nameMn;
    }

    // 3) Fallback to name-based match (handles newly-added / unrefreshed catalog)
    const nameMatch = nameToNameMnLookup.get(part.part_name.toLowerCase());
    if (nameMatch) return nameMatch;

    return part.part_name;
  }

  return (
    <>
      <SectionCard
        icon={Package}
        title={t("parts")}
        count={parts?.length}
        emptyMessage={t("noParts")}
        isEmpty={isEmpty}
        addLabel={t("addPart")}
        onToggleAdd={() => onAddPartOpenChange(true)}
      >
        {!isEmpty && (
          <div className="-mx-1">
            <WorkOrderListHeader
              name={t("part")}
              qty={t("qty")}
              price={t("price")}
            />
            {parts?.map((part) => {
              const catalogPartId = (part as WorkOrderPartWithSource).part_id;
              const lowStock = lowStockMap?.[catalogPartId ?? ""];

              return (
                <PartLineRow
                  key={part.id}
                  name={part.part_name}
                  nameMn={getPartDisplayName(part)}
                  partNumber={part.part_number ?? undefined}
                  quantity={Number(part.quantity ?? 1)}
                  unitPrice={Number(part.unit_price ?? 0)}
                  finalPrice={Number(part.final_price)}
                  discountAmount={Number(
                    (part as unknown as Record<string, unknown>)
                      .discount_amount ?? 0,
                  )}
                  discountPercent={Number(
                    (part as unknown as Record<string, unknown>)
                      .discount_percentage ?? 0,
                  )}
                  stockInfo={
                    lowStock
                      ? {
                          quantity: lowStock.quantity,
                          threshold: lowStock.threshold,
                        }
                      : null
                  }
                  locale={locale}
                  onQuantityChange={(qty) => onEditQtySave(part.id, qty)}
                  onPriceChange={(price) => onEditPriceSave(part.id, price)}
                  onDiscountAmountChange={
                    onEditDiscountSave
                      ? (amount) =>
                          onEditDiscountSave(
                            part.id,
                            amount,
                            Number(
                              (part as unknown as Record<string, unknown>)
                                .discount_percentage ?? 0,
                            ),
                          )
                      : undefined
                  }
                  onDiscountPercentChange={
                    onEditDiscountSave
                      ? (percent) =>
                          onEditDiscountSave(
                            part.id,
                            Number(
                              (part as unknown as Record<string, unknown>)
                                .discount_amount ?? 0,
                            ),
                            percent,
                          )
                      : undefined
                  }
                  onDelete={() => onRemovePart(part.id)}
                  deleteLabel={t("removePartLabel")}
                />
              );
            })}
          </div>
        )}
      </SectionCard>

      <CatalogPickerDrawer
        open={showAddPart}
        onOpenChange={onAddPartOpenChange}
        title={t("addPart")}
        description={t("addPartDrawerDescription")}
        items={partsCatalog}
        search={partSearch}
        onSearchChange={onPartSearchChange}
        onSelect={onAddPart}
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
          parts?.some(
            (p) => (p as WorkOrderPartWithSource).part_id === item.id,
          ) ??
          parts?.some(
            (p) =>
              (p as WorkOrderPartWithSource).part_id === null &&
              p.part_name.toLowerCase() === item.name.toLowerCase(),
          ) ??
          false
        }
        placeholder={t("searchParts")}
        noMatchMessage={t("noMatchPart")}
        addAsNewLabel={t("addAsNew")}
        closeLabel={t("close")}
      />
    </>
  );
}
