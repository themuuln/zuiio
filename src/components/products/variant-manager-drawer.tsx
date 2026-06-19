"use client";

import { DrawerLayout } from "@/components/ui/drawer-layout";
import { CaretLeft, Sliders } from "@phosphor-icons/react";
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
import { Drawer } from "@base-ui/react/drawer";

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
  parentTitle,
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
  /** Title of the parent drawer for breadcrumb display. */
  parentTitle?: string;
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

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      panelWidth="32rem"
      nested
      trigger={
        <button
          type="button"
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
      }
    >
      {/* Breadcrumb header */}
      <div className="mb-6 shrink-0">
        {parentTitle && (
          <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors"
            >
              <CaretLeft className="size-3" />
              {parentTitle}
            </button>
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Drawer.Title className="text-lg font-semibold tracking-tight">
              Вариант тохируулах
            </Drawer.Title>
            <Drawer.Description className="text-sm text-muted-foreground mt-0.5">
              Бүтээгдэхүүний хувилбаруудыг тохируулах
            </Drawer.Description>
          </div>
          <Drawer.Close className="flex size-8 shrink-0 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3L13 13M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Drawer.Close>
        </div>
      </div>

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
