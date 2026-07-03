"use client";

import { MessageSquarePlus, Timer, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface QuickActionsProps {
  workOrderId: string;
  orgId: string;
  existingNotes: string | null;
  onNoteAdded: () => void;
  t: (key: string) => string;
}

function parseNotes(raw: string | null): string {
  if (!raw) return "";
  if (typeof raw === "object" && raw !== null) {
    return (raw as { content: string }).content ?? "";
  }
  return String(raw);
}

export function QuickActions({
  workOrderId,
  orgId,
  existingNotes,
  onNoteAdded,
  t,
}: QuickActionsProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSaveNote() {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      const current = parseNotes(existingNotes);
      const separator = current ? "\n---\n" : "";
      const newNotes = `${current}${separator}${trimmed}`;

      const { updateWorkOrderNotes } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      await updateWorkOrderNotes(workOrderId, newNotes);

      toast.dismiss();
      toast.success(t("noteAdded") ?? "Note added");
      setNoteText("");
      setShowNoteInput(false);
      onNoteAdded();
    } catch {
      toast.error(t("failedToSaveNote"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-2 border-b border-border/60 shrink-0">
      <div className="flex items-center gap-2">
        {/* Add Note chip */}
        {!showNoteInput ? (
          <button
            type="button"
            onClick={() => setShowNoteInput(true)}
            className="inline-flex items-center gap-2 rounded-full bg-muted/70 px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
          >
            <MessageSquarePlus className="size-4" />
            {t("addNote")}
          </button>
        ) : null}

        {/* Log Time chip (placeholder) */}
        <button
          type="button"
          onClick={() => toast.info(t("timeTrackingComingSoon"))}
          className="inline-flex items-center gap-2 rounded-full bg-muted/70 px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
        >
          <Timer className="size-4" />
          {t("logTime")}
        </button>
      </div>

      {/* Inline note textarea */}
      {showNoteInput && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t("notePlaceholder")}
            rows={3}
            className="text-xs resize-none bg-muted/50 border-border/60"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveNote}
              disabled={!noteText.trim() || saving}
            >
              {t("saveNote")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNoteInput(false);
                setNoteText("");
              }}
            >
              <X className="size-3 mr-1" />
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
