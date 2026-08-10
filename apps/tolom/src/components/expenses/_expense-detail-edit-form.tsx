"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
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
import {
  type ExpenseFormValues,
  PAYMENT_METHODS,
} from "./_expense-detail-utils";

interface ExpenseCategory {
  id: string;
  name: string;
}

interface ExpenseDetailEditFormProps {
  form: UseFormReturn<ExpenseFormValues>;
  categories?: ExpenseCategory[];
  handleSave: () => Promise<void>;
}

export function ExpenseDetailEditForm({
  form,
  categories,
  handleSave,
}: ExpenseDetailEditFormProps) {
  const t = useTranslations("expenses");
  const commonT = useTranslations("common");
  const paid = form.watch("paid");

  return (
    <form
      id="expense-detail-form"
      onSubmit={(e) => {
        e.preventDefault();
        // Run the zod schema validation (e.g. required amount) before save;
        // on invalid input handleSave is not called and FieldErrors render.
        void form.handleSubmit(handleSave)();
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
              <CurrencyInput
                id="eds-amount"
                placeholder="\u20AE"
                value={Number(form.watch("amount")) || 0}
                onChange={(val) => form.setValue("amount", String(val))}
              />
              {form.formState.errors.amount && (
                <FieldError>{form.formState.errors.amount.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Tax Amount — optional */}
          <Field>
            <FieldLabel>{t("taxAmount")}</FieldLabel>
            <FieldContent>
              <CurrencyInput
                id="eds-taxAmount"
                placeholder="\u20AE"
                value={Number(form.watch("taxAmount")) || 0}
                onChange={(val) => form.setValue("taxAmount", String(val))}
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
                onValueChange={(val) => form.setValue("categoryId", val ?? "")}
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
  );
}
