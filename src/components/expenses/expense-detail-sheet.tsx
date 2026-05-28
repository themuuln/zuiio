"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePageHeader } from "@/hooks/use-page-header";
import {
  useDeleteExpense,
  useExpense,
  useExpenseCategories,
  useUpdateExpense,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { ExpenseWithCategory } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

interface ExpenseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string | null;
}

interface ExpenseFormState {
  description: string;
  amount: string;
  expenseDate: string;
  categoryId: string;
  vendorName: string;
  taxAmount: string;
  paymentMethod: string;
  referenceNumber: string;
  paid: boolean;
  notes: string;
}

const emptyForm: ExpenseFormState = {
  description: "",
  amount: "",
  expenseDate: "",
  categoryId: "",
  vendorName: "",
  taxAmount: "0",
  paymentMethod: "cash",
  referenceNumber: "",
  paid: false,
  notes: "",
};

const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "manual"] as const;

function syncForm(expense: ExpenseWithCategory): ExpenseFormState {
  return {
    description: expense.description,
    amount: String(expense.amount),
    expenseDate:
      expense.expense_date?.split("T")[0] ??
      new Date().toISOString().split("T")[0],
    categoryId: expense.category_id ?? "",
    vendorName: expense.vendor_name ?? "",
    taxAmount: String(expense.tax_amount ?? 0),
    paymentMethod: expense.payment_method ?? "",
    referenceNumber: expense.reference_number ?? "",
    paid: !!expense.paid_at,
    notes: expense.notes ?? "",
  };
}

export function ExpenseDetailSheet({
  open,
  onOpenChange,
  expenseId,
}: ExpenseDetailSheetProps) {
  const t = useTranslations("expenses");
  const commonT = useTranslations("common");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const {
    data: expense,
    isLoading: loading,
    error: queryError,
  } = useExpense(orgId, expenseId ?? "");
  const { data: categories } = useExpenseCategories(orgId);
  const updateExpense = useUpdateExpense(orgId);
  const deleteExpense = useDeleteExpense(orgId);
  const { setDetailExpenseId } = usePageHeader();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);

  const error = queryError ? queryError.message : null;

  // Populate form when expense loads
  useEffect(() => {
    if (expense && open) {
      setForm(syncForm(expense));
    }
  }, [expense, open]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setEditing(false);
        setForm(emptyForm);
      }
      onOpenChange(value);
    },
    [onOpenChange],
  );

  const handleSave = () => {
    if (!expenseId) return;
    const amount = parseFloat(form.amount);
    const taxAmount = form.taxAmount ? parseFloat(form.taxAmount) : 0;

    updateExpense.mutate(
      {
        id: expenseId,
        description: form.description,
        amount: Number.isNaN(amount) ? 0 : amount,
        taxAmount: Number.isNaN(taxAmount) ? 0 : taxAmount,
        expenseDate: form.expenseDate || undefined,
        categoryId: form.categoryId || null,
        vendorName: form.vendorName || null,
        paymentMethod: form.paymentMethod || null,
        referenceNumber: form.referenceNumber || null,
        paidAt: form.paid ? new Date().toISOString() : null,
        notes: form.notes || null,
      },
      {
        onSuccess: () => setEditing(false),
      },
    );
  };

  const handleDelete = () => {
    if (!expenseId) return;
    deleteExpense.mutate(expenseId, {
      onSuccess: () => handleOpenChange(false),
    });
  };

  const isLoadingData = loading || (open && !expense && !error);
  const notFound = open && !loading && !expense && !error;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              {isLoadingData ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <Pencil className="size-5 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base truncate">
                {isLoadingData
                  ? "Loading…"
                  : expense
                    ? expense.description
                    : t("details")}
              </SheetTitle>
              {expense && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant={expense.paid_at ? "outline" : "secondary"}
                    className="text-xs"
                  >
                    {expense.paid_at ? t("paid") : t("unpaid")}
                  </Badge>
                  {expense.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(expense.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* Actions in header */}
            {expense && !editing && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setForm(syncForm(expense));
                    setEditing(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive"
                      />
                    }
                  >
                    <Trash2 className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteConfirm")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{commonT("cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        {commonT("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Loading */}
        {isLoadingData && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <Typography.Muted className="text-sm">{error}</Typography.Muted>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              {commonT("cancel")}
            </Button>
          </div>
        )}

        {/* Not found */}
        {notFound && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <Typography.Muted className="text-sm">
              {t("notFound") ?? "Expense not found"}
            </Typography.Muted>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              {commonT("cancel")}
            </Button>
          </div>
        )}

        {/* Edit mode */}
        {editing && expense && (
          <form
            id="expense-detail-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="p-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="eds-description">
                    {t("description")}{" "}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="eds-description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder={t("descriptionPlaceholder")}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="eds-amount">
                      {t("amount")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="eds-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, amount: e.target.value }))
                      }
                      placeholder="₮"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="eds-taxAmount">
                      {t("taxAmount")}
                    </FieldLabel>
                    <Input
                      id="eds-taxAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.taxAmount}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, taxAmount: e.target.value }))
                      }
                      placeholder="₮"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="eds-date">
                      {t("expenseDate")}
                    </FieldLabel>
                    <Input
                      id="eds-date"
                      type="date"
                      value={form.expenseDate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, expenseDate: e.target.value }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="eds-category">
                      {t("category")}
                    </FieldLabel>
                    <select
                      id="eds-category"
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, categoryId: e.target.value }))
                      }
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">{commonT("all")}</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="eds-vendor">{t("vendor")}</FieldLabel>
                    <Input
                      id="eds-vendor"
                      value={form.vendorName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, vendorName: e.target.value }))
                      }
                      placeholder={t("vendorPlaceholder")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="eds-payment">
                      {t("paymentMethod")}
                    </FieldLabel>
                    <select
                      id="eds-payment"
                      value={form.paymentMethod}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          paymentMethod: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">{commonT("all")}</option>
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {t(method)}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="eds-reference">
                    {t("referenceNumber")}
                  </FieldLabel>
                  <Input
                    id="eds-reference"
                    value={form.referenceNumber}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        referenceNumber: e.target.value,
                      }))
                    }
                    placeholder={t("referenceNumberPlaceholder")}
                  />
                </Field>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="eds-paid"
                    checked={form.paid}
                    onCheckedChange={(checked) =>
                      setForm((p) => ({ ...p, paid: checked === true }))
                    }
                  />
                  <label
                    htmlFor="eds-paid"
                    className="cursor-pointer text-sm font-medium"
                  >
                    {t("paid")}
                  </label>
                </div>

                <Field>
                  <FieldLabel htmlFor="eds-notes">{t("notes")}</FieldLabel>
                  <textarea
                    id="eds-notes"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder={t("notesPlaceholder")}
                  />
                </Field>
              </FieldGroup>
            </div>
          </form>
        )}

        {/* Read-only view */}
        {!editing && !isLoadingData && expense && (
          <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-3">
            {/* Amount */}
            <section className="rounded-lg border border-border/60 bg-card/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("amount")}
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
              {expense.expense_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("expenseDate")}
                  </span>
                  <span>
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {expense.category && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("category")}</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: expense.category.color }}
                    />
                    {expense.category.name}
                  </span>
                </div>
              )}
              {expense.vendor_name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("vendor")}</span>
                  <span>{expense.vendor_name}</span>
                </div>
              )}
              {expense.payment_method && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("paymentMethod")}
                  </span>
                  <span className="capitalize">
                    {t(expense.payment_method)}
                  </span>
                </div>
              )}
              {expense.reference_number && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("referenceNumber")}
                  </span>
                  <span>{expense.reference_number}</span>
                </div>
              )}
            </section>

            {/* Notes */}
            {expense.notes && (
              <section className="rounded-lg border border-border/60 bg-card/40 p-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("notes")}
                </span>
                <Typography.Text className="mt-1.5 text-sm whitespace-pre-wrap">
                  {expense.notes}
                </Typography.Text>
              </section>
            )}
          </div>
        )}

        {/* Footer */}
        {editing && (
          <div className="shrink-0 border-t border-border p-4">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (expense) setForm(syncForm(expense));
                  setEditing(false);
                }}
              >
                {commonT("cancel")}
              </Button>
              <Button
                type="submit"
                form="expense-detail-form"
                className="flex-1 gap-2"
                disabled={updateExpense.isPending}
              >
                {updateExpense.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Pencil className="size-4" />
                )}
                {updateExpense.isPending ? commonT("saving") : commonT("save")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
