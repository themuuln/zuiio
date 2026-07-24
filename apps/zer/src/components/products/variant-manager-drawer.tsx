"use client";

import { Sliders } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import {
  computeCombinations,
  computeVariantSummary,
  type LocalVariantData,
  type LocalVariantGroup,
  VariantEditor,
  VariantSummaryCard,
} from "@/components/products/variant-editor";
import { buttonVariants } from "@/components/ui/button";
import { DrawerLayout } from "@/components/ui/drawer-layout";

export {
  computeCombinations,
  computeVariantSummary,
  type LocalVariantData,
  type LocalVariantGroup,
  VariantSummaryCard,
};

export function VariantManagerDrawer({
  groups,
  onGroupsChange,
  defaultValues,
  variantData,
  onVariantsChange,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  inline,
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
  /** When true, renders as an inline panel inside the parent drawer instead of a portal-based drawer. */
  inline?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const hasVariants = groups.length > 0;

  const totalOptions = useMemo(
    () => groups.reduce((sum, g) => sum + g.options.length, 0),
    [groups],
  );

  const combinationCount = useMemo(
    () => computeCombinations(groups).length,
    [groups],
  );

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={buttonVariants({
        variant: hasVariants ? "outline" : "secondary",
      })}
    >
      <Sliders className="size-4" />
      {hasVariants ? (
        <span>
          {totalOptions} сонголт
          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {combinationCount} вар.
          </span>
        </span>
      ) : (
        "Вариант тохируулах"
      )}
    </button>
  );

  const panelContent = (
    <VariantEditor
      groups={groups}
      onGroupsChange={onGroupsChange}
      defaultValues={defaultValues}
      variantData={variantData}
      onVariantsChange={onVariantsChange}
    />
  );

  // Inline mode: render as a nested drawer that stacks on top of the parent
  if (inline) {
    return (
      <>
        {trigger}
        <DrawerLayout
          open={open}
          onOpenChange={setOpen}
          panelWidth="32rem"
          nested
          title="Вариант тохируулах"
          description="Бүтээгдэхүүний хувилбаруудыг тохируулах"
        >
          {panelContent}
        </DrawerLayout>
      </>
    );
  }

  // Standalone mode: use a separate portal-based drawer
  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      panelWidth="32rem"
      nested
      trigger={trigger}
      title="Вариант тохируулах"
      description="Бүтээгдэхүүний хувилбаруудыг тохируулах"
    >
      {panelContent}
    </DrawerLayout>
  );
}
