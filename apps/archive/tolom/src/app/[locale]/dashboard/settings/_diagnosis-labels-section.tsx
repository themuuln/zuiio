"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrudFormDrawer } from "@/components/ui/crud-form-drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import {
  useCreateDiagnosisLabel,
  useDeleteDiagnosisLabel,
  useDiagnosisLabels,
  useReorderDiagnosisLabels,
  useUpdateDiagnosisLabel,
} from "@/lib/queries/use-diagnosis-labels";
import { reportServerError } from "@/lib/sentry-report-server";
import type { DiagnosisLabel } from "@/lib/types";
import {
  SettingsBlock,
  SettingsError,
  SettingsTableFrame,
} from "./_settings-layout";

const PRESET_COLORS = [
  { value: "#dc2626", label: "Engine" },
  { value: "#ea580c", label: "Brake" },
  { value: "#ca8a04", label: "Electrical" },
  { value: "#0284c7", label: "AC / Cooling" },
  { value: "#7c3aed", label: "Suspension" },
  { value: "#059669", label: "Transmission" },
  { value: "#0891b2", label: "Steering" },
  { value: "#be123c", label: "Body" },
  { value: "#64748b", label: "Exhaust" },
  { value: "#d97706", label: "Fuel" },
];

// ── Schema ──────────────────────────────────────────────────

const diagnosisLabelSchema = z.object({
  nameMn: z.string().optional(),
  name: z.string().min(1, "English name is required"),
  color: z.string().optional(),
  isActive: z.boolean(),
});

type DiagnosisLabelValues = z.infer<typeof diagnosisLabelSchema>;

function labelToFormValues(label: DiagnosisLabel | null): DiagnosisLabelValues {
  return {
    nameMn: label?.name_mn ?? "",
    name: label?.name ?? "",
    color: label?.color ?? "",
    isActive: label?.is_active ?? true,
  };
}

function formValuesToBody(data: DiagnosisLabelValues) {
  return {
    name: data.name.trim(),
    name_mn: data.nameMn?.trim() || null,
    color: data.color?.trim() || null,
    is_active: data.isActive,
  };
}

// ── DnD helpers ─────────────────────────────────────────────

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon-sm"
      className="size-7 cursor-grab active:cursor-grabbing text-muted-foreground hover:bg-transparent"
    >
      <GripVertical className="size-3.5" />
    </Button>
  );
}

function DraggableRow({
  label,
  children,
}: {
  label: DiagnosisLabel;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: label.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="border-b border-border"
      {...attributes}
      {...listeners}
    >
      {children}
    </TableRow>
  );
}

// ── Main component ──────────────────────────────────────────

interface DiagnosisLabelsSectionProps {
  orgId: string;
}

export function DiagnosisLabelsSection({ orgId }: DiagnosisLabelsSectionProps) {
  const t = useTranslations("diagnosisLabels") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: labels, isPending, error } = useDiagnosisLabels(orgId);
  const createLabel = useCreateDiagnosisLabel(orgId);
  const updateLabel = useUpdateDiagnosisLabel(orgId);
  const deleteLabel = useDeleteDiagnosisLabel(orgId);
  const reorderLabels = useReorderDiagnosisLabels(orgId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<DiagnosisLabel | null>(null);
  const [items, setItems] = useState<DiagnosisLabel[]>([]);

  useEffect(() => {
    if (labels) setItems(labels);
  }, [labels]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((l) => l.id === active.id);
      const newIndex = prev.findIndex((l) => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const reordered = arrayMove(prev, oldIndex, newIndex);
      reorderLabels.mutate(
        reordered.map((label, idx) => ({ id: label.id, sort_order: idx })),
      );
      return reordered;
    });
  }

  async function handleFormSubmit(data: DiagnosisLabelValues) {
    const body = formValuesToBody(data);
    if (editingLabel) {
      await updateLabel.mutateAsync({ id: editingLabel.id, body });
    } else {
      await createLabel.mutateAsync(body);
    }
  }

  async function handleDelete(labelId: string) {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteLabel.mutateAsync(labelId);
      toast.success(t("deleted"));
    } catch (err) {
      reportServerError("Unexpected error", err);
      toast.error(err instanceof Error ? err.message : t("deleteFailed"));
    }
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingLabel(null);
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`skel-${i}`} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <SettingsError message={t("loadFailed")} />;
  }

  return (
    <>
      <SettingsBlock>
        <div className="flex items-center justify-between">
          <Typography.Muted className="text-sm text-muted-foreground">
            {t("sectionDescription")}
          </Typography.Muted>
          <Button
            onClick={() => {
              setEditingLabel(null);
              setDialogOpen(true);
            }}
            size="sm"
          >
            <Plus className="mr-1.5 size-4" />
            {t("addLabel")}
          </Button>
        </div>

        {!labels || labels.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8">
            <Stethoscope className="size-8 text-muted-foreground/40" />
            <div className="text-center">
              <Typography.Text className="text-sm font-medium">
                {t("emptyTitle")}
              </Typography.Text>
              <Typography.Muted className="mt-0.5 text-xs text-muted-foreground">
                {t("emptyDescription")}
              </Typography.Muted>
            </div>
          </div>
        ) : (
          <SettingsTableFrame>
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              sensors={sensors}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10 px-2 py-3" />
                    <TableHead className="px-4 py-3 font-medium">
                      {t("nameMn")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium">
                      {t("name")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium">
                      {t("color")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium">
                      {t("status")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext
                  items={items.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {items.map((label) => (
                      <DraggableRow key={label.id} label={label}>
                        <TableCell className="w-10 px-2 py-3">
                          <DragHandle id={label.id} />
                        </TableCell>
                        <TableCell className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            {label.color && (
                              <div
                                className="size-3 rounded-full"
                                style={{ backgroundColor: label.color }}
                              />
                            )}
                            {label.name_mn ?? label.name}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {label.name}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {label.color ? (
                            <div className="flex items-center gap-1.5">
                              <div
                                className="size-4 rounded-full border"
                                style={{ backgroundColor: label.color }}
                              />
                              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                {label.color}
                              </code>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50">–</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge
                            variant={label.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {label.is_active ? t("active") : t("inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingLabel(label);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(label.id)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </DraggableRow>
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          </SettingsTableFrame>
        )}
      </SettingsBlock>

      <CrudFormDrawer
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}
        mode={editingLabel ? "edit" : "create"}
        title={{ create: t("addTitle"), edit: t("editTitle") }}
        formId="label-form"
        schema={diagnosisLabelSchema}
        defaultValues={labelToFormValues(editingLabel)}
        onSubmit={handleFormSubmit}
        isPending={createLabel.isPending || updateLabel.isPending}
        submitLabel={{ create: t("addLabel"), edit: t("editLabel") }}
      >
        {(form) => (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="label-name-mn">{t("nameMn")}</FieldLabel>
              <FieldContent>
                <Input
                  id="label-name-mn"
                  placeholder={t("namePlaceholder")}
                  {...form.register("nameMn")}
                />
              </FieldContent>
            </Field>

            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="label-name">
                {t("name")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="label-name"
                  placeholder={t("nameEnPlaceholder")}
                  aria-invalid={!!form.formState.errors.name}
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <FieldError>{form.formState.errors.name.message}</FieldError>
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("color")}</FieldLabel>
              <FieldContent>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((preset) => (
                    <Button
                      key={preset.value}
                      title={preset.label}
                      onClick={() => form.setValue("color", preset.value)}
                      variant="outline"
                      size="icon-sm"
                      className={[
                        "rounded-full border-2 transition-[transform,border-color,box-shadow] duration-200 hover:scale-110",
                        form.watch("color") === preset.value
                          ? "border-foreground scale-110 ring-2 ring-offset-1 ring-ring"
                          : "border-transparent",
                      ].join(" ")}
                      style={{ backgroundColor: preset.value }}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Input
                      id="label-color"
                      placeholder={t("colorPlaceholder")}
                      className="flex-1 pl-9"
                      {...form.register("color")}
                    />
                    {form.watch("color") && (
                      <div
                        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 rounded-full border"
                        style={{ backgroundColor: form.watch("color") }}
                      />
                    )}
                  </div>
                  {form.watch("color") &&
                    !PRESET_COLORS.some(
                      (p) => p.value === form.watch("color"),
                    ) && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {t("customColor")}
                      </span>
                    )}
                </div>
              </FieldContent>
            </Field>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.watch("isActive")}
                onCheckedChange={(v) => form.setValue("isActive", v)}
              />
              <Label className="cursor-pointer">{t("active")}</Label>
            </div>
          </FieldGroup>
        )}
      </CrudFormDrawer>
    </>
  );
}
