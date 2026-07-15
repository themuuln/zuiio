"use client";

import type { MechanicComboboxProps } from "@/components/mechanic-combobox";
import { MechanicCombobox } from "@/components/mechanic-combobox";
import { PickerDrawer } from "@/components/ui/picker-drawer";

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
    <PickerDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="xl"
    >
      <MechanicCombobox
        {...comboboxProps}
        className="flex-1 flex flex-col overflow-hidden"
      />
    </PickerDrawer>
  );
}
