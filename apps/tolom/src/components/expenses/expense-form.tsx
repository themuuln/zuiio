"use client";

import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useCreateExpense,
  useExpenseCategories,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { CreateExpenseParams, ExpenseWithCategory } from "@/lib/types";
import {
  PAYMENT_METHODS,
  expenseSchema as sharedExpenseSchema,
} from "@/lib/validation/expense-schema";

// ── Schema ───────────────────────────────────────────────────
// Import shared expense schema — override paymentMethod to string
// (form doesn't enforce enum at schema level).

const expenseSchema = sharedExpenseSchema.extend({
  paymentMethod: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const defaultExpenseValues: ExpenseFormValues = {
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

// ── Props ────────────────────────────────────────────────────

export type ExpenseFormProps = {
  mode?: "quick" | "full";
  onSuccess?: (expense: ExpenseWithCategory) => void;
  onCancel?: () => void;
};

// ── Component ────────────────────────────────────────────────

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;
  const commonT = useTranslations("common");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;
  const { data: categories } = useExpenseCategories(orgId ?? undefined);
  const createExpense = useCreateExpense(orgId ?? undefined);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultExpenseValues,
  });
  // Protect unsaved form data from accidental navigation
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form.formState.isDirty]);

  const paid = form.watch("paid");

  const onSubmit = form.handleSubmit(async (data) => {
    if (!orgId) {
      form.setError("description", { message: "Organization not loaded" });
      return;
    }

    const amount = parseFloat(data.amount);
    const taxAmount = data.taxAmount ? parseFloat(data.taxAmount) : 0;

    createExpense.mutate(
      {
        description: data.description,
        amount,
        taxAmount: Number.isNaN(taxAmount) ? 0 : taxAmount,
        expenseDate: data.expenseDate || undefined,
        dueDate: data.dueDate || null,
        categoryId: data.categoryId || undefined,
        vendorName: data.vendorName || undefined,
        paymentMethod: data.paymentMethod || undefined,
        referenceNumber: data.referenceNumber || undefined,
        paidAt: data.paid ? new Date().toISOString() : null,
        notes: data.notes || undefined,
      } satisfies CreateExpenseParams,
      {
        onSuccess: (expense) => {
          form.reset(defaultExpenseValues);
          onSuccess?.(expense);
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} id="expense-form" className="flex flex-col gap-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{t("details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {/* Description — required */}
            <Field data-invalid={!!form.formState.errors.description}>
              <FieldLabel>
                {t("description")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="expense-description"
                  placeholder={t("descriptionPlaceholder")}
                  className="h-11"
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

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Amount — required */}
              <Field data-invalid={!!form.formState.errors.amount}>
                <FieldLabel>
                  {t("amount")} <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <CurrencyInput
                    id="expense-amount"
                    placeholder="₮"
                    className="h-11"
                    value={Number(form.watch("amount")) || 0}
                    onChange={(val) => form.setValue("amount", String(val))}
                  />
                  {form.formState.errors.amount && (
                    <FieldError>
                      {form.formState.errors.amount.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>

              {/* Expense Date — optional */}
              <Field>
                <FieldLabel>{t("expenseDate")}</FieldLabel>
                <FieldContent>
                  <Input
                    id="expense-date"
                    type="date"
                    className="h-11"
                    {...form.register("expenseDate")}
                  />
                </FieldContent>
              </Field>

              {/* Due Date — optional */}
              <Field>
                <FieldLabel>{t("due")}</FieldLabel>
                <FieldContent>
                  <Input
                    id="expense-due-date"
                    type="date"
                    className="h-11"
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
                    <SelectTrigger
                      className="w-full"
                      aria-label={t("category")}
                    >
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

              {/* Vendor — optional */}
              <Field>
                <FieldLabel>{t("vendor")}</FieldLabel>
                <FieldContent>
                  <Input
                    id="expense-vendor"
                    className="h-11"
                    placeholder={t("vendorPlaceholder")}
                    {...form.register("vendorName")}
                  />
                </FieldContent>
              </Field>

              {/* Tax Amount — optional */}
              <Field>
                <FieldLabel>{t("taxAmount")}</FieldLabel>
                <FieldContent>
                  <CurrencyInput
                    id="expense-tax"
                    className="h-11"
                    placeholder="₮"
                    value={Number(form.watch("taxAmount")) || 0}
                    onChange={(val) => form.setValue("taxAmount", String(val))}
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
                </FieldContent>
              </Field>

              {/* Reference Number — optional */}
              <Field>
                <FieldLabel>{t("referenceNumber")}</FieldLabel>
                <FieldContent>
                  <Input
                    id="expense-reference"
                    className="h-11"
                    placeholder={t("referenceNumberPlaceholder")}
                    {...form.register("referenceNumber")}
                  />
                </FieldContent>
              </Field>

              {/* Paid checkbox */}
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="expense-paid"
                  checked={paid}
                  onCheckedChange={(checked) =>
                    form.setValue("paid", checked === true)
                  }
                />
                <label
                  htmlFor="expense-paid"
                  className="cursor-pointer text-sm font-medium"
                >
                  {t("paid")}
                </label>
              </div>

              {/* Notes — optional */}
              <div className="sm:col-span-2">
                <Field>
                  <FieldLabel>{t("notes")}</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="expense-notes"
                      rows={3}
                      placeholder={t("notesPlaceholder")}
                      {...form.register("notes")}
                    />
                  </FieldContent>
                </Field>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            className="h-11 px-6"
          >
            {commonT("cancel")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={createExpense.isPending}
          className="h-11 px-6 min-w-[140px] gap-2"
        >
          {createExpense.isPending ? null : <Wallet className="size-4" />}
          {createExpense.isPending ? t("saving") : t("addExpense")}
        </Button>
      </div>
    </form>
  );
}
