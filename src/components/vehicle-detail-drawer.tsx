"use client";

import {
  ArrowLeft,
  Calendar,
  Car,
  CircleGauge,
  Cog,
  Fuel,
  Loader2,
  Palette,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Vehicle } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

interface VehicleDetailDrawerProps {
  vehicleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center size-6 shrink-0 rounded-md bg-muted/60">
        <Icon className="size-3.5 text-muted-foreground/70" />
      </div>
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <Typography.Text className="text-sm">{value}</Typography.Text>
      </div>
    </div>
  );
}

export function VehicleDetailDrawer({
  vehicleId,
  open,
  onOpenChange,
}: VehicleDetailDrawerProps) {
  const t = useTranslations("vehicles");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orgIdRef = useRef<string | null>(null);

  const fetchVehicle = useCallback(async () => {
    const orgId = orgIdRef.current;
    if (!vehicleId || !orgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/vehicles/${vehicleId}`,
      );
      const json = await res.json();
      if (json.error) {
        setError(json.error.message ?? "Failed to load vehicle");
      } else {
        setVehicle(json.data);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  // Resolve org ID on first open
  useEffect(() => {
    if (!open || orgIdRef.current) return;
    const abort = new AbortController();
    fetch("/api/profile", { signal: abort.signal })
      .then((r) => r.json())
      .then((d) => {
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) {
          orgIdRef.current = id;
          void fetchVehicle();
        }
      })
      .catch(() => {});
    return () => abort.abort();
  }, [open]);

  const fetchVehicleRef = useRef(fetchVehicle);
  fetchVehicleRef.current = fetchVehicle;

  useEffect(() => {
    const orgId = orgIdRef.current;
    if (open && vehicleId && orgId) void fetchVehicleRef.current();
  }, [open, vehicleId]);

  useEffect(() => {
    if (!open) {
      setVehicle(null);
      setError(null);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 gap-0">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          {vehicle && (
            <SheetDescription className="sr-only">
              Vehicle details for {vehicle.plate_number}
            </SheetDescription>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                {loading ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <Car className="size-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base">
                  {loading ? (
                    <span className="text-muted-foreground/60">Loading…</span>
                  ) : vehicle ? (
                    <span className="font-mono tracking-wide">
                      {vehicle.plate_number}
                    </span>
                  ) : (
                    t("title")
                  )}
                </SheetTitle>
                {vehicle && (
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span>
                      {[vehicle.year, vehicle.make, vehicle.model]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <Typography.Muted className="text-sm text-muted-foreground">{error}</Typography.Muted>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchVehicle()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && vehicle && (
          <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-3">
            {/* Plate + VIN */}
            <section className="rounded-lg border border-border/60 bg-card/40 p-3 flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Identification
              </span>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow
                  icon={Car}
                  label="Plate"
                  value={vehicle.plate_number}
                />
                <InfoRow icon={Cog} label="VIN" value={vehicle.vin} />
                {vehicle.chassis_number && (
                  <InfoRow
                    icon={Settings}
                    label="Chassis"
                    value={vehicle.chassis_number}
                  />
                )}
              </div>
            </section>

            {/* Vehicle info */}
            <section className="rounded-lg border border-border/60 bg-card/40 p-3 flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Vehicle Information
              </span>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={Car} label="Make" value={vehicle.make} />
                <InfoRow icon={Car} label="Model" value={vehicle.model} />
                <InfoRow icon={Calendar} label="Year" value={vehicle.year} />
                <InfoRow icon={Palette} label="Color" value={vehicle.color} />
                <InfoRow icon={Fuel} label="Fuel" value={vehicle.fuel_type} />
                <InfoRow
                  icon={Cog}
                  label="Transmission"
                  value={vehicle.transmission}
                />
                <InfoRow
                  icon={Settings}
                  label="Drivetrain"
                  value={vehicle.drivetrain}
                />
                <InfoRow
                  icon={Car}
                  label="Body Type"
                  value={vehicle.body_type}
                />
                {vehicle.odometer != null && (
                  <InfoRow
                    icon={CircleGauge}
                    label="Odometer"
                    value={`${vehicle.odometer.toLocaleString()} km`}
                  />
                )}
              </div>
            </section>

            {/* Service dates */}
            {(vehicle.next_service_at || vehicle.license_expiry_at) && (
              <section className="rounded-lg border border-border/60 bg-card/40 p-3 flex flex-col gap-2.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Dates
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    icon={Calendar}
                    label="Next Service"
                    value={
                      vehicle.next_service_at
                        ? new Date(vehicle.next_service_at).toLocaleDateString()
                        : null
                    }
                  />
                  <InfoRow
                    icon={Calendar}
                    label="License Expiry"
                    value={
                      vehicle.license_expiry_at
                        ? new Date(
                            vehicle.license_expiry_at,
                          ).toLocaleDateString()
                        : null
                    }
                  />
                </div>
              </section>
            )}

            {/* Notes */}
            {vehicle.notes && (
              <section className="rounded-lg border border-border/60 bg-card/40 p-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Notes
                </span>
                <Typography.Text className="mt-1.5 text-sm whitespace-pre-wrap">
                  {vehicle.notes}
                </Typography.Text>
              </section>
            )}
          </div>
        )}

        {/* Footer */}
        {vehicle && !loading && (
          <div className="shrink-0 border-t border-border p-3">
            <Button
              className="w-full h-9 text-sm"
              render={<Link href={`/dashboard/vehicles/${vehicle.id}`} />}
            >
              <ArrowLeft className="size-4 rotate-180" />
              View full details
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
