"use client";

import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  useCreateExpense,
  useExpenseCategories,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";

interface ExpenseFormState {
  description: string;
  amount: string;
  expenseDate: string;
  dueDate: string;
  categoryId: string;
  vendorName: string;
  taxAmount: string;
  paymentMethod: string;
  referenceNumber: string;
  paid: boolean;
  notes: string;
}

const initialForm: ExpenseFormState = {
  description: "",
  amount: "",
  expenseDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  categoryId: "",
  vendorName: "",
  taxAmount: "0",
  paymentMethod: "cash",
  referenceNumber: "",
  paid: false,
  notes: "",
};

const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "manual"] as const;

export default function NewExpensePage() {
  const { push } = useRouter();
  const t = useTranslations("expenses");
  const commonT = useTranslations("common");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;
  const { data: categories } = useExpenseCategories(orgId ?? undefined);
  const createExpense = useCreateExpense(orgId ?? undefined);
  const [form, setForm] = useState<ExpenseFormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orgId) {
      toast.error(t("common.somethingWentWrong"));
      return;
    }

    const errors: Record<string, string> = {};
    if (!form.description.trim()) errors.description = t("common.required");
    const amount = parseFloat(form.amount);
    if (!form.amount.trim()) errors.amount = t("common.required");
    else if (Number.isNaN(amount) || amount <= 0)
      errors.amount = t("expenses.invalidAmount");
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const taxAmount = form.taxAmount ? parseFloat(form.taxAmount) : 0;

    createExpense.mutate(
      {
        description: form.description,
        amount,
        taxAmount: Number.isNaN(taxAmount) ? 0 : taxAmount,
        expenseDate: form.expenseDate || undefined,
        categoryId: form.categoryId || undefined,
        vendorName: form.vendorName || undefined,
        paymentMethod: form.paymentMethod || undefined,
        referenceNumber: form.referenceNumber || undefined,
        dueDate: form.dueDate || null,
        paidAt: form.paid ? new Date().toISOString() : null,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          push("/dashboard/expenses");
        },
      },
    );
  };

  if (orgQuery.isLoading) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (orgQuery.error) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href="/dashboard/expenses" />}
            variant="ghost"
            size="icon-xs"
            aria-label={commonT("back")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <Typography.H1 className="text-2xl font-semibold tracking-tight">
              {t("addExpense")}
            </Typography.H1>
            <Typography.Muted className="text-sm text-muted-foreground">
              {t("subtitle")}
            </Typography.Muted>
          </div>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <Typography.Text className="text-sm text-destructive">
              {orgQuery.error.message}
            </Typography.Text>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/dashboard/expenses" />}
          variant="ghost"
          size="icon-xs"
          aria-label={commonT("back")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("addExpense")}
          </Typography.H1>
          <Typography.Muted className="text-sm text-muted-foreground">
            {t("subtitle")}
          </Typography.Muted>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("details")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("description")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={`h-11 ${fieldErrors.description ? "border-destructive" : ""}`}
                  placeholder={t("descriptionPlaceholder")}
                  required
                  aria-invalid={!!fieldErrors.description}
                />
                {fieldErrors.description && (
                  <Typography.Text className="text-xs text-destructive mt-1">
                    {fieldErrors.description}
                  </Typography.Text>
                )}
              </div>

              <div>
                <Label
                  htmlFor="amount"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("amount")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className={`h-11 ${fieldErrors.amount ? "border-destructive" : ""}`}
                  placeholder="₮"
                  required
                  aria-invalid={!!fieldErrors.amount}
                />
                {fieldErrors.amount && (
                  <Typography.Text className="text-xs text-destructive mt-1">
                    {fieldErrors.amount}
                  </Typography.Text>
                )}
              </div>

              <div>
                <Label
                  htmlFor="expenseDate"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("expenseDate")}
                </Label>
                <Input
                  id="expenseDate"
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
                  htmlFor="dueDate"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("expenses.due")}
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                  className="h-11"
                />
              </div>

              <div>
                <Label
                  htmlFor="category"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("category")}
                </Label>
                <Select
                  id="category"
                  value={form.categoryId || null}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      categoryId: val ?? "",
                    }))
                  }
                >
                  <SelectTrigger className="w-full" aria-label={t("category")}>
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
              </div>

              <div>
                <Label
                  htmlFor="vendorName"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("vendor")}
                </Label>
                <Input
                  id="vendorName"
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
                  htmlFor="taxAmount"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("taxAmount")}
                </Label>
                <Input
                  id="taxAmount"
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
                  htmlFor="paymentMethod"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("paymentMethod")}
                </Label>
                <Select
                  id="paymentMethod"
                  value={form.paymentMethod}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: val ?? "",
                    }))
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label={t("paymentMethod")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {t(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="referenceNumber"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("referenceNumber")}
                </Label>
                <Input
                  id="referenceNumber"
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
                  id="paid"
                  checked={form.paid}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      paid: checked === true,
                    }))
                  }
                />
                <Label
                  htmlFor="paid"
                  className="cursor-pointer text-sm font-medium"
                >
                  {t("paid")}
                </Label>
              </div>

              <div className="sm:col-span-2">
                <Label
                  htmlFor="notes"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("notes")}
                </Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder={t("notesPlaceholder")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
              <Button
                render={<Link href="/dashboard/expenses" />}
                type="button"
                variant="outline"
              >
                {commonT("cancel")}
              </Button>
              <Button
                type="submit"
                size="default"
                disabled={createExpense.isPending}
              >
                {createExpense.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wallet className="size-4" />
                )}
                {createExpense.isPending ? t("saving") : t("addExpense")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
