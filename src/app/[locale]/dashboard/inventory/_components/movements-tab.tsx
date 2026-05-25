"use client";

import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { type FilterChip, FilterChips } from "@/components/filter-chips";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClientNow } from "@/hooks/use-client-now";
import {
  useCreateMovement,
  useInventoryMovements,
} from "@/lib/queries/use-inventory";
import type { InventoryMovement, PartsCatalogItem } from "@/lib/types";
import type { ExportColumn } from "@/lib/export";
import { formatMNT } from "@/lib/utils";
import {
  MOVEMENT_COLORS,
  MOVEMENT_FILTER_TYPES,
  MOVEMENT_LABELS,
  formatDate,
} from "./constants";
import { Modal } from "./modal";
import { TableSkeleton } from "./table-skeleton";

// API returns part_name joined on movements
type MovementRow = InventoryMovement & { part_name: string };
type MovementFormData = {
  part_id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  notes?: string;
};

interface MovementsTabProps {
  orgId: string;
  search: string;
  onSearchChange: (value: string) => void;
  parts: PartsCatalogItem[];
}

export function MovementsTab({ orgId, search, onSearchChange, parts }: MovementsTabProps) {
  const locale = useLocale();
  const t = useTranslations("inventory");
  const now = useClientNow();
  const [movementFilter, setMovementFilter] = useState("");
  const [showAddMovement, setShowAddMovement] = useState(false);

  const { data: movements = [], isLoading } = useInventoryMovements(
    orgId,
    movementFilter || undefined,
  );
  const createMovement = useCreateMovement(orgId);

  const movementChips: FilterChip[] = useMemo(
    () =>
      MOVEMENT_FILTER_TYPES.map((type) => ({
        key: type || "all",
        label: type ? (MOVEMENT_LABELS[type] ?? type) : "All",
        active: movementFilter === type,
        onClick: () => setMovementFilter(type),
      })),
    [movementFilter],
  );

  const movementExportColumns: ExportColumn<MovementRow>[] = [
    { key: "created_at", label: "Date", format: "date" },
    { key: "movement_type", label: "Type" },
    { key: "part_name", label: "Part" },
    { key: "quantity", label: "Qty" },
    { key: "unit_cost", label: "Unit Cost", format: "currency" },
    { key: "reference_type", label: "Ref" },
    { key: "notes", label: "Notes" },
  ];

  function handleAddMovement(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body: MovementFormData = {
      part_id: form.get("part_id") as string,
      movement_type: form.get("movement_type") as string,
      quantity: Number(form.get("quantity")),
      unit_cost: form.get("unit_cost")
        ? Number(form.get("unit_cost"))
        : undefined,
      notes: (form.get("notes") as string) || undefined,
    };
    createMovement.mutate(body, {
      onSuccess: () => {
        toast.success("Movement recorded");
        setShowAddMovement(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  }

  const activeParts = parts.filter((p) => p.is_active);

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        search={{
          placeholder: t("searchMovements"),
          value: search,
          onChange: onSearchChange,
        }}
        filters={<FilterChips items={movementChips} />}
        stats={<span>{movements.length} movements</span>}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={movements as MovementRow[]}
              columns={movementExportColumns}
              filename={`inventory-movements-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Movements"
            />
            <Button size="lg" onClick={() => setShowAddMovement(true)}>
              <ClipboardList className="size-4" />
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
            <p className="text-muted-foreground">{t("noMovements")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Part
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Qty
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Unit Cost
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Ref
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Notes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(movements as MovementRow[]).map((m) => (
                  <TableRow key={m.id} className="border-b border-border">
                    <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(m.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline">
                        {MOVEMENT_LABELS[m.movement_type] ?? m.movement_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium">
                      {m.part_name}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold tabular-nums">
                      {m.quantity}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {m.unit_cost ? formatMNT(m.unit_cost) : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                      {m.reference_type ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                      {m.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Record Movement Modal */}
      {showAddMovement && (
        <Modal
          title="Record Stock Movement"
          onClose={() => setShowAddMovement(false)}
        >
          <form onSubmit={handleAddMovement} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="inv-part-select"
                className="text-sm font-medium"
              >
                Part *
              </label>
              <select
                id="inv-part-select"
                name="part_id"
                required
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Select part</option>
                {activeParts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {locale === "mn" && p.name_mn ? p.name_mn : p.name} (
                    {p.part_number ?? "no #"})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="inv-movement-type"
                className="text-sm font-medium"
              >
                Movement Type *
              </label>
              <select
                id="inv-movement-type"
                name="movement_type"
                required
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Select type</option>
                <option value="purchase">Purchase (stock in)</option>
                <option value="sale">Sale (stock out)</option>
                <option value="adjustment">Adjustment</option>
                <option value="return">Return to Supplier</option>
                <option value="waste">Waste / Damaged</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="inv-quantity" className="text-sm font-medium">
                  Quantity *
                </label>
                <Input
                  id="inv-quantity"
                  name="quantity"
                  type="number"
                  required
                  min="1"
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="inv-unit-cost"
                  className="text-sm font-medium"
                >
                  Unit Cost (₮)
                </label>
                <Input
                  id="inv-unit-cost"
                  name="unit_cost"
                  type="number"
                  min="0"
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="inv-movement-notes"
                className="text-sm font-medium"
              >
                Notes
              </label>
              <Input
                id="inv-movement-notes"
                name="notes"
                placeholder="Optional notes"
                className="h-11"
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
              <Button type="submit">Record</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
