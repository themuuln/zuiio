"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DetailSheet } from "@/components/ui/detail-sheet";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vehicleModelKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";

// ── Types ────────────────────────────────────────────────────

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

interface VehicleModelFormSheetProps {
  mode: "add" | "edit";
  item?: VehicleModelItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Body type options ────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────

export function VehicleModelFormSheet({
  mode,
  item,
  open,
  onOpenChange,
}: VehicleModelFormSheetProps) {
  const t = useTranslations("vehicleModels");
  const commonT = useTranslations("common");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const queryClient = useQueryClient();

  // ── Form state ──────────────────────────────────────────────

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [generation, setGeneration] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");
  const [engine, setEngine] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  // Reset form when the sheet opens with a different item
  const [prevItemId, setPrevItemId] = useState<string | null>(null);
  if (mode === "edit" && item && item.id !== prevItemId) {
    setPrevItemId(item.id);
    setMake(item.make);
    setModel(item.model);
    setGeneration(item.generation ?? "");
    setYearStart(item.year_start?.toString() ?? "");
    setYearEnd(item.year_end?.toString() ?? "");
    setEngine(item.engine ?? "");
    setBodyType(item.body_type ?? "");
    setShowDetails(
      !!item.generation ||
        !!item.year_start ||
        !!item.year_end ||
        !!item.engine ||
        !!item.body_type,
    );
  }

  // ── Mutations ───────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) return;
      const r = await fetch(`/api/organizations/${orgId}/vehicle-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: make.trim(),
          model: model.trim(),
          generation: generation.trim() || null,
          year_start: yearStart ? parseInt(yearStart, 10) : null,
          year_end: yearEnd ? parseInt(yearEnd, 10) : null,
          engine: engine.trim() || null,
          body_type: bodyType || null,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.data as VehicleModelItem;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
      );
      const optimistic: VehicleModelItem = {
        id: `temp-${Date.now()}`,
        make: make.trim(),
        model: model.trim(),
        generation: generation.trim() || null,
        year_start: yearStart ? parseInt(yearStart, 10) : null,
        year_end: yearEnd ? parseInt(yearEnd, 10) : null,
        engine: engine.trim() || null,
        body_type: bodyType || null,
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
      toast.error(t("common.somethingWentWrong"));
    },
    onSuccess: () => {
      toast.success(t("vehicleModels.vehicleCreated"));
      onOpenChange(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !item) return;
      const r = await fetch(
        `/api/organizations/${orgId}/vehicle-models/${item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            make: make.trim(),
            model: model.trim(),
            generation: generation.trim() || null,
            year_start: yearStart ? parseInt(yearStart, 10) : null,
            year_end: yearEnd ? parseInt(yearEnd, 10) : null,
            engine: engine.trim() || null,
            body_type: bodyType || null,
          }),
        },
      );
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.data as VehicleModelItem;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
      );
      queryClient.setQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
        (old) =>
          (old ?? []).map((entry) =>
            entry.id === item?.id
              ? {
                  ...entry,
                  make: make.trim(),
                  model: model.trim(),
                  generation: generation.trim() || null,
                  year_start: yearStart ? parseInt(yearStart, 10) : null,
                  year_end: yearEnd ? parseInt(yearEnd, 10) : null,
                  engine: engine.trim() || null,
                  body_type: bodyType || null,
                }
              : entry,
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
      toast.error(t("common.somethingWentWrong"));
    },
    onSuccess: () => {
      toast.success(t("vehicleModels.vehicleUpdated"));
      onOpenChange(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
    },
  });

  // ── Handlers ────────────────────────────────────────────────

  const isPending = addMutation.isPending || updateMutation.isPending;
  const canSave = make.trim() && model.trim() && !isPending;

  const handleSave = () => {
    if (!canSave) return;
    if (mode === "edit") {
      updateMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowDetails(false);
    }
    onOpenChange(nextOpen);
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <DetailSheet open={open} onOpenChange={handleOpenChange} size="xl">
      <DetailSheet.Header>
        <DetailSheet.Title>
          {mode === "edit"
            ? t("editVariant") || "Edit Variant"
            : t("addNewModel") || "Add Vehicle Model"}
        </DetailSheet.Title>
        <DetailSheet.Description>
          {mode === "edit"
            ? t("editVariantDescription") || "Update vehicle model details"
            : t("addModelDescription") ||
              "Add a new vehicle model to your catalog"}
        </DetailSheet.Description>
      </DetailSheet.Header>

      <DetailSheet.Body>
        <FieldGroup>
          {/* Required fields — make + model */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                {t("make")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("makePlaceholder") || "e.g. Toyota"}
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>
                {t("model")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("modelPlaceholder") || "e.g. Camry"}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                />
              </FieldContent>
            </Field>
          </div>

          {/* Toggle details */}
          <Button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
            className="w-fit text-muted-foreground"
          >
            {showDetails ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            {showDetails
              ? t("hideDetails") || "Hide details"
              : t("addDetails") || "Add details"}
          </Button>

          {/* Optional fields */}
          {showDetails && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <Field>
                <FieldLabel>{t("generation") || "Generation"}</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder={t("generationPlaceholder") || "e.g. XV70"}
                    value={generation}
                    onChange={(e) => setGeneration(e.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("yearFrom") || "Year start"}</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="2014"
                    value={yearStart}
                    onChange={(e) => setYearStart(e.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("yearTo") || "Year end"}</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="2020"
                    value={yearEnd}
                    onChange={(e) => setYearEnd(e.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("engine") || "Engine"}</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder={t("enginePlaceholder") || "e.g. 2.5L"}
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("bodyType") || "Body type"}</FieldLabel>
                <FieldContent>
                  <Select
                    value={bodyType}
                    onValueChange={(val: string | null) =>
                      setBodyType(val ?? "")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("selectBodyType") || "Select body type"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyTypeOptions.map((bt) => (
                        <SelectItem key={bt} value={bt}>
                          {bt.charAt(0).toUpperCase() + bt.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>
          )}
        </FieldGroup>
      </DetailSheet.Body>

      <DetailSheet.Footer>
        <Button variant="outline" onClick={() => handleOpenChange(false)}>
          {commonT("cancel")}
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {commonT("saving") || "Saving..."}
            </span>
          ) : (
            commonT("save") || "Save"
          )}
        </Button>
      </DetailSheet.Footer>
    </DetailSheet>
  );
}
