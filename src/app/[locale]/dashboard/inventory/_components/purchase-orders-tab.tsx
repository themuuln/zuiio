"use client";

import { Plus, Truck, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import {
  type PurchaseOrderWithSupplier,
  useCreatePurchaseOrder,
  usePartsCatalog,
  usePurchaseOrderItems,
  usePurchaseOrders,
  useReceivePurchaseOrder,
  useSuppliers,
} from "@/lib/queries/use-inventory";
import { formatMNT } from "@/lib/utils";
import { formatDate, getPoStatusLabels } from "./constants";
import { Modal } from "./modal";
import { TableSkeleton } from "./table-skeleton";

interface PurchaseOrdersTabProps {
  orgId: string;
  branchFilter?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
}

export function PurchaseOrdersTab({
  orgId,
  branchFilter,
  search,
  onSearchChange,
}: PurchaseOrdersTabProps) {
  const locale = useLocale();
  const t = useTranslations("inventory");
  const now = useClientNow();
  const poStatusLabels = useMemo(() => getPoStatusLabels(t), [t]);
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders(
    orgId,
    branchFilter,
  );
  const createPO = useCreatePurchaseOrder(orgId);
  const receivePO = useReceivePurchaseOrder(orgId);
  const { data: parts = [] } = usePartsCatalog(orgId, branchFilter);
  const { data: suppliers = [] } = useSuppliers(orgId);

  const [showAddPO, setShowAddPO] = useState(false);
  const [_expandedPO, setExpandedPO] = useState<string | null>(null);

  const filteredPOs = useMemo(() => {
    if (!search) return purchaseOrders;
    const q = search.toLowerCase();
    return purchaseOrders.filter(
      (po) =>
        po.order_number.toLowerCase().includes(q) ||
        (po.supplier?.name ?? "").toLowerCase().includes(q) ||
        (poStatusLabels[po.status] ?? po.status).toLowerCase().includes(q),
    );
  }, [purchaseOrders, search]);

  const poExportColumns: ExportColumn<PurchaseOrderWithSupplier>[] = [
    { key: "order_number", label: "PO #" },
    {
      key: "supplier",
      label: t("supplier"),
      value: (po) => po.supplier?.name ?? "—",
    },
    { key: "status", label: t("status") },
    { key: "total_amount", label: t("totalAmount"), format: "currency" },
    { key: "created_at", label: t("date"), format: "date" },
  ];

  function handleCreatePO(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const items: {
      part_id: string;
      quantity_ordered: number;
      unit_cost: number;
    }[] = [];
    const itemCount = Number(form.get("item_count") || 0);
    for (let i = 0; i < itemCount; i++) {
      const partId = form.get(`item_${i}_part_id`);
      if (!partId) continue;
      items.push({
        part_id: partId as string,
        quantity_ordered: Number(form.get(`item_${i}_qty`) || 1),
        unit_cost: Number(form.get(`item_${i}_cost`) || 0),
      });
    }

    if (!items.length) {
      toast.error(t("addAtLeastOneItem"));
      return;
    }

    createPO.mutate(
      {
        supplier_id: (form.get("supplier_id") as string) || undefined,
        order_number: form.get("order_number") as string,
        notes: (form.get("notes") as string) || undefined,
        items,
      },
      {
        onSuccess: () => {
          toast.success(t("poCreated"));
          setShowAddPO(false);
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  }

  function handleReceivePO(poId: string) {
    receivePO.mutate(poId, {
      onSuccess: () => toast.success(t("poReceived")),
      onError: (err: Error) => toast.error(err.message),
    });
  }

  function handleTogglePO(poId: string) {
    setExpandedPO((prev) => (prev === poId ? null : poId));
  }

  const activeParts = parts.filter((p) => p.is_active);

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        search={{
          placeholder: t("searchPOs"),
          value: search,
          onChange: onSearchChange,
        }}
        stats={
          <span>
            {filteredPOs.length} {t("purchaseOrders")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={purchaseOrders}
              columns={poExportColumns}
              filename={`inventory-pos-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Purchase Orders"
            />
            <Button size="default" onClick={() => setShowAddPO(true)}>
              <Plus className="size-4" />
              {t("createPO")}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : purchaseOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Truck className="size-10 text-muted-foreground/40" />
            <Typography.Muted className="text-muted-foreground">
              {t("noPurchaseOrders")}
            </Typography.Muted>
            <Button variant="outline" onClick={() => setShowAddPO(true)}>
              {t("createFirstPO")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPOs.map((po) => (
            <POListItem
              key={po.id}
              po={po}
              orgId={orgId}
              onReceive={handleReceivePO}
              onToggle={handleTogglePO}
              t={t}
              poStatusLabels={poStatusLabels}
            />
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      {showAddPO && (
        <Modal title={t("createPO")} onClose={() => setShowAddPO(false)}>
          <form onSubmit={handleCreatePO} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="inv-po-order-number"
                  className="text-sm font-medium"
                >
                  {t("orderNumber")} *
                </label>
                <Input
                  id="inv-po-order-number"
                  name="order_number"
                  required
                  placeholder="PO-001"
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="inv-po-supplier"
                  className="text-sm font-medium"
                >
                  {t("supplier")}
                </label>
                <select
                  id="inv-po-supplier"
                  name="supplier_id"
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t("noSupplier")}</option>
                  {suppliers
                    .filter((s) => s.is_active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="inv-po-notes" className="text-sm font-medium">
                {t("notes")}
              </label>
              <Input
                id="inv-po-notes"
                name="notes"
                placeholder={t("optionalNotes")}
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <Typography.Text className="text-sm font-medium">
                  {t("items")}
                </Typography.Text>
              </div>
              <POItemEditor parts={activeParts} locale={locale} t={t} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddPO(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={createPO.isPending}>
                {t("createPO")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function POListItem({
  po,
  orgId,
  onReceive,
  onToggle,
  t,
  poStatusLabels,
}: {
  po: PurchaseOrderWithSupplier;
  orgId: string;
  onReceive: (id: string) => void;
  onToggle: (id: string) => void;
  t: (key: string) => string;
  poStatusLabels: Record<string, string>;
}) {
  const { data: items = [], isLoading: itemsLoading } = usePurchaseOrderItems(
    orgId,
    po.id,
  );

  return (
    <Card>
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start gap-4 px-6 py-4"
        onClick={() => onToggle(po.id)}
      >
        <span className="flex min-w-0 flex-1 flex-col items-start">
          <span className="font-medium">{po.order_number}</span>
          <span className="text-sm text-muted-foreground">
            {po.supplier?.name ?? t("noSupplier")}
          </span>
        </span>
        <Badge variant="outline">
          {poStatusLabels[po.status] ?? po.status}
        </Badge>
        <span className="text-sm font-semibold tabular-nums">
          {formatMNT(po.total_amount)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDate(po.created_at)}
        </span>
      </Button>

      {itemsLoading ? (
        <div className="border-t border-border px-6 py-4">
          <Skeleton className="h-10 w-full" />
        </div>
      ) : items.length > 0 ? (
        <div className="border-t border-border px-6 py-4">
          <div className="flex flex-col gap-2">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="py-2 pr-4 text-left font-medium text-muted-foreground">
                    {t("part")}
                  </TableHead>
                  <TableHead className="py-2 pr-4 text-right font-medium text-muted-foreground">
                    {t("quantityOrdered")}
                  </TableHead>
                  <TableHead className="py-2 pr-4 text-right font-medium text-muted-foreground">
                    {t("quantityReceived")}
                  </TableHead>
                  <TableHead className="py-2 text-right font-medium text-muted-foreground">
                    {t("unitCost")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="border-b border-border/50">
                    <TableCell className="py-2 pr-4">
                      {item.part_name}
                    </TableCell>
                    <TableCell className="py-2 pr-4 text-right tabular-nums">
                      {item.quantity_ordered}
                    </TableCell>
                    <TableCell className="py-2 pr-4 text-right tabular-nums">
                      {item.quantity_received}
                    </TableCell>
                    <TableCell className="py-2 text-right tabular-nums">
                      {formatMNT(item.unit_cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {po.status !== "received" && po.status !== "cancelled" && (
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={() => onReceive(po.id)}>
                  <Truck className="size-3" />
                  {t("receiveStock")}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function POItemEditor({
  parts,
  locale,
  t,
}: {
  parts: {
    id: string;
    name: string;
    name_mn: string | null;
    is_active: boolean;
  }[];
  locale: string;
  t: (key: string) => string;
}) {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="item_count" value={count} />
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`item-${i}`}
          className="flex items-end gap-2 border-b border-border pb-2"
        >
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("part")}</span>
            <select
              name={`item_${i}_part_id`}
              required
              className="h-9 w-full rounded border border-input bg-background px-2 text-sm"
            >
              <option value="">{t("select")}</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {locale === "mn" && p.name_mn ? p.name_mn : p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-20 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("qty")}</span>
            <input
              type="number"
              name={`item_${i}_qty`}
              defaultValue={1}
              min={1}
              className="h-9 w-full rounded border border-input bg-background px-2 text-sm text-center"
            />
          </div>
          <div className="w-24 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {t("unitCost")}
            </span>
            <input
              type="number"
              name={`item_${i}_cost`}
              defaultValue={0}
              min={0}
              className="h-9 w-full rounded border border-input bg-background px-2 text-sm text-right"
            />
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCount((c) => c - 1)}
            className="text-destructive/70 hover:text-destructive"
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCount((c) => c + 1)}
        className="gap-1 text-primary"
      >
        <Plus className="size-3" />
        {t("addItem")}
      </Button>
    </div>
  );
}
