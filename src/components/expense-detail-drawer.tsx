"use client";

import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  Receipt,
  Tag,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from "@/lib/i18n/navigation";
import type { ExpenseWithCategory } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

interface ExpenseDetailDrawerProps {
  expenseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center size-6 shrink-0 rounded-md bg-muted/60">
        <Icon className="size-3.5 text-muted-foreground/70" />
      </div>
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

export function ExpenseDetailDrawer({
  expenseId,
  open,
  onOpenChange,
}: ExpenseDetailDrawerProps) {
  const t = useTranslations("expenses");
  const [expense, setExpense] = useState<ExpenseWithCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orgIdRef = useRef<string | null>(null);

  const fetchExpense = useCallback(async () => {
    const orgId = orgIdRef.current;
    if (!expenseId || !orgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/expenses/${expenseId}`,
      );
      const json = await res.json();
      if (json.error) {
        setError(json.error.message ?? "Failed to load expense");
      } else {
        setExpense(json.data);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    if (!open || orgIdRef.current) return;
    const abort = new AbortController();
    fetch("/api/profile", { signal: abort.signal })
      .then((r) => r.json())
      .then((d) => {
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) {
          orgIdRef.current = id;
          void fetchExpense();
        }
      })
      .catch(() => {});
    return () => abort.abort();
  }, [open]);

  const fetchExpenseRef = useRef(fetchExpense);
  fetchExpenseRef.current = fetchExpense;

  useEffect(() => {
    const orgId = orgIdRef.current;
    if (open && expenseId && orgId) void fetchExpenseRef.current();
  }, [open, expenseId]);

  useEffect(() => {
    if (!open) {
      setExpense(null);
      setError(null);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          {expense && (
            <SheetDescription className="sr-only">
              Expense details for {expense.description}
            </SheetDescription>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                {loading ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <Receipt className="size-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base">
                  {loading ? (
                    <span className="text-muted-foreground/60">Loading…</span>
                  ) : expense ? (
                    <span className="truncate block">
                      {expense.description}
                    </span>
                  ) : (
                    t("details")
                  )}
                </SheetTitle>
                {expense && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={expense.paid_at ? "outline" : "secondary"}>
                      {expense.paid_at ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <Typography.Muted className="text-sm text-muted-foreground">{error}</Typography.Muted>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchExpense()}
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && expense && (
          <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-3">
            {/* Amount */}
            <section className="rounded-lg border border-border/60 bg-card/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Amount
                </span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatMNT(expense.amount)}
                </span>
              </div>
              {expense.tax_amount != null && expense.tax_amount > 0 && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    Tax included
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatMNT(expense.tax_amount)}
                  </span>
                </div>
              )}
            </section>

            {/* Details */}
            <section className="rounded-lg border border-border/60 bg-card/40 p-3 flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Details
              </span>
              <div className="flex flex-col gap-2.5">
                <InfoRow
                  icon={Calendar}
                  label="Date"
                  value={
                    expense.expense_date
                      ? new Date(expense.expense_date).toLocaleDateString()
                      : null
                  }
                />
                {expense.category && (
                  <InfoRow
                    icon={Tag}
                    label="Category"
                    value={expense.category.name}
                  />
                )}
                <InfoRow
                  icon={User}
                  label="Vendor"
                  value={expense.vendor_name}
                />
                <InfoRow
                  icon={CreditCard}
                  label="Payment Method"
                  value={
                    expense.payment_method ? t(expense.payment_method) : null
                  }
                />
                <InfoRow
                  icon={FileText}
                  label="Reference"
                  value={expense.reference_number}
                />
              </div>
            </section>

            {/* Notes */}
            {expense.notes && (
              <section className="rounded-lg border border-border/60 bg-card/40 p-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Notes
                </span>
                <Typography.Text className="mt-1.5 text-sm whitespace-pre-wrap">
                  {expense.notes}
                </Typography.Text>
              </section>
            )}
          </div>
        )}

        {expense && !loading && (
          <div className="shrink-0 border-t border-border p-3">
            <Button
              className="w-full h-9 text-sm"
              render={<Link href={`/dashboard/expenses/${expense.id}`} />}
            >
              <ArrowLeft className="size-4 rotate-180" />
              View full details
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
