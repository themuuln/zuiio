"use client";

import { capture } from "@zuiio/capture";
import {
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePartsCatalog } from "@/lib/queries/use-inventory";
import {
  useAddCountItem,
  useCreateStockCountSession,
  useReconcileSession,
} from "@/lib/queries/use-stock-counts";

// ── Types ──────────────────────────────────────────────────────

interface CountItemEntry {
  partId: string;
  partName: string;
  partNumber?: string | null;
  systemQuantity: number;
  physicalQuantity: number;
}

// ── Props ──────────────────────────────────────────────────────

interface StartCountDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

// ── Component ──────────────────────────────────────────────────

export function StartCountDrawer({
  open,
  onOpenChange,
  orgId,
}: StartCountDrawerProps) {
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  // Data
  const { data: parts = [], isPending: partsPending } = usePartsCatalog(orgId);

  // Mutations
  const createSession = useCreateStockCountSession(orgId);
  const addCountItemMut = useAddCountItem(orgId);
  const reconcile = useReconcileSession(orgId);

  // Local state
  const [step, setStep] = useState<"add" | "review" | "done">("add");
  const [partSearch, setPartSearch] = useState("");
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [physicalQuantity, setPhysicalQuantity] = useState(1);
  const [items, setItems] = useState<CountItemEntry[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedResult, setCompletedResult] = useState<{
    movements: number;
    matched: number;
  } | null>(null);

  // Derived
  const filteredParts = useMemo(() => {
    if (!partSearch) return [];
    const q = partSearch.toLowerCase();
    return parts.filter(
      (p) =>
        p.is_active &&
        !items.some((i) => i.partId === p.id) &&
        (p.name.toLowerCase().includes(q) ||
          (p.part_number ?? "").toLowerCase().includes(q)),
    );
  }, [parts, partSearch, items]);

  const selectedPart = useMemo(
    () => parts.find((p) => p.id === selectedPartId),
    [parts, selectedPartId],
  );

  const itemsWithVariance = useMemo(
    () => items.filter((i) => i.physicalQuantity !== i.systemQuantity),
    [items],
  );

  const matched = items.length - itemsWithVariance.length;

  // ── Actions ──────────────────────────────────────────────────

  const selectPart = (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    if (!part) return;
    setSelectedPartId(partId);
    setPhysicalQuantity(1);
    setPartSearch("");
  };

  const addItem = () => {
    if (!selectedPartId || !selectedPart) return;
    const existing = items.find((i) => i.partId === selectedPartId);
    if (existing) return;

    const systemQty = 0; // Will be updated if we can find a balance
    setItems((prev) => [
      ...prev,
      {
        partId: selectedPartId,
        partName: selectedPart.name,
        partNumber: selectedPart.part_number,
        systemQuantity: systemQty,
        physicalQuantity,
      },
    ]);
    setSelectedPartId(null);
    setPhysicalQuantity(1);
  };

  const removeItem = (partId: string) => {
    setItems((prev) => prev.filter((i) => i.partId !== partId));
  };

  const handleComplete = async () => {
    if (items.length === 0 || !orgId) return;
    setIsCompleting(true);
    try {
      // 1. Create session
      const session = await createSession.mutateAsync({});

      // 2. Add each item
      for (const item of items) {
        await addCountItemMut.mutateAsync({
          sessionId: session.id,
          part_id: item.partId,
          physical_quantity: item.physicalQuantity,
        });
      }

      // 3. Reconcile
      const result = await reconcile.mutateAsync({
        sessionId: session.id,
      });

      const movementsCreated =
        "movements_created" in result
          ? (result as unknown as { movements_created: number })
              .movements_created
          : itemsWithVariance.length;

      setCompletedResult({
        movements: movementsCreated,
        matched,
      });
      setStep("done");
      toast.success(t("countCompleted"));
    } catch (err) {
      toast.error(t("countFailed"));
      capture(err, { context: "stock-count complete" });
    } finally {
      setIsCompleting(false);
    }
  };

  const reset = () => {
    setStep("add");
    setPartSearch("");
    setSelectedPartId(null);
    setPhysicalQuantity(1);
    setItems([]);
    setIsCompleting(false);
    setCompletedResult(null);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // ── Quota text helper ────────────────────────────────────────

  const varianceText = (variance: number) => {
    if (variance === 0) return "—";
    return variance > 0 ? `+${variance}` : `${variance}`;
  };

  // ── Render: Step 1 - Add Items ────────────────────────────────

  const renderAddItems = () => (
    <>
      <DetailDrawer.Body>
        <div className="flex flex-col gap-4">
          {/* Part search */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("addItemToCount")}</span>
            <div className="relative">
              <Input
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                placeholder={t("searchPartsToCount")}
                className="h-11"
              />
              {partSearch && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                  {partsPending ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ) : filteredParts.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {t("noPartsMatch")}
                    </div>
                  ) : (
                    filteredParts.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPart(p.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                      >
                        <Search className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">{p.name}</span>
                        {p.part_number && (
                          <span className="text-muted-foreground text-xs">
                            {p.part_number}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected part form */}
          {selectedPart && (
            <div className="flex flex-col rounded-md border p-4 gap-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-sm">
                    {selectedPart.name}
                  </span>
                  {selectedPart.part_number && (
                    <span className="text-xs text-muted-foreground">
                      {selectedPart.part_number}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPartId(null)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t("systemQuantity")}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {0}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t("physicalQuantity")}
                  </span>
                  <NumericInput
                    value={physicalQuantity}
                    onChange={(qty) =>
                      setPhysicalQuantity(Math.max(0, Math.round(qty)))
                    }
                    min={0}
                    className="h-10 text-center"
                  />
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={addItem}
                disabled={
                  !selectedPartId ||
                  items.some((i) => i.partId === selectedPartId)
                }
              >
                <Plus className="size-4 mr-1" />
                {t("addItemToCount")}
              </Button>
            </div>
          )}

          {/* Items list */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                {t("itemsCounted")} ({items.length})
              </span>
              <div className="rounded-md border divide-y divide-border">
                {items.map((item) => {
                  const varValue = item.physicalQuantity - item.systemQuantity;
                  return (
                    <div
                      key={item.partId}
                      className="flex items-center gap-3 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">
                          {item.partName}
                        </span>
                        {item.partNumber && (
                          <span className="text-xs text-muted-foreground">
                            {item.partNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {t("systemQuantity")}: {item.systemQuantity}
                      </span>
                      <span className="text-xs tabular-nums shrink-0">
                        {t("physicalQuantity")}: {item.physicalQuantity}
                      </span>
                      <span className="text-xs tabular-nums shrink-0">
                        {varianceText(varValue)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.partId)}
                        className="shrink-0 text-destructive hover:text-destructive size-8"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions>
          <Button variant="outline" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button
            size="lg"
            disabled={items.length === 0}
            onClick={() => setStep("review")}
          >
            {t("reviewAndComplete")}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </>
  );

  // ── Render: Step 2 - Review ──────────────────────────────────

  const renderReview = () => (
    <>
      <DetailDrawer.Body>
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted/50 p-3">
              <span className="text-xs text-muted-foreground">
                {t("itemsCounted")}
              </span>
              <p className="text-lg font-semibold mt-1">{items.length}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <span className="text-xs text-muted-foreground">
                {t("itemsWithVariance")}
              </span>
              <p className="text-lg font-semibold mt-1">
                {itemsWithVariance.length}
              </p>
            </div>
          </div>

          {/* Items table */}
          <div className="rounded-md border">
            <div className="divide-y divide-border">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                <span className="flex-[2]">{t("part")}</span>
                <span className="flex-1 text-right">{t("systemQuantity")}</span>
                <span className="flex-1 text-right">
                  {t("physicalQuantity")}
                </span>
                <span className="flex-1 text-right">{t("variance")}</span>
              </div>
              {items.map((item) => {
                const varValue = item.physicalQuantity - item.systemQuantity;
                const hasVariance = varValue !== 0;
                return (
                  <div
                    key={item.partId}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm ${
                      hasVariance ? "bg-amber-50 dark:bg-amber-950/10" : ""
                    }`}
                  >
                    <span className="flex-[2] min-w-0 truncate">
                      {item.partName}
                    </span>
                    <span className="flex-1 text-right tabular-nums text-muted-foreground">
                      {item.systemQuantity}
                    </span>
                    <span className="flex-1 text-right tabular-nums font-medium">
                      {item.physicalQuantity}
                    </span>
                    <span
                      className={`flex-1 text-right tabular-nums font-semibold ${
                        hasVariance
                          ? varValue > 0
                            ? "text-amber-600"
                            : "text-red-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {varianceText(varValue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions>
          <Button variant="outline" onClick={() => setStep("add")}>
            <ChevronLeft className="size-4 mr-1" /> {t("back")}
          </Button>
          <Button size="lg" onClick={handleComplete} disabled={isCompleting}>
            {isCompleting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <ClipboardList className="size-4 mr-2" />
                {t("completeCount")}
              </>
            )}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </>
  );

  // ── Render: Step 3 - Done ─────────────────────────────────────

  const renderDone = () => (
    <>
      <DetailDrawer.Body>
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <CheckCircle2 className="size-16 text-emerald-500" />
          <span className="text-lg font-semibold">{t("countCompleted")}</span>
          {completedResult && (
            <p className="text-sm text-muted-foreground">
              {t("countCompletedDesc", {
                movements: completedResult.movements,
                matched: completedResult.matched,
              })}
            </p>
          )}
        </div>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions justify="end">
          <Button size="lg" onClick={handleClose}>
            {t("done")}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </>
  );

  // ── Main Render ──────────────────────────────────────────────

  return (
    <DetailDrawer open={open} onOpenChange={handleClose} size="lg">
      <DetailDrawer.Header>
        <DetailDrawer.Title>
          {step === "add" && t("stockCountTitle")}
          {step === "review" && t("reviewAndComplete")}
          {step === "done" && t("countCompleted")}
        </DetailDrawer.Title>
      </DetailDrawer.Header>

      {step === "add" && renderAddItems()}
      {step === "review" && renderReview()}
      {step === "done" && renderDone()}
    </DetailDrawer>
  );
}
