"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { NotePencil } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateExpense } from "@/app/(dashboard)/expenses/actions";
import { buttonVariants } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { formatRouteDate } from "@/lib/format";

const expenseSchema = z.object({
  expense_date: z.string().min(1, "Огноо шаардлагатай"),
  category: z.string().min(1, "Ангилал шаардлагатай"),
  amount: z.number().min(1, "Дүн 0-ээс их байх ёстой"),
  description: z.string().optional(),
  payment_method: z.string().min(1, "Төлбөрийн арга шаардлагатай"),
});

type ExpenseValues = z.infer<typeof expenseSchema>;

export interface ExpenseEditData {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  description: string | null;
  payment_method: string | null;
}

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Бэлэн" },
  { value: "card", label: "Карт" },
  { value: "bank_transfer", label: "Данс" },
  { value: "invoice", label: "Нэхэмжлэл" },
];

export function ExpenseEditDrawer({ expense }: { expense: ExpenseEditData }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: expense.expense_date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description ?? "",
      payment_method: expense.payment_method ?? "cash",
    },
  });

  const onSubmit = async (data: ExpenseValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("id", expense.id);
    formData.append("expense_date", data.expense_date);
    formData.append("category", data.category);
    formData.append("amount", String(data.amount));
    formData.append("description", data.description ?? "");
    formData.append("payment_method", data.payment_method);

    const result = await updateExpense(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setOpen(false);
      toast.success("Зарлага амжилттай шинэчлэгдсэн.");
    }
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          title="Засах"
        >
          <NotePencil className="size-3.5" />
        </button>
      }
      title="Зарлага засах"
      description={`${expense.category} • ${expense.expense_date}`}
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="edit-expense-form"
            isPending={isSubmitting}
            label="Хадгалах"
            loadingLabel="Хадгалж байна..."
          />
        </DrawerFooter>
      }
    >
      <form id="edit-expense-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5">
          <FieldGroup>
            <Field>
              <FieldLabel>Огноо</FieldLabel>
              <Controller
                control={control}
                name="expense_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(date ? formatRouteDate(date) : "")
                    }
                  />
                )}
              />
              {errors.expense_date && (
                <p className="text-xs text-destructive">
                  {errors.expense_date.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>Ангилал</FieldLabel>
              <Input placeholder="Зарлагын ангилал" {...register("category")} />
              {errors.category && (
                <p className="text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>Дүн</FieldLabel>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>Төлбөрийн арга</FieldLabel>
              <Controller
                control={control}
                name="payment_method"
                render={({ field }) => (
                  <NativeSelect
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    {PAYMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              />
            </Field>

            <Field>
              <FieldLabel>
                Тайлбар{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Input
                placeholder="Зарлагын тайлбар"
                {...register("description")}
              />
            </Field>
          </FieldGroup>
        </div>

        <ErrorBanner error={serverError} />
      </form>
    </DrawerLayout>
  );
}
