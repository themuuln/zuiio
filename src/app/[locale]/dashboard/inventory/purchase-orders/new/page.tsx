"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/lib/i18n/navigation";
import {
  useCreatePurchaseOrder,
  usePartsCatalog,
  useSuppliers,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { Typography } from "@/components/ui/typography";

interface LineItem {
  id: string;
  part_id: string;
  quantity_ordered: number;
  unit_cost: number;
}

export default function NewPurchaseOrderPage() {
  const t = useTranslations("inventory");
  const { push, back } = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: suppliers = [] } = useSuppliers(orgId);
  const { data: parts = [] } = usePartsCatalog(orgId);
  const createPO = useCreatePurchaseOrder(orgId);

  const [orderNumber, setOrderNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity_ordered * item.unit_cost,
    0,
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
    if (!orderNumber.trim()) {
      toast.error(t("orderNumberRequired"));
      return;
    }
    if (items.length === 0) {
      toast.error(t("addAtLeastOneItem"));
      return;
    }
    if (items.some((i) => !i.part_id)) {
      toast.error(t("selectPartForAllItems"));
      return;
    }

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
      push("/dashboard/inventory/purchase-orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToCreate"));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => back()}
          aria-label={t("back")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("newPurchaseOrder")}
        </Typography.H1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="order_number">
                  {t("orderNumber")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="order_number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="PO-001"
                  className="h-11"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="supplier_id">{t("supplier")}</FieldLabel>
                <select
                  id="supplier_id"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">—</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="notes">{t("notes")}</FieldLabel>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                className="h-11"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Typography.H2 className="text-lg font-semibold">{t("items")}</Typography.H2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="size-4" /> {t("addItem")}
              </Button>
            </div>

            {items.length === 0 ? (
              <Typography.Muted className="text-sm text-muted-foreground py-4 text-center">
                {t("noItems")}
              </Typography.Muted>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-end gap-2 border-b border-border pb-3"
                  >
                    <Field>
                      <FieldLabel className="text-xs text-muted-foreground">
                        {t("part")}
                      </FieldLabel>
                      <select
                        value={item.part_id}
                        onChange={(e) =>
                          updateItem(item.id, { part_id: e.target.value })
                        }
                        className="h-9 w-full rounded border border-input bg-background px-2 text-sm"
                      >
                        <option value="">{t("selectPart")}</option>
                        {parts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs text-muted-foreground">
                        {t("quantity")}
                      </FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity_ordered}
                        onChange={(e) =>
                          updateItem(item.id, {
                            quantity_ordered: Number(e.target.value) || 1,
                          })
                        }
                        className="h-9 text-center"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs text-muted-foreground">
                        {t("unitCost")}
                      </FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        value={item.unit_cost}
                        onChange={(e) =>
                          updateItem(item.id, {
                            unit_cost: Number(e.target.value) || 0,
                          })
                        }
                        className="h-9 text-right"
                      />
                    </Field>
                    <div className="w-24 text-right text-sm tabular-nums pb-2">
                      {(item.quantity_ordered * item.unit_cost).toLocaleString(
                        "mn-MN",
                      )}{" "}
                      ₮
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-8 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end text-lg font-semibold pt-2">
              <span>
                {t("totalAmount")}: {totalAmount.toLocaleString("mn-MN")} ₮
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => back()}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={createPO.isPending}>
            {createPO.isPending ? t("saving") : t("create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
