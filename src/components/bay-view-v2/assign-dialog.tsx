"use client";

import { Car, CornerDownRight, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Typography } from "@/components/ui/typography";
import { NewCustomerSheet } from "@/components/customers/new-customer-sheet";
import { NewVehicleSheet } from "@/components/vehicles/new-vehicle-sheet";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { cn, formatPlateNumber } from "@/lib/utils";

interface VehicleSearchResult {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  customer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
}

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bayNumber: number;
  queue: (WorkOrder & { vehicle: Vehicle | null })[];
  mechanics: { id: string; full_name: string | null }[];
  onAssign: (workOrderId: string, mechanicId?: string) => Promise<void>;
}

export function AssignDialog({
  open,
  onOpenChange,
  bayNumber,
  queue,
  mechanics,
  onAssign,
}: AssignDialogProps) {
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleSearchResult | null>(null);
  const [selectedMechId, setSelectedMechId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<VehicleSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [creatingWorkOrder, setCreatingWorkOrder] = useState(false);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(blurTimerRef.current);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedWoId(null);
      setSelectedVehicle(null);
      setSelectedMechId(null);
      setSearch("");
      setSearchResults([]);
      setSaving(false);
      setCreatingWorkOrder(false);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  // Vehicle search (debounced)
  const handleSearch = useCallback(async (term: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { searchVehiclesWithCustomers } = await import(
          "@/lib/services/bay-view-actions"
        );
        const results = await searchVehiclesWithCustomers(term);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  // Check if a vehicle already has a work order in the queue
  const findWorkOrderForVehicle = useCallback(
    (vehicleId: string) => {
      return queue.find((wo) => wo.vehicle_id === vehicleId) ?? null;
    },
    [queue],
  );

  const handleSelectVehicle = useCallback(
    async (vehicle: VehicleSearchResult) => {
      setSelectedVehicle(vehicle);
      setSearch("");
      setSearchResults([]);
      setSearchFocused(false);

      // Check if vehicle already has a work order in queue
      const existingWO = findWorkOrderForVehicle(vehicle.id);
      if (existingWO) {
        setSelectedWoId(existingWO.id);
      } else {
        // Create a new work order for this vehicle
        setSelectedWoId(null);
        setCreatingWorkOrder(true);
        try {
          const { addVehicleToQueue } = await import(
            "@/lib/services/bay-view-actions"
          );
          const customerId = vehicle.customer?.id;
          if (!customerId) {
            // No customer — can't create work order, but still show the vehicle
            setSelectedWoId(null);
            return;
          }
          const result = await addVehicleToQueue({
            vehicleId: vehicle.id,
            customerId: customerId,
            complaint: "",
          });
          setSelectedWoId(result.workOrderId);
        } catch (err) {
          console.error("Failed to create work order:", err);
          setSelectedVehicle(null);
        } finally {
          setCreatingWorkOrder(false);
        }
      }
    },
    [findWorkOrderForVehicle],
  );

  const handleConfirm = useCallback(async () => {
    if (!selectedWoId) return;
    setSaving(true);
    try {
      await onAssign(selectedWoId, selectedMechId ?? undefined);
      onOpenChange(false);
    } catch (err) {
      console.error("Assign failed:", err);
    } finally {
      setSaving(false);
    }
  }, [selectedWoId, selectedMechId, onAssign, onOpenChange]);

  // Keyboard shortcut: Enter to confirm
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && selectedWoId && !saving && !creatingWorkOrder) {
        handleConfirm();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedWoId, saving, creatingWorkOrder, handleConfirm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" initialFocus={searchRef}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Assign to Bay #{bayNumber}
          </DialogTitle>
          <DialogDescription>
            Search for a vehicle and assign it to this bay.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <Typography.Muted className="text-xs font-medium text-muted-foreground mb-2">
              Vehicle
            </Typography.Muted>

            {/* Search input */}
            <div className="relative">
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleSearch(e.target.value);
                }}
                onFocus={() => {
                  clearTimeout(blurTimerRef.current);
                  setSearchFocused(true);
                }}
                onBlur={() => {
                  blurTimerRef.current = setTimeout(() => {
                    setSearchFocused(false);
                  }, 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearch("");
                    setSearchResults([]);
                    setSearchFocused(false);
                  }
                }}
                placeholder="Search by plate, make, or model..."
                className="h-9 text-xs pl-2"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Search results dropdown */}
            {searchFocused && search.trim() && searchResults.length > 0 && (
              <ScrollArea className="max-h-[180px] mt-1">
                <div className="flex flex-col gap-1">
                  {searchResults.map((vehicle) => {
                    const inQueue = findWorkOrderForVehicle(vehicle.id);
                    return (
                      <Button
                        key={vehicle.id}
                        variant="ghost"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectVehicle(vehicle);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          handleSelectVehicle(vehicle);
                        }}
                        className="w-full justify-start gap-2.5 px-2.5 py-2 h-auto text-left"
                      >
                        <div className="flex size-7 items-center justify-center bg-muted text-muted-foreground shrink-0">
                          <Car className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Typography.Text className="text-xs font-medium truncate">
                              {formatPlateNumber(vehicle.plate_number)}
                            </Typography.Text>
                            {vehicle.year && (
                              <span className="text-[10px] text-muted-foreground">
                                {vehicle.year}
                              </span>
                            )}
                            {inQueue && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                In queue
                              </span>
                            )}
                          </div>
                          <Typography.Muted className="text-[10px] text-muted-foreground truncate">
                            {vehicle.make} {vehicle.model}
                            {vehicle.customer && (
                              <>
                                {" "}
                                · {vehicle.customer.first_name}{" "}
                                {vehicle.customer.last_name}
                              </>
                            )}
                          </Typography.Muted>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* No results */}
            {searchFocused &&
              search.trim() &&
              !searchLoading &&
              searchResults.length === 0 && (
                <Typography.Muted className="text-xs text-muted-foreground/60 text-center py-4">
                  No vehicles found
                </Typography.Muted>
              )}

            {/* Selected vehicle display */}
            {!search && selectedVehicle && (
              <div className="flex items-center gap-2.5 border border-primary/30 bg-primary/5 px-2.5 py-2 mt-1">
                <div className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
                  <Car className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <Typography.Text className="text-xs font-medium truncate">
                    {formatPlateNumber(selectedVehicle.plate_number)}
                  </Typography.Text>
                  <Typography.Muted className="text-[10px] text-muted-foreground truncate">
                    {selectedVehicle.make} {selectedVehicle.model}
                  </Typography.Muted>
                </div>
                {creatingWorkOrder && (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
            )}

            {/* Warning for vehicle without customer */}
            {!search && selectedVehicle && !selectedVehicle.customer && (
              <Typography.Muted className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                Vehicle needs owner info. Register the vehicle first to add
                owner details.
              </Typography.Muted>
            )}

            {/* Empty state - show queue count */}
            {!search && !selectedVehicle && (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Car className="size-5 text-muted-foreground/30 mb-1" />
                <Typography.Muted className="text-xs text-muted-foreground/60">
                  {queue.length} vehicle{queue.length !== 1 ? "s" : ""} in queue
                </Typography.Muted>
                <Typography.Muted className="text-[10px] text-muted-foreground/40 mt-0.5">
                  Search above or create a new record
                </Typography.Muted>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setShowNewVehicle(true)}
                  >
                    <Plus className="size-3" />
                    Add Vehicle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setShowNewCustomer(true)}
                  >
                    <Plus className="size-3" />
                    Add Customer
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <Typography.Muted className="text-xs font-medium text-muted-foreground mb-2">
              Mechanic{" "}
              <span className="font-normal text-muted-foreground/50">
                (optional)
              </span>
            </Typography.Muted>
            {mechanics.length === 0 ? (
              <Typography.Muted className="text-xs text-muted-foreground/60">
                No mechanics registered
              </Typography.Muted>
            ) : (
              <ScrollArea className="max-h-[140px]">
                <div className="flex flex-col gap-1 pr-3">
                  {mechanics.map((m) => {
                    const isSelected = selectedMechId === m.id;
                    const initials = (m.full_name ?? "M")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <Button
                        variant="ghost"
                        key={m.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedMechId(isSelected ? null : m.id);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          setSelectedMechId(isSelected ? null : m.id);
                        }}
                        className={cn(
                          "w-full justify-start gap-2.5 px-2.5 py-2 h-auto text-left",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border",
                        )}
                      >
                        <Avatar className="size-7">
                          <AvatarFallback className="text-[10px]">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <Typography.Text className="text-xs font-medium truncate">
                          {m.full_name}
                        </Typography.Text>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!selectedWoId || saving || creatingWorkOrder}
            onClick={handleConfirm}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CornerDownRight className="size-4" />
            )}
            {creatingWorkOrder
              ? "Creating work order..."
              : saving
                ? "Assigning..."
                : `Assign to Bay #${bayNumber}`}
          </Button>
        </div>

        <NewVehicleSheet
          open={showNewVehicle}
          onOpenChange={setShowNewVehicle}
          onSuccess={() => {
            setShowNewVehicle(false);
            setTimeout(() => searchRef.current?.focus(), 100);
          }}
        />
        <NewCustomerSheet
          open={showNewCustomer}
          onOpenChange={setShowNewCustomer}
          onSuccess={() => {
            setShowNewCustomer(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
