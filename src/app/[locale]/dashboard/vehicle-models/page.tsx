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
import { useEffect, useMemo, useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import { vehicleModelKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { cn } from "@/lib/utils";
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

function variantYears(
  v: VariantItem,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (v.year_start && v.year_end) return `${v.year_start}-${v.year_end}`;
  if (v.year_start) return t("yearFromValue", { year: v.year_start });
  if (v.year_end) return t("yearToValue", { year: v.year_end });
  return "";
}

function variantBodyTypeLabel(
  value: string | null,
  t: (key: string) => string,
): string | null {
  if (!value) return null;
  return t(`bodyTypes.${value}`);
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
      toast.error(_err instanceof Error ? _err.message : t("deleteFailed"));
    },
    onSuccess: () => toast.success(t("vehicleDeleted")),
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
  const filteredCount = filteredModels.length;

  useEffect(() => {
    if (!search.trim()) return;

    setExpandedMakes(new Set(tree.map((group) => group.make)));
    setExpandedModels(
      Object.fromEntries(
        tree.map((group) => [
          group.make,
          new Set(group.models.map((modelGroup) => modelGroup.model)),
        ]),
      ),
    );
  }, [search, tree]);

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
          resultLabel: filteredCount
            ? t("searchResults", { count: filteredCount })
            : undefined,
          emptyLabel: search ? t("noMatchesFor", { query: search }) : undefined,
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
      <Card className="overflow-hidden border-border/70 bg-card">
        <CardHeader className="border-b bg-muted/20 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">
                {t("title")}
              </CardTitle>
              <CardDescription>{t("subtitle")}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="h-8 rounded-md px-3">
                {tree.length} {t("make")}
              </Badge>
              <Badge variant="secondary" className="h-8 rounded-md px-3">
                {tree.reduce((sum, group) => sum + group.models.length, 0)}{" "}
                {t("modelCount", {
                  count: tree.reduce(
                    (sum, group) => sum + group.models.length,
                    0,
                  ),
                }).replace(/^\d+\s*/, "")}
              </Badge>
              <Badge variant="secondary" className="h-8 rounded-md px-3">
                {totalCount}{" "}
                {t("variantCount", { count: totalCount }).replace(
                  /^\d+\s*/,
                  "",
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {orgQuery.isLoading || loading ? (
            <div className="grid gap-3 p-4 sm:p-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="overflow-hidden rounded-lg border border-border/60"
                >
                  <div className="flex min-h-16 items-center gap-4 px-4 py-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                  <Separator />
                  <div className="space-y-3 px-4 py-4">
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 px-4 py-12">
              <Typography.Text className="text-destructive">
                {error}
              </Typography.Text>
              <Button onClick={() => refetch()}>{t("retry")}</Button>
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
            <div className="overflow-hidden rounded-b-xl">
              {tree.map((makeGroup) => {
                const makeOpen = expandedMakes.has(makeGroup.make);
                const variantCount = makeGroup.models.reduce(
                  (s, m) => s + m.variants.length,
                  0,
                );

                return (
                  <Collapsible
                    key={makeGroup.make}
                    open={makeOpen}
                    onOpenChange={() => toggleMake(makeGroup.make)}
                  >
                    <div className="border-b border-border/70 last:border-b-0">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/30 sm:px-5">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Typography.Text className="text-base font-semibold">
                                <HighlightText
                                  text={makeGroup.make}
                                  query={search}
                                />
                              </Typography.Text>
                              <Badge
                                variant="outline"
                                className="h-7 rounded-md px-2.5"
                              >
                                {makeGroup.models.length}{" "}
                                {t("modelCount", { count: 2 }).replace(
                                  /^\d+\s*/,
                                  "",
                                )}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="h-7 rounded-md px-2.5"
                              >
                                {variantCount}{" "}
                                {t("variantCount", { count: 2 }).replace(
                                  /^\d+\s*/,
                                  "",
                                )}
                              </Badge>
                            </div>
                            <Typography.Muted className="mt-1 text-sm">
                              {t("modelCount", {
                                count: makeGroup.models.length,
                              })}{" "}
                              · {t("variantCount", { count: variantCount })}
                            </Typography.Muted>
                          </div>
                          <div className="shrink-0 text-muted-foreground">
                            {makeOpen ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <Separator />
                        <div className="bg-muted/[0.04]">
                          {makeGroup.models.map((modelGroup, modelIndex) => {
                            const modelOpen =
                              expandedModels[makeGroup.make]?.has(
                                modelGroup.model,
                              ) ?? false;

                            return (
                              <Collapsible
                                key={modelGroup.model}
                                open={modelOpen}
                                onOpenChange={() =>
                                  toggleModel(makeGroup.make, modelGroup.model)
                                }
                              >
                                <div
                                  className={cn(
                                    "bg-background",
                                    modelIndex > 0 &&
                                      "border-t border-border/60",
                                  )}
                                >
                                  <CollapsibleTrigger className="w-full">
                                    <div className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20 sm:px-6">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Typography.Text className="text-sm font-medium">
                                            <HighlightText
                                              text={modelGroup.model}
                                              query={search}
                                            />
                                          </Typography.Text>
                                          <Badge
                                            variant="secondary"
                                            className="h-7 rounded-md px-2.5"
                                          >
                                            {modelGroup.variants.length}{" "}
                                            {t("variantCount", {
                                              count: 2,
                                            }).replace(/^\d+\s*/, "")}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="shrink-0 text-muted-foreground">
                                        {modelOpen ? (
                                          <ChevronDown className="size-4" />
                                        ) : (
                                          <ChevronRight className="size-4" />
                                        )}
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>

                                  <CollapsibleContent>
                                    <Separator />
                                    <div className="bg-muted/[0.03]">
                                      {modelGroup.variants.map(
                                        (v, variantIndex) => {
                                          const bodyTypeLabel =
                                            variantBodyTypeLabel(
                                              v.body_type,
                                              t,
                                            );
                                          const years = variantYears(v, t);
                                          const details = [
                                            years,
                                            v.engine,
                                            bodyTypeLabel,
                                          ]
                                            .filter(Boolean)
                                            .join(" \u00B7 ");

                                          return (
                                            <div
                                              key={v.id}
                                              className={cn(
                                                "grid gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_auto] lg:items-center",
                                                variantIndex > 0 &&
                                                  "border-t border-border/50",
                                              )}
                                            >
                                              <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <Typography.Text className="text-sm font-medium">
                                                    <HighlightText
                                                      text={
                                                        v.generation ||
                                                        t("baseVariant")
                                                      }
                                                      query={search}
                                                    />
                                                  </Typography.Text>
                                                  {!v.generation && details ? (
                                                    <Badge
                                                      variant="secondary"
                                                      className="h-6 rounded-md px-2"
                                                    >
                                                      {t("baseVariant")}
                                                    </Badge>
                                                  ) : null}
                                                </div>
                                                <Typography.Muted className="mt-1 text-sm">
                                                  <HighlightText
                                                    text={`${v.make} ${v.model}`}
                                                    query={search}
                                                  />
                                                </Typography.Muted>
                                              </div>

                                              <div className="min-w-0">
                                                {details ? (
                                                  <Typography.Muted className="text-sm leading-6">
                                                    <HighlightText
                                                      text={details}
                                                      query={search}
                                                    />
                                                  </Typography.Muted>
                                                ) : (
                                                  <Typography.Muted className="text-sm">
                                                    {t("baseVariant")}
                                                  </Typography.Muted>
                                                )}
                                              </div>

                                              <div className="flex items-center gap-2 lg:justify-end">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    setFormMode("edit");
                                                    setFormItem(v);
                                                    setFormOpen(true);
                                                  }}
                                                  className="h-10 gap-2 px-3"
                                                  aria-label={t("editVariant")}
                                                >
                                                  <Pencil className="size-4" />
                                                  <span>
                                                    {t("editVariant")}
                                                  </span>
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    setDeleteItem(v)
                                                  }
                                                  className="h-10 px-3 text-destructive hover:text-destructive"
                                                  aria-label={t(
                                                    "deleteVariant",
                                                  )}
                                                >
                                                  <Trash2 className="size-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
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
              {t("deleteConfirmationPrefix")}{" "}
              <span className="font-semibold text-foreground">
                {deleteItem?.make} {deleteItem?.model}
              </span>
              {deleteItem?.generation && <> ({deleteItem.generation})</>}
              {t("deleteConfirmationSuffix")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t("deleting") : t("deleteAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
