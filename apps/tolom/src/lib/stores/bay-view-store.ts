"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ─── Types ─────────────────────────────────────────────────────

type ViewMode = "grid" | "kanban" | "list";

interface PendingStatusChange {
  woId: string;
  status: string;
}

interface PendingPostService {
  woId: string;
  vehicleId: string;
  vehiclePlate: string;
  currentOdometer: number | null;
  newStatus: string;
  totalCost: number;
}

interface PendingPickupComplete {
  woId: string;
  vehicleId: string;
  vehiclePlate: string;
  newStatus: string;
  totalCost: number;
}

interface ToastState {
  msg: string;
  variant: "info" | "error";
}

// ─── State ─────────────────────────────────────────────────────

interface BayViewState {
  // View controls
  viewMode: ViewMode;
  myJobsOnly: boolean;
  baySearchQuery: string;

  // Bay assignment
  assignBay: number | null;

  // Detail drawer
  detailDrawerOpen: boolean;
  detailWoId: string | null;
  drawerInitialAction: "add-service" | "add-part" | null;

  // Dialog open states
  showShiftReport: boolean;
  showPinSettings: boolean;
  showVehicleReg: boolean;
  showMechanicReg: boolean;

  // Pending operations
  pendingStatusChange: PendingStatusChange | null;
  pendingPostService: PendingPostService | null;
  pendingPickupComplete: PendingPickupComplete | null;

  // Toast
  toast: ToastState | null;

  // Pending work order IDs (optimistic UI)
  pendingWoIds: Record<string, boolean>;

  // Polling control
  isPollingPaused: boolean;

  // Batch complete
  batchCompleteDialogOpen: boolean;
  batchCompletePending: boolean;
}

// ─── Actions ───────────────────────────────────────────────────

interface BayViewActions {
  setViewMode: (mode: ViewMode) => void;
  toggleMyJobsOnly: () => void;
  setBaySearchQuery: (q: string) => void;

  setAssignBay: (n: number | null) => void;

  openDetail: (woId: string, action?: "add-service" | "add-part") => void;
  closeDetail: () => void;

  setShowShiftReport: (open: boolean) => void;
  setShowPinSettings: (open: boolean) => void;
  setShowVehicleReg: (open: boolean) => void;
  setShowMechanicReg: (open: boolean) => void;

  setPendingStatusChange: (v: PendingStatusChange | null) => void;
  setPendingPostService: (v: PendingPostService | null) => void;
  setPendingPickupComplete: (v: PendingPickupComplete | null) => void;

  setToast: (t: ToastState | null) => void;

  markPending: (...ids: string[]) => void;
  clearPending: (...ids: string[]) => void;

  setPollingPaused: (paused: boolean) => void;

  setBatchCompleteDialogOpen: (open: boolean) => void;
  setBatchCompletePending: (pending: boolean) => void;
}

// ─── Store ─────────────────────────────────────────────────────

type BayViewStore = BayViewState & BayViewActions;

export const useBayViewStore = create<BayViewStore>()(
  devtools(
    immer((set) => ({
      // ── State defaults ──
      viewMode: "grid",
      myJobsOnly: false,
      baySearchQuery: "",
      assignBay: null,
      detailDrawerOpen: false,
      detailWoId: null,
      drawerInitialAction: null,
      showShiftReport: false,
      showPinSettings: false,
      showVehicleReg: false,
      showMechanicReg: false,
      pendingStatusChange: null,
      pendingPostService: null,
      pendingPickupComplete: null,
      toast: null,
      pendingWoIds: {},
      isPollingPaused: false,
      batchCompleteDialogOpen: false,
      batchCompletePending: false,

      // ── Actions ──
      setViewMode: (mode) =>
        set((s) => {
          s.viewMode = mode;
        }),

      toggleMyJobsOnly: () =>
        set((s) => {
          s.myJobsOnly = !s.myJobsOnly;
        }),

      setBaySearchQuery: (q) =>
        set((s) => {
          s.baySearchQuery = q;
        }),

      setAssignBay: (n) =>
        set((s) => {
          s.assignBay = n;
        }),

      openDetail: (woId, action) =>
        set((s) => {
          s.detailWoId = woId;
          s.detailDrawerOpen = true;
          s.drawerInitialAction = action ?? null;
        }),

      closeDetail: () =>
        set((s) => {
          s.detailDrawerOpen = false;
          s.detailWoId = null;
          s.drawerInitialAction = null;
        }),

      setShowShiftReport: (open) =>
        set((s) => {
          s.showShiftReport = open;
        }),

      setShowPinSettings: (open) =>
        set((s) => {
          s.showPinSettings = open;
        }),

      setShowVehicleReg: (open) =>
        set((s) => {
          s.showVehicleReg = open;
        }),

      setShowMechanicReg: (open) =>
        set((s) => {
          s.showMechanicReg = open;
        }),

      setPendingStatusChange: (v) =>
        set((s) => {
          s.pendingStatusChange = v;
        }),

      setPendingPostService: (v) =>
        set((s) => {
          s.pendingPostService = v;
        }),

      setPendingPickupComplete: (v) =>
        set((s) => {
          s.pendingPickupComplete = v;
        }),

      setToast: (t) =>
        set((s) => {
          s.toast = t;
        }),

      markPending: (...ids) =>
        set((s) => {
          for (const id of ids) if (id) s.pendingWoIds[id] = true;
        }),

      clearPending: (...ids) =>
        set((s) => {
          for (const id of ids) delete s.pendingWoIds[id];
        }),

      setPollingPaused: (paused) =>
        set((s) => {
          s.isPollingPaused = paused;
        }),

      setBatchCompleteDialogOpen: (open) =>
        set((s) => {
          s.batchCompleteDialogOpen = open;
        }),

      setBatchCompletePending: (pending) =>
        set((s) => {
          s.batchCompletePending = pending;
        }),
    })),
    { name: "BayViewStore" },
  ),
);

// ─── Selector Hooks ────────────────────────────────────────────
// Each selector returns a minimal slice to prevent unnecessary re-renders.

export const useBayViewMode = () => useBayViewStore((s) => s.viewMode);
export const useMyJobsOnly = () => useBayViewStore((s) => s.myJobsOnly);
export const useBaySearchQuery = () => useBayViewStore((s) => s.baySearchQuery);
export const useAssignBay = () => useBayViewStore((s) => s.assignBay);

export const useDetailDrawer = () =>
  useBayViewStore((s) => ({
    open: s.detailDrawerOpen,
    woId: s.detailWoId,
    initialAction: s.drawerInitialAction,
  }));

export const useBayPendingWoIds = () => useBayViewStore((s) => s.pendingWoIds);

export const useIsPollingPaused = () =>
  useBayViewStore((s) => s.isPollingPaused);

export const useBayToast = () => useBayViewStore((s) => s.toast);

export const useAnyDialogOpen = () =>
  useBayViewStore(
    (s) =>
      s.showShiftReport ||
      s.showPinSettings ||
      s.showVehicleReg ||
      s.showMechanicReg ||
      !!s.pendingPostService ||
      !!s.pendingPickupComplete ||
      !!s.pendingStatusChange ||
      s.assignBay !== null ||
      s.detailDrawerOpen,
  );
