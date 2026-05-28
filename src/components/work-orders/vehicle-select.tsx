"use client";

import { Car, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  isValidMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
import { inputProps } from "@/lib/form-ux";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { useMakes, useModelsByMake } from "@/lib/queries/use-vehicle-models";
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
  const [quickYear, setQuickYear] = useState("20");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: dbMakes = [] } = useMakes(orgId);
  const { data: dbModels = [] } = useModelsByMake(orgId, quickMake);

  const allMakes = useMemo(() => {
    const merged = new Set([
      ...dbMakes,
      "Acura",
      "Alfa Romeo",
      "Aston Martin",
      "Audi",
      "Bentley",
      "BMW",
      "Brilliance",
      "Bugatti",
      "Buick",
      "BYD",
      "Cadillac",
      "Changan",
      "Chery",
      "Chevrolet",
      "Chrysler",
      "Citroën",
      "Dacia",
      "Daewoo",
      "Daihatsu",
      "Dodge",
      "Dongfeng",
      "FAW",
      "Ferrari",
      "Fiat",
      "Ford",
      "Geely",
      "Genesis",
      "GMC",
      "Great Wall",
      "Haval",
      "Honda",
      "Hummer",
      "Hyundai",
      "Infiniti",
      "Isuzu",
      "JAC",
      "Jaguar",
      "Jeep",
      "Kia",
      "Lamborghini",
      "Land Rover",
      "Lexus",
      "Lifan",
      "Lincoln",
      "Maserati",
      "Mazda",
      "McLaren",
      "Mercedes-Benz",
      "MG",
      "MINI",
      "Mitsubishi",
      "Nissan",
      "Opel",
      "Peugeot",
      "Porsche",
      "Ram",
      "Renault",
      "Rolls-Royce",
      "Rover",
      "Saab",
      "Seat",
      "Skoda",
      "SsangYong",
      "Subaru",
      "Suzuki",
      "Tata",
      "Tesla",
      "Toyota",
      "UAZ",
      "Volkswagen",
      "Volvo",
      "Voyah",
      "Wuling",
      "ZX Auto",
    ]);
    return [...merged].sort((a, b) => a.localeCompare(b));
  }, [dbMakes]);

  const modelOptions = useMemo(() => {
    const set = new Set(dbModels);
    if (quickModel.trim() && !set.has(quickModel.trim())) {
      return [quickModel.trim(), ...set];
    }
    return [...set];
  }, [dbModels, quickModel]);

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
    if (!isValidMongolianPlate(quickPlate)) {
      setCreateError("Must be 4 digits + 3 letters (e.g. 4444УНА)");
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
        setQuickYear("20");
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
                  {[
                    selectedVehicle.year,
                    selectedVehicle.make,
                    selectedVehicle.model,
                  ]
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
              <form
                className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleQuickCreate();
                }}
              >
                <p className="text-sm font-medium">New Vehicle</p>
                <Input
                  placeholder="e.g. 4444УНА"
                  value={quickPlate}
                  onChange={(e) =>
                    setQuickPlate(transliterateMongolianPlate(e.target.value))
                  }
                  className="h-11"
                  {...inputProps("plate")}
                  autoFocus
                />
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Make <span className="text-destructive">*</span>
                    </label>
                    <Combobox
                      items={allMakes}
                      inputValue={quickMake}
                      onInputValueChange={(v) => setQuickMake(v)}
                      value={quickMake}
                      onValueChange={(make) => {
                        setQuickMake(make ?? "");
                        if (make && make !== quickMake) {
                          setQuickModel("");
                        }
                      }}
                    >
                      <ComboboxInput
                        placeholder="Search make…"
                        showTrigger
                        showClear={!!quickMake}
                        className="h-11 text-sm"
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          {(make: string) => (
                            <ComboboxItem key={make} value={make}>
                              {make}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                        <ComboboxEmpty>No makes found</ComboboxEmpty>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Model <span className="text-destructive">*</span>
                    </label>
                    <Combobox
                      items={modelOptions}
                      inputValue={quickModel}
                      onInputValueChange={(v) => setQuickModel(v)}
                      value={quickModel}
                      onValueChange={(model) => setQuickModel(model ?? "")}
                    >
                      <ComboboxInput
                        placeholder={
                          quickMake.trim()
                            ? "Search model…"
                            : "Select make first"
                        }
                        showTrigger
                        showClear={!!quickModel}
                        className="h-11 text-sm"
                        disabled={!quickMake.trim()}
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          {(model: string) => (
                            <ComboboxItem key={model} value={model}>
                              {model}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                        <ComboboxEmpty>No models found</ComboboxEmpty>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Year
                    </label>
                    <Input
                      placeholder="20__"
                      type="number"
                      value={quickYear}
                      onChange={(e) => setQuickYear(e.target.value)}
                      className="h-11"
                      {...inputProps("year")}
                    />
                  </div>
                </div>
                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
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
                    type="submit"
                    size="sm"
                    className="w-full"
                    disabled={creating || !quickPlate.trim()}
                  >
                    {creating ? "Creating..." : "Create & Select"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
