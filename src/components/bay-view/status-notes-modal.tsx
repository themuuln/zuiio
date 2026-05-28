"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface StatusNotesModalProps {
  woId: string;
  newStatus: string;
  onConfirm: (woId: string, status: string, notes?: string) => void;
  onCancel: () => void;
}

export function StatusNotesModal({
  woId,
  newStatus,
  onConfirm,
  onCancel,
}: StatusNotesModalProps) {
  const t = useTranslations("bayView");
  const [notes, setNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    onConfirm(woId, newStatus, notes.trim() || undefined);
  };

  const LABEL_MAP: Record<string, string> = {
    "Ready for Pickup": t("statusNotesTitle"),
    Completed: t("statusNotesCompleteTitle"),
    Cancelled: t("statusNotesCancelTitle"),
  };
  const title =
    LABEL_MAP[newStatus] ?? t("statusNotesGenericTitle", { status: newStatus });

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("addNotePrompt")}</p>
        <Input
          ref={inputRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("notePlaceholder")}
          className="h-11"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} size="default">
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} size="default">
            {title}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
