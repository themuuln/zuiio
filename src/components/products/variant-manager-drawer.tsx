"use client";

import { DrawerLayout } from "@/components/ui/drawer-layout";
import {Sliders} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import {
  VariantEditor,
  type LocalVariantGroup,
} from "@/components/products/variant-editor";
import { buttonVariants } from "@/components/ui/button";
import { DrawerHeader } from "@/components/ui/drawer-header";

export { type LocalVariantGroup };

export function VariantManagerDrawer({
  groups,
  onGroupsChange,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  groups: LocalVariantGroup[];
  onGroupsChange: (groups: LocalVariantGroup[]) => void;
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
      trigger={<button type="button" className={buttonVariants({ variant: hasVariants ? "outline" : "secondary" })}><Sliders className="size-4" />{hasVariants ? `${totalOptions} сонголт` : "Вариант тохируулах"}</button>}
    >
              <DrawerHeader title="Вариант тохируулах" description="Бүтээгдэхүүний хувилбаруудыг тохируулах" />

              <div className="flex-1 overflow-y-auto min-h-0">
              <VariantEditor
                groups={groups}
                onGroupsChange={onGroupsChange}
              />
            </div>
    </DrawerLayout>
  );
}
