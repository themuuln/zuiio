"use client";

import type { MechanicComboboxProps } from "@/components/mechanic-combobox";
import { MechanicCombobox } from "@/components/mechanic-combobox";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

// ─── Types ─────────────────────────────────────────────────────

export interface MechanicPickerDrawerProps extends MechanicComboboxProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Called when the drawer should open or close */
  onOpenChange: (open: boolean) => void;
  /** Drawer title */
  title?: string;
}

// ─── Main Component ────────────────────────────────────────────

export function MechanicPickerDrawer({
  open,
  onOpenChange,
  title = "Mechanics",
  ...comboboxProps
}: MechanicPickerDrawerProps) {
  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerHeader className="border-b border-border/50 px-4 py-3 space-y-0">
        <DrawerTitle className="text-sm">{title}</DrawerTitle>
      </DrawerHeader>

      <MechanicCombobox
        {...comboboxProps}
        className="flex-1 flex flex-col overflow-hidden"
      />
    </DetailDrawer>
  );
}
