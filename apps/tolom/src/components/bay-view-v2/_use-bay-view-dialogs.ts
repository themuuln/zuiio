"use client";

import { useCallback, useState } from "react";

type DialogKey = "shiftReport" | "vehicleReg" | "batchComplete" | "assign";

/**
 * Central dialog state manager for the bay view.
 * Maps dialog keys to their open state and extra data (bay numbers, work order IDs).
 * Eliminates the need for 10+ pass-through setters threaded through DialogManager.
 */
export function useBayViewDialogs() {
  const [open, setOpen] = useState<Record<DialogKey, boolean>>({
    shiftReport: false,
    vehicleReg: false,
    batchComplete: false,
    assign: false,
  });

  const show = useCallback(
    (key: DialogKey) => setOpen((prev) => ({ ...prev, [key]: true })),
    [],
  );
  const hide = useCallback(
    (key: DialogKey) => setOpen((prev) => ({ ...prev, [key]: false })),
    [],
  );
  const set = useCallback(
    (key: DialogKey, value: boolean) =>
      setOpen((prev) => ({ ...prev, [key]: value })),
    [],
  );

  // ── Assign dialog (carries a bay number) ──
  const [assignBay, setAssignBay] = useState<number | null>(null);
  const openAssign = useCallback((bayNumber: number) => {
    setAssignBay(bayNumber);
    setOpen((prev) => ({ ...prev, assign: true }));
  }, []);
  const closeAssign = useCallback(() => {
    setAssignBay(null);
    setOpen((prev) => ({ ...prev, assign: false }));
  }, []);

  // ── Work order detail drawer (carries woId + initial action) ──
  const [detailWoId, setDetailWoId] = useState<string | null>(null);
  const [drawerInitialAction, setDrawerInitialAction] = useState<
    "add-service" | "add-part" | null
  >(null);
  const openDetail = useCallback(
    (woId: string, initialAction?: "add-service" | "add-part") => {
      setDetailWoId(woId);
      setDrawerInitialAction(initialAction ?? null);
    },
    [],
  );
  const closeDetail = useCallback(() => {
    setDetailWoId(null);
    setDrawerInitialAction(null);
  }, []);

  // ── Empty bay action drawer (carries bay number) ──
  const [emptyBayBayNumber, setEmptyBayBayNumber] = useState<number | null>(
    null,
  );
  const openEmptyBay = useCallback((bayNumber: number) => {
    setEmptyBayBayNumber(bayNumber);
  }, []);
  const closeEmptyBay = useCallback(() => {
    setEmptyBayBayNumber(null);
  }, []);

  // ── Direct assign bay number (for vehicle registration → assign flow) ──
  const [directAssignBayNumber, setDirectAssignBayNumber] = useState<
    number | null
  >(null);

  // ── Derived ──
  const anyOpen =
    Object.values(open).some(Boolean) ||
    detailWoId !== null ||
    emptyBayBayNumber !== null ||
    directAssignBayNumber !== null;

  return {
    open,
    show,
    hide,
    set,
    assignBay,
    openAssign,
    closeAssign,
    detailWoId,
    setDetailWoId,
    drawerInitialAction,
    setDrawerInitialAction,
    openDetail,
    closeDetail,
    emptyBayBayNumber,
    setEmptyBayBayNumber,
    openEmptyBay,
    closeEmptyBay,
    directAssignBayNumber,
    setDirectAssignBayNumber,
    anyOpen,
  } as const;
}

export type { DialogKey };

export interface BayViewDialogsState {
  open: Record<DialogKey, boolean>;
  show: (key: DialogKey) => void;
  hide: (key: DialogKey) => void;
  set: (key: DialogKey, value: boolean) => void;
  assignBay: number | null;
  openAssign: (bayNumber: number) => void;
  closeAssign: () => void;
  detailWoId: string | null;
  setDetailWoId: (id: string | null) => void;
  drawerInitialAction: "add-service" | "add-part" | null;
  setDrawerInitialAction: (action: "add-service" | "add-part" | null) => void;
  openDetail: (
    woId: string,
    initialAction?: "add-service" | "add-part",
  ) => void;
  closeDetail: () => void;
  emptyBayBayNumber: number | null;
  setEmptyBayBayNumber: (num: number | null) => void;
  openEmptyBay: (bayNumber: number) => void;
  closeEmptyBay: () => void;
  directAssignBayNumber: number | null;
  setDirectAssignBayNumber: (num: number | null) => void;
  anyOpen: boolean;
}
