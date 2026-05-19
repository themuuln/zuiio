"use client";

import { ArrowLeft, Car, ChevronRight, History, Wrench } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { cn, formatMNT } from "@/lib/utils";

const STATUS_STYLES: Record<string, { dot: string; bg: string }> = {
  Completed: { dot: "bg-gray-400", bg: "bg-gray-50" },
  "In Progress": { dot: "bg-amber-500 animate-pulse", bg: "bg-amber-50" },
  Diagnosing: { dot: "bg-yellow-500", bg: "bg-yellow-50" },
  New: { dot: "bg-blue-500", bg: "bg-blue-50" },
  "Ready for Pickup": { dot: "bg-green-500 animate-pulse", bg: "bg-green-50" },
  Cancelled: { dot: "bg-red-400", bg: "bg-red-50" },
};

export default function PortalVehicleDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const vehicleId = params.id as string;
  const { customer, loading: authLoading, token } = usePortalAuth();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const { data, isLoading } = useQuery({
    queryKey: ["portal", "vehicle", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/portal/vehicles/${vehicleId}`, { headers });
      if (!res.ok) throw new Error("Failed to load vehicle");
      const json = await res.json();
      return json.data as {
        vehicle: Record<string, unknown>;
        workOrders: Record<string, unknown>[];
        upcomingServices: Record<string, unknown>[];
      };
    },
    enabled: !!customer && !!vehicleId,
  });

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Vehicle not found.
      </p>
    );
  }

  const { vehicle, workOrders, upcomingServices } = data;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/portal/vehicles"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {t("portal.vehicles")}
      </Link>

      {/* Vehicle info card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Car className="size-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold">{vehicle.plate_number as string}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {vehicle.make as string} {vehicle.model as string}
                {vehicle.year ? ` (${vehicle.year})` : ""}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground/70">
                {vehicle.vin && <span>VIN: {vehicle.vin as string}</span>}
                {vehicle.odometer && <span>{(vehicle.odometer as number)?.toLocaleString()} km</span>}
                {vehicle.color && <span>{vehicle.color as string}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming services */}
      {upcomingServices && upcomingServices.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              {t("portal.upcomingServices")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingServices.map((s, i) => (
                <div
                  key={s.id as string}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3.5 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{s.service_name as string}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {s.next_due_date
                        ? `Due by ${new Date(s.next_due_date as string).toLocaleDateString()}`
                        : ""}
                      {s.next_due_km
                        ? ` or ${(s.next_due_km as number).toLocaleString()} km`
                        : ""}
                    </p>
                  </div>
                  {(s as { priority?: string }).priority === "urgent" && (
                    <Badge variant="destructive" className="text-[10px]">Urgent</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work orders / Service history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wrench className="size-4 text-muted-foreground" />
            {t("portal.serviceHistory")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!workOrders || workOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("portal.noServiceHistory")}
            </p>
          ) : (
            <div className="space-y-1">
              {workOrders.map((wo) => {
                const style = STATUS_STYLES[wo.status as string] ?? STATUS_STYLES.Completed;
                return (
                  <Link
                    key={wo.id as string}
                    href={`/portal/work-orders/${wo.id}`}
                    className="flex items-center justify-between rounded-lg px-3.5 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn("size-2 shrink-0 rounded-full", style.dot)} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {(wo.description as string) ?? (wo.complaint as string) ?? "Service"}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          {new Date(wo.created_at as string).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold tabular-nums">
                        {wo.total ? formatMNT(Number(wo.total)) : ""}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {wo.status as string}
                      </Badge>
                      <ChevronRight className="size-3.5 text-muted-foreground/40" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
