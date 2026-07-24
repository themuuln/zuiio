"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useDeleteExpense,
  useExpense,
  useExpenseCategories,
  useUpdateExpense,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";
import { cn } from "@/lib/utils";
import { ExpenseDetailEditForm } from "./_expense-detail-edit-form";
import {
  type ExpenseFormValues,
  expenseSchema,
  isOverdue,
  syncForm,
} from "./_expense-detail-utils";
import { ExpenseDetailView } from "./_expense-detail-view";

// ── Component ────────────────────────────────────────────────

interface ExpenseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string | null;
}

export function ExpenseDetailDrawer({
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
    error,
  } = useExpense(orgId, expenseId ?? undefined);
  const { data: categories } = useExpenseCategories(orgId);
  const updateExpense = useUpdateExpense(orgId);
  const deleteExpense = useDeleteExpense(orgId);

  const [editing, setEditing] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      taxAmount: "",
      expenseDate: "",
      dueDate: "",
      categoryId: "",
      vendorName: "",
      paymentMethod: "",
      referenceNumber: "",
      paid: false,
      notes: "",
    },
  });

  // Reset form when expense loads
  useEffect(() => {
    if (expense) {
      form.reset(syncForm(expense));
    }
  }, [expense, form.reset]);

  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) {
      setEditing(false);
    }
  }, [open]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        form.reset();
        setEditing(false);
      }
      onOpenChange(value);
    },
    [onOpenChange, form],
  );

  const handleSave = useCallback(async () => {
    if (!expenseId) return;

    const data = form.getValues();
    try {
      await updateExpense.mutateAsync({
        id: expenseId,
        description: data.description.trim(),
        amount: parseFloat(data.amount),
        taxAmount: data.taxAmount ? parseFloat(data.taxAmount) : undefined,
        expenseDate: data.expenseDate || undefined,
        dueDate: data.dueDate || null,
        categoryId: data.categoryId || null,
        vendorName: data.vendorName?.trim() || null,
        paymentMethod: data.paymentMethod || null,
        referenceNumber: data.referenceNumber?.trim() || null,
        paidAt: data.paid ? new Date().toISOString() : null,
        notes: data.notes?.trim() || null,
      });
      toast.dismiss();
      toast.success(t("expenseUpdated"));
      setEditing(false);
    } catch (err) {
      reportServerError("Unexpected error", err);
      toast.error(err instanceof Error ? err.message : t("failedToUpdate"));
    }
  }, [expenseId, form, updateExpense, t]);

  const handleDelete = useCallback(async () => {
    if (!expenseId) return;
    try {
      await deleteExpense.mutateAsync(expenseId);
      toast.dismiss();
      toast.success(t("expenseDeleted"));
      handleOpenChange(false);
    } catch (err) {
      reportServerError("Unexpected error", err);
      toast.error(err instanceof Error ? err.message : t("failedToDelete"));
    }
  }, [expenseId, deleteExpense, t, handleOpenChange]);

  const isLoadingData = loading || (open && !expense && !error);
  const notFound = open && !loading && !expense && !error;
  const overdue = expense ? isOverdue(expense) : false;

  return (
    <DetailDrawer open={open} onOpenChange={handleOpenChange}>
      <DetailDrawer.Header>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            {isLoadingData ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <Pencil className="size-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <DetailDrawer.Title className="truncate">
              {isLoadingData
                ? commonT("loading")
                : expense
                  ? expense.description
                  : t("details")}
            </DetailDrawer.Title>
            {expense && (
              <div className="mt-0.5 flex items-center gap-2">
                <Badge
                  variant={expense.paid_at ? "outline" : "secondary"}
                  className={cn(
                    "text-xs",
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
                {expense.created_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(expense.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
          {expense && !editing && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  form.reset(syncForm(expense));
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
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        {/* Loading */}
        {isLoadingData && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Typography.Muted className="text-sm">
              {error instanceof Error ? error.message : String(error)}
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

        {/* Not found */}
        {notFound && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Typography.Muted className="text-sm">
              {t("notFound")}
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
          <ExpenseDetailEditForm
            form={form}
            categories={categories}
            handleSave={handleSave}
          />
        )}

        {/* Read-only view */}
        {!editing && !isLoadingData && expense && (
          <ExpenseDetailView expense={expense} />
        )}
      </DetailDrawer.Body>

      {/* Footer — edit mode only */}
      {editing && (
        <DetailDrawer.Footer>
          <DetailDrawer.FooterActions>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (expense) form.reset(syncForm(expense));
                setEditing(false);
              }}
            >
              {commonT("cancel")}
            </Button>
            <Button
              type="submit"
              form="expense-detail-form"
              className="flex-1 gap-2"
              size="lg"
              disabled={updateExpense.isPending}
            >
              {updateExpense.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Pencil className="size-4" />
              )}
              {updateExpense.isPending ? commonT("saving") : commonT("save")}
            </Button>
          </DetailDrawer.FooterActions>
        </DetailDrawer.Footer>
      )}
    </DetailDrawer>
  );
}
