"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatRouteDate } from "@/lib/format";
import { expenseKeys } from "@/lib/query/keys";
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
}: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

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

  const expenseMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createExpense(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: expenseKeys.all() });
      const snapshot = queryClient.getQueriesData({
        queryKey: expenseKeys.all(),
      });

      const category = formData.get("category")?.toString() ?? "";
      const amount = Number(formData.get("amount") ?? 0);
      const expenseDate = formData.get("expense_date")?.toString() ?? formatRouteDate();
      const description = formData.get("description")?.toString() ?? "";
      const paymentMethod = formData.get("payment_method")?.toString() ?? "cash";

      const optimisticExpense = {
        id: `opt-${Date.now()}`,
        category,
        amount,
        expense_date: expenseDate,
        description: description || null,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueriesData(
        { queryKey: expenseKeys.all(), type: "active" },
        (oldData: unknown) => {
          if (Array.isArray(oldData)) {
            return [optimisticExpense, ...oldData];
          }
          return oldData;
        },
      );

      return { snapshot };
    },
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) {
        for (const [key, data] of context.snapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err.message || "Зарлага үүсгэхэд алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all() });
    },
  });

  const onSubmit = (data: ExpenseValues) => {
    if (expenseMutation.isPending) return;
    const formData = new FormData();
    formData.append("category", data.category);
    formData.append("amount", String(data.amount));
    formData.append("expense_date", data.expense_date);
    formData.append("payment_method", data.payment_method);
    formData.append("description", data.description ?? "");
    expenseMutation.mutate(formData);
  };

  const [categoryQuery, setCategoryQuery] = useState("");
  const loweredCategoryQuery = categoryQuery.trim().toLowerCase();
  const [allCategories, setAllCategories] = useState<string[]>([...initialCategories]);
  const filteredCategories = loweredCategoryQuery
    ? allCategories.filter((c) => c.toLowerCase().includes(loweredCategoryQuery))
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
  const [allPaymentMethods, setAllPaymentMethods] = useState<string[]>([...initialPaymentMethods]);
  const filteredPaymentMethods = loweredPaymentQuery
    ? allPaymentMethods.filter((m) => m.toLowerCase().includes(loweredPaymentQuery))
    : allPaymentMethods;
  const paymentExactMatch =
    loweredPaymentQuery === "" ||
    allPaymentMethods.some((m) => m.toLowerCase() === loweredPaymentQuery);
  const paymentItems: string[] =
    loweredPaymentQuery !== "" && !paymentExactMatch
      ? [...filteredPaymentMethods, paymentQuery.trim()]
      : filteredPaymentMethods;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                        {allCategories.includes(item) || initialCategories.includes(item)
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
            <p className="text-xs text-destructive">{errors.category.message}</p>
          )}
        </Field>
        <Field>
          <FieldLabel>Дүн</FieldLabel>
          <Input
            type="number"
            min="0"
            step="0.01"
            required
            {...register("amount", { valueAsNumber: true })}
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
                onChange={(date) => field.onChange(date ? formatRouteDate(date) : "")}
              />
            )}
          />
          {errors.expense_date && (
            <p className="text-xs text-destructive">{errors.expense_date.message}</p>
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
                      (allPaymentMethods.includes(item) ? item : `"${item}" үүсгэх`))
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
                        {allPaymentMethods.includes(item) || initialPaymentMethods.includes(item)
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
            <p className="text-xs text-destructive">{errors.payment_method.message}</p>
          )}
        </Field>
        <Field>
          <FieldLabel>Тайлбар</FieldLabel>
          <Input placeholder="Сарын түрээс, хүргэлтийн зардал..." {...register("description")} />
        </Field>
      </FieldGroup>

      {expenseMutation.error ? (
        <div className="rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {expenseMutation.error.message}
        </div>
      ) : null}

      <button type="submit" disabled={expenseMutation.isPending} className={buttonVariants({ variant: "default" })}>
        {expenseMutation.isPending ? "Хадгалах..." : "Зарлага хадгалах"}
      </button>
    </form>
  );
}
