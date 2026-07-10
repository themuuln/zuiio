"use client";

import { useOrgMutation } from "@zuiio/query";
import { FileText, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { workOrderKeys } from "@/lib/queries/keys";
import { reportServerError } from "@/lib/sentry-report-server";

interface NotesSectionProps {
  complaint: string | null;
  diagnosis: string | null;
  notes: string | null;
  orgId: string;
  workOrderId: string;
  onUpdated: () => void;
  t: (key: string) => string;
}

type EditableField = "complaint" | "diagnosis" | "notes";

function parseNotes(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "object" && raw !== null && "content" in raw) {
    const maybeContent = raw.content;
    return typeof maybeContent === "string" ? maybeContent : "";
  }
  return String(raw);
}

export function NotesSection({
  complaint,
  diagnosis,
  notes,
  orgId,
  workOrderId,
  onUpdated,
  t,
}: NotesSectionProps) {
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const saveFieldMutation = useOrgMutation<
    unknown,
    Record<string, string | null>
  >({
    endpoint: () => `/api/organizations/${orgId}/work-orders/${workOrderId}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId),
    onSuccess: () => {
      toast.dismiss();
      toast.success(t("saved") ?? "Saved");
      setEditingField(null);
      setEditValue("");
      onUpdated();
    },
  });

  if (!complaint && !diagnosis && !notes) return null;

  function startEdit(field: EditableField, currentValue: string | null) {
    setEditingField(field);
    setEditValue(
      field === "notes" ? parseNotes(currentValue) : (currentValue ?? ""),
    );
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue("");
  }

  async function saveField(field: EditableField) {
    setSaving(true);
    try {
      const body: Record<string, string | null> = {};
      body[field] = editValue.trim() || null;
      await saveFieldMutation.mutateAsync(body);
    } catch (error) {
      reportServerError("Unexpected error", error);
      toast.error(t("failedToSave"));
    } finally {
      setSaving(false);
    }
  }

  function renderField(
    field: EditableField,
    label: string,
    value: string | null,
  ) {
    const isEditing = editingField === field;
    const displayValue = field === "notes" ? parseNotes(value) : (value ?? "");

    return (
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground/60">
            {label}
          </span>
          {!isEditing && displayValue && (
            <button
              type="button"
              onClick={() => startEdit(field, value)}
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer"
              aria-label={`Edit ${label}`}
            >
              <Pencil className="size-3" />
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="flex flex-col gap-2 mt-1">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={3}
              className="text-xs resize-none bg-muted/50 border-border/60"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => saveField(field)}
                disabled={saving}
              >
                {t("saveNote")}
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <Typography.Text className="text-xs mt-1 p-3 rounded-lg bg-muted/50 border border-border/60 text-foreground/80 leading-relaxed">
            {displayValue}
          </Typography.Text>
        )}
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-card/40 p-3">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="size-3.5 text-muted-foreground/70" />
        <span className="text-xs font-semibold text-muted-foreground">
          {t("complaintAndNotes")}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {complaint && renderField("complaint", t("complaint"), complaint)}
        {diagnosis && renderField("diagnosis", t("diagnosis"), diagnosis)}
        {notes && renderField("notes", t("internalNotes"), notes)}
      </div>
    </section>
  );
}
