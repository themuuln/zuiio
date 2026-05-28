"use client";

import { Loader2, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateExpense,
  useExpenseCategories,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";

const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "manual"] as const;

type ExpenseFormState = {
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
};

const initialForm: ExpenseFormState = {
  description: "",
  amount: "",
  expenseDate: new Date().toISOString().split("T")[0],
  categoryId: "",
  vendorName: "",
  taxAmount: "0",
  paymentMethod: "cash",
  referenceNumber: "",
  paid: false,
  notes: "",
};

type NewExpenseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewExpenseSheet({
  open,
  onOpenChange,
}: NewExpenseSheetProps) {
  const t = useTranslations("expenses");
  const commonT = useTranslations("common");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;
  const { data: categories } = useExpenseCategories(orgId ?? undefined);
  const createExpense = useCreateExpense(orgId ?? undefined);
  const [form, setForm] = useState<ExpenseFormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Clear errors on any input change
  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      setFieldErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orgId) {
      toast.error("Organization not loaded. Please try again.");
      return;
    }

    const errors: Record<string, string> = {};
    if (!form.description.trim())
      errors.description = "Description is required";
    const amount = parseFloat(form.amount);
    if (!form.amount.trim()) errors.amount = "Amount is required";
    else if (Number.isNaN(amount) || amount <= 0)
      errors.amount = "Enter a valid amount";
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
        paidAt: form.paid ? new Date().toISOString() : null,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setForm(initialForm);
          onOpenChange(false);
        },
      },
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setForm(initialForm);
      setFieldErrors({});
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
        showCloseButton
      >
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{t("addExpense")}</SheetTitle>
          <SheetDescription>{t("subtitle")}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 p-4">
            <form onSubmit={handleSubmit} id="new-expense-sheet-form">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("details")}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label
                        htmlFor="sheet-expense-description"
                        className="mb-1 block text-sm font-medium"
                      >
                        {t("description")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="sheet-expense-description"
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
                        <p className="text-xs text-destructive mt-1">
                          {fieldErrors.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="sheet-expense-amount"
                        className="mb-1 block text-sm font-medium"
                      >
                        {t("amount")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="sheet-expense-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.amount}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        className={`h-11 ${fieldErrors.amount ? "border-destructive" : ""}`}
                        placeholder="₮"
                        required
                        aria-invalid={!!fieldErrors.amount}
                      />
                      {fieldErrors.amount && (
                        <p className="text-xs text-destructive mt-1">
                          {fieldErrors.amount}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="sheet-expense-date"
                        className="mb-1 block text-sm font-medium"
                      >
                        {t("expenseDate")}
                      </Label>
                      <Input
                        id="sheet-expense-date"
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
                        htmlFor="sheet-expense-category"
                        className="mb-1 block text-sm font-medium"
                      >
                        {t("category")}
                      </Label>
                      <NativeSelect
                        id="sheet-expense-category"
                        value={form.categoryId}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            categoryId: e.target.value,
                          }))
                        }
                        className="w-full"
                        aria-label={t("category")}
                      >
                        <option value="">{commonT("all")}</option>
                        {categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>

                    <div>
                      <Label
                        htmlFor="sheet-expense-vendor"
                        className="mb-1 block text-sm font-medium"
                      >
                        {t("vendor")}
                      </Label>
                      <Input
                        id="sheet-expense-vendor"
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
                        htmlFor="sheet-expense-tax"
                        className="mb-1 block text-sm font-medium"
                      >
                        {t("taxAmount")}
                      </Label>
                      <Input
                        id="sheet-expense-tax"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.taxAmount}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            taxAmount: e.target.value,
                          }))
                        }
                        className="h-11"
                        placeholder="₮"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="sheet-expense-payment-method"
                        className="mb-1 block text-sm font-medium"
                      >
                        {t("paymentMethod")}
                      </Label>
                      <NativeSelect
                        id="sheet-expense-payment-method"
                        value={form.paymentMethod}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            paymentMethod: e.target.value,
                          }))
                        }
                        className="w-full"
                        aria-label={t("paymentMethod")}
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {t(method)}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>

                    <div>
                      <Label
                        htmlFor="sheet-expense-reference"
                        className="mb-1 block text-sm font-medium"
                      >
                        {t("referenceNumber")}
                      </Label>
                      <Input
                        id="sheet-expense-reference"
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
                        id="sheet-expense-paid"
                        checked={form.paid}
                        onCheckedChange={(checked) =>
                          setForm((prev) => ({
                            ...prev,
                            paid: checked === true,
                          }))
                        }
                      />
                      <Label
                        htmlFor="sheet-expense-paid"
                        className="cursor-pointer text-sm font-medium"
                      >
                        {t("paid")}
                      </Label>
                    </div>

                    <div className="sm:col-span-2">
                      <Label
                        htmlFor="sheet-expense-notes"
                        className="mb-1 block text-sm font-medium"
                      >
                        {t("notes")}
                      </Label>
                      <Textarea
                        id="sheet-expense-notes"
                        value={form.notes}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder={t("notesPlaceholder")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 border-t bg-background p-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="min-h-[48px] flex-1"
              onClick={() => handleOpenChange(false)}
            >
              {commonT("cancel")}
            </Button>
            <Button
              type="submit"
              form="new-expense-sheet-form"
              size="default"
              disabled={createExpense.isPending}
              className="min-h-[48px] gap-2 flex-1"
            >
              {createExpense.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wallet className="size-4" />
              )}
              {createExpense.isPending
                ? t("saving")
                : t("addExpense")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
