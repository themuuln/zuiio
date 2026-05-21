"use client";

import {
  Car,
  Clock,
  CornerDownRight,
  Loader2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { Vehicle, WorkOrder } from "@/lib/database.types";
import { cn, formatPlateNumber } from "@/lib/utils";

interface QueueAssignmentDialogProps {
  workOrder: WorkOrder & { vehicle: Vehicle | null };
  bays: { bayNumber: number; occupied: boolean }[];
  mechanics: { id: string; full_name: string | null }[];
  onAssign: (
    workOrderId: string,
    bayNumber: number,
    mechanicId?: string,
  ) => Promise<void>;
  onClose: () => void;
}

export function QueueAssignmentDialog({
  workOrder,
  bays,
  mechanics,
  onAssign,
  onClose,
}: QueueAssignmentDialogProps) {
  const t = useTranslations("bayView");
  const [selectedBay, setSelectedBay] = useState<number | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const v = workOrder.vehicle;
  const waitMinutes = Math.floor(
    (Date.now() - new Date(workOrder.created_at).getTime()) / 60000,
  );
  const waitText =
    waitMinutes < 60
      ? `${waitMinutes}m`
      : `${Math.floor(waitMinutes / 60)}h ${waitMinutes % 60}m`;

  const firstEmpty = bays.find((b) => !b.occupied);
  const availableBays = bays.filter((b) => !b.occupied);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      // Keyboard shortcut: press 1-9 to select a bay
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        const bay = bays.find((b) => b.bayNumber === num && !b.occupied);
        if (bay) setSelectedBay(bay.bayNumber);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, bays]);

  useEffect(() => {
    if (firstEmpty && !selectedBay) {
      setSelectedBay(firstEmpty.bayNumber);
    }
  }, [firstEmpty, selectedBay]);

  const handleConfirm = async () => {
    if (!selectedBay) return;
    setSaving(true);
    setError(null);
    try {
      await onAssign(
        workOrder.id,
        selectedBay,
        selectedMechanic ?? undefined,
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to assign vehicle",
      );
    } finally {
      setSaving(false);
    }
  };

  const serviceDesc = workOrder.complaint ?? workOrder.description ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        className="mx-4 w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={() => {}}
      >
        {/* ── Header: vehicle summary card ── */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-1 ring-amber-500/20">
                <Car className="size-7 text-amber-500" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {v ? formatPlateNumber(v.plate_number) : t("noVehicle")}
                  </h2>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {waitText}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {v
                    ? `${v.make} ${v.model}${v.year ? ` · ${v.year}` : ""}`
                    : ""}
                  {v?.color && (
                    <span className="text-muted-foreground/50">
                      {" "}· {v.color}
                    </span>
                  )}
                </p>
                {serviceDesc && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground border border-border/50">
                    <Wrench className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
                    <span className="line-clamp-2">{serviceDesc}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-muted transition-colors shrink-0"
              aria-label={t("close")}
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* ── Body: two-column layout ── */}
        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ── Left: Bay selection ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("selectBay")}
                </label>
                {selectedBay && (
                  <span className="text-[10px] font-medium text-primary">
                    Bay #{selectedBay} selected
                  </span>
                )}
              </div>
              {availableBays.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 py-8 text-center">
                  <span className="text-3xl font-semibold text-muted-foreground/30">
                    {bays.length}
                  </span>
                  <span className="text-xs text-muted-foreground/60 mt-1">
                    All bays are occupied
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {bays.map((bay) => {
                    const isSelected = selectedBay === bay.bayNumber;
                    const isAvailable = !bay.occupied;
                    return (
                      <button
                        key={bay.bayNumber}
                        type="button"
                        onClick={() => isAvailable && setSelectedBay(bay.bayNumber)}
                        disabled={!isAvailable}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3.5 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm shadow-primary/20 ring-1 ring-primary/20"
                            : isAvailable
                              ? "border-dashed border-muted-foreground/30 bg-muted/20 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                              : "border-border/50 bg-muted/10 opacity-45 cursor-not-allowed",
                        )}
                      >
                        <span
                          className={cn(
                            "text-lg font-semibold tabular-nums",
                            isSelected
                              ? "text-primary"
                              : isAvailable
                                ? "text-foreground"
                                : "text-muted-foreground",
                          )}
                        >
                          {bay.bayNumber}
                        </span>
                        {isAvailable ? (
                          <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Free
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
                            <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                            Busy
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground/50 mt-2">
                Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-mono">1</kbd>–<kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-mono">9</kbd> to quick-select a bay
              </p>
            </div>

            {/* ── Right: Mechanic selection + quick info ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("selectMechanic")}
                </label>
                {mechanics.length > 0 && (
                  <span className="text-[10px] text-muted-foreground/50">
                    {mechanics.length} available
                  </span>
                )}
              </div>
              <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                {mechanics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-8 text-center">
                    <User className="size-6 text-muted-foreground/30 mb-1" />
                    <span className="text-xs text-muted-foreground/60">
                      No mechanics registered
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedMechanic(null)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        !selectedMechanic
                          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/60 bg-muted/15 hover:border-primary/30 hover:bg-muted/30",
                      )}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground">
                        <span className="text-xs font-semibold">&ndash;</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium">
                          Skip mechanic
                        </span>
                        <span className="text-[11px] text-muted-foreground/60 block">
                          Assign later
                        </span>
                      </div>
                    </button>
                    {mechanics.map((m) => {
                      const isSelected = selectedMechanic === m.id;
                      const initials = m.full_name
                        ? m.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                        : "?";
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setSelectedMechanic(isSelected ? null : m.id)
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                            isSelected
                              ? "border-primary/50 bg-primary/10 shadow-sm ring-1 ring-primary/20"
                              : "border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-muted/40 hover:shadow-sm",
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted-foreground/10 text-muted-foreground",
                            )}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {m.full_name ?? "Unknown"}
                            </span>
                            <span className="text-[11px] text-muted-foreground/60">
                              {isSelected ? "Assigned" : "Click to assign"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
            <Clock className="size-3.5" />
            <span>
              {workOrder.vehicle ? formatPlateNumber(workOrder.vehicle.plate_number) : "Vehicle"} → Bay{" "}
              {selectedBay ?? "?"}
              {selectedMechanic && " + mechanic"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedBay || saving}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50",
                selectedBay
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CornerDownRight className="size-4" />
              )}
              {saving ? t("assigning") : t("assignToBay")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
