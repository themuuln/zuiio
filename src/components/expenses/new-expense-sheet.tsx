"use client";

import { Loader2, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useCreateExpense,
  useExpenseCategories,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";

// ── Schema ───────────────────────────────────────────────────

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => {
      const n = Number(val);
      return !Number.isNaN(n) && n > 0;
    }, "Enter a valid amount"),
  expenseDate: z.string().optional(),
  dueDate: z.string().optional(),
  categoryId: z.string().optional(),
  vendorName: z.string().optional(),
  taxAmount: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  paid: z.boolean(),
  notes: z.string().optional(),
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

const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "manual"] as const;

// ── Component ────────────────────────────────────────────────

type NewExpenseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewExpenseSheet({ open, onOpenChange }: NewExpenseSheetProps) {
  const t = useTranslations("expenses");
  const commonT = useTranslations("common");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;
  const { data: categories } = useExpenseCategories(orgId ?? undefined);
  const createExpense = useCreateExpense(orgId ?? undefined);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultExpenseValues,
  });

  const paid = form.watch("paid");

  const onSubmit = form.handleSubmit(async (data) => {
    if (!orgId) {
      toast.error("Organization not loaded. Please try again.");
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
      },
      {
        onSuccess: () => {
          form.reset(defaultExpenseValues);
          onOpenChange(false);
        },
      },
    );
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset(defaultExpenseValues);
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
            <form onSubmit={onSubmit} id="new-expense-sheet-form">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("details")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    {/* Description — required */}
                    <Field data-invalid={!!form.formState.errors.description}>
                      <FieldLabel>
                        {t("description")}{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="sheet-expense-description"
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
                          {t("amount")}{" "}
                          <span className="text-destructive">*</span>
                        </FieldLabel>
                        <FieldContent>
                          <Input
                            id="sheet-expense-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="₮"
                            className="h-11"
                            aria-invalid={!!form.formState.errors.amount}
                            {...form.register("amount")}
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
                            id="sheet-expense-date"
                            type="date"
                            className="h-11"
                            {...form.register("expenseDate")}
                          />
                        </FieldContent>
                      </Field>

                      {/* Due Date — optional */}
                      <Field>
                        <FieldLabel>Due Date</FieldLabel>
                        <FieldContent>
                          <Input
                            id="sheet-expense-due-date"
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
                            id="sheet-expense-vendor"
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
                          <Input
                            id="sheet-expense-tax"
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-11"
                            placeholder="₮"
                            {...form.register("taxAmount")}
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
                            id="sheet-expense-reference"
                            className="h-11"
                            placeholder={t("referenceNumberPlaceholder")}
                            {...form.register("referenceNumber")}
                          />
                        </FieldContent>
                      </Field>

                      {/* Paid checkbox */}
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <Checkbox
                          id="sheet-expense-paid"
                          checked={paid}
                          onCheckedChange={(checked) =>
                            form.setValue("paid", checked === true)
                          }
                        />
                        <label
                          htmlFor="sheet-expense-paid"
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
                              id="sheet-expense-notes"
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
              {createExpense.isPending ? t("saving") : t("addExpense")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
