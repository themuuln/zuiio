"use client";

import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import type { ExportColumn } from "@/lib/export";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { vehicleModelKeys } from "@/lib/queries/keys";
import { useQuery } from "@tanstack/react-query";

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

  const [saving, setSaving] = useState(false);

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

  // ── CRUD handlers ─────────────────────────────────────────────

  const handleAdd = async () => {
    if (!orgId || !editForm.make.trim() || !editForm.model.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/organizations/${orgId}/vehicle-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: editForm.make,
          model: editForm.model,
          generation: editForm.generation || null,
          year_start: editForm.year_start
            ? parseInt(editForm.year_start, 10)
            : null,
          year_end: editForm.year_end ? parseInt(editForm.year_end, 10) : null,
          engine: editForm.engine || null,
          body_type: editForm.body_type || null,
        }),
      });
      const d = await r.json();
      if (d.data) {
        toast.success("Vehicle model created");
        refetch();
        setShowAdd(false);
        setEditingId(null);
        resetForm();
      } else {
        toast.error(d.error?.message ?? "Failed to create");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!orgId || !editForm.make.trim() || !editForm.model.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(
        `/api/organizations/${orgId}/vehicle-models/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            make: editForm.make,
            model: editForm.model,
            generation: editForm.generation || null,
            year_start: editForm.year_start
              ? parseInt(editForm.year_start, 10)
              : null,
            year_end: editForm.year_end
              ? parseInt(editForm.year_end, 10)
              : null,
            engine: editForm.engine || null,
            body_type: editForm.body_type || null,
          }),
        },
      );
      const d = await r.json();
      if (d.data) {
        toast.success("Vehicle model updated");
        refetch();
        setEditingId(null);
        resetForm();
      } else {
        toast.error(d.error?.message ?? "Failed to update");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!orgId) return;
    try {
      const r = await fetch(
        `/api/organizations/${orgId}/vehicle-models/${id}`,
        { method: "DELETE" },
      );
      const d = await r.json();
      if (d.error) {
        toast.error(d.error.message);
        return;
      }
      refetch();
      toast.success("Vehicle model deleted");
    } catch {
      toast.error("Failed to delete");
    }
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
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
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
              size="lg"
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
          <CardContent className="space-y-4">
            {/* Required fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("makeRequired")} <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder={t("makePlaceholder")}
                  value={editForm.make}
                  onChange={(e) =>
                    setEditForm(prev => ({ ...prev, $$$ }))
                  }
                  className="h-11"
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("modelRequired")} <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder={t("modelPlaceholder")}
                  value={editForm.model}
                  onChange={(e) =>
                    setEditForm(prev => ({ ...prev, $$$ }))
                  }
                  className="h-11"
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Toggle details */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              {showDetails ? t("hideDetails") : t("addDetails")}
            </button>

            {showDetails && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1">
                  <label className="text-sm font-medium">{t("generation")}</label>
                  <Input
                    placeholder={t("generationPlaceholder")}
                    value={editForm.generation}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, $$$ }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">{t("yearFrom")}</label>
                  <Input
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="2014"
                    value={editForm.year_start}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, $$$ }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">{t("yearTo")}</label>
                  <Input
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="2020"
                    value={editForm.year_end}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, $$$ }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">{t("engine")}</label>
                  <Input
                    placeholder={t("enginePlaceholder")}
                    value={editForm.engine}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, $$$ }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">{t("bodyType")}</label>
                  <select
                    value={editForm.body_type}
                    onChange={(e) =>
                      setEditForm(prev => ({ ...prev, $$$ }))
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
                  saving || !editForm.make.trim() || !editForm.model.trim()
                }
                size="lg"
              >
                {saving
                  ? t("saving")
                  : editingId
                    ? t("saveChanges")
                    : t("saveModel")}
              </Button>
              <Button
                variant="outline"
                size="lg"
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
              <p className="text-destructive">{error}</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <p className="text-muted-foreground">
                {search
                  ? t("noModelsMatch")
                  : t("noModels")}
              </p>
              {!search && (
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
              )}
            </div>
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
                    <button
                      type="button"
                      onClick={() => toggleMake(makeGroup.make)}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      {makeOpen ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="font-semibold">
                        {makeGroup.make}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("modelCount", { count: makeGroup.models.length })} ·{" "}
                        {t("variantCount", { count: variantCount })}
                      </span>
                    </button>

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
                              <button
                                type="button"
                                onClick={() =>
                                  toggleModel(
                                    makeGroup.make,
                                    modelGroup.model,
                                  )
                                }
                                className="flex w-full items-center gap-2 pl-10 pr-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
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
                              </button>

                              {/* Variant leaf rows */}
                              {modelOpen && (
                                <div className="border-t border-border/30">
                                  {modelGroup.variants.map((v) => (
                                    <div
                                      key={v.id}
                                      className="group flex items-center gap-3 pl-16 pr-4 py-2.5 min-h-[40px] hover:bg-muted/20 transition-colors"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-muted-foreground">
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
                                        </p>
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
                                          size="icon"
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
