"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import { vehicleModelKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { HighlightText } from "@/lib/utils/search-utils";
import { VehicleModelFormSheet } from "./_vehicle-model-form-sheet";

interface VehicleModelItem {
  id: string;
  make: string;
  model: string;
  generation: string | null;
  year_start: number | null;
  year_end: number | null;
  engine: string | null;
  body_type: string | null;
}

// ── Tree helpers ──────────────────────────────────────────────

interface VariantItem extends VehicleModelItem {}
interface ModelGroup {
  model: string;
  variants: VariantItem[];
}
interface MakeGroup {
  make: string;
  models: ModelGroup[];
}

function buildTree(items: VehicleModelItem[]): MakeGroup[] {
  const map = new Map<string, Map<string, VariantItem[]>>();
  for (const item of items) {
    let models = map.get(item.make);
    if (!models) {
      models = new Map();
      map.set(item.make, models);
    }
    let variants = models.get(item.model);
    if (!variants) {
      variants = [];
      models.set(item.model, variants);
    }
    variants.push(item);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([make, models]) => ({
      make,
      models: Array.from(models.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([model, variants]) => ({ model, variants })),
    }));
}

// ── Variant display helpers ──────────────────────────────────

function variantYears(v: VariantItem): string {
  if (v.year_start && v.year_end) return `${v.year_start}\u2013${v.year_end}`;
  if (v.year_start) return `from ${v.year_start}`;
  if (v.year_end) return `until ${v.year_end}`;
  return "";
}

function variantDetailLine(v: VariantItem): string {
  return [v.generation, v.engine, v.body_type].filter(Boolean).join(" \u00B7 ");
}

// ── Page component ────────────────────────────────────────────

export default function VehicleModelsPage() {
  const t = useTranslations("vehicleModels");
  const now = useClientNow();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const {
    data: models = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: vehicleModelKeys.list(orgId ?? ""),
    queryFn: async () => {
      const r = await fetch(`/api/organizations/${orgId}/vehicle-models`);
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return (d.data ?? []) as VehicleModelItem[];
    },
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  });

  const error = queryError ? queryError.message : null;

  const [search, setSearch] = useState("");

  // Tree expansion state
  const [expandedMakes, setExpandedMakes] = useState<Set<string>>(new Set());
  const [expandedModels, setExpandedModels] = useState<
    Record<string, Set<string>>
  >({});

  const queryClient = useQueryClient();

  // ── Sheet state ────────────────────────────────────────────────

  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formItem, setFormItem] = useState<VehicleModelItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // ── Delete confirmation state ──────────────────────────────────

  const [deleteItem, setDeleteItem] = useState<VehicleModelItem | null>(null);

  // ── Delete mutation ────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(
        `/api/organizations/${orgId}/vehicle-models/${id}`,
        { method: "DELETE" },
      );
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
      );
      queryClient.setQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
        (old) => (old ?? []).filter((item) => item.id !== id),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          vehicleModelKeys.list(orgId ?? ""),
          context.previous,
        );
      }
      toast.error(t("common.somethingWentWrong"));
    },
    onSuccess: () => toast.success(t("vehicleModels.vehicleDeleted")),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
    },
  });

  const confirmDelete = () => {
    if (!orgId || !deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSettled: () => setDeleteItem(null),
    });
  };

  // ── Tree expansion helpers ────────────────────────────────────

  const toggleMake = (make: string) => {
    setExpandedMakes((prev) => {
      const next = new Set(prev);
      if (next.has(make)) next.delete(make);
      else next.add(make);
      return next;
    });
  };

  const toggleModel = (make: string, model: string) => {
    setExpandedModels((prev) => {
      const next = { ...prev };
      const set = new Set(next[make] ?? []);
      if (set.has(model)) set.delete(model);
      else set.add(model);
      next[make] = set;
      return next;
    });
  };

  const exportColumns: ExportColumn<VehicleModelItem>[] = useMemo(
    () => [
      { key: "make", label: "Make" },
      { key: "model", label: "Model" },
      { key: "generation", label: "Generation" },
      { key: "engine", label: "Engine" },
      { key: "body_type", label: "Body Type" },
      { key: "year_start", label: "Year Start" },
      { key: "year_end", label: "Year End" },
    ],
    [],
  );

  // ── Filtering & tree building ─────────────────────────────────

  const filteredModels = useFuzzySearch(models, search, {
    keys: [
      { name: "make", weight: 0.35 },
      { name: "model", weight: 0.3 },
      { name: "generation", weight: 0.15 },
      { name: "engine", weight: 0.1 },
      { name: "body_type", weight: 0.1 },
    ],
    threshold: 0.35,
    minQueryLength: 1,
  });

  const tree = buildTree(filteredModels);

  const totalCount = models.length;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </Typography.H1>
        <Typography.Muted className="text-muted-foreground">
          {t("subtitle")}
        </Typography.Muted>
      </div>

      <ListToolbar
        search={{
          placeholder: t("searchPlaceholder"),
          value: search,
          onChange: setSearch,
          resultLabel: filteredModels.length
            ? `${filteredModels.length} variant${filteredModels.length === 1 ? "" : "s"}`
            : undefined,
          emptyLabel: search ? `No matches for "${search}"` : undefined,
        }}
        stats={
          <span>
            {t("modelCount", {
              count: tree.reduce((s, m) => s + m.models.length, 0),
            })}{" "}
            · {t("variantCount", { count: totalCount })}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={models}
              columns={exportColumns}
              filename={`vehicle-models-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Vehicle Models"
            />
            <Button
              size="default"
              className="h-12"
              onClick={() => {
                setFormMode("add");
                setFormItem(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-5" /> {t("addModel")}
            </Button>
          </div>
        }
      />

      {/* ── Tree View ──────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {orgQuery.isLoading || loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-3 p-4">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Typography.Text className="text-destructive">
                {error}
              </Typography.Text>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          ) : tree.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Car />
                </EmptyMedia>
                <EmptyTitle>
                  {search ? t("noModelsMatch") : t("noModels")}
                </EmptyTitle>
                <EmptyDescription>{t("noModelsDesc") || ""}</EmptyDescription>
              </EmptyHeader>
              {!search && (
                <EmptyContent>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormMode("add");
                      setFormItem(null);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="size-4" /> {t("addFirstModel")}
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="divide-y divide-border">
              {tree.map((makeGroup) => {
                const makeOpen = expandedMakes.has(makeGroup.make);
                const variantCount = makeGroup.models.reduce(
                  (s, m) => s + m.variants.length,
                  0,
                );

                return (
                  <div key={makeGroup.make}>
                    {/* ── Make header ───────────────────────── */}
                    <Button
                      onClick={() => toggleMake(makeGroup.make)}
                      variant="ghost"
                      className={`w-full justify-start gap-2 px-4 py-3 font-semibold transition-colors hover:bg-muted/30 ${makeOpen ? "border-l-2 border-primary" : ""}`}
                    >
                      {makeOpen ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <HighlightText text={makeGroup.make} query={search} />
                      <span className="text-xs font-normal text-muted-foreground">
                        {t("modelCount", { count: makeGroup.models.length })} ·{" "}
                        {t("variantCount", { count: variantCount })}
                      </span>
                    </Button>

                    {/* ── Model rows ────────────────────────── */}
                    {makeOpen && (
                      <div className="border-t border-border/50">
                        {makeGroup.models.map((modelGroup) => {
                          const modelOpen =
                            expandedModels[makeGroup.make]?.has(
                              modelGroup.model,
                            ) ?? false;

                          return (
                            <div key={modelGroup.model}>
                              {/* Model header */}
                              <Button
                                onClick={() =>
                                  toggleModel(makeGroup.make, modelGroup.model)
                                }
                                variant="ghost"
                                className="w-full justify-start gap-2 pl-10 pr-4 py-2.5 transition-colors hover:bg-muted/30"
                              >
                                {modelOpen ? (
                                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                                )}
                                <span className="font-medium text-sm">
                                  <HighlightText
                                    text={modelGroup.model}
                                    query={search}
                                  />
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {t("variantCount", {
                                    count: modelGroup.variants.length,
                                  })}
                                </span>
                              </Button>

                              {/* Variant leaf rows */}
                              {modelOpen && (
                                <div className="border-t border-border/30">
                                  {modelGroup.variants.map((v) => (
                                    <div
                                      key={v.id}
                                      className="group flex items-center gap-3 pl-16 pr-4 py-2.5 min-h-[40px] hover:bg-muted/30 transition-colors"
                                    >
                                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                        <span className="text-sm font-medium truncate">
                                          <HighlightText
                                            text={v.model}
                                            query={search}
                                          />
                                        </span>
                                        <Typography.Muted className="text-xs text-muted-foreground truncate">
                                          {variantYears(v) && (
                                            <span>{variantYears(v)}</span>
                                          )}
                                          {variantYears(v) &&
                                            variantDetailLine(v) && (
                                              <span className="mx-1 text-muted-foreground/40">
                                                ·
                                              </span>
                                            )}
                                          {variantDetailLine(v) && (
                                            <HighlightText
                                              text={variantDetailLine(v)}
                                              query={search}
                                            />
                                          )}
                                          {!variantYears(v) &&
                                            !variantDetailLine(v) && (
                                              <span className="italic text-muted-foreground/60">
                                                {t("baseVariant")}
                                              </span>
                                            )}
                                        </Typography.Muted>
                                      </div>

                                      {v.body_type && (
                                        <Badge
                                          variant="outline"
                                          className="shrink-0 text-xs"
                                        >
                                          {v.body_type}
                                        </Badge>
                                      )}

                                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="icon-xs"
                                          onClick={() => {
                                            setFormMode("edit");
                                            setFormItem(v);
                                            setFormOpen(true);
                                          }}
                                          className="size-8"
                                          aria-label={t("editVariant")}
                                        >
                                          <Pencil className="size-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon-xs"
                                          onClick={() => setDeleteItem(v)}
                                          className="size-8 text-destructive/70 hover:text-destructive"
                                          aria-label={t("deleteVariant")}
                                        >
                                          <Trash2 className="size-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Vehicle Model Form Sheet ─────────────────────── */}
      <VehicleModelFormSheet
        mode={formMode}
        item={formItem}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* ── Delete Confirmation Dialog ────────────────────── */}
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteVariant")}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteItem?.make} {deleteItem?.model}
              </span>
              {deleteItem?.generation && <> ({deleteItem.generation})</>}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
