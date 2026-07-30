"use client";

import { ArrowRight, Camera, Check, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
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
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useAddDVIItem,
  useCreateDVInspection,
  useSendDVInspection,
} from "@/lib/queries/use-dvi";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useVehicles } from "@/lib/queries/use-vehicles";
import { reportServerError } from "@/lib/sentry-report-server";

// ── Constants ──────────────────────────────────────────────

const FUEL_LEVELS = ["", "Empty", "1/4", "1/2", "3/4", "Full"] as const;

const CATEGORIES = [
  "exterior",
  "interior",
  "tires",
  "brakes",
  "under_hood",
  "under_vehicle",
  "lights",
  "fluids",
  "battery",
  "belts_hoses",
] as const;

const CONDITIONS = ["good", "fair", "poor", "fail", "not_checked"] as const;

const SEVERITIES = [
  "info",
  "monitor",
  "recommend",
  "urgent",
  "critical",
] as const;

// ── Schemas ───────────────────────────────────────────────

const createInspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Please select a vehicle"),
  odometer: z.string().optional(),
  fuel_level: z.string().optional(),
  notes: z.string().optional(),
});

type CreateInspectionValues = z.infer<typeof createInspectionSchema>;

const addItemSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  title: z.string().min(1, "Item name is required"),
  condition: z.string().min(1, "Please select a condition"),
  severity: z.string().min(1, "Please select severity"),
  estimated_cost: z.string().optional(),
  description: z.string().optional(),
});

type AddItemValues = z.infer<typeof addItemSchema>;

// ── Props ─────────────────────────────────────────────────

interface DviCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ─────────────────────────────────────────────

export function DviCreateDrawer({ open, onOpenChange }: DviCreateDrawerProps) {
  const t = (
    useTranslations as unknown as (ns: string) => (key: string) => string
  )("dvi");
  const ct = (
    useTranslations as unknown as (ns: string) => (key: string) => string
  )("common");

  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;

  const { data: vehicles } = useVehicles(orgId);

  const createInspection = useCreateDVInspection(orgId);
  const addItem = useAddDVIItem(orgId);
  const sendInspection = useSendDVInspection(orgId);

  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [items, setItems] = useState<AddItemValues[]>([]);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);

  // ── Create inspection form ──────────────────────────────

  const form = useForm<CreateInspectionValues>({
    resolver: zodResolver(createInspectionSchema),
    defaultValues: {
      vehicle_id: "",
      odometer: "",
      fuel_level: "",
      notes: "",
    },
  });

  const vehicleId = form.watch("vehicle_id");

  const selectedVehicle = useMemo(
    () => vehicles?.find((v) => v.id === vehicleId),
    [vehicles, vehicleId],
  );

  // ── Add item form ───────────────────────────────────────

  const defaultItemValues: AddItemValues = {
    category: "",
    title: "",
    condition: "",
    severity: "",
    estimated_cost: undefined,
    description: "",
  };

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  const itemForm = useForm<AddItemValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: defaultItemValues,
  });

  // ── Handlers ────────────────────────────────────────────

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        form.reset();
        itemForm.reset();
        setInspectionId(null);
        setItems([]);
        setItemFormOpen(false);
      }
      onOpenChange(nextOpen);
    },
    [form, itemForm, onOpenChange],
  );

  const handleCreate = form.handleSubmit(async (data) => {
    if (!orgId) return;
    setCreating(true);
    try {
      const result = await createInspection.mutateAsync({
        vehicle_id: data.vehicle_id,
        notes: data.notes || undefined,
      });
      setInspectionId(result.id);
      toast.success(`${t("title")} created`);
    } catch (err) {
      reportServerError("Failed to create DVI", err);
      toast.error(t("errors.create_failed"));
    } finally {
      setCreating(false);
    }
  });

  const handleAddItem = itemForm.handleSubmit(async (data) => {
    if (!inspectionId) return;
    setAddingItem(true);
    try {
      const itemData = data as unknown as AddItemValues;
      await addItem.mutateAsync({
        inspection_id: inspectionId,
        category: itemData.category,
        condition: itemData.condition,
        severity: itemData.severity,
        title: itemData.title,
        description: itemData.description || undefined,
        estimated_cost: itemData.estimated_cost
          ? Number(itemData.estimated_cost)
          : undefined,
      });
      setItems((prev) => [...prev, itemData]);
      itemForm.reset(defaultItemValues);
      setItemFormOpen(false);
      toast.success(`${t("actions.add_item")} added`);
    } catch (err) {
      reportServerError("Failed to add DVI item", err);
      toast.error(t("errors.update_failed"));
    } finally {
      setAddingItem(false);
    }
  });

  const handleSend = async () => {
    if (!inspectionId) return;
    setSending(true);
    try {
      await sendInspection.mutateAsync({ id: inspectionId });
      toast.success(`${t("send")} — ${t("actions.send_sms")}`);
      handleOpenChange(false);
    } catch (err) {
      reportServerError("Failed to send DVI", err);
      toast.error(t("errors.send_failed"));
    } finally {
      setSending(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────

  const categoryLabel = (key: string) => {
    const cat = CATEGORIES.find((c) => c === key);
    return cat ? t(`category.${cat}`) : key;
  };

  const conditionLabel = (key: string) => {
    const cond = CONDITIONS.find((c) => c === key);
    return cond ? t(`condition.${cond}`) : key;
  };

  const severityLabel = (key: string) => {
    const sev = SEVERITIES.find((s) => s === key);
    return sev ? t(`severity.${sev}`) : key;
  };

  // ── Render ──────────────────────────────────────────────

  return (
    <DetailDrawer open={open} onOpenChange={handleOpenChange}>
      <DetailDrawer.Header>
        <DetailDrawer.Title className="flex items-center gap-2 text-base">
          <Camera className="size-4 text-info" />
          {inspectionId ? t("title") : t("create")}
        </DetailDrawer.Title>
        <DetailDrawer.Description className="sr-only">
          {inspectionId ? t("title") : t("create")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        <div className="flex flex-col gap-5">
          {/* ── Create form (phase 1) ───────────────────────── */}
          {!inspectionId && (
            <form
              onSubmit={handleCreate}
              id="dvi-create-form"
              className="flex flex-col gap-4"
            >
              {/* Vehicle select */}
              <Field data-invalid={!!form.formState.errors.vehicle_id}>
                <FieldLabel className="text-xs font-medium text-muted-foreground">
                  {ct("vehicle") ?? "Vehicle"}
                </FieldLabel>
                <FieldContent>
                  <select
                    {...form.register("vehicle_id")}
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">{ct("selectVehicle")}</option>
                    {vehicles?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} — {v.make} {v.model}
                      </option>
                    ))}
                  </select>
                </FieldContent>
              </Field>

              {/* Vehicle info summary */}
              {selectedVehicle && (
                <div className="rounded-lg border border-muted bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {selectedVehicle.plate_number}
                  {selectedVehicle.make &&
                    ` · ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model ?? ""}`}
                  {selectedVehicle.color && ` · ${selectedVehicle.color}`}
                  {selectedVehicle.fuel_type &&
                    ` · ${selectedVehicle.fuel_type}`}
                </div>
              )}

              {/* Odometer + Fuel level row */}
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel className="text-xs font-medium text-muted-foreground">
                    Odometer (km)
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      placeholder="e.g. 45000"
                      {...form.register("odometer")}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel className="text-xs font-medium text-muted-foreground">
                    Fuel Level
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      value={form.watch("fuel_level") || null}
                      onValueChange={(val) =>
                        form.setValue("fuel_level", val ?? "", {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_LEVELS.filter(Boolean).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </div>

              {/* Notes / technician remarks */}
              <Field>
                <FieldLabel className="text-xs font-medium text-muted-foreground">
                  {ct("notes") ?? "Notes"}
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Technician notes, observed issues..."
                    className="min-h-20"
                    {...form.register("notes")}
                  />
                </FieldContent>
              </Field>
            </form>
          )}

          {/* ── Add items section (phase 2) ──────────────────── */}
          {inspectionId && (
            <>
              {/* Added items list */}
              {items.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Typography.Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("title")} Items ({items.length})
                  </Typography.Text>
                  <div className="flex flex-col gap-2">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-muted bg-muted/20 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-foreground">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded">
                                {categoryLabel(item.category)}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  item.condition === "fail"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : item.condition === "poor"
                                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                }`}
                              >
                                {conditionLabel(item.condition)}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  item.severity === "critical" ||
                                  item.severity === "urgent"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : item.severity === "recommend"
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                      : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                                }`}
                              >
                                {severityLabel(item.severity)}
                              </span>
                              {item.estimated_cost && (
                                <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                  ₮{item.estimated_cost.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Add item inline form ──────────────────────── */}
              {itemFormOpen ? (
                <form
                  onSubmit={handleAddItem}
                  className="flex flex-col gap-3 rounded-lg border border-muted bg-muted/10 p-3"
                >
                  <Typography.Text className="text-xs font-semibold text-muted-foreground">
                    {t("actions.add_item")}
                  </Typography.Text>

                  {/* Category */}
                  <Field data-invalid={!!itemForm.formState.errors.category}>
                    <FieldLabel className="text-xs font-medium text-muted-foreground">
                      Category
                    </FieldLabel>
                    <FieldContent>
                      <Select
                        value={itemForm.watch("category") || null}
                        onValueChange={(val) =>
                          itemForm.setValue("category", val ?? "", {
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {categoryLabel(cat)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {itemForm.formState.errors.category && (
                        <FieldError>
                          {itemForm.formState.errors.category.message}
                        </FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  {/* Item name */}
                  <Field data-invalid={!!itemForm.formState.errors.title}>
                    <FieldLabel className="text-xs font-medium text-muted-foreground">
                      Item Name
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        placeholder="e.g. Left front brake pad"
                        {...itemForm.register("title")}
                      />
                      {itemForm.formState.errors.title && (
                        <FieldError>
                          {itemForm.formState.errors.title.message}
                        </FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  {/* Condition + Severity row */}
                  <div className="grid grid-cols-2 gap-2">
                    <Field data-invalid={!!itemForm.formState.errors.condition}>
                      <FieldLabel className="text-xs font-medium text-muted-foreground">
                        Condition
                      </FieldLabel>
                      <FieldContent>
                        <Select
                          value={itemForm.watch("condition") || null}
                          onValueChange={(val) =>
                            itemForm.setValue("condition", val ?? "", {
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITIONS.map((cond) => (
                              <SelectItem key={cond} value={cond}>
                                {conditionLabel(cond)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {itemForm.formState.errors.condition && (
                          <FieldError>
                            {itemForm.formState.errors.condition.message}
                          </FieldError>
                        )}
                      </FieldContent>
                    </Field>

                    <Field data-invalid={!!itemForm.formState.errors.severity}>
                      <FieldLabel className="text-xs font-medium text-muted-foreground">
                        Severity
                      </FieldLabel>
                      <FieldContent>
                        <Select
                          value={itemForm.watch("severity") || null}
                          onValueChange={(val) =>
                            itemForm.setValue("severity", val ?? "", {
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {SEVERITIES.map((sev) => (
                              <SelectItem key={sev} value={sev}>
                                {severityLabel(sev)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {itemForm.formState.errors.severity && (
                          <FieldError>
                            {itemForm.formState.errors.severity.message}
                          </FieldError>
                        )}
                      </FieldContent>
                    </Field>
                  </div>

                  {/* Estimated cost + description */}
                  <Field>
                    <FieldLabel className="text-xs font-medium text-muted-foreground">
                      Est. Cost (₮)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        placeholder="e.g. 50000"
                        {...itemForm.register("estimated_cost")}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel className="text-xs font-medium text-muted-foreground">
                      Notes
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        placeholder="Additional notes..."
                        className="min-h-16"
                        {...itemForm.register("description")}
                      />
                    </FieldContent>
                  </Field>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        itemForm.reset(defaultItemValues);
                        setItemFormOpen(false);
                      }}
                    >
                      <X className="size-3.5" />
                      {t("actions.cancel")}
                    </Button>
                    <Button type="submit" size="sm" disabled={addingItem}>
                      <Check className="size-3.5" />
                      {addingItem
                        ? (ct("saving") ?? "Saving...")
                        : t("actions.save")}
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => setItemFormOpen(true)}
                >
                  <Plus className="size-4" />
                  {t("actions.add_item")}
                </Button>
              )}

              {/* ── Send button ──────────────────────────────── */}
              {items.length > 0 && (
                <Button
                  className="w-full"
                  onClick={handleSend}
                  disabled={sending}
                >
                  <ArrowRight className="size-4" />
                  {sending ? (ct("saving") ?? "Sending...") : t("send")}
                </Button>
              )}
            </>
          )}
        </div>
      </DetailDrawer.Body>

      {/* ── Footer ───────────────────────────────────────────── */}
      {!inspectionId && (
        <DetailDrawer.Footer>
          <DetailDrawer.FooterActions>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" form="dvi-create-form" disabled={creating}>
              <Camera className="size-4" />
              {creating ? (ct("saving") ?? "Creating...") : t("create")}
            </Button>
          </DetailDrawer.FooterActions>
        </DetailDrawer.Footer>
      )}
    </DetailDrawer>
  );
}
