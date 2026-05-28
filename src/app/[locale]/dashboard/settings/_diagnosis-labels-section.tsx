"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { GripVertical, Loader2, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  useDiagnosisLabels,
  useCreateDiagnosisLabel,
  useUpdateDiagnosisLabel,
  useDeleteDiagnosisLabel,
  useReorderDiagnosisLabels,
} from "@/lib/queries/use-diagnosis-labels";
import type { DiagnosisLabel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

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

function LabelFormDialog({
  open,
  onOpenChange,
  orgId,
  editingLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  editingLabel: DiagnosisLabel | null;
}) {
  const t = useTranslations("diagnosisLabels");
  const createLabel = useCreateDiagnosisLabel(orgId);
  const updateLabel = useUpdateDiagnosisLabel(orgId);
  const isEditing = !!editingLabel;

  const [nameMn, setNameMn] = useState(editingLabel?.name_mn ?? "");
  const [name, setName] = useState(editingLabel?.name ?? "");
  const [color, setColor] = useState(editingLabel?.color ?? "");
  const [isActive, setIsActive] = useState(editingLabel?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setNameMn("");
    setName("");
    setColor("");
    setIsActive(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        name_mn: nameMn.trim() || null,
        color: color.trim() || null,
        is_active: isActive,
      };

      if (isEditing && editingLabel) {
        await updateLabel.mutateAsync({ id: editingLabel.id, body });
        toast.success(t("updated"));
      } else {
        await createLabel.mutateAsync(body);
        toast.success(t("created"));
      }

      onOpenChange(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editTitle") : t("addTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
          {/* Mongolian name first */}
          <Field>
            <FieldLabel htmlFor="label-name-mn">{t("nameMn")}</FieldLabel>
            <Input
              id="label-name-mn"
              value={nameMn}
              onChange={(e) => setNameMn(e.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </Field>

          {/* English name second */}
          <Field>
            <FieldLabel htmlFor="label-name">
              {t("name")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="label-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("nameEnPlaceholder")}
              required
            />
          </Field>

          {/* Color picker with presets */}
          <Field>
            <FieldLabel>{t("color")}</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((preset) => (
                <Button
                  key={preset.value}
                  title={preset.label}
                  onClick={() => setColor(preset.value)}
                  variant="outline"
                  size="icon-sm"
                  className={cn(
                    "rounded-full border-2 transition-all hover:scale-110",
                    color === preset.value
                      ? "border-foreground scale-110 ring-2 ring-offset-1 ring-ring"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  id="label-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder={t("colorPlaceholder")}
                  className="flex-1 pl-9"
                />
                {color && (
                  <div
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
              {color && !PRESET_COLORS.some((p) => p.value === color) && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t("customColor")}
                </span>
              )}
            </div>
          </Field>
          </FieldGroup>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="cursor-pointer">{t("active")}</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? t("editLabel") : t("addLabel")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DiagnosisLabelsSectionProps {
  orgId: string;
}

export function DiagnosisLabelsSection({
  orgId,
}: DiagnosisLabelsSectionProps) {
  const t = useTranslations("diagnosisLabels");
  const { data: labels, isLoading, error } = useDiagnosisLabels(orgId);
  const deleteLabel = useDeleteDiagnosisLabel(orgId);
  const reorderLabels = useReorderDiagnosisLabels(orgId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<DiagnosisLabel | null>(null);
  const [items, setItems] = useState<DiagnosisLabel[]>([]);

  // Sync local DnD state from query data
  useEffect(() => {
    if (labels) setItems(labels);
  }, [labels]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
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
      // Persist new sort_order to the server
      const updates = reordered.map((label, idx) => ({
        id: label.id,
        sort_order: idx,
      }));
      reorderLabels.mutate(updates);
      return reordered;
    });
  }

  function openAddDialog() {
    setEditingLabel(null);
    setDialogOpen(true);
  }

  function openEditDialog(label: DiagnosisLabel) {
    setEditingLabel(label);
    setDialogOpen(true);
  }

  async function handleDelete(labelId: string) {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteLabel.mutateAsync(labelId);
      toast.success(t("deleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("deleteFailed"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`skel-${i}`} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="py-6">
          <Typography.Text className="text-sm text-destructive">{t("loadFailed")}</Typography.Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex mt-4 flex-col gap-4">
        <div className="flex items-center justify-between">
          <Typography.Muted className="text-sm text-muted-foreground">
            {t("sectionDescription")}
          </Typography.Muted>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="mr-1.5 size-4" />
            {t("addLabel")}
          </Button>
        </div>

        {!labels || labels.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Stethoscope className="size-10 text-muted-foreground/40" />
              <div className="text-center">
                <Typography.Text className="text-sm font-medium">{t("emptyTitle")}</Typography.Text>
                <Typography.Muted className="mt-0.5 text-xs text-muted-foreground">
                  {t("emptyDescription")}
                </Typography.Muted>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
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
                                size="icon-sm"
                                onClick={() => openEditDialog(label)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
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
            </CardContent>
          </Card>
        )}
      </div>

      <LabelFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingLabel(null);
        }}
        orgId={orgId}
        editingLabel={editingLabel}
      />
    </>
  );
}
