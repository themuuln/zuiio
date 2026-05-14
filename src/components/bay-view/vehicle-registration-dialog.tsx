"use client";

import { HistoryIcon } from "lucide-react";
import {
  Car,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  onClose: () => void;
  initialMode?: "register" | "lookup";
}

interface LookupResult {
  exists: boolean;
  vehicle: {
    id: string;
    plate_number: string;
    make: string;
    model: string;
    year: number | null;
    color: string | null;
    vin: string | null;
    engine: string | null;
    transmission: string | null;
    fuel_type: string | null;
    odometer: number | null;
  } | null;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  serviceHistory: {
    work_order_id: string;
    status: string;
    created_at: string;
    complaint: string | null;
    diagnosis: string | null;
    notes: string | null;
    total: number;
    mechanic_name: string | null;
    services: { name: string; price: number }[];
  }[];
}

const EMPTY_LOOKUP: LookupResult = {
  exists: false,
  vehicle: null,
  customer: null,
  serviceHistory: [],
};

// ── Status colors for timeline ──────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Completed: "bg-green-500",
  "Ready for Pickup": "bg-green-400",
  "In Progress": "bg-amber-500",
  Diagnosing: "bg-blue-500",
  New: "bg-slate-400",
  Cancelled: "bg-red-400",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMNT(value: number): string {
  return `₮${new Intl.NumberFormat("mn-MN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)}`;
}

// ── Timeline Component ──────────────────────────────────────────

function ServiceTimeline({
  history,
}: {
  history: LookupResult["serviceHistory"];
}) {
  const t = useTranslations("bayView");
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
        <HistoryIcon className="size-10 mb-2" />
        <p className="text-sm">{t("noServiceHistory")}</p>
        <p className="text-xs mt-1">{t("serviceRecordsHere")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((entry, idx) => {
        const dotColor = STATUS_COLORS[entry.status] ?? "bg-slate-400";
        const isLast = idx === history.length - 1;

        return (
          <div key={entry.work_order_id} className="relative flex gap-3 pb-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-border" />
            )}

            {/* Dot */}
            <div className="relative z-10 mt-1 shrink-0">
              <div className={`size-5 rounded-full ${dotColor} ring-2 ring-background flex items-center justify-center`}>
                {entry.status === "Completed" ? (
                  <CheckCircle2 className="size-3 text-white" />
                ) : (
                  <div className="size-2 rounded-full bg-white" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold capitalize">
                  {entry.status}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDate(entry.created_at)} {formatTime(entry.created_at)}
                </span>
              </div>

              {entry.complaint && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {entry.complaint}
                </p>
              )}

              {entry.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {entry.services.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400"
                    >
                      <Wrench className="size-2.5" />
                      {s.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                {entry.total > 0 && (
                  <span className="font-medium text-foreground/80">
                    {formatMNT(entry.total)}
                  </span>
                )}
                {entry.mechanic_name && (
                  <span className="flex items-center gap-1">
                    <User className="size-2.5" />
                    {entry.mechanic_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dialog ─────────────────────────────────────────────────

export function VehicleRegistrationDialog({
  onClose,
  initialMode = "register",
}: Props) {
  const t = useTranslations("bayView");
  const [mode, setMode] = useState<"register" | "lookup">(initialMode);
  const [plate, setPlate] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult>(EMPTY_LOOKUP);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  // Registration form state
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [engine, setEngine] = useState("");
  const [odometer, setOdometer] = useState("");
  const [custFirstName, setCustFirstName] = useState("");
  const [custLastName, setCustLastName] = useState("");
  const [custPhone, setCustPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMode, setSaveMode] = useState<"created" | "updated" | null>(null);

  const plateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    plateRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Populate form from lookup result
  useEffect(() => {
    if (lookupResult.vehicle) {
      const v = lookupResult.vehicle;
      setMake(v.make);
      setModel(v.model);
      setYear(v.year?.toString() ?? "");
      setColor(v.color ?? "");
      setVin(v.vin ?? "");
      setEngine(v.engine ?? "");
      setOdometer(v.odometer?.toString() ?? "");
      if (lookupResult.customer) {
        const [first, ...rest] = (lookupResult.customer.first_name ?? "").split(" ");
        setCustFirstName(first);
        setCustLastName(rest.join(" ") || (lookupResult.customer.last_name ?? ""));
        setCustPhone(lookupResult.customer.phone ?? "");
      }
    }
  }, [lookupResult]);

  const handleLookup = useCallback(async () => {
    if (!plate.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupDone(false);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const { lookupVehicleByPlate } = await import(
        "@/lib/services/bay-view-actions"
      );
      const result = await lookupVehicleByPlate(plate.trim().toUpperCase());
      setLookupResult(result);
      setLookupDone(true);

      if (result.exists) {
        setMode("register");
      }
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "Lookup failed",
      );
    } finally {
      setLookupLoading(false);
    }
  }, [plate]);

  const handleSave = useCallback(async () => {
    if (!plate.trim() || !make.trim() || !model.trim()) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const { quickRegisterVehicle, lookupVehicleByPlate } = await import(
        "@/lib/services/bay-view-actions"
      );
      const saveResult = await quickRegisterVehicle({
        plateNumber: plate.trim().toUpperCase(),
        make: make.trim(),
        model: model.trim(),
        year: year ? parseInt(year, 10) : undefined,
        color: color.trim() || undefined,
        vin: vin.trim() || undefined,
        engine: engine.trim() || undefined,
        odometer: odometer ? parseInt(odometer, 10) : undefined,
        customerFirstName: custFirstName.trim() || undefined,
        customerLastName: custLastName.trim() || undefined,
        customerPhone: custPhone.trim() || undefined,
      });

      setSaveSuccess(true);
      setSaveMode(saveResult.isUpdate ? "updated" : "created");

      // Re-lookup to update timeline
      const lookupResult = await lookupVehicleByPlate(plate.trim().toUpperCase());
      setLookupResult(lookupResult);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to register vehicle",
      );
    } finally {
      setSaving(false);
    }
  }, [
    plate,
    make,
    model,
    year,
    color,
    vin,
    engine,
    odometer,
    custFirstName,
    custLastName,
    custPhone,
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-8 pb-8 overflow-y-auto"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative mx-4 w-full max-w-4xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-blue-500/10">
              <Car className="size-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {mode === "lookup"
                  ? t("vehicleServiceHistory")
                  : t("vehicleRegistration")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === "lookup"
                  ? t("lookupSubtitle")
                  : t("registerSubtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "register" ? "lookup" : "register");
                setLookupResult(EMPTY_LOOKUP);
                setLookupDone(false);
                setLookupError(null);
                setSaveSuccess(false);
                setSaveError(null);
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              {mode === "register" ? t("switchToLookup") : t("switchToRegister")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-muted transition-colors"
              aria-label={t("close")}
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* ── Left: Registration Form ── */}
          <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-border">
            {/* Plate lookup */}
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  ref={plateRef}
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLookup();
                  }}
                  placeholder={t("enterPlate")}
                  className="w-full h-11 rounded-xl border border-border bg-muted/30 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookupLoading || !plate.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
              >
                {lookupLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                {t("lookup")}
              </button>
            </div>

            {lookupError && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-600 dark:text-red-400">
                {lookupError}
              </div>
            )}

            {saveError && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-600 dark:text-red-400">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                {saveMode === "updated"
                  ? t("vehicleUpdated")
                  : t("vehicleRegistered")}
              </div>
            )}

            {lookupDone && !lookupResult.exists && (
              <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
                {t("vehicleNotFound")}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4"
            >
              {/* Vehicle fields */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t("vehicleInfo")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder={t("makeRequired")}
                    required
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={t("modelRequired")}
                    required
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder={t("year")}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder={t("color")}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Additional vehicle details */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t("additionalDetails")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    placeholder={t("vin")}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <input
                    type="text"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder={t("engine")}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <input
                    type="number"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder={t("odometer")}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Customer fields */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t("ownerInfo")} <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={custFirstName}
                    onChange={(e) => setCustFirstName(e.target.value)}
                    placeholder={t("firstName")}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <input
                    type="text"
                    value={custLastName}
                    onChange={(e) => setCustLastName(e.target.value)}
                    placeholder={t("lastName")}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder={t("phone")}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={saving || !plate.trim() || !make.trim() || !model.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : lookupResult.exists ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Car className="size-4" />
                )}
                {saving
                  ? t("saving")
                  : lookupResult.exists
                    ? t("updateVehicle")
                    : t("registerVehicleBtn")}
              </button>
            </form>
          </div>

          {/* ── Right: Timeline ── */}
          <div className="w-full lg:w-[360px] shrink-0 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-7 rounded-lg bg-amber-500/10">
                <HistoryIcon className="size-3.5 text-amber-500" />
              </div>
              <span className="text-sm font-semibold">{t("serviceTimeline")}</span>
              {lookupResult.serviceHistory.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {lookupResult.serviceHistory.length}
                </span>
              )}
            </div>

            {lookupDone ? (
              <>
                {/* Vehicle summary card */}
                {lookupResult.vehicle && (
                  <div className="mb-4 rounded-lg bg-muted/30 border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm">
                          {lookupResult.vehicle.plate_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lookupResult.vehicle.make}{" "}
                          {lookupResult.vehicle.model}
                          {lookupResult.vehicle.year
                            ? ` · ${lookupResult.vehicle.year}`
                            : ""}
                        </div>
                      </div>
                      {lookupResult.vehicle.color && (
                        <div
                          className="size-5 rounded-full border border-border"
                          style={{
                            backgroundColor:
                              lookupResult.vehicle.color.toLowerCase(),
                          }}
                          title={lookupResult.vehicle.color}
                        />
                      )}
                    </div>
                    {lookupResult.customer && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground border-t border-border/40 pt-2">
                        <User className="size-3" />
                        {[
                          lookupResult.customer.first_name,
                          lookupResult.customer.last_name,
                        ]
                          .filter(Boolean)
                          .join(" ") || t("unknown")}{" "}
                        · {lookupResult.customer.phone}
                      </div>
                    )}
                  </div>
                )}

                <div className="overflow-y-auto max-h-[420px] pr-1">
                  <ServiceTimeline history={lookupResult.serviceHistory} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
                <Car className="size-12 mb-3" />
                <p className="text-sm font-medium">
                  {t("enterPlateAbove")}
                </p>
                <p className="text-xs mt-1">
                  {t("timelineWillAppear")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
