"use client";

import { FileText } from "lucide-react";
import { Typography } from "@/components/ui/typography";

interface NotesSectionProps {
  complaint: string | null;
  diagnosis: string | null;
  notes: string | null;
  t: (key: string) => string;
}

export function NotesSection({
  complaint,
  diagnosis,
  notes,
  t,
}: NotesSectionProps) {
  if (!complaint && !diagnosis && !notes) return null;

  return (
    <section className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="flex items-center justify-center size-5 rounded-md bg-emerald-500/10">
          <FileText className="size-3 text-emerald-500" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("complaintAndNotes")}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {complaint && (
          <div>
            <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              {t("complaint")}
            </span>
            <Typography.Text className="text-xs mt-0.5 p-2.5 rounded-lg bg-muted/50 border border-border/60 text-foreground/80 leading-relaxed">
              {complaint}
            </Typography.Text>
          </div>
        )}
        {diagnosis && (
          <div>
            <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              {t("diagnosis")}
            </span>
            <Typography.Text className="text-xs mt-0.5 p-2.5 rounded-lg bg-muted/50 border border-border/60 text-foreground/80 leading-relaxed">
              {diagnosis}
            </Typography.Text>
          </div>
        )}
        {notes && (
          <div>
            <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              {t("internalNotes")}
            </span>
            <Typography.Text className="text-xs mt-0.5 p-2.5 rounded-lg bg-muted/50 border border-border/60 text-foreground/80 leading-relaxed">
              {typeof notes === "object" && notes !== null
                ? (notes as { content: string }).content
                : notes}
            </Typography.Text>
          </div>
        )}
      </div>
    </section>
  );
}
