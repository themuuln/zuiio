"use client";

import { FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useCreatePurchaseOrder,
  usePartsCatalog,
  useSuppliers,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { formatMNT } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface NewPurchaseOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineItem {
  id: string;
  part_id: string;
  quantity_ordered: number;
  unit_cost: number;
}

export function NewPurchaseOrderSheet({
  open,
  onOpenChange,
}: NewPurchaseOrderSheetProps) {
  const t = useTranslations("inventory");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const suppliersQuery = useSuppliers(orgId);
  const partsQuery = usePartsCatalog(orgId);
  const suppliers = suppliersQuery.data ?? [];
  const parts = partsQuery.data ?? [];
  const isLoading =
    orgQuery.isPending || suppliersQuery.isLoading || partsQuery.isLoading;
  const createPO = useCreatePurchaseOrder(orgId);

  const [orderNumber, setOrderNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity_ordered * item.unit_cost,
    0,
  );

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setOrderNumber("");
        setSupplierId("");
        setNotes("");
        setItems([]);
        setFieldErrors({});
      }
      onOpenChange(value);
    },
    [onOpenChange],
  );

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        part_id: "",
        quantity_ordered: 1,
        unit_cost: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!orderNumber.trim()) errors.orderNumber = t("orderNumberRequired");
    if (items.length === 0) errors.items = t("addAtLeastOneItem");
    if (items.some((i) => !i.part_id))
      errors.items = t("selectPartForAllItems");
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await createPO.mutateAsync({
        supplier_id: supplierId || undefined,
        order_number: orderNumber.trim(),
        notes: notes || undefined,
        items: items.map((i) => ({
          part_id: i.part_id,
          quantity_ordered: i.quantity_ordered,
          unit_cost: i.unit_cost,
        })),
      });
      toast.success(t("poCreated"));
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToCreate"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 gap-0"
      >
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">
                {t("newPurchaseOrder")}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Захиалга үүсгэх
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          id="new-po-sheet-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto min-h-0"
        >
          <div className="p-4 flex flex-col gap-4">
            {isLoading ? (
              <>
                {/* Fields skeleton */}
                <FieldGroup>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </FieldGroup>

                <Skeleton className="h-px w-full" />

                {/* Items section skeleton */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </>
            ) : (
              <>
                <FieldGroup>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="po-order-number">
                        {t("orderNumber")}{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="po-order-number"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="PO-001"
                        aria-invalid={!!fieldErrors.orderNumber}
                      />
                      {fieldErrors.orderNumber && (
                        <Typography.Text className="text-xs text-destructive mt-1">
                          {fieldErrors.orderNumber}
                        </Typography.Text>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="po-supplier">
                        {t("supplier")}
                      </FieldLabel>
                      <NativeSelect
                        id="po-supplier"
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                      >
                        <option value="">—</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="po-notes">{t("notes")}</FieldLabel>
                    <Input
                      id="po-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("notesPlaceholder")}
                    />
                  </Field>
                </FieldGroup>

                <Separator />

                {/* Line items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Typography.H3 className="text-sm font-semibold">
                      {t("items")}
                    </Typography.H3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      {t("addItem")}
                    </Button>
                  </div>

                  {fieldErrors.items && (
                    <Typography.Text className="text-xs text-destructive mb-2">
                      {fieldErrors.items}
                    </Typography.Text>
                  )}

                  {items.length === 0 ? (
                    <Typography.Muted className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
                      {t("noItems")}
                    </Typography.Muted>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-end gap-2 p-2.5 rounded-lg border border-border/60 bg-card/40"
                        >
                          <div className="flex-1 min-w-0">
                            <NativeSelect
                              value={item.part_id}
                              onChange={(e) =>
                                updateItem(item.id, { part_id: e.target.value })
                              }
                            >
                              <option value="">{t("selectPart")}</option>
                              {parts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </NativeSelect>
                          </div>
                          <div className="w-20">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity_ordered}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  quantity_ordered: Number(e.target.value) || 1,
                                })
                              }
                              className="text-center"
                            />
                          </div>
                          <div className="w-28">
                            <Input
                              type="number"
                              min={0}
                              value={item.unit_cost}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  unit_cost: Number(e.target.value) || 0,
                                })
                              }
                              className="text-right"
                            />
                          </div>
                          <div className="w-24 text-right text-sm tabular-nums pb-2">
                            {formatMNT(item.quantity_ordered * item.unit_cost)}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="size-8 text-destructive shrink-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {items.length > 0 && (
                    <div className="flex justify-end text-base font-semibold mt-3 pt-3 border-t border-border">
                      <span>
                        {t("totalAmount")}: {formatMNT(totalAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 border-t border-border p-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              form="new-po-sheet-form"
              className="flex-1 gap-2"
              disabled={createPO.isPending}
            >
              {createPO.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              {createPO.isPending ? t("saving") : t("create")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
