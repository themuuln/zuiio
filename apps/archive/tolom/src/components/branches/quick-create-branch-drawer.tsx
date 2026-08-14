"use client";

import { useTranslations } from "next-intl";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import type { Branch } from "@/lib/types";
import { BranchForm } from "./branch-form";

interface QuickCreateBranchSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with the newly created branch after successful creation */
  onCreated?: (branch: Branch) => void;
  orgId?: string;
}

/**
 * Quick-create branch dialog.
 * Follows the exact pattern of QuickCreateCustomerDrawer (quick-create-customer-sheet.tsx).
 * Uses ResponsiveFormModal for responsive display (Sheet on desktop, Drawer on mobile).
 */
export function QuickCreateBranchDrawer({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateBranchSheetProps) {
  const t = useTranslations();

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("settings.addBranch")}
      sheetSize="md"
    >
      <BranchForm
        onSuccess={(branch) => {
          onCreated?.(branch);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveFormModal>
  );
}
