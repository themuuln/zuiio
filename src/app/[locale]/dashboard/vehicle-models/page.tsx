"use client";

import { Car, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import type { ExportColumn } from "@/lib/export";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { vehicleModelKeys } from "@/lib/queries/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/typography";

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
    if (!map.has(item.make)) map.set(item.make, new Map());
    const models = map.get(item.make)!;
    if (!models.has(item.model)) models.set(item.model, []);
    models.get(item.model)!.push(item);
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

// ── Variant label helper ──────────────────────────────────────

function variantLabel(v: VariantItem): string {
  return [v.generation, v.engine, v.body_type].filter(Boolean).join(" · ");
}

function variantShortLabel(v: VariantItem): string {
  const parts: string[] = [];
  if (v.year_start && v.year_end) parts.push(`${v.year_start}-${v.year_end}`);
  else if (v.year_start) parts.push(`from ${v.year_start}`);
  else if (v.year_end) parts.push(`until ${v.year_end}`);
  if (v.engine) parts.push(v.engine);
  if (v.body_type) parts.push(v.body_type);
  return parts.join(" · ") || (v.generation ?? "—");
}

// ── Body type options ─────────────────────────────────────────

const bodyTypeOptions = [
  "sedan",
  "suv",
  "hatchback",
  "coupe",
  "wagon",
  "pickup",
  "van",
  "minivan",
  "convertible",
  "crossover",
];

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
  const [showAdd, setShowAdd] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Tree expansion state
  const [expandedMakes, setExpandedMakes] = useState<Set<string>>(new Set());
  const [expandedModels, setExpandedModels] = useState<
    Record<string, Set<string>>
  >({});

  const queryClient = useQueryClient();

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    make: "",
    model: "",
    generation: "",
    year_start: "",
    year_end: "",
    engine: "",
    body_type: "",
  });

  const resetForm = () => {
    setEditForm({
      make: "",
      model: "",
      generation: "",
      year_start: "",
      year_end: "",
      engine: "",
      body_type: "",
    });
    setShowDetails(false);
  };

  // ── Mutation hooks ────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: async (formData: typeof editForm) => {
      const r = await fetch(`/api/organizations/${orgId}/vehicle-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: formData.make,
          model: formData.model,
          generation: formData.generation || null,
          year_start: formData.year_start
            ? parseInt(formData.year_start, 10)
            : null,
          year_end: formData.year_end
            ? parseInt(formData.year_end, 10)
            : null,
          engine: formData.engine || null,
          body_type: formData.body_type || null,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.data as VehicleModelItem;
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
      );
      const optimistic: VehicleModelItem = {
        id: `temp-${Date.now()}`,
        make: formData.make,
        model: formData.model,
        generation: formData.generation || null,
        year_start: formData.year_start
          ? parseInt(formData.year_start, 10)
          : null,
        year_end: formData.year_end
          ? parseInt(formData.year_end, 10)
          : null,
        engine: formData.engine || null,
        body_type: formData.body_type || null,
      };
      queryClient.setQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
        (old) => [...(old ?? []), optimistic],
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
      toast.error("Failed to create vehicle model");
    },
    onSuccess: () => {
      toast.success("Vehicle model created");
      setShowAdd(false);
      setEditingId(null);
      resetForm();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: typeof editForm;
    }) => {
      const r = await fetch(
        `/api/organizations/${orgId}/vehicle-models/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            make: formData.make,
            model: formData.model,
            generation: formData.generation || null,
            year_start: formData.year_start
              ? parseInt(formData.year_start, 10)
              : null,
            year_end: formData.year_end
              ? parseInt(formData.year_end, 10)
              : null,
            engine: formData.engine || null,
            body_type: formData.body_type || null,
          }),
        },
      );
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.data as VehicleModelItem;
    },
    onMutate: async ({ id, formData }) => {
      await queryClient.cancelQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
      );
      queryClient.setQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
        (old) =>
          (old ?? []).map((item) =>
            item.id === id
              ? {
                  ...item,
                  make: formData.make,
                  model: formData.model,
                  generation: formData.generation || null,
                  year_start: formData.year_start
                    ? parseInt(formData.year_start, 10)
                    : null,
                  year_end: formData.year_end
                    ? parseInt(formData.year_end, 10)
                    : null,
                  engine: formData.engine || null,
                  body_type: formData.body_type || null,
                }
              : item,
          ),
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
      toast.error("Failed to update vehicle model");
    },
    onSuccess: () => {
      toast.success("Vehicle model updated");
      setEditingId(null);
      resetForm();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
    },
  });

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
      toast.error("Failed to delete vehicle model");
    },
    onSuccess: () => toast.success("Vehicle model deleted"),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
    },
  });

  // ── CRUD handlers ─────────────────────────────────────────────

  const handleAdd = () => {
    if (!orgId || !editForm.make.trim() || !editForm.model.trim()) return;
    addMutation.mutate(editForm);
  };

  const handleUpdate = (id: string) => {
    if (!orgId || !editForm.make.trim() || !editForm.model.trim()) return;
    updateMutation.mutate({ id, formData: editForm });
  };

  const handleDelete = (id: string) => {
    if (!orgId) return;
    deleteMutation.mutate(id);
  };

  const startEdit = (v: VariantItem) => {
    setEditingId(v.id);
    setShowAdd(false);
    setShowDetails(true);
    setEditForm({
      make: v.make,
      model: v.model,
      generation: v.generation ?? "",
      year_start: v.year_start?.toString() ?? "",
      year_end: v.year_end?.toString() ?? "",
      engine: v.engine ?? "",
      body_type: v.body_type ?? "",
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

  const tree = buildTree(
    models.filter(
      (m) =>
        !search ||
        m.make.toLowerCase().includes(search.toLowerCase()) ||
        m.model.toLowerCase().includes(search.toLowerCase()) ||
        (m.generation ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (m.engine ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (m.body_type ?? "").toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const totalCount = models.length;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">{t("title")}</Typography.H1>
        <Typography.Muted className="text-muted-foreground">
          {t("subtitle")}
        </Typography.Muted>
      </div>

      <ListToolbar
        search={{
          placeholder: t("searchPlaceholder"),
          value: search,
          onChange: setSearch,
        }}
        stats={
          <span>
            {t("modelCount", { count: tree.reduce((s, m) => s + m.models.length, 0) })} · {t("variantCount", { count: totalCount })}
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
                setShowAdd(!showAdd);
                setEditingId(null);
                resetForm();
              }}
            >
              <Plus className="size-5" />{" "}
              {showAdd ? t("cancel") : t("addModel")}
            </Button>
          </div>
        }
      />

      {/* ── Add / Edit form ────────────────────────────────── */}
      {(showAdd || editingId) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {editingId ? t("editVariant") : t("addNewModel")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Required fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  {t("makeRequired")} <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder={t("makePlaceholder")}
                  value={editForm.make}
                  onChange={(e) =>
                    setEditForm(prev => ({ ...prev, make: e.target.value }))
                  }
                  className="h-11"
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  {t("modelRequired")} <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder={t("modelPlaceholder")}
                  value={editForm.model}
                  onChange={(e) =>
                    setEditForm(prev => ({ ...prev, model: e.target.value }))
                  }
                  className="h-11"
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Toggle details */}
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              {showDetails ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              {showDetails ? t("hideDetails") : t("addDetails")}
            </Button>

            {showDetails && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("generation")}</label>
                  <Input
                    placeholder={t("generationPlaceholder")}
                    value={editForm.generation}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, generation: e.target.value }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("yearFrom")}</label>
                  <Input
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="2014"
                    value={editForm.year_start}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, year_start: e.target.value }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("yearTo")}</label>
                  <Input
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="2020"
                    value={editForm.year_end}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, year_end: e.target.value }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("engine")}</label>
                  <Input
                    placeholder={t("enginePlaceholder")}
                    value={editForm.engine}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, engine: e.target.value }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("bodyType")}</label>
                  <select
                    value={editForm.body_type}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, body_type: e.target.value }))
                    }
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">{t("selectBodyType")}</option>
                    {bodyTypeOptions.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt.charAt(0).toUpperCase() + bt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={editingId ? () => handleUpdate(editingId) : handleAdd}
                disabled={
                  (editingId ? updateMutation.isPending : addMutation.isPending) ||
                  !editForm.make.trim() ||
                  !editForm.model.trim()
                }
                size="default"
              >
                {(editingId ? updateMutation.isPending : addMutation.isPending)
                  ? t("saving")
                  : editingId
                    ? t("saveChanges")
                    : t("saveModel")}
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setShowAdd(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Typography.Text className="text-destructive">{error}</Typography.Text>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          ) : tree.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Car />
                </EmptyMedia>
                <EmptyTitle>
                  {search
                    ? t("noModelsMatch")
                    : t("noModels")}
                </EmptyTitle>
                <EmptyDescription>
                  {t("noModelsDesc") || ""}
                </EmptyDescription>
              </EmptyHeader>
              {!search && (
                <EmptyContent>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAdd(true);
                      setEditingId(null);
                      resetForm();
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
                      className="w-full justify-start gap-2 px-4 py-3 font-semibold"
                    >
                      {makeOpen ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      {makeGroup.make}
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
                                  toggleModel(
                                    makeGroup.make,
                                    modelGroup.model,
                                  )
                                }
                                variant="ghost"
                                className="w-full justify-start gap-2 pl-10 pr-4 py-2.5"
                              >
                                {modelOpen ? (
                                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                                )}
                                <span className="font-medium text-sm">
                                  {modelGroup.model}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {t("variantCount", { count: modelGroup.variants.length })}
                                </span>
                              </Button>

                              {/* Variant leaf rows */}
                              {modelOpen && (
                                <div className="border-t border-border/30">
                                  {modelGroup.variants.map((v) => (
                                    <div
                                      key={v.id}
                                      className="group flex items-center gap-3 pl-16 pr-4 py-2.5 min-h-[40px] hover:bg-muted/20 transition-colors"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <Typography.Muted className="text-sm text-muted-foreground">
                                          {variantLabel(v) ? (
                                            <>
                                              {variantLabel(v)}
                                              <span className="mx-1.5 text-muted-foreground/40">·</span>
                                              {variantShortLabel(v)}
                                            </>
                                          ) : (
                                            <span className="italic text-muted-foreground/60">
                                              {t("baseVariant")}
                                            </span>
                                          )}
                                        </Typography.Muted>
                                      </div>
                                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => startEdit(v)}
                                          className="h-8 text-xs"
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon-xs"
                                          onClick={() => handleDelete(v.id)}
                                          className="size-8"
                                          aria-label={t("deleteVariant")}
                                        >
                                          <X className="size-3.5" />
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
    </div>
  );
}
