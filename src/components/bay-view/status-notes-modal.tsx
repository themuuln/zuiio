"use client";

import { MessageSquare, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface StatusNotesModalProps {
  woId: string;
  newStatus: string;
  onConfirm: (woId: string, status: string, notes?: string) => void;
  onCancel: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  "Ready for Pickup": "Mark Ready for Pickup",
  Completed: "Complete Work Order",
  Cancelled: "Cancel Work Order",
};

export function StatusNotesModal({
  woId,
  newStatus,
  onConfirm,
  onCancel,
}: StatusNotesModalProps) {
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

  const title = STATUS_LABELS[newStatus] ?? `Change to ${newStatus}`;

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
            aria-label="Cancel"
          >
            <X className="size-4" />
          </button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Add a note about this status change{" "}
            <span className="text-xs text-muted-foreground/60">(optional)</span>
          </p>
          <Input
            ref={inputRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='e.g. "Oil change completed, test drove OK"'
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
              Cancel
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
