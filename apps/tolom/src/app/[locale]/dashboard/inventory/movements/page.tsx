"use client";

import { ClipboardList, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { type FilterChip, FilterChips } from "@/components/filter-chips";
import { ListToolbar } from "@/components/list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import {
  useCreateMovement,
  useInventoryMovements,
  usePartsCatalog,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import type { InventoryMovement } from "@/lib/types";

const MOVEMENT_TYPES = [
  "",
  "purchase",
  "sale",
  "adjustment",
  "return",
  "waste",
];

const _MOVEMENT_COLORS: Record<string, string> = {
  purchase: "text-green-600 bg-green-50",
  sale: "text-red-600 bg-red-50",
  adjustment: "text-blue-600 bg-blue-50",
  transfer_in: "text-purple-600 bg-purple-50",
  transfer_out: "text-purple-600 bg-purple-50",
  return: "text-amber-600 bg-amber-50",
  waste: "text-gray-600 bg-gray-50",
};

export default function MovementsPage() {
  const t = useTranslations("inventory");
  const now = useClientNow();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [unitCost, setUnitCost] = useState(0);

  const { data: movements = [], isLoading } = useInventoryMovements(
    orgId,
    typeFilter,
    branchFilter,
  );
  const { data: parts = [] } = usePartsCatalog(orgId);
  const createMovement = useCreateMovement(orgId);

  const filtered = useMemo(() => {
    if (!search) return movements;
    const q = search.toLowerCase();
    return movements.filter((m) =>
      (m as InventoryMovement & { part_name?: string }).part_name
        ?.toLowerCase()
        .includes(q),
    );
  }, [movements, search]);

  const typeChips: FilterChip[] = useMemo(
    () =>
      MOVEMENT_TYPES.map((key) => ({
        key: key || "all",
        label: key
          ? t(`movement${key.charAt(0).toUpperCase() + key.slice(1)}` as string)
          : t("all"),
        active: typeFilter === key,
        onClick: () => setTypeFilter(key),
      })),
    [typeFilter, t],
  );

  const exportColumns: ExportColumn<InventoryMovement>[] = [
    { key: "created_at", label: t("date"), format: "date" },
    {
      key: "movement_type",
      label: t("movementType"),
      value: (m) =>
        t(
          `movement${m.movement_type.charAt(0).toUpperCase() + m.movement_type.slice(1)}` as string,
        ),
    },
    {
      key: "part_id",
      label: t("part"),
      value: (m) =>
        (m as InventoryMovement & { part_name?: string }).part_name ?? "—",
    },
    { key: "quantity", label: t("quantity") },
    { key: "unit_cost", label: t("unitCost"), format: "currency" },
    { key: "reference_type", label: t("reference") },
    { key: "notes", label: t("notes") },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createMovement.mutateAsync({
        quantity: quantity,
        part_id: form.get("part_id") as string,
        movement_type: form.get("movement_type") as string,
        unit_cost: unitCost || undefined,
        reference_type: (form.get("reference_type") as string) || undefined,
        reference_id: (form.get("reference_id") as string) || undefined,
        notes: (form.get("notes") as string) || undefined,
      });
      toast.success(t("movementRecorded"));
      setQuantity(0);
      setUnitCost(0);
      setShowDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToRecord"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("movementsTitle")}
        </Typography.H1>
        <Typography.Muted className="text-muted-foreground">
          {t("movementsSubtitle")}
        </Typography.Muted>
      </div>

      <ListToolbar
        search={{
          placeholder: t("searchMovements"),
          value: search,
          onChange: setSearch,
        }}
        filters={<FilterChips items={typeChips} />}
        stats={
          <span>
            {filtered.length} {t("movements")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={filtered}
              columns={exportColumns}
              filename={`movements-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Movements"
            />
            <Button
              size="default"
              className="h-12"
              onClick={() => setShowDialog(true)}
            >
              <Plus className="size-5" /> {t("newMovement")}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList />
                </EmptyMedia>
                <EmptyTitle>{t("noMovements")}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setShowDialog(true)}>
                  {t("recordFirstMovement")}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 p-4 min-h-[64px]"
                >
                  <span className="text-xs text-muted-foreground w-24 shrink-0">
                    {new Date(m.created_at).toLocaleDateString("mn-MN")}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {t(
                      `movement${m.movement_type.charAt(0).toUpperCase() + m.movement_type.slice(1)}` as string,
                    )}
                  </Badge>
                  <span className="text-sm font-medium flex-1 min-w-0 truncate">
                    {(m as InventoryMovement & { part_name?: string })
                      .part_name ?? "—"}
                  </span>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {m.quantity}
                  </span>
                  <span className="text-sm text-muted-foreground shrink-0 hidden sm:block">
                    {m.reference_type ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden md:block">
                    {m.notes ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DetailDrawer open={showDialog} onOpenChange={setShowDialog} size="lg">
        <DetailDrawer.Header>
          <DetailDrawer.Title>{t("newMovement")}</DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <form
            id="movement-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="part_id">{t("part")} *</Label>
              <select
                id="part_id"
                name="part_id"
                required
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("selectPart")}</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.part_number ?? t("noNumber")})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="movement_type">{t("movementType")} *</Label>
              <select
                id="movement_type"
                name="movement_type"
                required
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("selectType")}</option>
                {MOVEMENT_TYPES.flatMap((tKey) =>
                  tKey
                    ? [
                        <option key={tKey} value={tKey}>
                          {t(
                            `movement${tKey.charAt(0).toUpperCase() + tKey.slice(1)}` as string,
                          )}
                        </option>,
                      ]
                    : [],
                )}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">{t("quantity")} *</Label>
                <NumericInput
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={(qty) => setQuantity(qty)}
                  step={1}
                  min={1}
                  required
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="unit_cost">{t("unitCost")}</Label>
                <CurrencyInput
                  id="unit_cost"
                  name="unit_cost"
                  value={unitCost}
                  onChange={(cost) => setUnitCost(cost)}
                  showPrefix={false}
                  className="h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="reference_type">{t("referenceType")}</Label>
                <Input
                  id="reference_type"
                  name="reference_type"
                  placeholder={t("referenceTypePlaceholder")}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reference_id">{t("referenceId")}</Label>
                <Input
                  id="reference_id"
                  name="reference_id"
                  placeholder={t("referenceIdPlaceholder")}
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Input
                id="notes"
                name="notes"
                placeholder={t("notesPlaceholder")}
                className="h-11"
              />
            </div>
          </form>
        </DetailDrawer.Body>
        <DetailDrawer.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDialog(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="movement-form"
            disabled={createMovement.isPending}
          >
            {createMovement.isPending ? t("saving") : t("save")}
          </Button>
        </DetailDrawer.Footer>
      </DetailDrawer>
    </div>
  );
}
