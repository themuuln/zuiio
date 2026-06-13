"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
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
] as const;

const EMPTY_FORM = {
  make: "",
  model: "",
  generation: "",
  yearStart: "",
  yearEnd: "",
  engine: "",
  bodyType: "",
};

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

  const [make, setMake] = useState(EMPTY_FORM.make);
  const [model, setModel] = useState(EMPTY_FORM.model);
  const [generation, setGeneration] = useState(EMPTY_FORM.generation);
  const [yearStart, setYearStart] = useState(EMPTY_FORM.yearStart);
  const [yearEnd, setYearEnd] = useState(EMPTY_FORM.yearEnd);
  const [engine, setEngine] = useState(EMPTY_FORM.engine);
  const [bodyType, setBodyType] = useState(EMPTY_FORM.bodyType);
  const [showDetails, setShowDetails] = useState(false);

  const normalizedMake = make.trim();
  const normalizedModel = model.trim();
  const parsedYearStart = yearStart ? Number.parseInt(yearStart, 10) : null;
  const parsedYearEnd = yearEnd ? Number.parseInt(yearEnd, 10) : null;
  const yearRangeInvalid =
    parsedYearStart != null &&
    parsedYearEnd != null &&
    parsedYearStart > parsedYearEnd;

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && item) {
      setMake(item.make);
      setModel(item.model);
      setGeneration(item.generation ?? "");
      setYearStart(item.year_start?.toString() ?? "");
      setYearEnd(item.year_end?.toString() ?? "");
      setEngine(item.engine ?? "");
      setBodyType(item.body_type ?? "");
      setShowDetails(
        Boolean(
          item.generation ||
            item.year_start ||
            item.year_end ||
            item.engine ||
            item.body_type,
        ),
      );
      return;
    }

    setMake(EMPTY_FORM.make);
    setModel(EMPTY_FORM.model);
    setGeneration(EMPTY_FORM.generation);
    setYearStart(EMPTY_FORM.yearStart);
    setYearEnd(EMPTY_FORM.yearEnd);
    setEngine(EMPTY_FORM.engine);
    setBodyType(EMPTY_FORM.bodyType);
    setShowDetails(false);
  }, [item, mode, open]);

  const bodyTypeItems = useMemo(
    () =>
      bodyTypeOptions.map((value) => ({
        value,
        label: t(`bodyTypes.${value}`),
      })),
    [t],
  );

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error(commonT("somethingWentWrong"));
      const r = await fetch(`/api/organizations/${orgId}/vehicle-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: normalizedMake,
          model: normalizedModel,
          generation: generation.trim() || null,
          year_start: parsedYearStart,
          year_end: parsedYearEnd,
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
        make: normalizedMake,
        model: normalizedModel,
        generation: generation.trim() || null,
        year_start: parsedYearStart,
        year_end: parsedYearEnd,
        engine: engine.trim() || null,
        body_type: bodyType || null,
      };
      queryClient.setQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
        (old) => [...(old ?? []), optimistic],
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          vehicleModelKeys.list(orgId ?? ""),
          context.previous,
        );
      }
      toast.error(
        err instanceof Error ? err.message : commonT("somethingWentWrong"),
      );
    },
    onSuccess: () => {
      toast.success(t("vehicleCreated"));
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
      if (!orgId || !item) throw new Error(commonT("somethingWentWrong"));
      const r = await fetch(
        `/api/organizations/${orgId}/vehicle-models/${item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            make: normalizedMake,
            model: normalizedModel,
            generation: generation.trim() || null,
            year_start: parsedYearStart,
            year_end: parsedYearEnd,
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
                  make: normalizedMake,
                  model: normalizedModel,
                  generation: generation.trim() || null,
                  year_start: parsedYearStart,
                  year_end: parsedYearEnd,
                  engine: engine.trim() || null,
                  body_type: bodyType || null,
                }
              : entry,
          ),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          vehicleModelKeys.list(orgId ?? ""),
          context.previous,
        );
      }
      toast.error(
        err instanceof Error ? err.message : commonT("somethingWentWrong"),
      );
    },
    onSuccess: () => {
      toast.success(t("vehicleUpdated"));
      onOpenChange(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
    },
  });

  const isPending = addMutation.isPending || updateMutation.isPending;
  const canSave =
    Boolean(normalizedMake) &&
    Boolean(normalizedModel) &&
    !yearRangeInvalid &&
    !isPending;

  function handleSave() {
    if (!canSave) return;
    if (mode === "edit") {
      updateMutation.mutate();
      return;
    }
    addMutation.mutate();
  }

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="xl">
      <DetailDrawer.Header>
        <DetailDrawer.Title>
          {mode === "edit" ? t("editVariant") : t("addNewModel")}
        </DetailDrawer.Title>
        <DetailDrawer.Description>
          {mode === "edit"
            ? t("editVariantDescription")
            : t("addModelDescription")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                {t("make")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("makePlaceholder")}
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
                  placeholder={t("modelPlaceholder")}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                />
              </FieldContent>
            </Field>
          </div>

          <Button
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            variant="ghost"
            size="sm"
            className="w-fit text-muted-foreground"
          >
            {showDetails ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            {showDetails ? t("hideDetails") : t("addDetails")}
          </Button>

          {showDetails ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <Field>
                <FieldLabel>{t("generation")}</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder={t("generationPlaceholder")}
                    value={generation}
                    onChange={(e) => setGeneration(e.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("yearFrom")}</FieldLabel>
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
                <FieldLabel>{t("yearTo")}</FieldLabel>
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
                <FieldLabel>{t("engine")}</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder={t("enginePlaceholder")}
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("bodyType")}</FieldLabel>
                <FieldContent>
                  <Select
                    value={bodyType}
                    onValueChange={(value) => setBodyType(value ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("selectBodyType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyTypeItems.map((bodyTypeItem) => (
                        <SelectItem
                          key={bodyTypeItem.value}
                          value={bodyTypeItem.value}
                        >
                          {bodyTypeItem.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>
          ) : null}

          {yearRangeInvalid ? (
            <p className="text-sm text-destructive">
              {t("validation.yearRangeInvalid")}
            </p>
          ) : null}
        </FieldGroup>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {commonT("cancel")}
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {commonT("saving")}
            </span>
          ) : mode === "edit" ? (
            t("saveChanges")
          ) : (
            t("saveModel")
          )}
        </Button>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
