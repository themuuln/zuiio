"use client";

import { FileText, Package, Pencil, Plus, Wrench } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkOrderPart, WorkOrderService } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { EditableText } from "./_editable-text";
import { PreviewLineItemRow } from "./_preview-row";

/**
 * Work-order sections in the drawer v2 anatomy: solid cards with an
 * icon-chip header (icon · title · count · subtotal), divided rows, and
 * a dashed add-action footer. Wired to real data + mutations.
 */

function SectionCardV2({
  icon: Icon,
  title,
  count,
  subtotal,
  addLabel,
  onAdd,
  emptyMessage,
  isEmpty,
  children,
}: {
  icon: typeof Wrench;
  title: string;
  count: number;
  subtotal: number;
  addLabel: string;
  onAdd: () => void;
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm [content-visibility:auto] [contain-intrinsic-size:auto_220px]">
      <header className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-3.5" />
          </div>
          <h3 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h3>
          {count > 0 && (
            <Badge
              variant="outline"
              className="h-4 shrink-0 px-1.5 text-[10px] tabular-nums"
            >
              {count}
            </Badge>
          )}
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground/80">
          {formatMNT(subtotal)}
        </span>
      </header>

      {isEmpty ? (
        <p className="px-3 py-6 text-center text-xs text-muted-foreground/60">
          {emptyMessage}
        </p>
      ) : (
        <div className="divide-y divide-border/50">{children}</div>
      )}

      <div className="border-t border-border/50 p-2">
        <Button
          variant="outline"
          onClick={onAdd}
          className="h-9 w-full gap-2 border-dashed text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>
    </section>
  );
}

interface SectionsProps {
  services?: WorkOrderService[] | null;
  parts?: WorkOrderPart[] | null;
  complaint?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
  onAddServiceOpenChange?: (open: boolean) => void;
  onAddPartOpenChange?: (open: boolean) => void;
  onEditServiceQty?: (id: string, qty: number) => Promise<void>;
  onEditServicePrice?: (id: string, price: number) => Promise<void>;
  onEditPartQty?: (id: string, qty: number) => Promise<void>;
  onEditPartPrice?: (id: string, price: number) => Promise<void>;
  onSaveNoteField?: (
    field: "complaint" | "diagnosis" | "notes",
    value: string,
  ) => void;
}

export function ServicesSectionV2({
  services,
  t,
  onAddServiceOpenChange,
  onEditServiceQty,
  onEditServicePrice,
}: SectionsProps) {
  const items = services ?? [];
  const subtotal = items.reduce(
    (sum, svc) => sum + Number(svc.final_price ?? 0),
    0,
  );

  return (
    <SectionCardV2
      icon={Wrench}
      title={t("services")}
      count={items.length}
      subtotal={subtotal}
      emptyMessage={t("noServicesYet")}
      isEmpty={items.length === 0}
      addLabel={t("addService")}
      onAdd={() => onAddServiceOpenChange?.(true)}
    >
      {items.map((svc) => (
        <PreviewLineItemRow
          key={svc.id}
          name={svc.service_name}
          meta={svc.description}
          quantity={Number(svc.quantity ?? 1)}
          unitPrice={Number(svc.unit_price ?? 0)}
          finalPrice={Number(svc.final_price ?? 0)}
          onEditQtySave={
            onEditServiceQty
              ? (qty) => void onEditServiceQty(svc.id, qty)
              : undefined
          }
          onEditPriceSave={
            onEditServicePrice
              ? (price) => void onEditServicePrice(svc.id, price)
              : undefined
          }
        />
      ))}
    </SectionCardV2>
  );
}

export function PartsSectionV2({
  parts,
  t,
  onAddPartOpenChange,
  onEditPartQty,
  onEditPartPrice,
}: SectionsProps) {
  const items = parts ?? [];
  const subtotal = items.reduce(
    (sum, p) => sum + Number(p.final_price ?? 0),
    0,
  );

  return (
    <SectionCardV2
      icon={Package}
      title={t("parts")}
      count={items.length}
      subtotal={subtotal}
      emptyMessage={t("noParts")}
      isEmpty={items.length === 0}
      addLabel={t("addPart")}
      onAdd={() => onAddPartOpenChange?.(true)}
    >
      {items.map((part) => (
        <PreviewLineItemRow
          key={part.id}
          name={part.part_name}
          meta={part.part_number}
          quantity={Number(part.quantity ?? 1)}
          unitPrice={Number(part.unit_price ?? 0)}
          finalPrice={Number(part.final_price ?? 0)}
          onEditQtySave={
            onEditPartQty
              ? (qty) => void onEditPartQty(part.id, qty)
              : undefined
          }
          onEditPriceSave={
            onEditPartPrice
              ? (price) => void onEditPartPrice(part.id, price)
              : undefined
          }
        />
      ))}
    </SectionCardV2>
  );
}

export function NotesSectionV2({
  complaint,
  diagnosis,
  notes,
  t,
  onSaveNoteField,
}: SectionsProps) {
  const [editRequest, setEditRequest] = useState(0);
  const fields = [
    { label: t("complaint"), key: "complaint", value: complaint ?? "" },
    { label: t("diagnosis"), key: "diagnosis", value: diagnosis ?? "" },
    { label: t("internalNotes"), key: "notes", value: notes ?? "" },
  ].filter((f) => f.value || onSaveNoteField);

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm [content-visibility:auto] [contain-intrinsic-size:auto_220px]">
      <header className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
            <FileText className="size-3.5" />
          </div>
          <h3 className="truncate text-sm font-semibold text-foreground">
            {t("complaintAndNotes")}
          </h3>
        </div>
        {onSaveNoteField && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground/50 hover:text-foreground"
            aria-label={t("complaintAndNotes")}
            onClick={() => setEditRequest((n) => n + 1)}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </header>

      {fields.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-muted-foreground/60">
          {t("noNotesYet") ?? "No notes"}
        </p>
      ) : (
        <dl className="divide-y divide-border/50">
          {fields.map((f, index) => (
            <div key={f.key} className="px-3 py-2.5">
              <dt className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {f.label}
              </dt>
              <dd className="text-sm leading-relaxed text-foreground/85">
                {onSaveNoteField ? (
                  <EditableText
                    value={f.value}
                    multiline={f.value.length > 60}
                    placeholder="—"
                    // Only one field can be in edit mode at a time (blur
                    // commits), so the header pencil targets the first one.
                    editRequest={index === 0 ? editRequest : undefined}
                    onSave={(v) =>
                      onSaveNoteField(
                        f.key as "complaint" | "diagnosis" | "notes",
                        v,
                      )
                    }
                    className="w-full"
                  />
                ) : (
                  f.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
