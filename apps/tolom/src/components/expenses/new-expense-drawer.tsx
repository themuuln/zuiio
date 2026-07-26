"use client";

import { useTranslations } from "next-intl";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import { ExpenseForm } from "./expense-form";

type NewExpenseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewExpenseDrawer({ open, onOpenChange }: NewExpenseSheetProps) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("addExpense")}
      desc={t("subtitle")}
      sheetSize="2xl"
    >
      <ExpenseForm mode="full" />
    </ResponsiveFormModal>
  );
}
