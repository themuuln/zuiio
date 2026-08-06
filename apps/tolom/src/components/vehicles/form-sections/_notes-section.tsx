"use client";

import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { VehicleFormApi, VehicleFormT } from "./_types";

// ── Component ────────────────────────────────────────────────

type NotesSectionProps = {
  form: VehicleFormApi;
  t: VehicleFormT;
};

/** Notes textarea — always visible, spans the full grid width. */
export function NotesSection({ form, t }: NotesSectionProps) {
  return (
    <div className="sm:col-span-2">
      <Field>
        <FieldLabel>{t("notes")}</FieldLabel>
        <FieldContent>
          <Textarea
            value={form.watch("notes") || ""}
            onChange={(e) => form.setValue("notes", e.target.value)}
            placeholder={t("notesPlaceholderForm")}
            rows={2}
          />
        </FieldContent>
      </Field>
    </div>
  );
}
