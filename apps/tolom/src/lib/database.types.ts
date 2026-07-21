export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          end_at: string | null
          id: string
          mechanic_id: string | null
          notes: string | null
          organization_id: string
          scheduled_at: string
          source_estimate_id: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          vehicle_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          mechanic_id?: string | null
          notes?: string | null
          organization_id: string
          scheduled_at: string
          source_estimate_id?: string | null
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          vehicle_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          mechanic_id?: string | null
          notes?: string | null
          organization_id?: string
          scheduled_at?: string
          source_estimate_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "appointments_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "appointments_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointments_source_estimate"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          branch_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          organization_id: string
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          branch_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id: string
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          branch_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_user_permissions: {
        Row: {
          branch_id: string
          can_approve_transfers: boolean
          can_manage_users: boolean
          can_override_discounts: boolean
          can_view: boolean
          can_view_other_branches: boolean
          created_at: string
          id: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id: string
          can_approve_transfers?: boolean
          can_manage_users?: boolean
          can_override_discounts?: boolean
          can_view?: boolean
          can_view_other_branches?: boolean
          created_at?: string
          id?: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string
          can_approve_transfers?: boolean
          can_manage_users?: boolean
          can_override_discounts?: boolean
          can_view?: boolean
          can_view_other_branches?: boolean
          created_at?: string
          id?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_user_permissions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_user_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean
          is_main: boolean
          name: string
          organization_id: string
          phone: string | null
          settings: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_main?: boolean
          name: string
          organization_id: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_main?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      car_brands: {
        Row: {
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      car_models: {
        Row: {
          body_type: string | null
          brand_id: string
          created_at: string
          drivetrain: string | null
          engine_options: string | null
          fuel_type: string | null
          id: string
          is_active: boolean
          name: string
          transmission: string | null
          updated_at: string
          year_end: number | null
          year_start: number | null
        }
        Insert: {
          body_type?: string | null
          brand_id: string
          created_at?: string
          drivetrain?: string | null
          engine_options?: string | null
          fuel_type?: string | null
          id?: string
          is_active?: boolean
          name: string
          transmission?: string | null
          updated_at?: string
          year_end?: number | null
          year_start?: number | null
        }
        Update: {
          body_type?: string | null
          brand_id?: string
          created_at?: string
          drivetrain?: string | null
          engine_options?: string | null
          fuel_type?: string | null
          id?: string
          is_active?: boolean
          name?: string
          transmission?: string | null
          updated_at?: string
          year_end?: number | null
          year_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "car_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "car_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register_entries: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          entry_type: string
          id: string
          organization_id: string
          session_id: string
          source: string
          source_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_type: string
          id?: string
          organization_id: string
          session_id: string
          source: string
          source_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_type?: string
          id?: string
          organization_id?: string
          session_id?: string
          source?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "cash_register_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_register_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register_sessions: {
        Row: {
          branch_id: string | null
          cash_in: number
          cash_out: number
          closed_at: string | null
          closed_by: string | null
          closing_balance: number | null
          created_at: string
          created_by: string | null
          date: string
          deleted_at: string | null
          discrepancy: number | null
          discrepancy_note: string | null
          expected_balance: number | null
          id: string
          opened_at: string
          opened_by: string | null
          opening_balance: number
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          cash_in?: number
          cash_out?: number
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          created_at?: string
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          discrepancy?: number | null
          discrepancy_note?: string | null
          expected_balance?: number | null
          id?: string
          opened_at?: string
          opened_by?: string | null
          opening_balance?: number
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          cash_in?: number
          cash_out?: number
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          created_at?: string
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          discrepancy?: number | null
          discrepancy_note?: string | null
          expected_balance?: number | null
          id?: string
          opened_at?: string
          opened_by?: string | null
          opening_balance?: number
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_sessions_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "cash_register_sessions_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "cash_register_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "cash_register_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_variants: {
        Row: {
          barcode: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean
          organization_id: string
          price: number | null
          sku: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
          variant_data: Json
          variant_label: string
        }
        Insert: {
          barcode?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean
          organization_id: string
          price?: number | null
          sku?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          variant_data?: Json
          variant_label: string
        }
        Update: {
          barcode?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          price?: number | null
          sku?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          variant_data?: Json
          variant_label?: string
        }
        Relationships: []
      }
      catalog_variant_groups: {
        Row: {
          applies_to: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          name_mn: string | null
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          applies_to?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          name_mn?: string | null
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          applies_to?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          name_mn?: string | null
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      catalog_variant_options: {
        Row: {
          created_at: string
          deleted_at: string | null
          group_id: string
          id: string
          label: string
          label_mn: string | null
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          group_id: string
          id?: string
          label: string
          label_mn?: string | null
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          group_id?: string
          id?: string
          label?: string
          label_mn?: string | null
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_variant_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "catalog_variant_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      clock_in_tokens: {
        Row: {
          action_type: string
          claimed_at: string | null
          created_at: string
          expires_at: string
          id: string
          mechanic_id: string | null
          organization_id: string
          session_id: string
          token_hash: string
        }
        Insert: {
          action_type: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          mechanic_id?: string | null
          organization_id: string
          session_id?: string
          token_hash: string
        }
        Update: {
          action_type?: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          mechanic_id?: string | null
          organization_id?: string
          session_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "clock_in_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_communications: {
        Row: {
          content: string
          created_at: string
          customer_id: string
          deleted_at: string | null
          direction: string
          id: string
          organization_id: string
          staff_id: string | null
          subject: string | null
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          direction: string
          id?: string
          organization_id: string
          staff_id?: string | null
          subject?: string | null
          type: string
        }
        Update: {
          content?: string
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          direction?: string
          id?: string
          organization_id?: string
          staff_id?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_communications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_communications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_communications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_communications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "customer_communications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_followups: {
        Row: {
          assigned_to: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          due_at: string
          estimate_id: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          organization_id: string
          outcome: string | null
          outcome_notes: string | null
          status: string
          subject: string
          type: string
          updated_at: string
          vehicle_id: string | null
          work_order_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          due_at: string
          estimate_id?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          organization_id: string
          outcome?: string | null
          outcome_notes?: string | null
          status?: string
          subject: string
          type?: string
          updated_at?: string
          vehicle_id?: string | null
          work_order_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          due_at?: string
          estimate_id?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          organization_id?: string
          outcome?: string | null
          outcome_notes?: string | null
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          vehicle_id?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_followups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_followups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_followups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_followups_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_followups_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_followups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_followups_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_followups_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "customer_followups_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "customer_followups_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          customer_id: string
          deleted_at: string | null
          id: string
          organization_id: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          customer_id: string
          deleted_at?: string | null
          id?: string
          organization_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          deleted_at?: string | null
          id?: string
          organization_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          branch_id: string | null
          company_name: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          customer_user_id: string | null
          deleted_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          last_visit_at: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          portal_token: string | null
          source: string | null
          tags: string[] | null
          telegram_chat_id: number | null
          total_visits: number
          type: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          customer_user_id?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          last_visit_at?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          portal_token?: string | null
          source?: string | null
          tags?: string[] | null
          telegram_chat_id?: number | null
          total_visits?: number
          type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          customer_user_id?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          last_visit_at?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          portal_token?: string | null
          source?: string | null
          tags?: string[] | null
          telegram_chat_id?: number | null
          total_visits?: number
          type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      day_close_logs: {
        Row: {
          closed_at: string
          closed_by: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          organization_id: string
          summary: Json | null
        }
        Insert: {
          closed_at?: string
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          organization_id: string
          summary?: Json | null
        }
        Update: {
          closed_at?: string
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          organization_id?: string
          summary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "day_close_logs_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "day_close_logs_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_close_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "day_close_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_close_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosis_labels: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          name_mn: string | null
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_mn?: string | null
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_mn?: string | null
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnosis_labels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "diagnosis_labels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosis_labels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          catalog_item_variant_id: string | null
          created_at: string
          created_by: string | null
          description: string
          discount_amount: number
          discount_percentage: number
          estimate_id: string
          id: string
          is_tax_exempt: boolean | null
          item_type: string
          line_total: number
          notes: string | null
          organization_id: string
          quantity: number
          sort_order: number
          source_part_id: string | null
          source_service_id: string | null
          tax_rate: number | null
          unit_cost: number
          unit_price: number
          variant_label: string | null
        }
        Insert: {
          catalog_item_variant_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          discount_amount?: number
          discount_percentage?: number
          estimate_id: string
          id?: string
          is_tax_exempt?: boolean | null
          item_type: string
          line_total?: number
          notes?: string | null
          organization_id: string
          quantity?: number
          sort_order?: number
          source_part_id?: string | null
          source_service_id?: string | null
          tax_rate?: number | null
          unit_cost?: number
          unit_price?: number
          variant_label?: string | null
        }
        Update: {
          catalog_item_variant_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          discount_amount?: number
          discount_percentage?: number
          estimate_id?: string
          id?: string
          is_tax_exempt?: boolean | null
          item_type?: string
          line_total?: number
          notes?: string | null
          organization_id?: string
          quantity?: number
          sort_order?: number
          source_part_id?: string | null
          source_service_id?: string | null
          tax_rate?: number | null
          unit_cost?: number
          unit_price?: number
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_catalog_item_variant_id_fkey"
            columns: ["catalog_item_variant_id"]
            isOneToOne: false
            referencedRelation: "catalog_item_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_source_part_id_fkey"
            columns: ["source_part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_source_service_id_fkey"
            columns: ["source_service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          appointment_id: string | null
          branch_id: string | null
          converted_work_order_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          discount_amount: number
          discount_percentage: number
          discount_total: number
          estimate_number: string
          grand_total: number
          id: string
          notes: string | null
          organization_id: string
          public_token: string
          status: string
          subtotal: number
          tax_total: number
          terms: string | null
          updated_at: string
          updated_by: string | null
          valid_until: string | null
          vehicle_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          branch_id?: string | null
          converted_work_order_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          discount_amount?: number
          discount_percentage?: number
          discount_total?: number
          estimate_number: string
          grand_total?: number
          id?: string
          notes?: string | null
          organization_id: string
          public_token?: string
          status?: string
          subtotal?: number
          tax_total?: number
          terms?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
          vehicle_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          branch_id?: string | null
          converted_work_order_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          discount_amount?: number
          discount_percentage?: number
          discount_total?: number
          estimate_number?: string
          grand_total?: number
          id?: string
          notes?: string | null
          organization_id?: string
          public_token?: string
          status?: string
          subtotal?: number
          tax_total?: number
          terms?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_converted_work_order_id_fkey"
            columns: ["converted_work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "estimates_converted_work_order_id_fkey"
            columns: ["converted_work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "estimates_converted_work_order_id_fkey"
            columns: ["converted_work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          due_date: string | null
          expense_date: string
          id: string
          is_recurring: boolean
          notes: string | null
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          receipt_url: string | null
          recurrence_interval: string | null
          reference_number: string | null
          tax_amount: number
          updated_at: string
          updated_by: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          due_date?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recurrence_interval?: string | null
          reference_number?: string | null
          tax_amount?: number
          updated_at?: string
          updated_by?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          due_date?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recurrence_interval?: string | null
          reference_number?: string | null
          tax_amount?: number
          updated_at?: string
          updated_by?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          flag_key: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      global_parts_catalog: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          name_mn: string | null
          part_number: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_mn?: string | null
          part_number?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_mn?: string | null
          part_number?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_parts_vehicle_models: {
        Row: {
          created_at: string
          global_part_id: string
          id: string
          vehicle_model_id: string
        }
        Insert: {
          created_at?: string
          global_part_id: string
          id?: string
          vehicle_model_id: string
        }
        Update: {
          created_at?: string
          global_part_id?: string
          id?: string
          vehicle_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_parts_vehicle_models_global_part_id_fkey"
            columns: ["global_part_id"]
            isOneToOne: false
            referencedRelation: "global_parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_parts_vehicle_models_vehicle_model_id_fkey"
            columns: ["vehicle_model_id"]
            isOneToOne: false
            referencedRelation: "car_models"
            referencedColumns: ["id"]
          },
        ]
      }
      global_services_catalog: {
        Row: {
          category: string
          created_at: string
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          interval_km: number | null
          interval_months: number | null
          is_active: boolean
          name: string
          name_mn: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          is_active?: boolean
          name: string
          name_mn?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          is_active?: boolean
          name?: string
          name_mn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_balances: {
        Row: {
          branch_id: string | null
          category: string | null
          default_price: number | null
          last_movement_at: string | null
          organization_id: string
          part_id: string
          part_name: string | null
          part_number: string | null
          quantity_on_hand: number
          unit: string | null
        }
        Insert: {
          branch_id?: string | null
          category?: string | null
          default_price?: number | null
          last_movement_at?: string | null
          organization_id: string
          part_id: string
          part_name?: string | null
          part_number?: string | null
          quantity_on_hand?: number
          unit?: string | null
        }
        Update: {
          branch_id?: string | null
          category?: string | null
          default_price?: number | null
          last_movement_at?: string | null
          organization_id?: string
          part_id?: string
          part_name?: string | null
          part_number?: string | null
          quantity_on_hand?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_balances_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balances_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes: string | null
          organization_id: string
          part_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          unit_cost: number | null
          unit_price: number | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          organization_id: string
          part_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          unit_price?: number | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          organization_id?: string
          part_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          discount_amount: number
          id: string
          invoice_id: string
          is_tax_exempt: boolean | null
          item_type: string
          quantity: number
          sort_order: number
          tax_rate: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_amount?: number
          id?: string
          invoice_id: string
          is_tax_exempt?: boolean | null
          item_type: string
          quantity?: number
          sort_order?: number
          tax_rate?: number | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_amount?: number
          id?: string
          invoice_id?: string
          is_tax_exempt?: boolean | null
          item_type?: string
          quantity?: number
          sort_order?: number
          tax_rate?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          cash_register_session_id: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          method: string
          notes: string | null
          organization_id: string | null
          paid_at: string
          reference: string | null
        }
        Insert: {
          amount: number
          cash_register_session_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          method?: string
          notes?: string | null
          organization_id?: string | null
          paid_at?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          cash_register_session_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          organization_id?: string | null
          paid_at?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_cash_register_session_id_fkey"
            columns: ["cash_register_session_id"]
            isOneToOne: false
            referencedRelation: "cash_register_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_refunds: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          method: string
          notes: string | null
          organization_id: string
          reason: string | null
          reference: string | null
          refunded_at: string
          status: Database["public"]["Enums"]["refund_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          method?: string
          notes?: string | null
          organization_id: string
          reason?: string | null
          reference?: string | null
          refunded_at?: string
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          organization_id?: string
          reason?: string | null
          reference?: string | null
          refunded_at?: string
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_refunds_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_refunds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          amount_refunded: number
          balance_due: number
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          deleted_at: string | null
          discount_total: number
          due_at: string | null
          einvoice_qr_code: string | null
          einvoice_registered_at: string | null
          einvoice_registration_id: string | null
          einvoice_status: string | null
          email_sent_at: string | null
          footer: string | null
          id: string
          invoice_number: string
          issued_at: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          public_token: string
          status: string
          subtotal: number
          tax_total: number
          terms: string | null
          total: number
          updated_at: string
          updated_by: string | null
          vehicle_details: string | null
          vehicle_id: string | null
          vehicle_plate: string | null
          work_order_id: string | null
        }
        Insert: {
          amount_paid?: number
          amount_refunded?: number
          balance_due?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          deleted_at?: string | null
          discount_total?: number
          due_at?: string | null
          einvoice_qr_code?: string | null
          einvoice_registered_at?: string | null
          einvoice_registration_id?: string | null
          einvoice_status?: string | null
          email_sent_at?: string | null
          footer?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          public_token?: string
          status?: string
          subtotal?: number
          tax_total?: number
          terms?: string | null
          total?: number
          updated_at?: string
          updated_by?: string | null
          vehicle_details?: string | null
          vehicle_id?: string | null
          vehicle_plate?: string | null
          work_order_id?: string | null
        }
        Update: {
          amount_paid?: number
          amount_refunded?: number
          balance_due?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          deleted_at?: string | null
          discount_total?: number
          due_at?: string | null
          einvoice_qr_code?: string | null
          einvoice_registered_at?: string | null
          einvoice_registration_id?: string | null
          einvoice_status?: string | null
          email_sent_at?: string | null
          footer?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          public_token?: string
          status?: string
          subtotal?: number
          tax_total?: number
          terms?: string | null
          total?: number
          updated_at?: string
          updated_by?: string | null
          vehicle_details?: string | null
          vehicle_id?: string | null
          vehicle_plate?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "invoices_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "invoices_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          clicked_count: number
          created_at: string
          created_by: string | null
          id: string
          name: string
          opened_count: number
          organization_id: string | null
          sent_count: number
          status: string
          target_count: number
          type: string
          updated_at: string
        }
        Insert: {
          clicked_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          opened_count?: number
          organization_id?: string | null
          sent_count?: number
          status?: string
          target_count?: number
          type: string
          updated_at?: string
        }
        Update: {
          clicked_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          opened_count?: number
          organization_id?: string | null
          sent_count?: number
          status?: string
          target_count?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          created_by: string | null
          id: string
          mechanic_id: string
          notes: string | null
          organization_id: string
          unassigned_at: string | null
          work_order_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          mechanic_id: string
          notes?: string | null
          organization_id: string
          unassigned_at?: string | null
          work_order_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          mechanic_id?: string
          notes?: string | null
          organization_id?: string
          unassigned_at?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_assignments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "mechanic_assignments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "mechanic_assignments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_commission_rules: {
        Row: {
          commission_type: string
          commission_value: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          max_commission: number | null
          mechanic_id: string | null
          min_commission: number | null
          name: string
          organization_id: string
          priority: number
          updated_at: string
        }
        Insert: {
          commission_type: string
          commission_value?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          max_commission?: number | null
          mechanic_id?: string | null
          min_commission?: number | null
          name: string
          organization_id: string
          priority?: number
          updated_at?: string
        }
        Update: {
          commission_type?: string
          commission_value?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          max_commission?: number | null
          mechanic_id?: string | null
          min_commission?: number | null
          name?: string
          organization_id?: string
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_commission_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "mechanic_commission_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_commission_rules_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "mechanic_commission_rules_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_commission_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_daily_reports: {
        Row: {
          created_at: string
          hours_worked: number | null
          id: string
          mechanic_id: string
          notes: string | null
          organization_id: string
          parts_used: number | null
          report_date: string
          services_performed: number | null
          total_discounts: number | null
          total_revenue: number | null
          updated_at: string
          work_orders_completed: number | null
        }
        Insert: {
          created_at?: string
          hours_worked?: number | null
          id?: string
          mechanic_id: string
          notes?: string | null
          organization_id: string
          parts_used?: number | null
          report_date: string
          services_performed?: number | null
          total_discounts?: number | null
          total_revenue?: number | null
          updated_at?: string
          work_orders_completed?: number | null
        }
        Update: {
          created_at?: string
          hours_worked?: number | null
          id?: string
          mechanic_id?: string
          notes?: string | null
          organization_id?: string
          parts_used?: number | null
          report_date?: string
          services_performed?: number | null
          total_discounts?: number | null
          total_revenue?: number | null
          updated_at?: string
          work_orders_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_daily_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string | null
          id: string
          last_used_at: string | null
          mechanic_id: string
          organization_id: string
          revoked_at: string | null
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          mechanic_id: string
          organization_id: string
          revoked_at?: string | null
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          mechanic_id?: string
          organization_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_pay_rates: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          hourly_rate: number
          id: string
          mechanic_id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          hourly_rate: number
          id?: string
          mechanic_id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          hourly_rate?: number
          id?: string
          mechanic_id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_pay_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_time_logs: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          date: string
          id: string
          mechanic_id: string
          notes: string | null
          organization_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          mechanic_id: string
          notes?: string | null
          organization_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          mechanic_id?: string
          notes?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_time_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          message: string | null
          organization_id: string
          role_id: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          message?: string | null
          organization_id: string
          role_id?: string | null
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          message?: string | null
          organization_id?: string
          role_id?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_invites_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          date_format: string | null
          default_currency: string | null
          default_reminder_channel: string
          default_tax_rate: number | null
          einvoice_api_key: string | null
          einvoice_enabled: boolean | null
          einvoice_endpoint: string | null
          einvoice_merchant_id: string | null
          invoice_prefix: string | null
          ndsh_employee_rate: number | null
          ndsh_employer_rate: number | null
          ndsh_enabled: boolean | null
          notification_email: string | null
          nuat_enabled: boolean | null
          organization_id: string
          settings: Json | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_format?: string | null
          default_currency?: string | null
          default_reminder_channel?: string
          default_tax_rate?: number | null
          einvoice_api_key?: string | null
          einvoice_enabled?: boolean | null
          einvoice_endpoint?: string | null
          einvoice_merchant_id?: string | null
          invoice_prefix?: string | null
          ndsh_employee_rate?: number | null
          ndsh_employer_rate?: number | null
          ndsh_enabled?: boolean | null
          notification_email?: string | null
          nuat_enabled?: boolean | null
          organization_id: string
          settings?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_format?: string | null
          default_currency?: string | null
          default_reminder_channel?: string
          default_tax_rate?: number | null
          einvoice_api_key?: string | null
          einvoice_enabled?: boolean | null
          einvoice_endpoint?: string | null
          einvoice_merchant_id?: string | null
          invoice_prefix?: string | null
          ndsh_employee_rate?: number | null
          ndsh_employer_rate?: number | null
          ndsh_enabled?: boolean | null
          notification_email?: string | null
          nuat_enabled?: boolean | null
          organization_id?: string
          settings?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          branch_id: string | null
          is_primary: boolean
          joined_at: string
          organization_id: string
          removed_at: string | null
          role_id: string | null
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          is_primary?: boolean
          joined_at?: string
          organization_id: string
          removed_at?: string | null
          role_id?: string | null
          user_id: string
        }
        Update: {
          branch_id?: string | null
          is_primary?: boolean
          joined_at?: string
          organization_id?: string
          removed_at?: string | null
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          booking_token: string | null
          branch_limit: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          settings: Json | null
          sharing_enabled: boolean
          slug: string
          tax_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          booking_token?: string | null
          branch_limit?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          settings?: Json | null
          sharing_enabled?: boolean
          slug: string
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          booking_token?: string | null
          branch_limit?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          settings?: Json | null
          sharing_enabled?: boolean
          slug?: string
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      part_categories: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      part_price_history: {
        Row: {
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_percentage: number | null
          final_price: number
          id: string
          mechanic_id: string | null
          organization_id: string
          part_name: string
          part_number: string | null
          quantity: number
          unit_price: number
          vehicle_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          work_order_id: string | null
          work_order_part_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price: number
          id?: string
          mechanic_id?: string | null
          organization_id: string
          part_name: string
          part_number?: string | null
          quantity?: number
          unit_price: number
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          work_order_id?: string | null
          work_order_part_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price?: number
          id?: string
          mechanic_id?: string | null
          organization_id?: string
          part_name?: string
          part_number?: string | null
          quantity?: number
          unit_price?: number
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          work_order_id?: string | null
          work_order_part_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_price_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_price_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_price_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "part_price_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "part_price_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_price_history_work_order_part_id_fkey"
            columns: ["work_order_part_id"]
            isOneToOne: false
            referencedRelation: "work_order_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_car_parts: {
        Row: {
          condition: string
          created_at: string
          created_by: string | null
          estimated_price: number
          id: string
          location_group: Database["public"]["Enums"]["parts_car_location_group"]
          name: string
          notes: string | null
          organization_id: string
          part_id: string | null
          parts_car_id: string
          quantity: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          condition?: string
          created_at?: string
          created_by?: string | null
          estimated_price?: number
          id?: string
          location_group?: Database["public"]["Enums"]["parts_car_location_group"]
          name: string
          notes?: string | null
          organization_id: string
          part_id?: string | null
          parts_car_id: string
          quantity?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          condition?: string
          created_at?: string
          created_by?: string | null
          estimated_price?: number
          id?: string
          location_group?: Database["public"]["Enums"]["parts_car_location_group"]
          name?: string
          notes?: string | null
          organization_id?: string
          part_id?: string | null
          parts_car_id?: string
          quantity?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_car_parts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_car_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_car_parts_parts_car_id_fkey"
            columns: ["parts_car_id"]
            isOneToOne: false
            referencedRelation: "parts_cars"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_cars: {
        Row: {
          arrival_date: string
          branch_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          id: string
          license_plate: string | null
          make: string
          model: string
          notes: string | null
          organization_id: string
          purchase_cost: number
          status: string
          total_estimated_value: number
          total_parts_actual: number
          updated_at: string
          updated_by: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          arrival_date?: string
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          license_plate?: string | null
          make: string
          model: string
          notes?: string | null
          organization_id: string
          purchase_cost?: number
          status?: string
          total_estimated_value?: number
          total_parts_actual?: number
          updated_at?: string
          updated_by?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          arrival_date?: string
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          license_plate?: string | null
          make?: string
          model?: string
          notes?: string | null
          organization_id?: string
          purchase_cost?: number
          status?: string
          total_estimated_value?: number
          total_parts_actual?: number
          updated_at?: string
          updated_by?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_cars_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_cars_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_catalog: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          created_by: string | null
          default_price: number | null
          deleted_at: string | null
          description: string | null
          embedding: string | null
          global_part_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          last_purchase_price: number | null
          location: string | null
          name: string
          name_mn: string | null
          organization_id: string
          part_number: string | null
          purchase_price: number | null
          unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_price?: number | null
          deleted_at?: string | null
          description?: string | null
          embedding?: string | null
          global_part_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_purchase_price?: number | null
          location?: string | null
          name: string
          name_mn?: string | null
          organization_id: string
          part_number?: string | null
          purchase_price?: number | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_price?: number | null
          deleted_at?: string | null
          description?: string | null
          embedding?: string | null
          global_part_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_purchase_price?: number | null
          location?: string | null
          name?: string
          name_mn?: string | null
          organization_id?: string
          part_number?: string | null
          purchase_price?: number | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_catalog_global_part_id_fkey"
            columns: ["global_part_id"]
            isOneToOne: false
            referencedRelation: "global_parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          branch_id: string | null
          cash_register_session_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          paid_at: string
          payment_method: string
          reference: string | null
          work_order_id: string | null
        }
        Insert: {
          amount: number
          branch_id?: string | null
          cash_register_session_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          paid_at?: string
          payment_method: string
          reference?: string | null
          work_order_id?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string | null
          cash_register_session_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string
          payment_method?: string
          reference?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_cash_register_session_id_fkey"
            columns: ["cash_register_session_id"]
            isOneToOne: false
            referencedRelation: "cash_register_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "payments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "payments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          created_at: string
          gross_pay: number
          hourly_rate: number
          id: string
          mechanic_id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          total_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          gross_pay?: number
          hourly_rate?: number
          id?: string
          mechanic_id: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          total_hours?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          gross_pay?: number
          hourly_rate?: number
          id?: string
          mechanic_id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          resource: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          resource: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["permission_action"]
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          resource?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      price_rules: {
        Row: {
          apply_to: string
          conditions: Json
          conditions_description: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          operator: string
          organization_id: string
          part_category: string | null
          part_name_pattern: string | null
          priority: number
          service_category: string | null
          service_name_pattern: string | null
          updated_at: string
          updated_by: string | null
          value: number
        }
        Insert: {
          apply_to?: string
          conditions?: Json
          conditions_description?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          operator: string
          organization_id: string
          part_category?: string | null
          part_name_pattern?: string | null
          priority?: number
          service_category?: string | null
          service_name_pattern?: string | null
          updated_at?: string
          updated_by?: string | null
          value: number
        }
        Update: {
          apply_to?: string
          conditions?: Json
          conditions_description?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          operator?: string
          organization_id?: string
          part_category?: string | null
          part_name_pattern?: string | null
          priority?: number
          service_category?: string | null
          service_name_pattern?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          organization_id: string | null
          phone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          part_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number
          unit_cost: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          part_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received?: number
          unit_cost: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          part_id?: string
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number
          unit_cost?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expected_at: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          organization_id: string
          received_at: string | null
          status: string
          supplier_id: string | null
          total_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expected_at?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          organization_id: string
          received_at?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expected_at?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          organization_id?: string
          received_at?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          organization_id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          organization_id: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          organization_id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_logs: {
        Row: {
          channel: string
          created_at: string
          customer_id: string | null
          error_message: string | null
          id: string
          organization_id: string
          reminder_type: string
          scheduled_at: string
          sent_at: string | null
          service_catalog_id: string | null
          service_name: string
          status: string
          vehicle_id: string
          vehicle_service_schedule_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          id?: string
          organization_id: string
          reminder_type?: string
          scheduled_at?: string
          sent_at?: string | null
          service_catalog_id?: string | null
          service_name: string
          status?: string
          vehicle_id: string
          vehicle_service_schedule_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string
          reminder_type?: string
          scheduled_at?: string
          sent_at?: string | null
          service_catalog_id?: string | null
          service_name?: string
          status?: string
          vehicle_id?: string
          vehicle_service_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "reminder_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "reminder_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_vehicle_service_schedule_id_fkey"
            columns: ["vehicle_service_schedule_id"]
            isOneToOne: false
            referencedRelation: "vehicle_service_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          organization_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_assignments: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          seller_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          seller_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_assignments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          branch_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          default_cost: number | null
          default_price: number
          deleted_at: string | null
          description: string | null
          embedding: string | null
          estimated_duration_minutes: number | null
          global_service_id: string | null
          id: string
          interval_km: number | null
          interval_months: number | null
          is_active: boolean
          name: string
          name_mn: string | null
          organization_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          branch_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_cost?: number | null
          default_price?: number
          deleted_at?: string | null
          description?: string | null
          embedding?: string | null
          estimated_duration_minutes?: number | null
          global_service_id?: string | null
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          is_active?: boolean
          name: string
          name_mn?: string | null
          organization_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          branch_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_cost?: number | null
          default_price?: number
          deleted_at?: string | null
          description?: string | null
          embedding?: string | null
          estimated_duration_minutes?: number | null
          global_service_id?: string | null
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          is_active?: boolean
          name?: string
          name_mn?: string | null
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_global_service_id_fkey"
            columns: ["global_service_id"]
            isOneToOne: false
            referencedRelation: "global_services_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_completion_data: {
        Row: {
          branch_id: string | null
          collected_at: string
          created_at: string
          created_by: string | null
          customer_feedback: string | null
          customer_preferences: Json
          customer_satisfaction: number | null
          id: string
          next_appointment_date: string | null
          odometer_reading: number | null
          organization_id: string
          vehicle_id: string
          work_order_id: string
        }
        Insert: {
          branch_id?: string | null
          collected_at?: string
          created_at?: string
          created_by?: string | null
          customer_feedback?: string | null
          customer_preferences?: Json
          customer_satisfaction?: number | null
          id?: string
          next_appointment_date?: string | null
          odometer_reading?: number | null
          organization_id: string
          vehicle_id: string
          work_order_id: string
        }
        Update: {
          branch_id?: string | null
          collected_at?: string
          created_at?: string
          created_by?: string | null
          customer_feedback?: string | null
          customer_preferences?: Json
          customer_satisfaction?: number | null
          id?: string
          next_appointment_date?: string | null
          odometer_reading?: number | null
          organization_id?: string
          vehicle_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_completion_data_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_completion_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_completion_data_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_completion_data_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "service_completion_data_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "service_completion_data_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_price_history: {
        Row: {
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_percentage: number | null
          final_price: number
          id: string
          mechanic_id: string | null
          organization_id: string
          quantity: number
          service_catalog_id: string | null
          service_name: string | null
          unit_price: number
          vehicle_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          work_order_id: string | null
          work_order_service_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price: number
          id?: string
          mechanic_id?: string | null
          organization_id: string
          quantity?: number
          service_catalog_id?: string | null
          service_name?: string | null
          unit_price: number
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          work_order_id?: string | null
          work_order_service_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price?: number
          id?: string
          mechanic_id?: string | null
          organization_id?: string
          quantity?: number
          service_catalog_id?: string | null
          service_name?: string | null
          unit_price?: number
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          work_order_id?: string | null
          work_order_service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_price_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_price_history_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_price_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_price_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "service_price_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "service_price_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_price_history_work_order_service_id_fkey"
            columns: ["work_order_service_id"]
            isOneToOne: false
            referencedRelation: "work_order_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_recommendations: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          next_due_date: string | null
          next_due_km: number | null
          notes: string | null
          organization_id: string
          priority: string
          recommended_interval_km: number | null
          recommended_interval_months: number | null
          service_catalog_id: string | null
          service_name: string
          updated_at: string
          updated_by: string | null
          work_order_id: string
          work_order_service_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          next_due_date?: string | null
          next_due_km?: number | null
          notes?: string | null
          organization_id: string
          priority?: string
          recommended_interval_km?: number | null
          recommended_interval_months?: number | null
          service_catalog_id?: string | null
          service_name: string
          updated_at?: string
          updated_by?: string | null
          work_order_id: string
          work_order_service_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          next_due_date?: string | null
          next_due_km?: number | null
          notes?: string | null
          organization_id?: string
          priority?: string
          recommended_interval_km?: number | null
          recommended_interval_months?: number | null
          service_catalog_id?: string | null
          service_name?: string
          updated_at?: string
          updated_by?: string | null
          work_order_id?: string
          work_order_service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_recommendations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_recommendations_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_recommendations_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "service_recommendations_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "service_recommendations_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_recommendations_work_order_service_id_fkey"
            columns: ["work_order_service_id"]
            isOneToOne: false
            referencedRelation: "work_order_services"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_thresholds: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          maximum_quantity: number | null
          minimum_quantity: number
          notes: string | null
          organization_id: string
          part_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          maximum_quantity?: number | null
          minimum_quantity?: number
          notes?: string | null
          organization_id: string
          part_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          maximum_quantity?: number | null
          minimum_quantity?: number
          notes?: string | null
          organization_id?: string
          part_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_thresholds_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_thresholds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_thresholds_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          created_at: string
          id: string
          part_id: string
          quantity: number
          transfer_id: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          part_id: string
          quantity: number
          transfer_id: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          part_id?: string
          quantity?: number
          transfer_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          approved_by: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          from_branch_id: string | null
          id: string
          notes: string | null
          organization_id: string
          received_by: string | null
          status: string
          to_branch_id: string
        }
        Insert: {
          approved_by?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          from_branch_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          received_by?: string | null
          status?: string
          to_branch_id: string
        }
        Update: {
          approved_by?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          from_branch_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          received_by?: string | null
          status?: string
          to_branch_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      store_credit_balances: {
        Row: {
          balance: number
          created_at: string
          customer_id: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          customer_id: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          customer_id?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_credit_balances_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_credit_balances_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "store_credit_balances_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "store_credit_balances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      store_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          organization_id: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          organization_id: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_credit_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "store_credit_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_credit_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_credit_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "store_credit_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "store_credit_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          expires_at: string | null
          grace_period_end: string | null
          id: string
          organization_id: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          settings: Json | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          grace_period_end?: string | null
          id?: string
          organization_id: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          settings?: Json | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          grace_period_end?: string | null
          id?: string
          organization_id?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          settings?: Json | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          branch_id: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean
          lead_time_days: number | null
          min_order_quantity: number | null
          name: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          min_order_quantity?: number | null
          name: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          min_order_quantity?: number | null
          name?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_link_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          organization_id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          organization_id: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          organization_id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_link_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_links: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          notification_preferences: Json
          organization_id: string
          telegram_chat_id: number
          telegram_user_id: number | null
          telegram_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          notification_preferences?: Json
          organization_id: string
          telegram_chat_id: number
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          notification_preferences?: Json
          organization_id?: string
          telegram_chat_id?: number
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_model_parts: {
        Row: {
          compatibility_notes: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          part_id: string
          specific_price: number | null
          updated_at: string
          updated_by: string | null
          vehicle_model_id: string
        }
        Insert: {
          compatibility_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          part_id: string
          specific_price?: number | null
          updated_at?: string
          updated_by?: string | null
          vehicle_model_id: string
        }
        Update: {
          compatibility_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          part_id?: string
          specific_price?: number | null
          updated_at?: string
          updated_by?: string | null
          vehicle_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_model_parts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_model_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_model_parts_vehicle_model_id_fkey"
            columns: ["vehicle_model_id"]
            isOneToOne: false
            referencedRelation: "vehicle_models"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_model_services: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          service_catalog_id: string
          specific_price: number | null
          updated_at: string
          updated_by: string | null
          vehicle_model_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          service_catalog_id: string
          specific_price?: number | null
          updated_at?: string
          updated_by?: string | null
          vehicle_model_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          service_catalog_id?: string
          specific_price?: number | null
          updated_at?: string
          updated_by?: string | null
          vehicle_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_model_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_model_services_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_model_services_vehicle_model_id_fkey"
            columns: ["vehicle_model_id"]
            isOneToOne: false
            referencedRelation: "vehicle_models"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_models: {
        Row: {
          body_type: string | null
          class: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          engine: string | null
          generation: string | null
          id: string
          is_active: boolean
          make: string
          model: string
          organization_id: string
          updated_at: string
          updated_by: string | null
          year_end: number | null
          year_start: number | null
        }
        Insert: {
          body_type?: string | null
          class?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          engine?: string | null
          generation?: string | null
          id?: string
          is_active?: boolean
          make: string
          model: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
          year_end?: number | null
          year_start?: number | null
        }
        Update: {
          body_type?: string | null
          class?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          engine?: string | null
          generation?: string | null
          id?: string
          is_active?: boolean
          make?: string
          model?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
          year_end?: number | null
          year_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_models_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_owners: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          id: string
          is_primary: boolean
          organization_id: string | null
          owned_from: string
          owned_until: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          organization_id?: string | null
          owned_from?: string
          owned_until?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vehicle_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          organization_id?: string | null
          owned_from?: string
          owned_until?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_owners_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_owners_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "vehicle_owners_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "vehicle_owners_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_service_schedules: {
        Row: {
          branch_id: string | null
          contact_status: string
          contacted_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          interval_km: number | null
          interval_months: number | null
          last_service_date: string | null
          last_service_odometer: number | null
          next_due_date: string | null
          next_due_km: number | null
          notes: string | null
          organization_id: string
          reminder_enabled: boolean
          service_catalog_id: string | null
          service_name: string
          updated_at: string
          updated_by: string | null
          vehicle_id: string
        }
        Insert: {
          branch_id?: string | null
          contact_status?: string
          contacted_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          last_service_date?: string | null
          last_service_odometer?: number | null
          next_due_date?: string | null
          next_due_km?: number | null
          notes?: string | null
          organization_id: string
          reminder_enabled?: boolean
          service_catalog_id?: string | null
          service_name: string
          updated_at?: string
          updated_by?: string | null
          vehicle_id: string
        }
        Update: {
          branch_id?: string | null
          contact_status?: string
          contacted_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          last_service_date?: string | null
          last_service_odometer?: number | null
          next_due_date?: string | null
          next_due_km?: number | null
          notes?: string | null
          organization_id?: string
          reminder_enabled?: boolean
          service_catalog_id?: string | null
          service_name?: string
          updated_at?: string
          updated_by?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_service_schedules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_service_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_service_schedules_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_service_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          body_type: string | null
          branch_id: string | null
          chassis_number: string | null
          color: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          drivetrain: string | null
          engine: string | null
          fuel_type: string | null
          height: number | null
          id: string
          inspection_notes: string | null
          last_service_branch_id: string | null
          last_visit_at: string | null
          last_visit_date: string | null
          length: number | null
          license_expiry: string | null
          license_expiry_at: string | null
          make: string
          model: string
          next_service_at: string | null
          next_service_date: string | null
          notes: string | null
          odometer: number | null
          organization_id: string
          plate_number: string
          tags: string[] | null
          transmission: string | null
          trim: string | null
          updated_at: string
          updated_by: string | null
          vin: string | null
          weight: number | null
          width: number | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          branch_id?: string | null
          chassis_number?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          drivetrain?: string | null
          engine?: string | null
          fuel_type?: string | null
          height?: number | null
          id?: string
          inspection_notes?: string | null
          last_service_branch_id?: string | null
          last_visit_at?: string | null
          last_visit_date?: string | null
          length?: number | null
          license_expiry?: string | null
          license_expiry_at?: string | null
          make: string
          model: string
          next_service_at?: string | null
          next_service_date?: string | null
          notes?: string | null
          odometer?: number | null
          organization_id: string
          plate_number: string
          tags?: string[] | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          updated_by?: string | null
          vin?: string | null
          weight?: number | null
          width?: number | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          branch_id?: string | null
          chassis_number?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          drivetrain?: string | null
          engine?: string | null
          fuel_type?: string | null
          height?: number | null
          id?: string
          inspection_notes?: string | null
          last_service_branch_id?: string | null
          last_visit_at?: string | null
          last_visit_date?: string | null
          length?: number | null
          license_expiry?: string | null
          license_expiry_at?: string | null
          make?: string
          model?: string
          next_service_at?: string | null
          next_service_date?: string | null
          notes?: string | null
          odometer?: number | null
          organization_id?: string
          plate_number?: string
          tags?: string[] | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          updated_by?: string | null
          vin?: string | null
          weight?: number | null
          width?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "vehicles_last_service_branch_id_fkey"
            columns: ["last_service_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_attachments: {
        Row: {
          created_at: string
          deleted_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          mime_type: string
          organization_id: string
          public_url: string | null
          storage_path: string
          uploaded_by: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          file_name: string
          file_size: number
          file_type?: string
          id?: string
          mime_type: string
          organization_id: string
          public_url?: string | null
          storage_path: string
          uploaded_by: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          mime_type?: string
          organization_id?: string
          public_url?: string | null
          storage_path?: string
          uploaded_by?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_attachments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_attachments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_attachments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number
          commission_rule_id: string | null
          commission_type: string
          created_at: string
          id: string
          labor_amount: number
          mechanic_id: string
          parts_amount: number
          updated_at: string
          work_order_id: string
        }
        Insert: {
          commission_amount?: number
          commission_rate: number
          commission_rule_id?: string | null
          commission_type: string
          created_at?: string
          id?: string
          labor_amount?: number
          mechanic_id: string
          parts_amount?: number
          updated_at?: string
          work_order_id: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          commission_rule_id?: string | null
          commission_type?: string
          created_at?: string
          id?: string
          labor_amount?: number
          mechanic_id?: string
          parts_amount?: number
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wo_commissions_rule"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "mechanic_commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_commissions_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "work_order_commissions_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_commissions_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_commissions_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_commissions_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_helpers: {
        Row: {
          assigned_at: string
          created_at: string
          created_by: string | null
          id: string
          mechanic_id: string
          organization_id: string
          sort_order: number
          work_order_id: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          created_by?: string | null
          id?: string
          mechanic_id: string
          organization_id: string
          sort_order?: number
          work_order_id: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          created_by?: string | null
          id?: string
          mechanic_id?: string
          organization_id?: string
          sort_order?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_helpers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_helpers_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_helpers_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_helpers_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          work_order_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          work_order_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_notes_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_notes_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_notes_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_parts: {
        Row: {
          catalog_item_variant_id: string | null
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_percentage: number | null
          final_price: number
          id: string
          last_sold_price: number | null
          notes: string | null
          organization_id: string | null
          part_id: string | null
          part_name: string
          part_number: string | null
          quantity: number
          unit_cost: number
          unit_price: number
          variant_label: string | null
          work_order_id: string
        }
        Insert: {
          catalog_item_variant_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price?: number
          id?: string
          last_sold_price?: number | null
          notes?: string | null
          organization_id?: string | null
          part_id?: string | null
          part_name: string
          part_number?: string | null
          quantity?: number
          unit_cost?: number
          unit_price?: number
          variant_label?: string | null
          work_order_id: string
        }
        Update: {
          catalog_item_variant_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price?: number
          id?: string
          last_sold_price?: number | null
          notes?: string | null
          organization_id?: string | null
          part_id?: string | null
          part_name?: string
          part_number?: string | null
          quantity?: number
          unit_cost?: number
          unit_price?: number
          variant_label?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_parts_catalog_item_variant_id_fkey"
            columns: ["catalog_item_variant_id"]
            isOneToOne: false
            referencedRelation: "catalog_item_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_parts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_parts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_parts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_parts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_services: {
        Row: {
          catalog_item_variant_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          final_price: number
          id: string
          last_sold_price: number | null
          mechanic_id: string | null
          notes: string | null
          organization_id: string | null
          quantity: number
          service_catalog_id: string | null
          service_name: string
          unit_cost: number
          unit_price: number
          variant_label: string | null
          work_order_id: string
        }
        Insert: {
          catalog_item_variant_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price?: number
          id?: string
          last_sold_price?: number | null
          mechanic_id?: string | null
          notes?: string | null
          organization_id?: string | null
          quantity?: number
          service_catalog_id?: string | null
          service_name: string
          unit_cost?: number
          unit_price?: number
          variant_label?: string | null
          work_order_id: string
        }
        Update: {
          catalog_item_variant_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price?: number
          id?: string
          last_sold_price?: number | null
          mechanic_id?: string | null
          notes?: string | null
          organization_id?: string | null
          quantity?: number
          service_catalog_id?: string | null
          service_name?: string
          unit_cost?: number
          unit_price?: number
          variant_label?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_services_catalog_item_variant_id_fkey"
            columns: ["catalog_item_variant_id"]
            isOneToOne: false
            referencedRelation: "catalog_item_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_services_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_services_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_services_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_services_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_status_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          previous_status: string | null
          status: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          previous_status?: string | null
          status: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          previous_status?: string | null
          status?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_status_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_status_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_status_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order_costs"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_status_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          bay_number: number | null
          branch_id: string | null
          complaint: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          diagnosis: string | null
          diagnosis_label_id: string | null
          discount_amount: number
          discount_percentage: number
          discount_total: number
          id: string
          labor_cost: number | null
          labor_hours: number | null
          loss_reason: string | null
          mechanic_id: string | null
          mechanic_notes: string | null
          notes: string | null
          nuat_enabled: boolean | null
          odometer_at_service: number | null
          organization_id: string
          queue_order: number
          source_estimate_id: string | null
          started_at: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          updated_by: string | null
          vehicle_id: string | null
        }
        Insert: {
          bay_number?: number | null
          branch_id?: string | null
          complaint?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          diagnosis?: string | null
          diagnosis_label_id?: string | null
          discount_amount?: number
          discount_percentage?: number
          discount_total?: number
          id?: string
          labor_cost?: number | null
          labor_hours?: number | null
          loss_reason?: string | null
          mechanic_id?: string | null
          mechanic_notes?: string | null
          notes?: string | null
          nuat_enabled?: boolean | null
          odometer_at_service?: number | null
          organization_id: string
          queue_order?: number
          source_estimate_id?: string | null
          started_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          updated_by?: string | null
          vehicle_id?: string | null
        }
        Update: {
          bay_number?: number | null
          branch_id?: string | null
          complaint?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          diagnosis?: string | null
          diagnosis_label_id?: string | null
          discount_amount?: number
          discount_percentage?: number
          discount_total?: number
          id?: string
          labor_cost?: number | null
          labor_hours?: number | null
          loss_reason?: string | null
          mechanic_id?: string | null
          mechanic_notes?: string | null
          notes?: string | null
          nuat_enabled?: boolean | null
          odometer_at_service?: number | null
          organization_id?: string
          queue_order?: number
          source_estimate_id?: string | null
          started_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          updated_by?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_customer_lifetime_value"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "work_orders_diagnosis_label_id_fkey"
            columns: ["diagnosis_label_id"]
            isOneToOne: false
            referencedRelation: "diagnosis_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "work_orders_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_source_estimate_id_fkey"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      app_config_view: {
        Row: {
          in_vault: boolean | null
          key: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          in_vault?: never
          key?: string | null
          updated_at?: string | null
          value?: never
        }
        Update: {
          in_vault?: never
          key?: string | null
          updated_at?: string | null
          value?: never
        }
        Relationships: []
      }
      mv_customer_lifetime_value: {
        Row: {
          avg_order_value: number | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          first_visit: string | null
          last_visit: string | null
          organization_id: string | null
          total_spent: number | null
          total_visits: number | null
          vehicles_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_mechanic_performance: {
        Row: {
          avg_completion_time_hours: number | null
          completed_orders: number | null
          mechanic_id: string | null
          mechanic_name: string | null
          orders_last_7_days: number | null
          organization_id: string | null
          parts_revenue: number | null
          revenue_last_30_days: number | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mv_work_order_summary"
            referencedColumns: ["mechanic_id"]
          },
          {
            foreignKeyName: "work_orders_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_revenue_by_service_category: {
        Row: {
          category: string | null
          date: string | null
          order_count: number | null
          organization_id: string | null
          total_parts_revenue: number | null
          total_revenue: number | null
          total_service_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_work_order_summary: {
        Row: {
          bay_number: number | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          grand_total: number | null
          mechanic_id: string | null
          mechanic_name: string | null
          organization_id: string | null
          parts_count: number | null
          parts_total: number | null
          plate_number: string | null
          queue_order: number | null
          services_count: number | null
          services_total: number | null
          started_at: string | null
          status: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          work_order_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_security_definer_audit: {
        Row: {
          arguments: string | null
          function_name: string | null
          has_auth_uid_check: boolean | null
          has_search_path_set: boolean | null
          return_type: string | null
        }
        Relationships: []
      }
      work_order_costs: {
        Row: {
          gross_profit: number | null
          margin_percent: number | null
          organization_id: string | null
          parts_cost: number | null
          parts_revenue: number | null
          services_cost: number | null
          services_revenue: number | null
          total_cost: number | null
          total_revenue: number | null
          work_order_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invite: {
        Args: { accepting_user_id: string; invite_token: string }
        Returns: Json
      }
      admin_extend_subscription: {
        Args: { target_org_id: string }
        Returns: Json
      }
      admin_list_organizations: { Args: never; Returns: Json }
      admin_update_subscription: {
        Args: {
          new_plan_type: string
          new_status?: string
          target_org_id: string
        }
        Returns: Json
      }
      audit_security_definer_functions: {
        Args: never
        Returns: {
          arguments: string
          function_name: string
          has_auth_uid_check: boolean
          has_search_path_set: boolean
          return_type: string
        }[]
      }
      check_org_subscription_status: {
        Args: { target_org_id: string }
        Returns: Json
      }
      check_org_subscription_status_fast: {
        Args: { target_org_id: string }
        Returns: Json
      }
      create_default_subscription: {
        Args: { target_org_id: string }
        Returns: string
      }
      generate_clock_token: {
        Args: { p_action_type: string; p_org_id: string }
        Returns: Json
      }
      generate_estimate_number: { Args: never; Returns: string }
      generate_registration_token: {
        Args: { p_mechanic_id: string; p_org_id: string }
        Returns: Json
      }
      get_current_org_id: { Args: never; Returns: string }
      get_customers_with_value: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_org_id: string
          p_search?: string
        }
        Returns: Json
      }
      get_dashboard_metrics: { Args: { p_org_id: string }; Returns: Json }
      get_finance_summary: {
        Args: { p_org_id: string; p_period?: string }
        Returns: Json
      }
      get_full_dashboard_data: {
        Args: {
          p_branch_id?: string
          p_date_from?: string
          p_date_to?: string
          p_org_id: string
          p_period?: string
        }
        Returns: Json
      }
      get_inventory_with_stock: {
        Args: {
          p_limit?: number
          p_low_stock_only?: boolean
          p_offset?: number
          p_org_id: string
          p_search?: string
        }
        Returns: Json
      }
      get_invoice_by_token: { Args: { p_token: string }; Returns: Json }
      get_mechanic_leaderboard: {
        Args: { p_org_id: string; p_period?: string }
        Returns: Json
      }
      get_public_estimate_by_token: { Args: { p_token: string }; Returns: Json }
      get_public_stats: { Args: never; Returns: Json }
      get_user_organization_id: { Args: never; Returns: string }
      get_user_organizations: {
        Args: never
        Returns: {
          branch_id: string
          has_bay_view_pin: boolean
          is_primary: boolean
          name: string
          organization_id: string
          role_id: string
          slug: string
        }[]
      }
      get_users_by_ids: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          id: string
        }[]
      }
      get_vehicles_list: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_org_id: string
          p_search?: string
        }
        Returns: Json
      }
      get_work_orders_list: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_org_id: string
          p_status?: string
        }
        Returns: Json
      }
      invoke_check_service_reminders: { Args: never; Returns: undefined }
      invoke_expire_subscriptions: { Args: never; Returns: undefined }
      invoke_telegram_notify_daily: { Args: never; Returns: undefined }
      invoke_telegram_notify_monthly: { Args: never; Returns: undefined }
      invoke_telegram_notify_weekly: { Args: never; Returns: undefined }
      list_mechanic_devices: {
        Args: { p_mechanic_id?: string; p_org_id: string }
        Returns: {
          created_at: string
          device_fingerprint: string
          device_id: string
          device_name: string
          is_active: boolean
          last_used_at: string
          mechanic_id: string
          mechanic_name: string
          revoked_at: string
        }[]
      }
      lookup_user_by_email: {
        Args: { target_email: string }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      normalize_plate: { Args: { p: string }; Returns: string }
      process_notification_queue: { Args: never; Returns: undefined }
      queue_notification: {
        Args: { p_org_id: string; p_payload: Json; p_type: string }
        Returns: undefined
      }
      record_refund_atomically: {
        Args: {
          p_amount: number
          p_created_by?: string
          p_invoice_id: string
          p_method?: string
          p_notes?: string
          p_organization_id: string
          p_reason?: string
          p_reference?: string
        }
        Returns: Json
      }
      refresh_inventory_balance: {
        Args: { p_part_id: string }
        Returns: undefined
      }
      register_mechanic_device: {
        Args: {
          p_device_fingerprint: string
          p_device_name?: string
          p_org_id: string
          p_registration_token: string
        }
        Returns: Json
      }
      renew_organization_subscription: {
        Args: { target_org_id: string }
        Returns: Json
      }
      revoke_mechanic_device: {
        Args: { p_device_id: string }
        Returns: boolean
      }
      seed_org_permissions: { Args: { p_org_id: string }; Returns: undefined }
      seed_org_role_permissions: {
        Args: { p_org_id: string }
        Returns: undefined
      }
      set_organization_bay_view_pin: {
        Args: { plain_pin: string; target_org_id: string }
        Returns: boolean
      }
      set_primary_organization: {
        Args: { target_org_id: string }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      translate_plate: { Args: { p: string }; Returns: string }
      vault_get_secret: { Args: { p_key: string }; Returns: string }
      vault_migrate_all_secrets: { Args: never; Returns: number }
      vault_migrate_from_app_config: {
        Args: { p_key: string }
        Returns: boolean
      }
      vault_store_secret: {
        Args: { p_key: string; p_value: string }
        Returns: undefined
      }
      verify_clock_token: {
        Args: { p_mechanic_id: string; p_raw_token: string }
        Returns: Json
      }
      verify_organization_bay_view_pin: {
        Args: { plain_pin: string; target_org_id: string }
        Returns: boolean
      }
    }
    Enums: {
      inventory_movement_type:
        | "purchase"
        | "sale"
        | "adjustment"
        | "transfer_in"
        | "transfer_out"
        | "return"
        | "waste"
        | "disassembly"
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "partial"
        | "overdue"
        | "cancelled"
        | "refunded"
      parts_car_location_group:
        | "engine"
        | "transmission"
        | "suspension"
        | "brake"
        | "body"
        | "interior"
        | "electrical"
        | "cooling"
        | "exhaust"
        | "fuel"
        | "steering"
        | "ac"
        | "other"
      permission_action:
        | "create"
        | "read"
        | "update"
        | "delete"
        | "manage"
        | "write"
        | "invite"
      plan_type: "starter" | "pro" | "business" | "enterprise"
      refund_status: "pending" | "completed" | "failed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      inventory_movement_type: [
        "purchase",
        "sale",
        "adjustment",
        "transfer_in",
        "transfer_out",
        "return",
        "waste",
        "disassembly",
      ],
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "partial",
        "overdue",
        "cancelled",
        "refunded",
      ],
      parts_car_location_group: [
        "engine",
        "transmission",
        "suspension",
        "brake",
        "body",
        "interior",
        "electrical",
        "cooling",
        "exhaust",
        "fuel",
        "steering",
        "ac",
        "other",
      ],
      permission_action: [
        "create",
        "read",
        "update",
        "delete",
        "manage",
        "write",
        "invite",
      ],
      plan_type: ["starter", "pro", "business", "enterprise"],
      refund_status: ["pending", "completed", "failed", "cancelled"],
    },
  },
} as const

