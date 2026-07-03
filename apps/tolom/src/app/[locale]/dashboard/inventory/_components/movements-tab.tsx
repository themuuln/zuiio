"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumericInput } from "@/components/ui/numeric-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import {
  useCreateMovement,
  useInventoryBalances,
  useInventoryMovements,
} from "@/lib/queries/use-inventory";
import type { InventoryMovement, PartsCatalogItem } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { formatDate, getMovementFilters, getMovementLabels } from "./constants";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { TableSkeleton } from "./table-skeleton";

// API returns part_name joined on movements
type MovementRow = InventoryMovement & { part_name: string };

interface MovementsTabProps {
  orgId: string;
  branchFilter?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  movementFilter: string;
  onMovementFilterChange: (filter: string) => void;
}

export function MovementsTab({
  orgId,
  branchFilter,
  search,
  onSearchChange,
  movementFilter,
  onMovementFilterChange,
}: MovementsTabProps) {
  // const locale = useLocale();
  const t = useTranslations("inventory");
  const now = useClientNow();
  const movementLabels = useMemo(() => getMovementLabels(t), [t]);
  const movementFilters = useMemo(() => getMovementFilters(t), [t]);

  const { data: movements = [], isLoading } = useInventoryMovements(
    orgId,
    undefined,
    branchFilter,
  );
  const createMovement = useCreateMovement(orgId);
  const { data: balances = [] } = useInventoryBalances(orgId, branchFilter);

  const [showAddMovement, setShowAddMovement] = useState(false);
  const [movementForm, setMovementForm] = useState({
    part_id: "",
    part_name: "",
    quantity: "",
    unit_cost: "",
    movement_type: "purchase",
    notes: "",
  });
  const balanceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of balances) {
      if (b.part_id) map.set(b.part_id, b.quantity_on_hand ?? 0);
    }
    return map;
  }, [balances]);

  const [parts, setParts] = useState<PartsCatalogItem[]>([]);
  const [partsSearch, setPartsSearch] = useState("");

  const filteredMovements = useMemo(() => {
    let list = movements;
    if (movementFilter && movementFilter !== "all") {
      list = list.filter((m) => m.movement_type === movementFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          ("part_name" in m &&
            (m as MovementRow).part_name.toLowerCase().includes(q)) ||
          (m.notes ?? "").toLowerCase().includes(q) ||
          (m.reference_type ?? "").toLowerCase().includes(q),
      );
    }
    return list as MovementRow[];
  }, [movements, movementFilter, search]);

  const movementExportColumns: ExportColumn<MovementRow>[] = [
    { key: "created_at", label: t("date"), format: "date" },
    {
      key: "movement_type",
      label: t("movementType"),
      value: (m) => movementLabels[m.movement_type] ?? m.movement_type,
    },
    { key: "part_name", label: t("part") },
    { key: "quantity", label: t("qty"), format: "number" },
    { key: "unit_cost", label: t("unitCost"), format: "number" },
    { key: "reference_type", label: t("reference") },
    { key: "notes", label: t("notes") },
  ];

  const columns: ColumnDef<MovementRow>[] = useMemo(
    () => [
      {
        id: "date",
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("date")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        accessorKey: "movement_type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("movementType")} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline">
            {movementLabels[row.original.movement_type] ??
              row.original.movement_type}
          </Badge>
        ),
      },
      {
        id: "part_name",
        accessorKey: "part_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("part")} />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.part_name}</span>
        ),
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("qty")} />
        ),
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            {row.original.quantity}
          </span>
        ),
      },
      {
        accessorKey: "unit_cost",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("unitCost")} />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.unit_cost ? formatMNT(row.original.unit_cost) : "—"}
          </span>
        ),
      },
      {
        id: "reference",
        accessorKey: "reference_type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("reference")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.reference_type ?? "—"}
          </span>
        ),
      },
      {
        id: "notes",
        accessorKey: "notes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("notes")} />
        ),
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate text-xs text-muted-foreground">
            {row.original.notes ?? "—"}
          </span>
        ),
      },
    ],
    [t, movementLabels],
  );

  async function handleRecordMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!movementForm.part_id || !movementForm.quantity) {
      toast.error(t("selectPartAndQty"));
      return;
    }

    const body = {
      part_id: movementForm.part_id,
      quantity: parseInt(movementForm.quantity, 10),
      movement_type: movementForm.movement_type,
      unit_cost: movementForm.unit_cost
        ? parseFloat(movementForm.unit_cost)
        : undefined,
      notes: movementForm.notes || undefined,
    };

    createMovement.mutate(body, {
      onSuccess: () => {
        toast.success(t("movementRecorded"));
        setShowAddMovement(false);
        setMovementForm({
          part_id: "",
          part_name: "",
          quantity: "",
          unit_cost: "",
          movement_type: "purchase",
          notes: "",
        });
      },
      onError: (err: Error) => toast.error(err.message),
    });
  }

  async function searchParts(q: string) {
    setPartsSearch(q);
    if (q.length < 2) {
      setParts([]);
      return;
    }
    try {
      const r = await fetch(
        `/api/organizations/${orgId}/inventory/parts?q=${encodeURIComponent(q)}&limit=10`,
      );
      const d = await r.json();
      setParts(d.data ?? []);
    } catch {
      setParts([]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        search={{
          placeholder: t("searchMovements"),
          value: search,
          onChange: onSearchChange,
        }}
        filters={
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[movementFilter]}
            onValueChange={(values) => {
              const next = values[0] ?? "all";
              if (next !== movementFilter) onMovementFilterChange(next);
            }}
            className="flex-wrap gap-1.5"
          >
            {movementFilters.map((filter) => (
              <ToggleGroupItem key={filter.key} value={filter.key}>
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
        stats={
          <span>
            {filteredMovements.length} {t("movements")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={filteredMovements}
              columns={movementExportColumns}
              filename={`inventory-movements-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Movements"
            />
            <Button size="default" onClick={() => setShowAddMovement(true)}>
              {t("recordMovement")}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : movements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <ClipboardList className="size-10 text-muted-foreground/40" />
            <Typography.Muted className="text-muted-foreground">
              {t("noMovements")}
            </Typography.Muted>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <DataTable
              columns={columns}
              data={filteredMovements}
              getRowId={(row) => row.id}
              pageSize={20}
              renderMobileCard={(m) => (
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(m.created_at)}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {movementLabels[m.movement_type] ?? m.movement_type}
                    </Badge>
                  </div>
                  <span className="font-medium">{m.part_name}</span>
                  <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">Qty: {m.quantity}</span>
                      <span>·</span>
                      <span className="tabular-nums">
                        {m.unit_cost ? formatMNT(m.unit_cost) : "—"}
                      </span>
                    </div>
                    <span className="truncate max-w-[120px]">
                      {m.reference_type || m.notes || "—"}
                    </span>
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Record Movement Drawer */}
      <DetailDrawer
        open={showAddMovement}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddMovement(false);
            setMovementForm({
              part_id: "",
              part_name: "",
              quantity: "",
              unit_cost: "",
              movement_type: "purchase",
              notes: "",
            });
            setParts([]);
            setPartsSearch("");
          }
        }}
        size="lg"
      >
        <DetailDrawer.Header>
          <DetailDrawer.Title>{t("recordStockMovement")}</DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <form
            id="record-movement-form"
            onSubmit={handleRecordMovement}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t("part")} *</label>
              <Input
                placeholder={t("searchParts")}
                value={partsSearch}
                onChange={(e) => searchParts(e.target.value)}
              />
              {parts.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {parts.map((p) => (
                    <Button
                      key={p.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMovementForm((prev) => ({
                          ...prev,
                          part_id: p.id,
                          part_name: p.name,
                        }));
                        setParts([]);
                        setPartsSearch(p.name);
                      }}
                    >
                      {p.name}
                    </Button>
                  ))}
                </div>
              )}
              {movementForm.part_id && !partsSearch && (
                <div className="flex items-center justify-between">
                  <Typography.Muted className="text-sm text-muted-foreground">
                    {t("selectedPart")}: {movementForm.part_name}
                  </Typography.Muted>
                  <Badge variant="outline" className="gap-1.5">
                    {t("currentBalance")}:{" "}
                    <span className="font-semibold tabular-nums">
                      {balanceMap.get(movementForm.part_id) ?? 0}
                    </span>
                  </Badge>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <NumericInput
                  value={Number(movementForm.quantity) || 0}
                  onChange={(qty) =>
                    setMovementForm((prev) => ({
                      ...prev,
                      quantity: String(qty),
                    }))
                  }
                  min={1}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <CurrencyInput
                  value={movementForm.unit_cost ? Number(movementForm.unit_cost) : 0}
                  onChange={(cost) =>
                    setMovementForm((prev) => ({
                      ...prev,
                      unit_cost: String(cost),
                    }))
                  }
                  showPrefix={false}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t("movementType")}</label>
              <select
                value={movementForm.movement_type}
                onChange={(e) =>
                  setMovementForm((prev) => ({
                    ...prev,
                    movement_type: e.target.value,
                  }))
                }
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(movementLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t("notes")}</label>
              <Input
                value={movementForm.notes}
                onChange={(e) =>
                  setMovementForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </div>
          </form>
        </DetailDrawer.Body>
        <DetailDrawer.Footer>
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowAddMovement(false);
                setMovementForm({
                  part_id: "",
                  part_name: "",
                  quantity: "",
                  unit_cost: "",
                  movement_type: "purchase",
                  notes: "",
                });
                setParts([]);
                setPartsSearch("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              className="flex-1"
              form="record-movement-form"
              type="submit"
              disabled={createMovement.isPending}
            >
              {t("record")}
            </Button>
          </div>
        </DetailDrawer.Footer>
      </DetailDrawer>
    </div>
  );
}
