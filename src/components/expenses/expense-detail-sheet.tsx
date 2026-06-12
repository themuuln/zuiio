"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
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
import { DetailSheet } from "@/components/ui/detail-sheet";
import { DetailSheetHeader } from "@/components/ui/detail-sheet-header";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";

import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useDeleteExpense,
  useExpense,
  useExpenseCategories,
  useUpdateExpense,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { cn } from "@/lib/utils";
import { formatMNT } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────

const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "card",
  "manual",
] as const;

// ── Schema ───────────────────────────────────────────────────

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  taxAmount: z.string().optional(),
  expenseDate: z.string().optional(),
  dueDate: z.string().optional(),
  categoryId: z.string().optional(),
  vendorName: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  paid: z.boolean(),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

function syncForm(expense: NonNullable<ReturnType<typeof useExpense>["data"]>) {
  return {
    description: expense.description,
    amount: String(expense.amount),
    taxAmount: expense.tax_amount ? String(expense.tax_amount) : "",
    expenseDate: expense.expense_date ?? "",
    dueDate: expense.due_date ?? "",
    categoryId: expense.category_id ?? "",
    vendorName: expense.vendor_name ?? "",
    paymentMethod: expense.payment_method ?? "",
    referenceNumber: expense.reference_number ?? "",
    paid: !!expense.paid_at,
    notes: expense.notes ?? "",
  };
}

function isOverdue(expense: NonNullable<ReturnType<typeof useExpense>["data"]>) {
  return !!(
    !expense.paid_at &&
    expense.due_date &&
    new Date(expense.due_date) < new Date()
  );
}

// ── Component ────────────────────────────────────────────────

interface ExpenseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string | null;
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

  const { data: expense, isLoading: loading, error } = useExpense(
    orgId,
    expenseId ?? undefined,
  );
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

  const paid = form.watch("paid");

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
      toast.error(err instanceof Error ? err.message : t("failedToDelete"));
    }
  }, [expenseId, deleteExpense, t, handleOpenChange]);

  const isLoadingData = loading || (open && !expense && !error);
  const notFound = open && !loading && !expense && !error;
  const overdue = expense ? isOverdue(expense) : false;

  return (
    <DetailSheet open={open} onOpenChange={handleOpenChange} size="2xl">
      <DetailSheet.Header>
        <DetailSheetHeader
          icon={Pencil}
          iconLoading={isLoadingData}
          title={
            <DetailSheet.Title className="truncate">
              {isLoadingData
                ? commonT("loading")
                : expense
                  ? expense.description
                  : t("details")}
            </DetailSheet.Title>
          }
          subtitle={
            expense ? (
              <>
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
              </>
            ) : undefined
          }
          actions={
            expense && !editing ? (
              <>
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
              </>
            ) : undefined
          }
        />
      </DetailSheet.Header>

      <DetailSheet.Body>
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
          <form
            id="expense-detail-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <FieldGroup>
              {/* Description — required */}
              <Field data-invalid={!!form.formState.errors.description}>
                <FieldLabel>
                  {t("description")} <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="eds-description"
                    placeholder={t("descriptionPlaceholder")}
                    aria-invalid={!!form.formState.errors.description}
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <FieldError>
                      {form.formState.errors.description.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount — required */}
                <Field data-invalid={!!form.formState.errors.amount}>
                  <FieldLabel>
                    {t("amount")} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="eds-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="\u20AE"
                      aria-invalid={!!form.formState.errors.amount}
                      {...form.register("amount")}
                    />
                    {form.formState.errors.amount && (
                      <FieldError>
                        {form.formState.errors.amount.message}
                      </FieldError>
                    )}
                  </FieldContent>
                </Field>

                {/* Tax Amount — optional */}
                <Field>
                  <FieldLabel>{t("taxAmount")}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="eds-taxAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="\u20AE"
                      {...form.register("taxAmount")}
                    />
                  </FieldContent>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Expense Date — optional */}
                <Field>
                  <FieldLabel>{t("expenseDate")}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="eds-date"
                      type="date"
                      {...form.register("expenseDate")}
                    />
                  </FieldContent>
                </Field>

                {/* Due Date — optional */}
                <Field>
                  <FieldLabel>{t("due")}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="eds-due-date"
                      type="date"
                      {...form.register("dueDate")}
                    />
                  </FieldContent>
                </Field>

                {/* Category — optional */}
                <Field>
                  <FieldLabel>{t("category")}</FieldLabel>
                  <FieldContent>
                    <Select
                      value={form.watch("categoryId") || ""}
                      onValueChange={(val) =>
                        form.setValue("categoryId", val ?? "")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={commonT("all")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Vendor — optional */}
                <Field>
                  <FieldLabel>{t("vendor")}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="eds-vendor"
                      placeholder={t("vendorPlaceholder")}
                      {...form.register("vendorName")}
                    />
                  </FieldContent>
                </Field>

                {/* Payment Method — optional */}
                <Field>
                  <FieldLabel>{t("paymentMethod")}</FieldLabel>
                  <FieldContent>
                    <Select
                      value={form.watch("paymentMethod") || ""}
                      onValueChange={(val) =>
                        form.setValue("paymentMethod", val ?? "")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={commonT("all")} />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {t(method)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </div>

              {/* Reference Number — optional */}
              <Field>
                <FieldLabel>{t("referenceNumber")}</FieldLabel>
                <FieldContent>
                  <Input
                    id="eds-reference"
                    placeholder={t("referenceNumberPlaceholder")}
                    {...form.register("referenceNumber")}
                  />
                </FieldContent>
              </Field>

              {/* Paid checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="eds-paid"
                  checked={paid}
                  onCheckedChange={(checked) =>
                    form.setValue("paid", checked === true)
                  }
                />
                <label
                  htmlFor="eds-paid"
                  className="cursor-pointer text-sm font-medium"
                >
                  {t("paid")}
                </label>
              </div>

              {/* Notes — optional */}
              <Field>
                <FieldLabel>{t("notes")}</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="eds-notes"
                    rows={3}
                    placeholder={t("notesPlaceholder")}
                    {...form.register("notes")}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </form>
        )}

        {/* Read-only view */}
        {!editing && !isLoadingData && expense && (
          <div className="flex flex-col gap-3">
            {/* Amount */}
            <section className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
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
                    <span className="text-muted-foreground">
                      {t("expenseDate")}
                    </span>
                    <span>
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {expense.due_date && (
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{t("due")}</span>
                    <span
                      className={cn(overdue && "font-medium text-destructive")}
                    >
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
        )}
      </DetailSheet.Body>

      {/* Footer — edit mode only */}
      {editing && (
        <DetailSheet.Footer>
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
            disabled={updateExpense.isPending}
          >
            {updateExpense.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Pencil className="size-4" />
            )}
            {updateExpense.isPending ? commonT("saving") : commonT("save")}
          </Button>
        </DetailSheet.Footer>
      )}
    </DetailSheet>
  );
}
