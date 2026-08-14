"use client";

import {
  Calendar,
  Check,
  ChevronDown,
  Phone,
  Plus,
  User,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { Button } from "@/components/ui/button";
import type { WorkOrderDetail } from "@/lib/types/composite";
import type { MechanicRef } from "@/lib/types/mechanic";
import { cn, formatMNT } from "@/lib/utils";
import type { BayCardMechanic } from "./../_bay-card-types";
import { STATUS_TRANSLATION_KEYS } from "./../_constants";
import { EditableText } from "./_editable-text";

/**
 * Sidebar cards in the drawer v2 anatomy. The mechanic card uses the
 * approved inline picker UX (click the row → list → assign, helpers as
 * removable chips) wired to the real mutations.
 */

function initials(fullName: string | null | undefined): string {
  if (!fullName) return "?";
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function SidebarCardV2({
  icon: Icon,
  label,
  action,
  children,
}: {
  icon: typeof User;
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm [content-visibility:auto] [contain-intrinsic-size:auto_180px]">
      <header className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground">
            <Icon className="size-3.5" />
          </div>
          <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            {label}
          </span>
        </div>
        {action}
      </header>
      <div className="p-3">{children}</div>
    </div>
  );
}

function MechanicListV2({
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  options: { id: string; title: string }[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-border/60">
      {options.map((opt, i) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => {
            onSelect(opt.id);
            onClose();
          }}
          className={cn(
            "flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/50",
            i > 0 && "border-t border-border/50",
            opt.id === selectedId && "bg-primary/5",
          )}
        >
          <span className="truncate text-xs font-medium text-foreground">
            {opt.title}
          </span>
          {opt.id === selectedId && (
            <Check className="size-3.5 shrink-0 text-primary" />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Customer ────────────────────────────────────────────────────

export function CustomerCardV2({
  wo,
  t,
  onOpenCustomerPicker,
  onSaveCustomerField,
}: {
  wo: WorkOrderDetail;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
  onOpenCustomerPicker: () => void;
  onSaveCustomerField?: (field: "name" | "phone", value: string) => void;
}) {
  const customer = wo.customer;
  const name = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      customer.full_name ||
      customer.phone ||
      ""
    : "";

  return (
    <SidebarCardV2
      icon={User}
      label={t("listHeaderCustomer")}
      action={
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6 text-muted-foreground/40 hover:text-foreground"
          aria-label={t("changeCustomer") ?? "Change customer"}
          onClick={onOpenCustomerPicker}
        >
          <UserPlus className="size-3.5" />
        </Button>
      }
    >
      {name ? (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {initials(name)}
          </div>
          <div className="min-w-0 flex-1">
            {onSaveCustomerField ? (
              <EditableText
                value={name}
                onSave={(v) => onSaveCustomerField("name", v)}
                className="text-sm font-medium text-foreground"
              />
            ) : (
              <p className="truncate text-sm font-medium text-foreground">
                {name}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
              <Phone className="size-3 shrink-0" />
              {onSaveCustomerField ? (
                <EditableText
                  value={customer?.phone ?? ""}
                  onSave={(v) => onSaveCustomerField("phone", v)}
                  placeholder="—"
                  className="text-xs"
                />
              ) : (
                <span className="truncate">{customer?.phone ?? "—"}</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenCustomerPicker}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex size-7 items-center justify-center rounded-full bg-muted/50">
            <User className="size-3.5 text-muted-foreground/50" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {t("selectCustomer")}
          </span>
        </button>
      )}
    </SidebarCardV2>
  );
}

// ── Mechanic ────────────────────────────────────────────────────

export function MechanicCardV2({
  wo,
  allMechanics,
  helpers,
  workOrderId,
  t,
  onAssignMechanic,
  addHelperMutation,
  removeHelperMutation,
}: {
  wo: WorkOrderDetail;
  allMechanics: BayCardMechanic[];
  helpers: MechanicRef[];
  workOrderId: string;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
  onAssignMechanic: (
    mechanicId: string,
    fullName?: string | null,
  ) => Promise<void>;
  addHelperMutation?: {
    mutateAsync: (vars: { woId: string; mechanicId: string }) => Promise<void>;
  };
  removeHelperMutation?: {
    mutateAsync: (vars: { woId: string; mechanicId: string }) => Promise<void>;
  };
}) {
  const [showAssign, setShowAssign] = useState(false);
  const [showAddHelper, setShowAddHelper] = useState(false);
  const mechanic = wo.mechanic;

  const effectiveMechanics = useMemo(() => {
    if (!mechanic?.id) return allMechanics;
    const alreadyIncluded = allMechanics.some((m) => m.id === mechanic.id);
    if (alreadyIncluded) return allMechanics;
    return [
      { id: mechanic.id, full_name: mechanic.full_name ?? "—" },
      ...allMechanics,
    ];
  }, [mechanic, allMechanics]);

  const helperIds = useMemo(() => {
    const ids = new Set<string>();
    for (const h of helpers) {
      const hid = (h as MechanicRef & { mechanic_id?: string }).mechanic_id;
      if (hid) ids.add(hid);
      else if (h.id) ids.add(h.id);
    }
    return ids;
  }, [helpers]);

  // The lead mechanic row shows the real avatar; wo.mechanic carries no
  // avatar_url, so resolve it from the full mechanic list (merged above).
  const leadMechanic = useMemo((): MechanicRef | null => {
    if (!mechanic?.id) return null;
    const listed = effectiveMechanics.find((m) => m.id === mechanic.id);
    return {
      id: mechanic.id,
      full_name: mechanic.full_name ?? null,
      avatar_url: listed?.avatar_url ?? null,
    };
  }, [mechanic, effectiveMechanics]);

  const availableForAssign = effectiveMechanics.filter(
    (m) => m.id !== mechanic?.id,
  );
  const availableHelpers = effectiveMechanics.filter(
    (m) => m.id !== mechanic?.id && !helperIds.has(m.id),
  );

  const handleAssign = useCallback(
    async (mechanicId: string) => {
      const mech = effectiveMechanics.find((m) => m.id === mechanicId);
      try {
        await onAssignMechanic(mechanicId, mech?.full_name);
      } catch {
        toast.error(t("assignMechanicFailed"));
      }
    },
    [effectiveMechanics, onAssignMechanic, t],
  );

  const handleAddHelper = useCallback(
    async (mechanicId: string) => {
      try {
        await addHelperMutation?.mutateAsync({ woId: workOrderId, mechanicId });
      } catch {
        toast.error(t("addHelperFailed"));
      }
    },
    [addHelperMutation, workOrderId, t],
  );

  const handleRemoveHelper = useCallback(
    async (mechanicId: string) => {
      try {
        await removeHelperMutation?.mutateAsync({
          woId: workOrderId,
          mechanicId,
        });
      } catch {
        toast.error(t("removeHelperFailed"));
      }
    },
    [removeHelperMutation, workOrderId, t],
  );

  return (
    <SidebarCardV2 icon={Wrench} label={t("listHeaderMechanic")}>
      {/* Click the mechanic row to reassign */}
      <button
        type="button"
        onClick={() => setShowAssign((v) => !v)}
        aria-expanded={showAssign}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {leadMechanic ? (
          <MechanicAvatar mechanic={leadMechanic} className="size-8" />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
            ?
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {mechanic?.full_name ?? t("unassigned")}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {mechanic ? t("assigned") : t("unassigned")}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground/60">
          {t("change") ?? "Солих"}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              showAssign && "rotate-180",
            )}
          />
        </span>
      </button>

      {showAssign && (
        <MechanicListV2
          options={availableForAssign.map((m) => ({
            id: m.id,
            title: m.full_name ?? "—",
          }))}
          selectedId={mechanic?.id}
          onSelect={handleAssign}
          onClose={() => setShowAssign(false)}
        />
      )}

      {mechanic && (
        <div className="mt-2.5 border-t border-border/50 pt-2.5">
          {helpers.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {helpers.map((h) => {
                const hid = (h as MechanicRef & { mechanic_id?: string })
                  .mechanic_id;
                const helperId = hid ?? h.id;
                return (
                  <span
                    key={h.id}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
                  >
                    <MechanicAvatar mechanic={h} className="size-4" />
                    {h.full_name}
                    <button
                      type="button"
                      onClick={() => handleRemoveHelper(helperId)}
                      aria-label={t("removeHelper") ?? "Remove helper"}
                      className="text-muted-foreground/50 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                onClick={() => setShowAddHelper((v) => !v)}
                aria-label={t("addHelper") ?? "Add helper"}
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground/60 transition-colors hover:border-primary/50 hover:text-primary",
                  showAddHelper && "rotate-45 border-primary/50 text-primary",
                )}
              >
                <Plus className="size-3" />
              </button>
            </div>
          )}

          {helpers.length === 0 && (
            <button
              type="button"
              onClick={() => setShowAddHelper((v) => !v)}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/30 px-2.5 py-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:border-primary/50 hover:text-primary hover:bg-primary/5",
                showAddHelper && "border-primary/50 bg-primary/5 text-primary",
              )}
            >
              <Plus className="size-3.5" />
              {t("addHelper") ?? "Add helper"}
            </button>
          )}

          {showAddHelper && (
            <MechanicListV2
              options={availableHelpers.map((m) => ({
                id: m.id,
                title: m.full_name ?? "—",
              }))}
              onSelect={handleAddHelper}
              onClose={() => setShowAddHelper(false)}
            />
          )}
        </div>
      )}
    </SidebarCardV2>
  );
}

// ── Timeline ────────────────────────────────────────────────────

const STATUS_ORDER = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
];

export function TimelineCardV2({
  wo,
  t,
}: {
  wo: WorkOrderDetail;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
}) {
  const history = wo.status_history ?? [];

  // Steps are linear: every step at or before the current status is reached,
  // even if status_history skipped intermediate entries (e.g. drag from New
  // straight to Ready for Pickup). Fall back to history-derived steps when the
  // current status is not in the order (e.g. Cancelled).
  const currentIdx = STATUS_ORDER.indexOf(wo.status);
  const reached =
    currentIdx >= 0
      ? STATUS_ORDER.slice(0, currentIdx + 1)
      : (() => {
          const seen = new Set<string>();
          const fromHistory: string[] = [];
          for (const h of history) {
            if (!seen.has(h.status)) {
              seen.add(h.status);
              fromHistory.push(h.status);
            }
          }
          return fromHistory;
        })();

  const latestAt = (status: string) => {
    const entry = [...history].reverse().find((h) => h.status === status);
    return entry
      ? new Date(entry.created_at).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  };

  return (
    <SidebarCardV2 icon={Calendar} label={t("statusTimeline") ?? "Timeline"}>
      <ol className="flex flex-col">
        {STATUS_ORDER.map((status, i) => {
          const done = reached.includes(status);
          const isCurrent = wo.status === status;
          return (
            <li key={status} className="relative flex gap-3 pb-4 last:pb-0">
              {i < STATUS_ORDER.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[5px] top-4 h-[calc(100%-1rem)] w-px",
                    reached.includes(STATUS_ORDER[i + 1])
                      ? "bg-primary/40"
                      : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "mt-1 size-[11px] shrink-0 rounded-full",
                  done
                    ? "bg-primary ring-4 ring-primary/10"
                    : "border-2 border-border bg-background",
                  isCurrent && "animate-pulse",
                )}
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    done
                      ? "font-medium text-foreground"
                      : "text-muted-foreground/60",
                  )}
                >
                  {t(STATUS_TRANSLATION_KEYS[status] ?? status)}
                </p>
                {latestAt(status) && (
                  <p className="text-xs tabular-nums text-muted-foreground/60">
                    {latestAt(status)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 border-t border-border/50 pt-2 text-xs tabular-nums text-muted-foreground/70">
        {t("total")} · {formatMNT(wo.total)}
      </p>
    </SidebarCardV2>
  );
}
