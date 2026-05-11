// ============================================================
// TOLOM Database Type Definitions
// Matches supabase/migrations/00001_phase0_foundation.sql
// Snake_case column naming per convention
// ============================================================

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage";
export type PlanType = "starter" | "pro" | "business" | "enterprise";

// ----------------------------------------------------------
// Table Row Types
// ----------------------------------------------------------

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_main: boolean;
  settings: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  branch_id: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Permission {
  id: string;
  organization_id: string;
  name: string;
  resource: string;
  action: PermissionAction;
  description: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface OrganizationUser {
  organization_id: string;
  user_id: string;
  role_id: string | null;
  branch_id: string | null;
  is_primary: boolean;
  joined_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  branch_id: string | null;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  organization_id: string;
  plan_type: PlanType;
  status: string;
  started_at: string;
  expires_at: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  organization_id: string;
  flag_key: string;
  enabled: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  organization_id: string;
  invoice_prefix: string;
  default_currency: string;
  default_tax_rate: number;
  timezone: string;
  date_format: string;
  sms_enabled: boolean;
  qpay_enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------
// Insert Types (omit generated columns)
// ----------------------------------------------------------

export type OrganizationInsert = Omit<
  Organization,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type BranchInsert = Omit<
  Branch,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProfileInsert = Omit<Profile, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};

export type RoleInsert = Omit<
  Role,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PermissionInsert = Omit<
  Permission,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RolePermissionInsert = RolePermission;

export type OrganizationUserInsert = Omit<OrganizationUser, "joined_at"> & {
  joined_at?: string;
};

export type AuditLogInsert = Partial<Omit<AuditLog, "id" | "created_at">> & {
  organization_id: string;
  user_id: string;
  action: string;
  table_name: string;
  id?: string;
  created_at?: string;
};

export type SubscriptionPlanInsert = Omit<
  SubscriptionPlan,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type FeatureFlagInsert = Omit<
  FeatureFlag,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type OrganizationSettingsInsert = Omit<
  OrganizationSettings,
  "created_at" | "updated_at"
> & {
  created_at?: string;
  updated_at?: string;
};

// ----------------------------------------------------------
// Update Types (all fields optional except PKs)
// ----------------------------------------------------------

export type OrganizationUpdate = Partial<
  Omit<Organization, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type BranchUpdate = Partial<
  Omit<Branch, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at">> & {
  updated_at?: string;
};

export type RoleUpdate = Partial<
  Omit<Role, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type PermissionUpdate = Partial<
  Omit<Permission, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type OrganizationUserUpdate = Partial<
  Omit<OrganizationUser, "organization_id" | "user_id" | "joined_at">
>;

export type SubscriptionPlanUpdate = Partial<
  Omit<SubscriptionPlan, "id" | "created_at">
> & {
  updated_at?: string;
};

export type FeatureFlagUpdate = Partial<
  Omit<FeatureFlag, "id" | "created_at">
> & {
  updated_at?: string;
};

export type OrganizationSettingsUpdate = Partial<
  Omit<OrganizationSettings, "organization_id" | "created_at">
> & {
  updated_at?: string;
};

// ----------------------------------------------------------
// Supabase Database type (for typed client)
// ----------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      branches: {
        Row: Branch;
        Insert: BranchInsert;
        Update: BranchUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      roles: {
        Row: Role;
        Insert: RoleInsert;
        Update: RoleUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      permissions: {
        Row: Permission;
        Insert: PermissionInsert;
        Update: PermissionUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      role_permissions: {
        Row: RolePermission;
        Insert: RolePermissionInsert;
        Update: RolePermission;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      organization_users: {
        Row: OrganizationUser;
        Insert: OrganizationUserInsert;
        Update: OrganizationUserUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: AuditLogInsert;
        Update: AuditLogInsert; // append-only — updates not allowed at app layer
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: SubscriptionPlanInsert;
        Update: SubscriptionPlanUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      feature_flags: {
        Row: FeatureFlag;
        Insert: FeatureFlagInsert;
        Update: FeatureFlagUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      organization_settings: {
        Row: OrganizationSettings;
        Insert: OrganizationSettingsInsert;
        Update: OrganizationSettingsUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_organization_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
    Enums: {
      permission_action: PermissionAction;
      plan_type: PlanType;
    };
    CompositeTypes: Record<string, never>;
  };
}
