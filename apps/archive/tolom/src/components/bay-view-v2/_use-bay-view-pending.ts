"use client";

import { useCallback, useState } from "react";

interface PendingStatusChange {
  type: "status";
  woId: string;
  status: string;
}

interface PendingPostService {
  type: "postService";
  woId: string;
  vehicleId: string;
  vehiclePlate: string;
  currentOdometer: number | null;
  newStatus: string;
  totalCost: number;
}

interface PendingPickupComplete {
  type: "pickupComplete";
  woId: string;
  vehicleId: string;
  vehiclePlate: string;
  newStatus: string;
  totalCost: number;
}

export type PendingIntercept =
  | PendingStatusChange
  | PendingPostService
  | PendingPickupComplete
  | null;

/**
 * Manages the "pending intercept" state — when a status change needs extra
 * user input (notes, post-service data, pickup confirmation) before proceeding.
 *
 * Replaces 3 separate useState calls with a single discriminated union.
 */
export function useBayViewPending() {
  const [pending, setPending] = useState<PendingIntercept>(null);

  const clearPending = useCallback(() => setPending(null), []);

  const requestStatusChange = useCallback(
    (woId: string, status: string) =>
      setPending({ type: "status", woId, status }),
    [],
  );

  const requestPostService = useCallback(
    (
      woId: string,
      vehicleId: string,
      vehiclePlate: string,
      currentOdometer: number | null,
      newStatus: string,
      totalCost: number,
    ) =>
      setPending({
        type: "postService",
        woId,
        vehicleId,
        vehiclePlate,
        currentOdometer,
        newStatus,
        totalCost,
      }),
    [],
  );

  const requestPickupComplete = useCallback(
    (
      woId: string,
      vehicleId: string,
      vehiclePlate: string,
      newStatus: string,
      totalCost: number,
    ) =>
      setPending({
        type: "pickupComplete",
        woId,
        vehicleId,
        vehiclePlate,
        newStatus,
        totalCost,
      }),
    [],
  );

  return {
    pending,
    clearPending,
    requestStatusChange,
    requestPostService,
    requestPickupComplete,
  } as const;
}

export interface BayViewPendingState {
  pending: PendingIntercept;
  clearPending: () => void;
  requestStatusChange: (woId: string, status: string) => void;
  requestPostService: (
    woId: string,
    vehicleId: string,
    vehiclePlate: string,
    currentOdometer: number | null,
    newStatus: string,
    totalCost: number,
  ) => void;
  requestPickupComplete: (
    woId: string,
    vehicleId: string,
    vehiclePlate: string,
    newStatus: string,
    totalCost: number,
  ) => void;
}
