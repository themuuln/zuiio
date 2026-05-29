"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { DetailSheetHeader } from "@/components/ui/detail-sheet-header";

import { usePageHeader } from "@/hooks/use-page-header";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useDeleteExpense,
  useExpense,
  useExpenseCategories,
  useUpdateExpense,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { ExpenseWithCategory } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

// ── Schema ───────────────────────────────────────────────────

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => {
      const n = Number(val);
      return !Number.isNaN(n) && n > 0;
    }, "Enter a valid amount"),
  expenseDate: z.string().optional(),
  categoryId: z.string().optional(),
  vendorName: z.string().optional(),
  taxAmount: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  paid: z.boolean(),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const emptyForm: ExpenseFormValues = {
  description: "",
  amount: "",
  expenseDate: "",
  categoryId: "",
  vendorName: "",
  taxAmount: "0",
  paymentMethod: "",
  referenceNumber: "",
  paid: false,
  notes: "",
};

const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "manual"] as const;

function syncForm(expense: ExpenseWithCategory): ExpenseFormValues {
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

  const {
    data: expense,
    isLoading: loading,
    error: queryError,
  } = useExpense(orgId, expenseId ?? "");
  const { data: categories } = useExpenseCategories(orgId);
  const updateExpense = useUpdateExpense(orgId);
  const deleteExpense = useDeleteExpense(orgId);
  void usePageHeader();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: emptyForm,
  });

  const [editing, setEditing] = useState(false);

  const error = queryError ? queryError.message : null;
  const paid = form.watch("paid");

  // Populate form when expense loads
  useEffect(() => {
    if (expense && open) {
      form.reset(syncForm(expense));
    }
  }, [expense, open, form.reset]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setEditing(false);
        form.reset(emptyForm);
      }
      onOpenChange(value);
    },
    [onOpenChange, form],
  );

  const handleSave = form.handleSubmit(async (data) => {
    if (!expenseId) return;
    const amount = parseFloat(data.amount);
    const taxAmount = data.taxAmount ? parseFloat(data.taxAmount) : 0;

    updateExpense.mutate(
      {
        id: expenseId,
        description: data.description,
        amount: Number.isNaN(amount) ? 0 : amount,
        taxAmount: Number.isNaN(taxAmount) ? 0 : taxAmount,
        expenseDate: data.expenseDate || undefined,
        categoryId: data.categoryId || null,
        vendorName: data.vendorName || null,
        paymentMethod: data.paymentMethod || null,
        referenceNumber: data.referenceNumber || null,
        paidAt: data.paid ? new Date().toISOString() : null,
        notes: data.notes || null,
      },
      {
        onSuccess: () => setEditing(false),
      },
    );
  });

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
          <DetailSheetHeader
            icon={Pencil}
            iconLoading={isLoadingData}
            title={
              <SheetTitle className="text-base truncate">
                {isLoadingData
                  ? "Loading…"
                  : expense
                    ? expense.description
                    : t("details")}
              </SheetTitle>
            }
            subtitle={
              expense ? (
                <>
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
                        <AlertDialogTitle>
                          {t("deleteConfirm")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("deleteConfirm")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {commonT("cancel")}
                        </AlertDialogCancel>
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
                {/* Description — required */}
                <Field data-invalid={!!form.formState.errors.description}>
                  <FieldLabel>
                    {t("description")}{" "}
                    <span className="text-destructive">*</span>
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
                        placeholder="₮"
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
                        placeholder="₮"
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
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
