// ── Types ──────────────────────────────────────────────────────

import type { Profile, Vehicle, WorkOrder } from "@/lib/types";

export interface BaySlotData {
  bayNumber: number;
  workOrder:
    | (WorkOrder & {
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
  waitingQueue: (WorkOrder & {
    vehicle: Vehicle | null;
  })[];
  mechanics: (Profile & { current_jobs: number })[];
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
