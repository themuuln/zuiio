"use client";

import { DrawerLayout } from "@/components/ui/drawer-layout";
import { Sliders } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import {
  computeCombinations,
  type LocalVariantData,
  type LocalVariantGroup,
  VariantEditor,
} from "@/components/products/variant-editor";
import { buttonVariants } from "@/components/ui/button";
import { DrawerHeader } from "@/components/ui/drawer-header";

export { computeCombinations, type LocalVariantData, type LocalVariantGroup };

export function VariantManagerDrawer({
  groups,
  onGroupsChange,
  defaultValues,
  variantData,
  onVariantsChange,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  groups: LocalVariantGroup[];
  onGroupsChange: (groups: LocalVariantGroup[]) => void;
  defaultValues?: {
    cost_price: number;
    sale_price: number;
    current_stock: number;
  };
  variantData: LocalVariantData[];
  onVariantsChange: (data: LocalVariantData[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const hasVariants = groups.length > 0;

  const totalOptions = useMemo(
    () => groups.reduce((sum, g) => sum + g.options.length, 0),
    [groups],
  );

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      panelWidth="32rem"
      trigger={
        <button
          type="button"
          className={buttonVariants({
            variant: hasVariants ? "outline" : "secondary",
          })}
        >
          <Sliders className="size-4" />
          {hasVariants ? `${totalOptions} сонголт` : "Вариант тохируулах"}
        </button>
      }
    >
      <DrawerHeader
        title="Вариант тохируулах"
        description="Бүтээгдэхүүний хувилбаруудыг тохируулах"
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        <VariantEditor
          groups={groups}
          onGroupsChange={onGroupsChange}
          defaultValues={defaultValues}
          variantData={variantData}
          onVariantsChange={onVariantsChange}
        />
      </div>
    </DrawerLayout>
  );
}
