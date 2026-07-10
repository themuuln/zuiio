"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Car,
  CornerDownRight,
  GripVertical,
  Loader2,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NewCustomerSheet } from "@/components/customers/new-customer-drawer";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import {
  type SortableItem,
  SortableListBody,
} from "@/components/sortable-list";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { NewVehicleSheet } from "@/components/vehicles/new-vehicle-drawer";
import { reportError } from "@/lib/sentry-report";
import { reportServerError } from "@/lib/sentry-report-server";
import type { BayViewWorkOrder } from "@/lib/services/bay-view-service";
import type { Vehicle } from "@/lib/types";
import { cn, formatPlateNumber } from "@/lib/utils";

interface MechanicItem extends SortableItem {
  id: string;
  full_name: string | null;
}

function SortableMechanicRow({
  mechanic,
  isAssigned,
  onToggle,
}: {
  mechanic: MechanicItem;
  isAssigned: boolean;
  onToggle?: (mechanicId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mechanic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2",
        isDragging && "opacity-50 bg-accent/30 shadow-sm",
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className="flex size-5 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded hover:bg-muted/60 active:cursor-grabbing"
      >
        <GripVertical className="size-3 text-muted-foreground/30" />
      </span>
      <Checkbox
        checked={isAssigned}
        onCheckedChange={() => onToggle?.(mechanic.id)}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="size-4 shrink-0"
        aria-label={`Toggle ${mechanic.full_name ?? "mechanic"}`}
      />
      <MechanicAvatar mechanic={mechanic} className="size-7 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium">
        {mechanic.full_name ?? "Unknown"}
      </span>
      {isAssigned && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          Lead
        </span>
      )}
    </div>
  );
}

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
  branchId?: string;
  queue: (BayViewWorkOrder & { vehicle: Vehicle | null })[];
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
  branchId,
}: AssignDialogProps) {
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleSearchResult | null>(null);
  const [assignedMechanics, setAssignedMechanics] = useState<
    { id: string; full_name: string | null }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<VehicleSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [creatingWorkOrder, setCreatingWorkOrder] = useState(false);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const allItems = useMemo(() => {
    const assignedIds = new Set(assignedMechanics.map((m) => m.id));
    return [
      ...assignedMechanics,
      ...mechanics.filter((m) => !assignedIds.has(m.id)),
    ];
  }, [assignedMechanics, mechanics]);

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
      setAssignedMechanics([]);
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
          const customerId = vehicle.customer?.id ?? undefined;
          const result = await addVehicleToQueue({
            vehicleId: vehicle.id,
            customerId: customerId,
            complaint: "",
            branchId,
          });
          setSelectedWoId(result.workOrderId);
        } catch (err) {
          reportServerError("Unexpected error", err);
          reportError(err, "Failed to create work order");
          setSelectedVehicle(null);
        } finally {
          setCreatingWorkOrder(false);
        }
      }
    },
    [findWorkOrderForVehicle, branchId],
  );

  const handleConfirm = useCallback(async () => {
    if (!selectedWoId) return;
    setSaving(true);
    try {
      await onAssign(selectedWoId, assignedMechanics[0]?.id ?? undefined);
      onOpenChange(false);
    } catch (err) {
      reportServerError("Unexpected error", err);
      reportError(err, "Assign failed");
    } finally {
      setSaving(false);
    }
  }, [selectedWoId, assignedMechanics, onAssign, onOpenChange]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);
      if (!over || active.id === over.id) return;

      const oldIndex = allItems.findIndex((m) => m.id === active.id);
      const newIndex = allItems.findIndex((m) => m.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const assignedCount = assignedMechanics.length;
      const wasUnassigned = oldIndex >= assignedCount;
      const isNowAssigned = newIndex < assignedCount;

      if (wasUnassigned && isNowAssigned) {
        const mechanic = mechanics.find((m) => m.id === active.id);
        if (!mechanic) return;
        if (newIndex === 0) {
          setAssignedMechanics([mechanic]);
        } else {
          setAssignedMechanics((prev) => [...prev, mechanic]);
        }
      } else if (!wasUnassigned && isNowAssigned) {
        const reordered = arrayMove(allItems, oldIndex, newIndex);
        setAssignedMechanics(
          reordered.slice(0, assignedCount) as {
            id: string;
            full_name: string | null;
          }[],
        );
      } else if (!wasUnassigned && !isNowAssigned) {
        // Dragged from assigned to unassigned → remove
        setAssignedMechanics((prev) => prev.filter((m) => m.id !== active.id));
      }
    },
    [allItems, assignedMechanics.length, mechanics],
  );

  // Keyboard shortcut: Enter to confirm
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
    <>
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveDragId(String(active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
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
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
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
                            className="w-full justify-start gap-2 px-3 py-2 h-auto text-left"
                          >
                            <div className="flex size-8 items-center justify-center bg-muted text-muted-foreground shrink-0">
                              <Car className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Typography.Text className="text-xs font-medium truncate">
                                  {formatPlateNumber(vehicle.plate_number)}
                                </Typography.Text>
                                {vehicle.year && (
                                  <span className="text-xs text-muted-foreground">
                                    {vehicle.year}
                                  </span>
                                )}
                                {inQueue && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    In queue
                                  </span>
                                )}
                              </div>
                              <Typography.Muted className="text-xs text-muted-foreground truncate">
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
                  <div className="flex items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-2 mt-1">
                    <div className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
                      <Car className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography.Text className="text-xs font-medium truncate">
                        {formatPlateNumber(selectedVehicle.plate_number)}
                      </Typography.Text>
                      <Typography.Muted className="text-xs text-muted-foreground truncate">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </Typography.Muted>
                    </div>
                    {creatingWorkOrder && (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}

                {/* Queue list — shown by default when search is empty */}
                {!search && !selectedVehicle && (
                  <div className="flex flex-col gap-2 mt-1">
                    {queue.length > 0 ? (
                      <div className="max-h-[180px] overflow-y-auto">
                        <div className="flex flex-col gap-1">
                          {queue.map((wo) => {
                            const v = wo.vehicle;
                            return (
                              <Button
                                key={wo.id}
                                variant="ghost"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  if (v) {
                                    handleSelectVehicle({
                                      id: v.id,
                                      plate_number: v.plate_number,
                                      make: v.make ?? "",
                                      model: v.model ?? "",
                                      year: v.year,
                                      color: v.color,
                                      customer: null,
                                    });
                                  }
                                }}
                                onTouchStart={(e) => {
                                  e.preventDefault();
                                  if (v) {
                                    handleSelectVehicle({
                                      id: v.id,
                                      plate_number: v.plate_number,
                                      make: v.make ?? "",
                                      model: v.model ?? "",
                                      year: v.year,
                                      color: v.color,
                                      customer: null,
                                    });
                                  }
                                }}
                                className="w-full justify-start gap-2 px-3 py-2 h-auto text-left"
                              >
                                <div className="flex size-8 items-center justify-center bg-amber-500/10 text-amber-500 shrink-0">
                                  <Car className="size-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Typography.Text className="text-xs font-medium truncate">
                                      {formatPlateNumber(v?.plate_number ?? "")}
                                    </Typography.Text>
                                    {v?.year && (
                                      <span className="text-xs text-muted-foreground">
                                        {v.year}
                                      </span>
                                    )}
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                      In queue
                                    </span>
                                  </div>
                                  <Typography.Muted className="text-xs text-muted-foreground truncate">
                                    {v?.make} {v?.model}
                                  </Typography.Muted>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <Car className="size-5 text-muted-foreground/30 mb-1" />
                        <Typography.Muted className="text-xs text-muted-foreground/60">
                          No vehicles in queue
                        </Typography.Muted>
                        <Typography.Muted className="text-xs text-muted-foreground/40 mt-1">
                          Search above or create a new record
                        </Typography.Muted>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
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
                  <SortableListBody
                    items={mechanics}
                    assignedItems={assignedMechanics}
                    emptyText="All mechanics assigned"
                    noResultsText="No mechanics found"
                    renderItem={(m, { isAssigned }) => (
                      <SortableMechanicRow
                        mechanic={m as MechanicItem}
                        isAssigned={isAssigned}
                        onToggle={(mechanicId) => {
                          if (isAssigned) {
                            setAssignedMechanics((prev) =>
                              prev.filter((a) => a.id !== mechanicId),
                            );
                          } else {
                            const mechanic = mechanics.find(
                              (m) => m.id === mechanicId,
                            );
                            if (mechanic) {
                              setAssignedMechanics((prev) => [
                                ...prev,
                                mechanic,
                              ]);
                            }
                          }
                        }}
                      />
                    )}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1 shrink-0"
                  onClick={() => setShowNewVehicle(true)}
                >
                  <Plus className="size-3" />
                  Vehicle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1 shrink-0"
                  onClick={() => setShowNewCustomer(true)}
                >
                  <Plus className="size-3" />
                  Customer
                </Button>
                <Button
                  className="flex-1 h-9"
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
            </div>
          </DialogContent>
        </Dialog>

        <DragOverlay>
          {(() => {
            if (!activeDragId) return null;
            const dragged = allItems.find((m) => m.id === activeDragId);
            if (!dragged) return null;
            return (
              <div className="flex items-center gap-2 rounded-md bg-card px-2 py-1.5 shadow-lg ring-1 ring-border/50">
                <GripVertical className="size-3 text-muted-foreground/30" />
                <MechanicAvatar mechanic={dragged} className="size-6" />
                <span className="text-xs font-medium">{dragged.full_name}</span>
              </div>
            );
          })()}
        </DragOverlay>
      </DndContext>

      <NewVehicleSheet
        open={showNewVehicle}
        onOpenChange={setShowNewVehicle}
        initialPlateNumber={search.trim() || undefined}
        onSuccess={() => {
          setShowNewVehicle(false);
          setSearch("");
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
    </>
  );
}
