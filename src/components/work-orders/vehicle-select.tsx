"use client";

import { Car, Plus } from "lucide-react";
import { useState } from "react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Vehicle } from "@/lib/types";

interface VehicleSelectProps {
  orgId: string;
  customerId: string | null;
  selectedVehicle: Vehicle | null;
  onSelect: (vehicle: Vehicle) => void;
  onClear: () => void;
}

export function VehicleSelect({
  orgId,
  customerId,
  selectedVehicle,
  onSelect,
  onClear,
}: VehicleSelectProps) {
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searching, setSearching] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [quickPlate, setQuickPlate] = useState("");
  const [quickMake, setQuickMake] = useState("");
  const [quickModel, setQuickModel] = useState("");
  const [quickYear, setQuickYear] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Search vehicles — normalize plate input (strip separators, uppercase)
  const handleSearch = (q: string) => {
    const normalized = q.replace(/[\s-]/g, "").toUpperCase();
    setVehicleSearch(q);
    if (!orgId || !normalized || normalized.length < 2) {
      setVehicles([]);
      return;
    }
    setSearching(true);
    const url = customerId
      ? `/api/organizations/${orgId}/vehicles?customer=${customerId}&plate=${encodeURIComponent(normalized)}`
      : `/api/organizations/${orgId}/vehicles?plate=${encodeURIComponent(normalized)}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setVehicles(d.data ?? []))
      .catch(() => setVehicles([]))
      .finally(() => setSearching(false));
  };

  // Quick create
  const handleQuickCreate = async () => {
    if (!orgId || !quickPlate.trim()) {
      setCreateError("Plate number is required");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate_number: quickPlate.trim().toUpperCase(),
          make: quickMake.trim() || "Unknown",
          model: quickModel.trim() || "Unknown",
          year: quickYear ? parseInt(quickYear, 10) : null,
          customer_id: customerId,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setCreateError(json.error.message ?? "Failed to create vehicle");
      } else if (json.data) {
        onSelect(json.data);
        setQuickPlate("");
        setQuickMake("");
        setQuickModel("");
        setQuickYear("");
        setShowQuick(false);
      }
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Car className="size-4" />
          Vehicle
          {selectedVehicle && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {selectedVehicle.plate_number}
              {selectedVehicle.make &&
                ` · ${selectedVehicle.make} ${selectedVehicle.model ?? ""}`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedVehicle ? (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10 p-4">
            <div className="flex items-center gap-3">
              <Car className="size-5 text-green-600" />
              <div>
                <span className="font-mono font-semibold">
                  {selectedVehicle.plate_number}
                </span>
                <span className="ml-3 text-sm text-muted-foreground">
                  {[selectedVehicle.year, selectedVehicle.make, selectedVehicle.model]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClear}>
              Change
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <SearchInput
              placeholder="Search by plate number..."
              loading={searching}
              onSearch={handleSearch}
              debounceMs={400}
            />
            {vehicleSearch && vehicles.length > 0 && (
              <div className="flex flex-col gap-1 border rounded-lg overflow-hidden">
                {vehicles.map((v) => (
                  <Button
                    variant="ghost"
                    key={v.id}
                    onClick={() => onSelect(v)}
                    className="w-full justify-start gap-3 p-3 min-h-[48px] h-auto"
                  >
                    <Car className="size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="font-mono font-semibold">
                        {v.plate_number}
                      </span>
                      <span className="ml-3 text-sm text-muted-foreground">
                        {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            {!showQuick && (
              <Button
                variant="outline"
                onClick={() => setShowQuick(true)}
                className="w-full justify-start gap-2 border-dashed p-3 min-h-[48px] h-auto"
              >
                <Plus className="size-4" />
                Quick create vehicle
              </Button>
            )}
            {showQuick && (
              <div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20">
                <p className="text-sm font-medium">New Vehicle</p>
                <Input
                  placeholder="Plate number *"
                  value={quickPlate}
                  onChange={(e) => setQuickPlate(e.target.value)}
                  className="h-11"
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="Make"
                    value={quickMake}
                    onChange={(e) => setQuickMake(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    placeholder="Model"
                    value={quickModel}
                    onChange={(e) => setQuickModel(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    placeholder="Year"
                    type="number"
                    value={quickYear}
                    onChange={(e) => setQuickYear(e.target.value)}
                    className="h-11"
                  />
                </div>
                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowQuick(false);
                      setCreateError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={creating || !quickPlate.trim()}
                    onClick={handleQuickCreate}
                  >
                    {creating ? "Creating..." : "Create & Select"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
