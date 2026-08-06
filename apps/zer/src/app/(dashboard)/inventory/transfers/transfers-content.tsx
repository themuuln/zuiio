"use client";

import { ArrowsLeftRight, Check, Plus, X } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import {
  approveStockTransfer,
  cancelStockTransfer,
  createStockTransfer,
} from "./actions";
import type { ProductOption, TransferRow, WarehouseOption } from "./page";

const STATUS_LABELS: Record<TransferRow["status"], string> = {
  pending: "Хүлээгдэж буй",
  completed: "Гүйцэтгэсэн",
  cancelled: "Цуцлагдсан",
};

const STATUS_VARIANTS: Record<
  TransferRow["status"],
  "default" | "secondary" | "destructive"
> = {
  pending: "secondary",
  completed: "default",
  cancelled: "destructive",
};

interface TransferItemDraft {
  id: string;
  product_id: string;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Option combobox (warehouses / products)
// ---------------------------------------------------------------------------

interface Option {
  id: string;
  name: string;
  sku?: string | null;
}

function OptionCombobox({
  options,
  value,
  onChange,
  placeholder,
  renderLabel,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  renderLabel: (option: Option) => string;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? options.filter((o) => o.name.toLowerCase().includes(trimmed))
    : options;

  return (
    <Combobox
      items={filtered}
      value={options.find((o) => o.id === value) ?? null}
      onValueChange={(next: Option | null) => {
        onChange(next?.id ?? "");
        setQuery("");
      }}
      itemToStringValue={(o: Option | null) => o?.id ?? ""}
      itemToStringLabel={(o: Option | null) => o?.name ?? ""}
      inputValue={query}
      onInputValueChange={setQuery}
    >
      <ComboboxInput placeholder={placeholder} showTrigger />
      <ComboboxContent>
        <ComboboxEmpty>Олдсонгүй</ComboboxEmpty>
        <ComboboxList>
          {(option: Option) => (
            <ComboboxItem key={option.id}>{renderLabel(option)}</ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// ---------------------------------------------------------------------------
// TransfersContent
// ---------------------------------------------------------------------------

export function TransfersContent({
  transfers,
  warehouses,
  products,
  stockTotals,
}: {
  transfers: TransferRow[];
  warehouses: WarehouseOption[];
  products: ProductOption[];
  stockTotals: Record<string, number>;
}) {
  const { t } = useI18n();
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [items, setItems] = useState<TransferItemDraft[]>([]);
  const [notes, setNotes] = useState("");

  const [createState, createAction, createPending] = useActionState(
    createStockTransfer,
    undefined,
  );

  const [confirmAction, setConfirmAction] = useState<{
    kind: "approve" | "cancel";
    transfer: TransferRow;
  } | null>(null);
  const [actionPending, setActionPending] = useState(false);

  // Close create drawer on success
  useEffect(() => {
    if (createState && "success" in createState) {
      setCreateOpen(false);
      setFromWarehouseId("");
      setToWarehouseId("");
      setItems([]);
      setNotes("");
      toast.success(t("transfers.created"));
      router.refresh();
    }
  }, [createState, router, t]);

  const warehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name ?? id.slice(0, 8);

  const updateItem = (index: number, patch: Partial<TransferItemDraft>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  async function runConfirmAction() {
    if (!confirmAction) return;
    const { kind, transfer } = confirmAction;
    setActionPending(true);

    const formData = new FormData();
    formData.set("id", transfer.id);
    const result =
      kind === "approve"
        ? await approveStockTransfer(undefined, formData)
        : await cancelStockTransfer(undefined, formData);

    setActionPending(false);
    setConfirmAction(null);

    if (result && "error" in result && result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        kind === "approve" ? t("transfers.approved") : t("transfers.cancelled"),
      );
      router.refresh();
    }
  }

  const columns: ColumnDef<TransferRow>[] = [
    {
      accessorFn: (row) => row.created_at ?? "",
      id: "created_at",
      header: t("transfers.createdAt"),
      cell: ({ row }) => formatDate(row.original.created_at ?? ""),
    },
    {
      accessorFn: (row) => row.from_warehouse_id,
      id: "route",
      header: t("transfers.route"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs font-medium sm:text-sm">
          <span>{warehouseName(row.original.from_warehouse_id)}</span>
          <ArrowsLeftRight className="size-3.5 text-muted-foreground" />
          <span>{warehouseName(row.original.to_warehouse_id)}</span>
        </div>
      ),
    },
    {
      accessorFn: (row) => row.status,
      id: "status",
      header: t("transfers.status"),
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorFn: (row) => row.notes ?? "",
      id: "notes",
      header: t("transfers.notes"),
      cell: ({ row }) =>
        row.original.notes ?? <span className="text-muted-foreground">-</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const transfer = row.original;
        if (transfer.status !== "pending") return null;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              title={t("transfers.approve")}
              onClick={() => setConfirmAction({ kind: "approve", transfer })}
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              title={t("transfers.cancel")}
              onClick={() => setConfirmAction({ kind: "cancel", transfer })}
            >
              <X className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const newTransferButton = (
    <Button size="sm" onClick={() => setCreateOpen(true)}>
      <Plus data-icon="inline-start" />
      {t("transfers.new")}
    </Button>
  );

  return (
    <>
      <PageShell
        title={t("transfers.title")}
        description={t("transfers.description")}
        actions={newTransferButton}
      >
        {/* Per-warehouse stock summary */}
        {warehouses.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("transfers.warehouseStock")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {warehouses.map((wh) => (
                <Card key={wh.id}>
                  <CardHeader className="pb-1">
                    <CardTitle className="truncate text-sm font-medium text-muted-foreground">
                      {wh.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tabular-nums">
                      {(stockTotals[wh.id] ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("transfers.totalUnits")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {transfers.length === 0 ? (
          <ErpEmptyState
            icon={<ArrowsLeftRight className="size-4" />}
            title={t("transfers.emptyTitle")}
            description={t("transfers.emptyDescription")}
            action={newTransferButton}
          />
        ) : (
          <DataTable columns={columns} data={transfers} />
        )}
      </PageShell>

      {/* Create transfer drawer */}
      <SlideInDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t("transfers.new")}
        description={t("transfers.description")}
        footer={
          <DrawerFooter>
            <DrawerCancel onClick={() => setCreateOpen(false)} />
            <DrawerSubmit
              form="create-transfer-form"
              isPending={createPending}
              label={t("transfers.submit")}
            />
          </DrawerFooter>
        }
      >
        <form
          id="create-transfer-form"
          action={createAction}
          className="space-y-6"
        >
          {createState?.error && <ErrorBanner error={createState.error} />}
          <input type="hidden" name="items" value={JSON.stringify(items)} />

          <FieldGroup>
            <Field>
              <FieldLabel>{t("transfers.fromWarehouse")}</FieldLabel>
              <OptionCombobox
                options={warehouses}
                value={fromWarehouseId}
                onChange={setFromWarehouseId}
                placeholder={t("transfers.warehousePlaceholder")}
                renderLabel={(w) => w.name}
              />
            </Field>
            <Field>
              <FieldLabel>{t("transfers.toWarehouse")}</FieldLabel>
              <OptionCombobox
                options={warehouses.filter((w) => w.id !== fromWarehouseId)}
                value={toWarehouseId}
                onChange={setToWarehouseId}
                placeholder={t("transfers.warehousePlaceholder")}
                renderLabel={(w) => w.name}
              />
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel>{t("transfers.items")}</FieldLabel>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <OptionCombobox
                      options={products}
                      value={item.product_id}
                      onChange={(productId) =>
                        updateItem(index, { product_id: productId })
                      }
                      placeholder={t("transfers.productPlaceholder")}
                      renderLabel={(p) => p.name + (p.sku ? ` (${p.sku})` : "")}
                    />
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    className="w-24"
                    value={item.quantity || ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateItem(index, {
                        quantity: Number(e.target.value) || 0,
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(index)}
                    aria-label={t("common.delete")}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), product_id: "", quantity: 1 },
                  ])
                }
              >
                <Plus data-icon="inline-start" />
                {t("transfers.addItem")}
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabel>{t("transfers.notes")}</FieldLabel>
            <Textarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("transfers.notesPlaceholder")}
              rows={3}
            />
          </Field>
        </form>
      </SlideInDrawer>

      {/* Approve / cancel confirmation */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !actionPending) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.kind === "approve"
                ? t("transfers.approveConfirmTitle")
                : t("transfers.cancelConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.kind === "approve"
                ? t("transfers.approveConfirmDescription")
                : t("transfers.cancelConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionPending}
              onClick={runConfirmAction}
            >
              {confirmAction?.kind === "approve"
                ? t("transfers.approve")
                : t("transfers.cancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
