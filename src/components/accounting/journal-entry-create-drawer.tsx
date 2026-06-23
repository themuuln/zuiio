"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createJournalEntry } from "@/app/(dashboard)/accounting/actions";
import { buttonVariants } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { journalEntryKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";

const lineSchema = z
  .object({
    account_id: z.string().min(1, "Данс сонгоно уу"),
    debit_amount: z.number().min(0, "Дебет 0-ээс багагүй"),
    credit_amount: z.number().min(0, "Кредит 0-ээс багагүй"),
  })
  .refine((data) => data.debit_amount > 0 || data.credit_amount > 0, {
    message: "Дебет эсвэл кредит дүн оруулна уу",
  });

const journalEntrySchema = z.object({
  entry_date: z.string().min(1, "Огноо шаардлагатай"),
  description: z.string().min(1, "Тайлбар шаардлагатай"),
  lines: z.array(lineSchema).min(1, "Дор хаяж нэг мөр оруулна уу"),
});

type JournalEntryValues = z.infer<typeof journalEntrySchema>;

type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
  is_active: boolean;
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: "Хөрөнгө",
  liability: "Өр төлбөр",
  equity: "Өмч",
  income: "Орлого",
  expense: "Зарлага",
};

export function JournalEntryCreateDrawer({
  accounts,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  accounts: AccountRow[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const activeAccounts = accounts.filter((a) => a.is_active);

  const journalMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createJournalEntry(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: journalEntryKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      entry_date: formData.get("entry_date")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      created_at: new Date().toISOString(),
    }),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JournalEntryValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      entry_date: new Date().toISOString().slice(0, 10),
      description: "",
      lines: [{ account_id: "", debit_amount: 0, credit_amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const lines = watch("lines");
  const totalDebits =
    lines?.reduce((sum, line) => sum + (line.debit_amount || 0), 0) ?? 0;
  const totalCredits =
    lines?.reduce((sum, line) => sum + (line.credit_amount || 0), 0) ?? 0;
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const onSubmit = (data: JournalEntryValues) => {
    if (journalMutation.isPending) return;

    // Validate debits = credits
    const debits = data.lines.reduce((s, l) => s + (l.debit_amount || 0), 0);
    const credits = data.lines.reduce((s, l) => s + (l.credit_amount || 0), 0);
    if (Math.abs(debits - credits) > 0.01) {
      toast.error("Дебет ба кредит дүн тэнцүү байх ёстой");
      return;
    }

    // Validate each line
    for (const [i, line] of data.lines.entries()) {
      if (!line.account_id) {
        toast.error(`Мөр ${i + 1}: Данс сонгоно уу`);
        return;
      }
      if (line.debit_amount === 0 && line.credit_amount === 0) {
        toast.error(`Мөр ${i + 1}: Дебет эсвэл кредит дүн оруулна уу`);
        return;
      }
    }

    const formData = new FormData();
    formData.append("entry_date", data.entry_date);
    formData.append("description", data.description);
    formData.append(
      "lines",
      JSON.stringify(
        data.lines.map((line) => ({
          account_id: line.account_id,
          debit_amount: line.debit_amount || 0,
          credit_amount: line.credit_amount || 0,
        })),
      ),
    );

    journalMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        reset();
        toast.success("Журналын бичилт амжилттай үүсгэгдлээ.");
      },
    });
  };

  const getAccountLabel = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return "Устгасан данс";
    return `${account.code} - ${account.name}`;
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
        }
      }}
      title="Шинэ журналын бичилт"
      description="Огноо, тайлбар, дансны мөрүүдийг оруулан шинэ бичилт үүсгэнэ."
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="size-4" />
          Шинэ бичилт
        </button>
      }
      panelWidth="36rem"
      footer={
        <DrawerFooter>
          <DrawerCancel
            onClick={() => {
              setOpen(false);
              reset();
            }}
          />
          <DrawerSubmit
            form="journal-form"
            isPending={isSubmitting || journalMutation.isPending}
            label="Бичилт үүсгэх"
            loadingLabel="Үүсгэж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="journal-form"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Огноо</FieldLabel>
            <DatePicker
              value={
                watch("entry_date") ? new Date(watch("entry_date")) : undefined
              }
              onChange={(date) =>
                setValue(
                  "entry_date",
                  date
                    ? formatRouteDate(date)
                    : new Date().toISOString().slice(0, 10),
                )
              }
            />
            {errors.entry_date && (
              <p className="text-xs text-destructive">
                {errors.entry_date.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>Тайлбар</FieldLabel>
            <Textarea
              placeholder="Журналын бичилтийн тайлбар..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </Field>
        </FieldGroup>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Мөрүүд</span>
            <button
              type="button"
              onClick={() =>
                append({ account_id: "", debit_amount: 0, credit_amount: 0 })
              }
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Plus className="size-4" />
              Мөр нэмэх
            </button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
            >
              <div className="min-w-[180px] flex-1">
                <FieldLabel className="mb-1 text-xs">Данс</FieldLabel>
                <Select
                  value={watch(`lines.${index}.account_id`)}
                  onValueChange={(value: string) =>
                    setValue(`lines.${index}.account_id`, value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Данс сонгох">
                      {watch(`lines.${index}.account_id`)
                        ? getAccountLabel(watch(`lines.${index}.account_id`))
                        : "Данс сонгох"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs">
                            {account.code}
                          </span>
                          <span>{account.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                            )
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.lines?.[index]?.account_id && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.lines[index]?.account_id?.message}
                  </p>
                )}
              </div>

              <div className="w-28">
                <FieldLabel className="mb-1 text-xs">Дебет</FieldLabel>
                <Controller
                  control={control}
                  name={`lines.${index}.debit_amount`}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="w-28">
                <FieldLabel className="mb-1 text-xs">Кредит</FieldLabel>
                <Controller
                  control={control}
                  name={`lines.${index}.credit_amount`}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {fields.length > 1 && (
                <div className="pb-1">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex size-8 items-center justify-center rounded text-destructive hover:bg-muted"
                  >
                    <Trash className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Нийт дебет:</span>
              <span
                className={`ml-2 text-base font-semibold ${
                  !isBalanced ? "text-destructive" : ""
                }`}
              >
                {formatCurrency(totalDebits)}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                Нийт кредит:
              </span>
              <span
                className={`ml-2 text-base font-semibold ${
                  !isBalanced ? "text-destructive" : ""
                }`}
              >
                {formatCurrency(totalCredits)}
              </span>
            </div>
          </div>
          {!isBalanced && totalDebits > 0 && totalCredits > 0 && (
            <p className="mt-1 text-xs text-destructive">
              Дебет ба кредит дүн тэнцүү байх ёстой
            </p>
          )}
          {isBalanced && totalDebits > 0 && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              Тэнцүү ✓
            </p>
          )}
        </div>

        {errors.lines && !Array.isArray(errors.lines) && (
          <p className="text-xs text-destructive">
            {(errors.lines as any)?.message}
          </p>
        )}

        <ErrorBanner error={journalMutation.error} />
      </form>
    </SlideInDrawer>
  );
}
