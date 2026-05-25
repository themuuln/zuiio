"use client";

import {
  Car,
  CheckCircle2,
  HistoryIcon,
  Loader2,
  Search,
  User,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatMNT } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    <div className="flex flex-col gap-0">
      {history.map((entry, idx) => {
        const dotColor = STATUS_COLORS[entry.status] ?? "bg-slate-400";
        const isLast = idx === history.length - 1;

        return (
          <div key={entry.work_order_id} className="relative flex gap-3 pb-4">
            {!isLast && (
              <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-border" />
            )}

            <div className="relative z-10 mt-1 shrink-0">
              <div
                className={`size-5  ${dotColor} ring-2 ring-background flex items-center justify-center`}
              >
                {entry.status === "Completed" ? (
                  <CheckCircle2 className="size-3 text-white" />
                ) : (
                  <div className="size-2  bg-white" />
                )}
              </div>
            </div>

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
                  {entry.services.map((s) => (
                    <span
                      key={`${s.name}-${s.price}`}
                      className="inline-flex items-center gap-1  bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400"
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

export function VehicleRegistrationDialog({
  open,
  onOpenChange,
  initialMode = "register",
}: Props) {
  const t = useTranslations("bayView");
  const [mode, setMode] = useState<"register" | "lookup">(initialMode);
  const [plate, setPlate] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult>(EMPTY_LOOKUP);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

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
    if (!open) return;
    plateRef.current?.focus();
  }, [open]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setPlate("");
      setLookupResult(EMPTY_LOOKUP);
      setLookupLoading(false);
      setLookupError(null);
      setLookupDone(false);
      setMake("");
      setModel("");
      setYear("");
      setColor("");
      setVin("");
      setEngine("");
      setOdometer("");
      setCustFirstName("");
      setCustLastName("");
      setCustPhone("");
      setSaving(false);
      setSaveError(null);
      setSaveSuccess(false);
      setSaveMode(null);
    }
  }, [open]);

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
        const [first, ...rest] = (lookupResult.customer.first_name ?? "").split(
          " ",
        );
        setCustFirstName(first);
        setCustLastName(
          rest.join(" ") || (lookupResult.customer.last_name ?? ""),
        );
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
      setLookupError(err instanceof Error ? err.message : "Lookup failed");
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
      const refreshResult = await lookupVehicleByPlate(
        plate.trim().toUpperCase(),
      );
      setLookupResult(refreshResult);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Car className="size-4 text-blue-500" />
            {mode === "lookup"
              ? t("vehicleServiceHistory")
              : t("vehicleRegistration")}
          </DialogTitle>
          <DialogDescription>
            {mode === "lookup"
              ? t("lookupSubtitle")
              : t("registerSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMode(mode === "register" ? "lookup" : "register");
              setLookupResult(EMPTY_LOOKUP);
              setLookupDone(false);
              setLookupError(null);
              setSaveSuccess(false);
              setSaveError(null);
            }}
          >
            {mode === "register"
              ? t("switchToLookup")
              : t("switchToRegister")}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Registration Form */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Plate lookup */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  ref={plateRef}
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLookup();
                  }}
                  placeholder={t("enterPlate")}
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                onClick={handleLookup}
                disabled={lookupLoading || !plate.trim()}
              >
                {lookupLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                {t("lookup")}
              </Button>
            </div>

            {lookupError && (
              <div className=" bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-600 dark:text-red-400">
                {lookupError}
              </div>
            )}

            {saveError && (
              <div className=" bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-600 dark:text-red-400">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className=" bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                {saveMode === "updated"
                  ? t("vehicleUpdated")
                  : t("vehicleRegistered")}
              </div>
            )}

            {lookupDone && !lookupResult.exists && (
              <div className=" bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
                {t("vehicleNotFound")}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("vehicleInfo")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder={t("makeRequired")}
                    required
                  />
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={t("modelRequired")}
                    required
                  />
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder={t("year")}
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder={t("color")}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("additionalDetails")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    placeholder={t("vin")}
                  />
                  <Input
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder={t("engine")}
                  />
                  <Input
                    type="number"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder={t("odometer")}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("ownerInfo")}{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={custFirstName}
                    onChange={(e) => setCustFirstName(e.target.value)}
                    placeholder={t("firstName")}
                  />
                  <Input
                    value={custLastName}
                    onChange={(e) => setCustLastName(e.target.value)}
                    placeholder={t("lastName")}
                  />
                  <Input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder={t("phone")}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={saving || !plate.trim() || !make.trim() || !model.trim()}
                size="lg"
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
              </Button>
            </form>
          </div>

          {/* Right: Timeline */}
          <div className="w-full lg:w-[360px] shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-7  bg-amber-500/10">
                <HistoryIcon className="size-3.5 text-amber-500" />
              </div>
              <span className="text-sm font-semibold">
                {t("serviceTimeline")}
              </span>
              {lookupResult.serviceHistory.length > 0 && (
                <span className=" bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {lookupResult.serviceHistory.length}
                </span>
              )}
            </div>

            {lookupDone ? (
              <ScrollArea className="max-h-[420px] pr-1">
                {lookupResult.vehicle && (
                  <div className="mb-4  bg-muted/30 border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">
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
                          className="size-5  border border-border"
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
                <ServiceTimeline history={lookupResult.serviceHistory} />
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
                <Car className="size-12 mb-3" />
                <p className="text-sm font-medium">{t("enterPlateAbove")}</p>
                <p className="text-xs mt-1">{t("timelineWillAppear")}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
