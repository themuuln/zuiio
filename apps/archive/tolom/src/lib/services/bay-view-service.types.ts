// ── Types ──────────────────────────────────────────────────────

import type { Profile, Vehicle, WorkOrder } from "@/lib/types";

/**
 * Bay View work order type — permissive variant of WorkOrder that allows
 * nullable bay_number and mechanic_id for optimistic cache updates
 * (completed/cancelled/unassigned states).
 */
export type BayViewWorkOrder = Omit<WorkOrder, "bay_number" | "mechanic_id"> & {
  bay_number: number | null;
  mechanic_id: string | null;
};

export interface BaySlotData {
  bayNumber: number;
  workOrder:
    | (BayViewWorkOrder & {
        vehicle: Vehicle | null;
        mechanic: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        } | null;
        helpers: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        }[];
        customer_name: string | null;
      })
    | null;
}

export interface BranchInfo {
  id: string;
  name: string;
}

export interface BranchSectionData {
  branchId: string;
  branchName: string;
  bayCount: number;
  bays: BaySlotData[];
}

export interface BayViewData {
  bayCount: number;
  bays: BaySlotData[];
  branches: BranchInfo[];
  /** Present when viewing "All" — one section per branch with its bay grid. */
  branchSections?: BranchSectionData[];
  waitingQueue: (BayViewWorkOrder & {
    vehicle: Vehicle | null;
  })[];
  mechanics: (Profile & { current_jobs: number })[];
  /** Shift report computed inline from bay view data (no separate query needed). */
  shiftReport: ShiftReport;
}

export interface WorkOrderWithDetails extends WorkOrder {
  vehicle: Vehicle | null;
  customer: { full_name: string | null; company_name: string | null } | null;
  mechanic: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  helpers: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
  customer_name: string | null;
}

export interface ShiftReport {
  completedToday: number;
  revenueToday: number;
  avgDurationMinutes: number;
  bayUtilization: number;
  bayCount: number;
  activeJobs: number;
  revenuePerLaborHour: number;
}

export type UpdateStatusParams = {
  woId: string;
  status:
    | "New"
    | "Diagnosing"
    | "In Progress"
    | "Ready for Pickup"
    | "Completed"
    | "Cancelled";
  notes?: string;
};
