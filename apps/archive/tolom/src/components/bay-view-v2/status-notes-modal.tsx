"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { useForm } from "@/lib/hooks/use-form";

// ── Schema ───────────────────────────────────────────────────

const statusNotesSchema = z.object({
  notes: z.string().optional(),
});

type StatusNotesFormValues = z.infer<typeof statusNotesSchema>;

// ── Types ──────────────────────────────────────────────────

interface StatusNotesModalProps {
  woId: string;
  newStatus: string;
  onConfirm: (woId: string, status: string, notes?: string) => void;
  onCancel: () => void;
}

// ── Component ──────────────────────────────────────────────

export function StatusNotesModal({
  woId,
  newStatus,
  onConfirm,
  onCancel,
}: StatusNotesModalProps) {
  const t = useTranslations("bayView");

  const form = useForm<StatusNotesFormValues>({
    defaultValues: { notes: "" },
  });

  // Register notes field and merge with auto-focus ref
  const notesRegister = form.register("notes");
  const notesRef = useCallback(
    (el: HTMLInputElement | null) => {
      notesRegister.ref(el);
      if (el) el.focus();
    },
    [notesRegister],
  );

  const onSubmit = form.handleSubmit((data) => {
    onConfirm(woId, newStatus, data.notes?.trim() || undefined);
  });

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
        <Typography.Muted className="text-sm text-muted-foreground">
          {t("addNotePrompt")}
        </Typography.Muted>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field data-invalid={!!form.formState.errors.notes}>
            <FieldContent>
              <Input
                ref={notesRef}
                placeholder={t("notePlaceholder")}
                className="h-11"
                aria-invalid={!!form.formState.errors.notes}
                onChange={notesRegister.onChange}
                onBlur={notesRegister.onBlur}
                name={notesRegister.name}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e as unknown as React.FormEvent);
                  }
                }}
              />
              {form.formState.errors.notes && (
                <FieldError>{form.formState.errors.notes.message}</FieldError>
              )}
            </FieldContent>
          </Field>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              type="button"
              size="default"
            >
              {t("cancel")}
            </Button>
            <Button type="submit" size="default">
              {title}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
