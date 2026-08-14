"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { buttonVariants } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatRouteDate } from "@/lib/format";
import { expenseKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";
import { createExpense } from "./actions";

const initialPaymentMethods: string[] = ["cash", "bank_transfer", "card"];
const paymentMethodLabels: Record<string, string> = {
  cash: "Бэлэн",
  bank_transfer: "Данс",
  card: "Карт",
};

const initialCategories: string[] = [
  "Түрээс",
  "Тээвэр",
  "Цалин",
  "Коммунал",
  "Интернет",
  "Офис",
  "Маркетинг",
  "Татвар",
  "Даатгал",
  "Засвар үйлчилгээ",
  "Хоол",
  "Бусад",
];

const expenseSchema = z.object({
  category: z.string().min(1, "Ангилал шаардлагатай"),
  amount: z.number().positive("Дүн 0-ээс их байх ёстой"),
  expense_date: z.string().min(1, "Огноо шаардлагатай"),
  payment_method: z.string().min(1, "Төлбөрийн арга шаардлагатай"),
  description: z.string().optional(),
});

type ExpenseValues = z.infer<typeof expenseSchema>;

export function ExpenseForm({
  onSuccess,
  formId,
}: {
  onSuccess?: () => void;
  formId?: string;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      amount: 0,
      expense_date: formatRouteDate(),
      payment_method: "cash",
      description: "",
    },
  });

  const expenseMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createExpense(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
      return result;
    },
    queryKey: expenseKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      category: formData.get("category")?.toString() ?? "",
      amount: Number(formData.get("amount") ?? 0),
      expense_date:
        formData.get("expense_date")?.toString() ?? formatRouteDate(),
      description: formData.get("description")?.toString() || null,
      payment_method: formData.get("payment_method")?.toString() ?? "cash",
      created_at: new Date().toISOString(),
    }),
  });

  const onSubmit = (data: ExpenseValues) => {
    if (expenseMutation.isPending) return;
    const formData = new FormData();
    formData.append("category", data.category);
    formData.append("amount", String(data.amount));
    formData.append("expense_date", data.expense_date);
    formData.append("payment_method", data.payment_method);
    formData.append("description", data.description ?? "");
    expenseMutation.mutate(formData, {
      onSuccess: () => {
        onSuccess?.();
        toast.success("Зарлага амжилттай үүсгэгдсэн.");
      },
    });
  };

  const [categoryQuery, setCategoryQuery] = useState("");
  const loweredCategoryQuery = categoryQuery.trim().toLowerCase();
  const [allCategories, setAllCategories] = useState<string[]>([
    ...initialCategories,
  ]);
  const filteredCategories = loweredCategoryQuery
    ? allCategories.filter((c) =>
        c.toLowerCase().includes(loweredCategoryQuery),
      )
    : allCategories;
  const categoryExactMatch =
    loweredCategoryQuery === "" ||
    allCategories.some((c) => c.toLowerCase() === loweredCategoryQuery);
  const categoryItems: string[] =
    loweredCategoryQuery !== "" && !categoryExactMatch
      ? [...filteredCategories, categoryQuery.trim()]
      : filteredCategories;

  const [paymentQuery, setPaymentQuery] = useState("");
  const loweredPaymentQuery = paymentQuery.trim().toLowerCase();
  const [allPaymentMethods, setAllPaymentMethods] = useState<string[]>([
    ...initialPaymentMethods,
  ]);
  const filteredPaymentMethods = loweredPaymentQuery
    ? allPaymentMethods.filter((m) =>
        m.toLowerCase().includes(loweredPaymentQuery),
      )
    : allPaymentMethods;
  const paymentExactMatch =
    loweredPaymentQuery === "" ||
    allPaymentMethods.some((m) => m.toLowerCase() === loweredPaymentQuery);
  const paymentItems: string[] =
    loweredPaymentQuery !== "" && !paymentExactMatch
      ? [...filteredPaymentMethods, paymentQuery.trim()]
      : filteredPaymentMethods;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id={formId}>
      <FieldGroup>
        <Field>
          <FieldLabel>Ангилал</FieldLabel>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Combobox
                name="category"
                items={categoryItems}
                required
                value={field.value}
                onValueChange={(next: string | null) => {
                  if (next && !allCategories.includes(next)) {
                    setAllCategories((prev) => [...prev, next]);
                  }
                  setCategoryQuery("");
                  field.onChange(next ?? "");
                }}
                itemToStringLabel={(item: string | null) =>
                  item && allCategories.includes(item)
                    ? item
                    : item
                      ? `"${item}" үүсгэх`
                      : ""
                }
                inputValue={categoryQuery}
                onInputValueChange={setCategoryQuery}
              >
                <ComboboxInput
                  placeholder="Түрээс, тээвэр, цалин..."
                  showTrigger
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Ангилал байхгүй</ComboboxEmpty>
                  <ComboboxList>
                    {(item: string) => (
                      <ComboboxItem key={item} value={item}>
                        {allCategories.includes(item) ||
                        initialCategories.includes(item)
                          ? item
                          : `"${item}" үүсгэх`}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )}
          />
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
              <CurrencyInput value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </Field>
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
          <FieldLabel>Төлбөрийн арга</FieldLabel>
          <Controller
            name="payment_method"
            control={control}
            render={({ field }) => (
              <Combobox
                name="payment_method"
                items={paymentItems}
                value={field.value}
                onValueChange={(next: string | null) => {
                  if (next && !allPaymentMethods.includes(next)) {
                    setAllPaymentMethods((prev) => [...prev, next]);
                  }
                  setPaymentQuery("");
                  field.onChange(next ?? "");
                }}
                itemToStringLabel={(item: string | null) =>
                  item
                    ? (paymentMethodLabels[item] ??
                      (allPaymentMethods.includes(item)
                        ? item
                        : `"${item}" үүсгэх`))
                    : ""
                }
                inputValue={paymentQuery}
                onInputValueChange={setPaymentQuery}
              >
                <ComboboxInput
                  placeholder="Сонгох"
                  showTrigger
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Арга байхгүй</ComboboxEmpty>
                  <ComboboxList>
                    {(item: string) => (
                      <ComboboxItem key={item} value={item}>
                        {allPaymentMethods.includes(item) ||
                        initialPaymentMethods.includes(item)
                          ? (paymentMethodLabels[item] ?? item)
                          : `"${item}" үүсгэх`}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )}
          />
          {errors.payment_method && (
            <p className="text-xs text-destructive">
              {errors.payment_method.message}
            </p>
          )}
        </Field>
        <Field>
          <FieldLabel>Тайлбар</FieldLabel>
          <Input
            placeholder="Сарын түрээс, хүргэлтийн зардал..."
            {...register("description")}
          />
        </Field>
      </FieldGroup>
      {!formId && (
        <button
          type="submit"
          disabled={expenseMutation.isPending}
          className={buttonVariants({ variant: "default" })}
        >
          {expenseMutation.isPending ? "Хадгалах..." : "Зарлага хадгалах"}
        </button>
      )}
    </form>
  );
}
