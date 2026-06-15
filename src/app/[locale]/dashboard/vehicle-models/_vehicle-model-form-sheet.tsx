"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
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
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { vehicleModelKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";

// ── Types ──────────────────────────────────────────────────────

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

// ── Schema ─────────────────────────────────────────────────────

export const vehicleModelSchema = z
  .object({
    make: z.string().min(1, "Brand is required"),
    model: z.string().min(1, "Model is required"),
    generation: z.string().optional(),
    yearStart: z.string().optional(),
    yearEnd: z.string().optional(),
    engine: z.string().optional(),
    bodyType: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.yearStart || !data.yearEnd) return true;
      return Number(data.yearStart) <= Number(data.yearEnd);
    },
    { message: "Year range is invalid", path: ["yearEnd"] },
  );

type VehicleModelValues = z.infer<typeof vehicleModelSchema>;

// ── Component ──────────────────────────────────────────────────

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

  const [showDetails, setShowDetails] = useState(false);

  const form = useForm<VehicleModelValues>({
    resolver: zodResolver(vehicleModelSchema),
    defaultValues: {
      make: "",
      model: "",
      generation: "",
      yearStart: "",
      yearEnd: "",
      engine: "",
      bodyType: "",
    },
  });

  // Reset form when sheet opens / item changes
  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && item) {
      form.reset({
        make: item.make,
        model: item.model,
        generation: item.generation ?? "",
        yearStart: item.year_start?.toString() ?? "",
        yearEnd: item.year_end?.toString() ?? "",
        engine: item.engine ?? "",
        bodyType: item.body_type ?? "",
      });
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

    form.reset({
      make: "",
      model: "",
      generation: "",
      yearStart: "",
      yearEnd: "",
      engine: "",
      bodyType: "",
    });
    setShowDetails(false);
  }, [item, mode, open, form]);

  const bodyTypeItems = useMemo(
    () =>
      bodyTypeOptions.map((value) => ({
        value,
        label: t(`bodyTypes.${value}`),
      })),
    [t],
  );

  const watchedMake = form.watch("make");
  const watchedModel = form.watch("model");
  const watchedBodyType = form.watch("bodyType");

  const addMutation = useMutation({
    mutationFn: async (data: VehicleModelValues) => {
      if (!orgId) throw new Error(commonT("somethingWentWrong"));
      const r = await fetch(`/api/organizations/${orgId}/vehicle-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: data.make.trim(),
          model: data.model.trim(),
          generation: data.generation?.trim() || null,
          year_start: data.yearStart ? Number(data.yearStart) : null,
          year_end: data.yearEnd ? Number(data.yearEnd) : null,
          engine: data.engine?.trim() || null,
          body_type: data.bodyType || null,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.data as VehicleModelItem;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: vehicleModelKeys.list(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<VehicleModelItem[]>(
        vehicleModelKeys.list(orgId ?? ""),
      );
      const optimistic: VehicleModelItem = {
        id: `temp-${Date.now()}`,
        make: data.make.trim(),
        model: data.model.trim(),
        generation: data.generation?.trim() || null,
        year_start: data.yearStart ? Number(data.yearStart) : null,
        year_end: data.yearEnd ? Number(data.yearEnd) : null,
        engine: data.engine?.trim() || null,
        body_type: data.bodyType || null,
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
    mutationFn: async (data: VehicleModelValues) => {
      if (!orgId || !item) throw new Error(commonT("somethingWentWrong"));
      const r = await fetch(
        `/api/organizations/${orgId}/vehicle-models/${item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            make: data.make.trim(),
            model: data.model.trim(),
            generation: data.generation?.trim() || null,
            year_start: data.yearStart ? Number(data.yearStart) : null,
            year_end: data.yearEnd ? Number(data.yearEnd) : null,
            engine: data.engine?.trim() || null,
            body_type: data.bodyType || null,
          }),
        },
      );
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.data as VehicleModelItem;
    },
    onMutate: async (data) => {
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
                  make: data.make.trim(),
                  model: data.model.trim(),
                  generation: data.generation?.trim() || null,
                  year_start: data.yearStart ? Number(data.yearStart) : null,
                  year_end: data.yearEnd ? Number(data.yearEnd) : null,
                  engine: data.engine?.trim() || null,
                  body_type: data.bodyType || null,
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

  const handleSave = form.handleSubmit((data) => {
    if (mode === "edit") {
      updateMutation.mutate(data);
      return;
    }
    addMutation.mutate(data);
  });

  const isSaveDisabled =
    !watchedMake.trim() ||
    !watchedModel.trim() ||
    isPending;

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
            <Field data-invalid={!!form.formState.errors.make}>
              <FieldLabel>
                {t("make")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("makePlaceholder")}
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                  aria-invalid={!!form.formState.errors.make}
                  {...form.register("make")}
                />
                {form.formState.errors.make && (
                  <FieldError>{form.formState.errors.make.message}</FieldError>
                )}
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.model}>
              <FieldLabel>
                {t("model")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("modelPlaceholder")}
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                  aria-invalid={!!form.formState.errors.model}
                  {...form.register("model")}
                />
                {form.formState.errors.model && (
                  <FieldError>{form.formState.errors.model.message}</FieldError>
                )}
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
                    {...form.register("generation")}
                  />
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.yearEnd}>
                <FieldLabel>{t("yearFrom")}</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="2014"
                    {...form.register("yearStart")}
                  />
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.yearEnd}>
                <FieldLabel>{t("yearTo")}</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="2020"
                    aria-invalid={!!form.formState.errors.yearEnd}
                    {...form.register("yearEnd")}
                  />
                  {form.formState.errors.yearEnd && (
                    <FieldError>
                      {form.formState.errors.yearEnd.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("engine")}</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder={t("enginePlaceholder")}
                    {...form.register("engine")}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("bodyType")}</FieldLabel>
                <FieldContent>
                  <Select
                    value={watchedBodyType}
                    onValueChange={(value) =>
                      form.setValue("bodyType", value ?? "")
                    }
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

          {/* Year range validation is handled by Zod refine on yearEnd */}
        </FieldGroup>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {commonT("cancel")}
        </Button>
        <Button onClick={handleSave} disabled={isSaveDisabled}>
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
