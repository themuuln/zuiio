// ── Re-exports from database.types.ts ────────────────────────────
// Domain types are defined in @/lib/database.types.ts.
// This file adds API-level and convenience types used across routes and services.

export type {
  AuditLog,
  Branch,
  FeatureFlag,
  Organization,
  OrganizationSettings,
  OrganizationUser,
  Permission,
  PermissionAction,
  PlanType,
  Profile,
  Role,
  SubscriptionPlan,
} from "@/lib/database.types";

// ── API Response Wrappers ────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Convenience / Composite Types ────────────────────────────────

/** Flattened profile for the current user, including org + role info. */
export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  organizationId: string | null;
  organizationName: string | null;
  branchId: string | null;
  roleId: string | null;
  roleName: string | null;
}

// ── Service Parameter Types ──────────────────────────────────────

export interface CreateOrganizationParams {
  name: string;
  slug: string;
}

export interface UpdateOrganizationParams {
  name?: string;
  logoUrl?: string | null;
  settings?: Record<string, unknown>;
}

export interface CreateBranchParams {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateBranchParams {
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isMain?: boolean;
  settings?: Record<string, unknown>;
}

export interface InviteUserParams {
  email: string;
  roleId?: string;
}

export interface UpdateUserRoleParams {
  roleId: string;
}
