"use client";

import { Package, TriangleAlert } from "lucide-react";
import type { WorkOrderPart } from "@/lib/types";
import { CatalogPickerDrawer } from "./_catalog-picker-drawer";
import type { CatalogPartItem } from "./_drawer-types";
import { SectionCard } from "./_section-card";
import { WorkOrderListHeader, WorkOrderRow } from "./_work-order-row";

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
              const isLowStock =
                lowStock && part.quantity <= lowStock.threshold;

              return (
                <WorkOrderRow
                  key={part.id}
                  name={getPartDisplayName(part)}
                  badge={
                    isLowStock ? (
                      <TriangleAlert
                        className="size-3 text-yellow-500 shrink-0"
                        aria-label={t("lowStockLabel")}
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
