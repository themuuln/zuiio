"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { cn, formatMNT } from "@/lib/utils";
import { isOverdue } from "./_expense-detail-utils";

interface ExpenseDetailViewProps {
  expense: {
    amount: number;
    tax_amount?: number | null;
    category?: { name: string } | null;
    paid_at?: string | null;
    expense_date?: string | null;
    due_date?: string | null;
    vendor_name?: string | null;
    payment_method?: string | null;
    reference_number?: string | null;
    notes?: string | null;
  };
}

export function ExpenseDetailView({ expense }: ExpenseDetailViewProps) {
  const t = useTranslations("expenses") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const overdue = isOverdue(expense);

  return (
    <div className="flex flex-col gap-3">
      {/* Amount */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("amount")}
            </span>
            <div className="text-2xl font-semibold tabular-nums">
              {formatMNT(expense.amount)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {expense.category && (
              <Badge variant="outline" className="font-normal">
                {expense.category.name}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                expense.paid_at &&
                  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
                overdue &&
                  "border-destructive/25 bg-destructive/5 text-destructive",
              )}
            >
              {expense.paid_at
                ? t("paid")
                : overdue
                  ? t("overdue")
                  : t("unpaid")}
            </Badge>
          </div>
        </div>
        {expense.tax_amount != null && expense.tax_amount > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/25 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {t("taxIncluded")}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatMNT(expense.tax_amount)}
            </span>
          </div>
        )}
      </section>

      {/* Details */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("detailsSection")}
        </span>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {expense.expense_date && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("expenseDate")}</span>
              <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
            </div>
          )}
          {expense.due_date && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("due")}</span>
              <span className={cn(overdue && "font-medium text-destructive")}>
                {new Date(expense.due_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {expense.vendor_name && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("vendor")}</span>
              <span className="truncate">{expense.vendor_name}</span>
            </div>
          )}
          {expense.payment_method && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {t("paymentMethod")}
              </span>
              <span className="capitalize">{t(expense.payment_method)}</span>
            </div>
          )}
          {expense.reference_number && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2 text-sm sm:col-span-2">
              <span className="text-muted-foreground">
                {t("referenceNumber")}
              </span>
              <span className="truncate">{expense.reference_number}</span>
            </div>
          )}
        </div>
      </section>

      {/* Notes */}
      {expense.notes && (
        <section className="rounded-xl border border-border/60 bg-card/40 p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("notes")}
          </span>
          <Typography.Text className="mt-2 text-sm whitespace-pre-wrap leading-6">
            {expense.notes}
          </Typography.Text>
        </section>
      )}
    </div>
  );
}
