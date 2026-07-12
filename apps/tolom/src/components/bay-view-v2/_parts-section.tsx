"use client";

import { Package } from "lucide-react";
import { useMemo } from "react";
import { LineItemRow } from "@/components/work-orders/line-items";
import type { WorkOrderPart } from "@/lib/types";
import type { CatalogPartItem } from "./_drawer-types";
import { SectionCard } from "./_section-card";

interface PartsSectionProps {
  parts: WorkOrderPart[];
  partsCatalog: CatalogPartItem[];
  locale?: string;
  onAddPartOpenChange: (open: boolean) => void;
  onEditPriceSave: (id: string, price: number) => Promise<void>;
  onEditQtySave: (partId: string, qty: number) => Promise<void>;
  t: (key: string) => string;
  lastAddedPartId?: string | null;
}

type WorkOrderPartWithSource = WorkOrderPart & {
  part_id?: string | null;
  name_mn?: string | null;
};

export function PartsSection({
  parts,
  partsCatalog,
  locale = "en",
  onAddPartOpenChange,
  onEditPriceSave,
  onEditQtySave,
  t,
  lastAddedPartId,
}: PartsSectionProps) {
  const isEmpty = (parts?.length ?? 0) === 0;

  // Build lookups from partsCatalog for name_mn (memoized to avoid re-creating Maps on every render)
  const partNameLookup = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    for (const item of partsCatalog) {
      if (item.id) map.set(item.id, item.name_mn);
    }
    return map;
  }, [partsCatalog]);

  const nameToNameMnLookup = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    for (const item of partsCatalog) {
      if (item.name) map.set(item.name.toLowerCase(), item.name_mn);
    }
    return map;
  }, [partsCatalog]);

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
        addButtonClassName="!bg-info/8 !border-info/35 !text-info hover:!bg-info/12 hover:!border-info/50"
        onToggleAdd={() => onAddPartOpenChange(true)}
      >
        {!isEmpty && (
          <div className="-mx-1">
            {parts?.map((part) => {
              return (
                <LineItemRow
                  key={part.id}
                  name={part.part_name}
                  nameMn={getPartDisplayName(part)}
                  quantity={Number(part.quantity ?? 1)}
                  unitPrice={Number(part.unit_price ?? 0)}
                  finalPrice={Number(part.final_price)}
                  discountAmount={Number(part.discount_amount ?? 0)}
                  discountPercentage={Number(part.discount_percentage ?? 0)}
                  locale={locale}
                  onEditPriceSave={onEditPriceSave}
                  onEditQtySave={onEditQtySave}
                  lineItemId={part.id}
                  autoFocusPrice={part.id === lastAddedPartId}
                />
              );
            })}
          </div>
        )}
      </SectionCard>
      {/* CatalogPickerDrawer lifted to WorkOrderDetailDrawer for proper Base UI nesting */}
    </>
  );
}
