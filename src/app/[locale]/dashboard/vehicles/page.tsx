"use client";

import { Car, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";
import type { Vehicle } from "@/lib/types";

interface VehicleWithOwner extends Vehicle {
  owner_name?: string;
}

function VehicleRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border p-4">
      <Skeleton className="size-10 rounded-lg bg-muted" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [_error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) setOrgId(id);
        else {
          setError("No organization found");
          router.replace(
            "/auth/select-organization?returnUrl=/dashboard/vehicles",
          );
        }
      })
      .catch(() => {
        toast.error("Failed to load profile");
        setError("Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const fetchVehicles = useCallback(
    async (query = "") => {
      if (!orgId) return;
      setSearching(true);
      try {
        const url = `/api/organizations/${orgId}/vehicles${query ? `?q=${encodeURIComponent(query)}` : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.error) setError(json.error.message);
        else setVehicles(json.data ?? []);
      } catch {
        setError("Failed to load vehicles");
      } finally {
        setSearching(false);
        setLoading(false);
      }
    },
    [orgId],
  );

  useEffect(() => {
    if (orgId) fetchVehicles();
  }, [orgId, fetchVehicles]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      fetchVehicles(value);
    },
    [fetchVehicles],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Card>
          <CardContent className="p-0">
            {[1, 2, 3].map((i) => (
              <VehicleRowSkeleton key={i} />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/dashboard/vehicles/new" />} size="lg">
          <Plus className="size-4" />
          Add Vehicle
        </Button>
      </div>

      <ListToolbar
        search={{
          placeholder: "Search by plate number or VIN...",
          value: search,
          onChange: handleSearch,
          loading: searching,
        }}
        stats={
          <span>
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
          </span>
        }
        actions={
          <Button render={<Link href="/dashboard/vehicles/new" />} size="lg">
            <Plus className="size-4" />
            Add Vehicle
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 px-4">
              <Car className="size-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                {search
                  ? "No vehicles match this plate number or VIN"
                  : "No vehicles yet"}
              </p>
              {!search && (
                <Button
                  render={<Link href="/dashboard/vehicles/new" />}
                  variant="outline"
                >
                  Add your first vehicle
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {vehicles.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  href={`/dashboard/vehicles/${vehicle.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 min-h-[72px]"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Car className="size-5" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-base font-semibold font-mono tracking-wide">
                      {vehicle.plate_number}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {[vehicle.year, vehicle.make, vehicle.model]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                    {vehicle.vin && (
                      <span className="text-xs font-mono text-muted-foreground">
                        VIN: {vehicle.vin}
                      </span>
                    )}
                  </div>
                  {vehicle.owner_name && (
                    <span className="text-sm text-muted-foreground text-right">
                      {vehicle.owner_name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
