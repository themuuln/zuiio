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
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import {
  useCreateMovement,
  useInventoryBalances,
  useInventoryMovements,
} from "@/lib/queries/use-inventory";
import type { InventoryMovement, PartsCatalogItem } from "@/lib/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatMNT } from "@/lib/utils";
import { formatDate, MOVEMENT_FILTERS, MOVEMENT_LABELS } from "./constants";
import { Modal } from "./modal";
import { TableSkeleton } from "./table-skeleton";

// API returns part_name joined on movements
type MovementRow = InventoryMovement & { part_name: string };

interface MovementsTabProps {
  orgId: string;
  search: string;
  onSearchChange: (value: string) => void;
  movementFilter: string;
  onMovementFilterChange: (filter: string) => void;
}

export function MovementsTab({
  orgId,
  search,
  onSearchChange,
  movementFilter,
  onMovementFilterChange,
}: MovementsTabProps) {
  // const locale = useLocale();
  const t = useTranslations("inventory");
  const now = useClientNow();

  const { data: movements = [], isLoading } = useInventoryMovements(orgId);
  const createMovement = useCreateMovement(orgId);
  const { data: balances = [] } = useInventoryBalances(orgId);

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
    { key: "created_at", label: "Date", format: "date" },
    {
      key: "movement_type",
      label: "Type",
      value: (m) => MOVEMENT_LABELS[m.movement_type] ?? m.movement_type,
    },
    { key: "part_name", label: "Part" },
    { key: "quantity", label: "Qty", format: "number" },
    { key: "unit_cost", label: "Unit Cost", format: "number" },
    { key: "reference_type", label: "Reference" },
    { key: "notes", label: "Notes" },
  ];

  const columns: ColumnDef<MovementRow>[] = useMemo(
    () => [
      {
        id: "date",
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
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
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline">
            {MOVEMENT_LABELS[row.original.movement_type] ??
              row.original.movement_type}
          </Badge>
        ),
      },
      {
        id: "part_name",
        accessorKey: "part_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Part" />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.part_name}</span>
        ),
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Qty" />
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
          <DataTableColumnHeader column={column} title="Unit Cost" />
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
          <DataTableColumnHeader column={column} title="Ref" />
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
          <DataTableColumnHeader column={column} title="Notes" />
        ),
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate text-xs text-muted-foreground">
            {row.original.notes ?? "—"}
          </span>
        ),
      },
    ],
    [],
  );

  async function handleRecordMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!movementForm.part_id || !movementForm.quantity) {
      toast.error("Please select a part and enter a quantity");
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
        toast.success("Movement recorded");
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
            {MOVEMENT_FILTERS.map((filter) => (
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
              Record Movement
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
                      {MOVEMENT_LABELS[m.movement_type] ?? m.movement_type}
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

      {/* Record Movement Modal */}
      {showAddMovement && (
        <Modal
          title="Record Stock Movement"
          onClose={() => {
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
          <form onSubmit={handleRecordMovement} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Part *</label>
              <Input
                placeholder="Search parts..."
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
                    Selected: {movementForm.part_name}
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
                <label className="text-sm font-medium">Quantity *</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={movementForm.quantity}
                  onChange={(e) =>
                    setMovementForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Unit Cost</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="₮"
                  value={movementForm.unit_cost}
                  onChange={(e) =>
                    setMovementForm((prev) => ({
                      ...prev,
                      unit_cost: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Movement Type</label>
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
                {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Notes</label>
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
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddMovement(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMovement.isPending}>
                Record
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
