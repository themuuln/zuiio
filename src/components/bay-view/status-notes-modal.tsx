"use client";

import { MessageSquare, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    // Close on Escape
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleSubmit = () => {
    onConfirm(woId, newStatus, notes.trim() || undefined);
  };

  const LABEL_MAP: Record<string, string> = {
    "Ready for Pickup": t("statusNotesTitle"),
    Completed: t("statusNotesCompleteTitle"),
    Cancelled: t("statusNotesCancelTitle"),
  };
  const title = LABEL_MAP[newStatus] ?? t("statusNotesGenericTitle", { status: newStatus });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <Card
        className="mx-4 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            {title}
          </CardTitle>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 hover:bg-muted transition-colors"
            aria-label={t("cancel")}
          >
            <X className="size-4" />
          </button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {t("addNotePrompt")}
          </p>
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
            <Button variant="outline" onClick={onCancel} size="lg">
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} size="lg">
              {title}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
