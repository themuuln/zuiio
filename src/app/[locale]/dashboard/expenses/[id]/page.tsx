"use client";

import { ArrowLeft, Pencil, Save, Trash2, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  useDeleteExpense,
  useExpense,
  useExpenseCategories,
  useUpdateExpense,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { ExpenseWithCategory } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

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

const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "manual",
] as const;

export default function ExpenseDetailPage() {
  const t = useTranslations("expenses");
  const commonT = useTranslations("common");
  const params = useParams();
  const { push } = useRouter();
  const expenseId = params.id as string;

  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const {
    data: expense,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useExpense(orgId, expenseId);

  const { data: categories } = useExpenseCategories(orgId ?? undefined);
  const updateExpense = useUpdateExpense(orgId ?? undefined);
  const deleteExpense = useDeleteExpense(orgId ?? undefined);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);

  const error = queryError ? queryError.message : null;

  const syncForm = useCallback((nextExpense: ExpenseWithCategory) => {
    setForm({
      description: nextExpense.description,
      amount: String(nextExpense.amount),
      expenseDate:
        nextExpense.expense_date?.split("T")[0] ??
        new Date().toISOString().split("T")[0],
      categoryId: nextExpense.category_id ?? "",
      vendorName: nextExpense.vendor_name ?? "",
      taxAmount: String(nextExpense.tax_amount ?? 0),
      paymentMethod: nextExpense.payment_method ?? "",
      referenceNumber: nextExpense.reference_number ?? "",
      paid: !!nextExpense.paid_at,
      notes: nextExpense.notes ?? "",
    });
  }, []);

  const handleSave = () => {
    if (!orgId || !expenseId) return;

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
    if (!orgId || !expenseId) return;
    deleteExpense.mutate(expenseId, {
      onSuccess: () => push("/dashboard/expenses"),
    });
  };

  if (orgQuery.isLoading || loading) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[34rem] w-full" />
      </div>
    );
  }

  if (error && !expense) {
    return (
      <div className="flex flex-col gap-6">
        <Button
          render={<Link href="/dashboard/expenses" />}
          variant="ghost"
          className="w-fit"
        >
          <ArrowLeft className="size-4" />
          {commonT("back")}
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => refetch()} variant="outline">
              {commonT("retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!expense) {
    return null;
  }

  const expenseTitle = expense.description || t("details");
  const totalAmount = expense.amount + (expense.tax_amount ?? 0);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          render={<Link href="/dashboard/expenses" />}
          variant="ghost"
          size="icon"
          aria-label={commonT("back")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{expenseTitle}</h1>
          {expense.created_at && (
            <p className="text-sm text-muted-foreground">
              {t("created")} {new Date(expense.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
        {!editing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                syncForm(expense);
                setEditing(true);
              }}
            >
              <Pencil className="size-4" />
              {commonT("edit")}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                  />
                }
              >
                <Trash2 className="size-4" />
                {commonT("delete")}
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
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={updateExpense.isPending}>
              <Save className="size-4" />
              {updateExpense.isPending ? commonT("saving") : commonT("save")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                syncForm(expense);
                setEditing(false);
              }}
            >
              <X className="size-4" />
              {commonT("cancel")}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("editExpense")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label
                  htmlFor="edit-description"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("description")} *
                </Label>
                <Input
                  id="edit-description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder={t("descriptionPlaceholder")}
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="edit-amount"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("amount")} *
                </Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="h-11"
                  placeholder="₮"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="edit-expenseDate"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("expenseDate")}
                </Label>
                <Input
                  id="edit-expenseDate"
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      expenseDate: e.target.value,
                    }))
                  }
                  className="h-11"
                />
              </div>

              <div>
                <Label
                  htmlFor="edit-category"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("category")}
                </Label>
                <select
                  id="edit-category"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label={t("category")}
                >
                  <option value="">{commonT("all")}</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label
                  htmlFor="edit-vendorName"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("vendor")}
                </Label>
                <Input
                  id="edit-vendorName"
                  value={form.vendorName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      vendorName: e.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder={t("vendorPlaceholder")}
                />
              </div>

              <div>
                <Label
                  htmlFor="edit-taxAmount"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("taxAmount")}
                </Label>
                <Input
                  id="edit-taxAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.taxAmount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, taxAmount: e.target.value }))
                  }
                  className="h-11"
                  placeholder="₮"
                />
              </div>

              <div>
                <Label
                  htmlFor="edit-paymentMethod"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("paymentMethod")}
                </Label>
                <select
                  id="edit-paymentMethod"
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label={t("paymentMethod")}
                >
                  <option value="">{commonT("all")}</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {t(method)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label
                  htmlFor="edit-referenceNumber"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("referenceNumber")}
                </Label>
                <Input
                  id="edit-referenceNumber"
                  value={form.referenceNumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      referenceNumber: e.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder={t("referenceNumberPlaceholder")}
                />
              </div>

              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="edit-paid"
                  checked={form.paid}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      paid: checked === true,
                    }))
                  }
                />
                <Label
                  htmlFor="edit-paid"
                  className="cursor-pointer text-sm font-medium"
                >
                  {t("paid")}
                </Label>
              </div>

              <div className="sm:col-span-2">
                <Label
                  htmlFor="edit-notes"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("notes")}
                </Label>
                <textarea
                  id="edit-notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder={t("notesPlaceholder")}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("description")}
                  </p>
                  <p className="text-sm font-medium">{expense.description}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("amount")}
                  </p>
                  <p className="text-sm font-medium">
                    {formatMNT(expense.amount)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("taxAmount")}
                  </p>
                  <p className="text-sm font-medium">
                    {formatMNT(expense.tax_amount ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 sm:col-span-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {commonT("total")}
                  </p>
                  <p className="text-lg font-semibold">{formatMNT(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("category")}</CardTitle>
              </CardHeader>
              <CardContent>
                {expense.category ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ backgroundColor: expense.category.color }}
                    />
                    <span className="text-sm font-medium">
                      {expense.category.name}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">–</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("vendorInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("vendor")}
                  </p>
                  <p className="text-sm font-medium">
                    {expense.vendor_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("referenceNumber")}
                  </p>
                  <p className="text-sm font-medium">
                    {expense.reference_number || "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("paymentDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      {t("paymentMethod")}
                    </p>
                    <p className="text-sm font-medium capitalize">
                      {expense.payment_method ? t(expense.payment_method) : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      {t("expenseDate")}
                    </p>
                    <p className="text-sm font-medium">
                      {expense.expense_date
                        ? new Date(expense.expense_date).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      {commonT("status")}
                    </p>
                    <Badge
                      variant="default"
                      className={
                        expense.paid_at
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-100"
                      }
                    >
                      {expense.paid_at ? t("paid") : t("unpaid")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {expense.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{expense.notes}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
