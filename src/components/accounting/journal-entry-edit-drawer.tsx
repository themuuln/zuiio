"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { updateJournalEntry } from "@/app/(dashboard)/accounting/actions";
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

type JournalEntryLine = {
  id: string;
  debit_amount: number;
  credit_amount: number;
  account: { id: string; code: string; name: string } | null;
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: "Хөрөнгө",
  liability: "Өр төлбөр",
  equity: "Өмч",
  income: "Орлого",
  expense: "Зарлага",
};

export function JournalEntryEditDrawer({
  entry,
  accounts,
  open,
  onOpenChange,
}: {
  entry: {
    id: string;
    entry_date: string;
    description: string | null;
    journal_entry_lines: JournalEntryLine[];
  };
  accounts: AccountRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.is_active);

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
      entry_date: entry.entry_date,
      description: entry.description ?? "",
      lines: entry.journal_entry_lines.map((line) => ({
        account_id: line.account?.id ?? "",
        debit_amount: line.debit_amount,
        credit_amount: line.credit_amount,
      })),
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

  const onSubmit = async (data: JournalEntryValues) => {
    setServerError(null);

    const debits = data.lines.reduce((s, l) => s + (l.debit_amount || 0), 0);
    const credits = data.lines.reduce((s, l) => s + (l.credit_amount || 0), 0);
    if (Math.abs(debits - credits) > 0.01) {
      setServerError("Дебет ба кредит дүн тэнцүү байх ёстой");
      return;
    }

    for (const [i, line] of data.lines.entries()) {
      if (!line.account_id) {
        setServerError(`Мөр ${i + 1}: Данс сонгоно уу`);
        return;
      }
      if (line.debit_amount === 0 && line.credit_amount === 0) {
        setServerError(`Мөр ${i + 1}: Дебет эсвэл кредит дүн оруулна уу`);
        return;
      }
    }

    const formData = new FormData();
    formData.append("id", entry.id);
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

    const result = await updateJournalEntry(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    } else {
      onOpenChange(false);
    }
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
        onOpenChange(next);
        if (!next) {
          setServerError(null);
        }
      }}
      title="Журналын бичилт засах"
      description="Бичилтийн мэдээллийг шинэчлэх"
      panelWidth="36rem"
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => onOpenChange(false)} />
          <DrawerSubmit
            form="journal-edit-form"
            isPending={isSubmitting}
            loadingLabel="Хадгалаж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="journal-edit-form"
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
                  <p className="mt-1 text-xs text-destructive">
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

        <ErrorBanner error={serverError} />
      </form>
    </SlideInDrawer>
  );
}
