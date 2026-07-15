export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string | null;
          key: string;
          updated_at: string | null;
          value: Json;
        };
        Insert: {
          created_at?: string | null;
          key: string;
          updated_at?: string | null;
          value?: Json;
        };
        Update: {
          created_at?: string | null;
          key?: string;
          updated_at?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string | null;
          entity_id: string;
          entity_type: string;
          field_changes: Json | null;
          id: string;
          organization_id: string;
          summary: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string | null;
          entity_id: string;
          entity_type: string;
          field_changes?: Json | null;
          id?: string;
          organization_id: string;
          summary?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string | null;
          entity_id?: string;
          entity_type?: string;
          field_changes?: Json | null;
          id?: string;
          organization_id?: string;
          summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_log_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      branches: {
        Row: {
          address: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          is_default: boolean;
          name: string;
          organization_id: string;
          phone: string | null;
          slug: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_default?: boolean;
          name: string;
          organization_id: string;
          phone?: string | null;
          slug: string;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_default?: boolean;
          name?: string;
          organization_id?: string;
          phone?: string | null;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      brands: {
        Row: {
          created_at: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          organization_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          organization_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brands_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          slug: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          slug?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          slug?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      chart_of_accounts: {
        Row: {
          branch_id: string;
          code: string;
          created_at: string | null;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          parent_id: string | null;
          type: string;
        };
        Insert: {
          branch_id: string;
          code: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
          parent_id?: string | null;
          type: string;
        };
        Update: {
          branch_id?: string;
          code?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          parent_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chart_of_accounts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      commission_payout_items: {
        Row: {
          commission_amount: number;
          created_at: string | null;
          id: string;
          payout_id: string;
          sale_item_id: string;
        };
        Insert: {
          commission_amount?: number;
          created_at?: string | null;
          id?: string;
          payout_id: string;
          sale_item_id: string;
        };
        Update: {
          commission_amount?: number;
          created_at?: string | null;
          id?: string;
          payout_id?: string;
          sale_item_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commission_payout_items_payout_id_fkey";
            columns: ["payout_id"];
            isOneToOne: false;
            referencedRelation: "commission_payouts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_payout_items_sale_item_id_fkey";
            columns: ["sale_item_id"];
            isOneToOne: true;
            referencedRelation: "sale_items";
            referencedColumns: ["id"];
          },
        ];
      };
      commission_payouts: {
        Row: {
          branch_id: string;
          created_at: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          paid_at: string;
          paid_by: string;
          profile_id: string;
          status: string;
          total_amount: number;
        };
        Insert: {
          branch_id: string;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          organization_id: string;
          paid_at?: string;
          paid_by: string;
          profile_id: string;
          status?: string;
          total_amount?: number;
        };
        Update: {
          branch_id?: string;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          organization_id?: string;
          paid_at?: string;
          paid_by?: string;
          profile_id?: string;
          status?: string;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "commission_payouts_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_payouts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_payouts_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_payouts_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          address: string | null;
          balance: number | null;
          created_at: string | null;
          credit_limit: number | null;
          customer_segment_id: string | null;
          email: string | null;
          id: string;
          name: string;
          organization_id: string;
          payment_terms_days: number | null;
          phone: string | null;
          type: string;
        };
        Insert: {
          address?: string | null;
          balance?: number | null;
          created_at?: string | null;
          credit_limit?: number | null;
          customer_segment_id?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          payment_terms_days?: number | null;
          phone?: string | null;
          type: string;
        };
        Update: {
          address?: string | null;
          balance?: number | null;
          created_at?: string | null;
          credit_limit?: number | null;
          customer_segment_id?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          payment_terms_days?: number | null;
          phone?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_customer_segment_id_fkey";
            columns: ["customer_segment_id"];
            isOneToOne: false;
            referencedRelation: "customer_segments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      discount_conditions: {
        Row: {
          condition_type: string;
          condition_value: string;
          created_at: string | null;
          discount_id: string;
          id: string;
        };
        Insert: {
          condition_type: string;
          condition_value: string;
          created_at?: string | null;
          discount_id: string;
          id?: string;
        };
        Update: {
          condition_type?: string;
          condition_value?: string;
          created_at?: string | null;
          discount_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discount_conditions_discount_id_fkey";
            columns: ["discount_id"];
            isOneToOne: false;
            referencedRelation: "discounts";
            referencedColumns: ["id"];
          },
        ];
      };
      discounts: {
        Row: {
          applies_to: string;
          branch_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          min_purchase_amount: number;
          name: string;
          organization_id: string;
          type: string;
          usage_limit: number | null;
          used_count: number;
          valid_from: string;
          valid_until: string | null;
          value: number;
        };
        Insert: {
          applies_to?: string;
          branch_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          min_purchase_amount?: number;
          name: string;
          organization_id: string;
          type: string;
          usage_limit?: number | null;
          used_count?: number;
          valid_from?: string;
          valid_until?: string | null;
          value: number;
        };
        Update: {
          applies_to?: string;
          branch_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          min_purchase_amount?: number;
          name?: string;
          organization_id?: string;
          type?: string;
          usage_limit?: number | null;
          used_count?: number;
          valid_from?: string;
          valid_until?: string | null;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "discounts_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discounts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string | null;
          full_name: string;
          position: string | null;
          department: string | null;
          hire_date: string;
          contract_type: string;
          base_salary: number;
          salary_type: string;
          bank_account: string | null;
          is_active: boolean;
          branch_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          profile_id?: string | null;
          full_name: string;
          position?: string | null;
          department?: string | null;
          hire_date: string;
          contract_type?: string;
          base_salary: number;
          salary_type?: string;
          bank_account?: string | null;
          is_active?: boolean;
          branch_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          profile_id?: string | null;
          full_name?: string;
          position?: string | null;
          department?: string | null;
          hire_date?: string;
          contract_type?: string;
          base_salary?: number;
          salary_type?: string;
          bank_account?: string | null;
          is_active?: boolean;
          branch_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      payroll_runs: {
        Row: {
          id: string;
          organization_id: string;
          period_start: string;
          period_end: string;
          status: string;
          total_gross: number;
          total_si_employee: number;
          total_si_employer: number;
          total_income_tax: number;
          total_deductions: number;
          total_net: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          period_start: string;
          period_end: string;
          status?: string;
          total_gross?: number;
          total_si_employee?: number;
          total_si_employer?: number;
          total_income_tax?: number;
          total_deductions?: number;
          total_net?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          period_start?: string;
          period_end?: string;
          status?: string;
          total_gross?: number;
          total_si_employee?: number;
          total_si_employer?: number;
          total_income_tax?: number;
          total_deductions?: number;
          total_net?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payroll_runs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          branch_id: string;
          category: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          expense_date: string;
          id: string;
          organization_id: string;
          payment_method: string | null;
        };
        Insert: {
          amount: number;
          branch_id: string;
          category: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          expense_date?: string;
          id?: string;
          organization_id: string;
          payment_method?: string | null;
        };
        Update: {
          amount?: number;
          branch_id?: string;
          category?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          expense_date?: string;
          id?: string;
          organization_id?: string;
          payment_method?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          description: string | null;
          id: string;
          invoice_id: string;
          product_id: string | null;
          quantity: number;
          total_price: number;
          unit_price: number;
          variant_id: string | null;
        };
        Insert: {
          description?: string | null;
          id?: string;
          invoice_id: string;
          product_id?: string | null;
          quantity?: number;
          total_price?: number;
          unit_price?: number;
          variant_id?: string | null;
        };
        Update: {
          description?: string | null;
          id?: string;
          invoice_id?: string;
          product_id?: string | null;
          quantity?: number;
          total_price?: number;
          unit_price?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          branch_id: string;
          contact_id: string | null;
          created_at: string | null;
          created_by: string | null;
          due_date: string | null;
          id: string;
          invoice_number: string;
          issue_date: string;
          notes: string | null;
          organization_id: string;
          paid_amount: number | null;
          sale_id: string | null;
          status: string | null;
          token: string | null;
          token_hash: string | null;
          expires_at: string | null;
          revoked_at: string | null;
          total_amount: number | null;
        };
        Insert: {
          branch_id: string;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          due_date?: string | null;
          expires_at?: string | null;
          id?: string;
          invoice_number: string;
          issue_date?: string;
          notes?: string | null;
          organization_id: string;
          paid_amount?: number | null;
          revoked_at?: string | null;
          sale_id?: string | null;
          status?: string | null;
          token?: string | null;
          token_hash?: string | null;
          total_amount?: number | null;
        };
        Update: {
          branch_id?: string;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          due_date?: string | null;
          expires_at?: string | null;
          id?: string;
          invoice_number?: string;
          issue_date?: string;
          notes?: string | null;
          organization_id?: string;
          paid_amount?: number | null;
          revoked_at?: string | null;
          sale_id?: string | null;
          status?: string | null;
          token?: string | null;
          token_hash?: string | null;
          total_amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_entries: {
        Row: {
          branch_id: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          entry_date: string;
          entry_number: string;
          id: string;
          organization_id: string;
          reference_id: string | null;
          reference_type: string | null;
        };
        Insert: {
          branch_id: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          entry_date?: string;
          entry_number: string;
          id?: string;
          organization_id: string;
          reference_id?: string | null;
          reference_type?: string | null;
        };
        Update: {
          branch_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          entry_date?: string;
          entry_number?: string;
          id?: string;
          organization_id?: string;
          reference_id?: string | null;
          reference_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entries_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_entry_lines: {
        Row: {
          account_id: string;
          created_at: string | null;
          credit_amount: number;
          debit_amount: number;
          id: string;
          journal_entry_id: string;
        };
        Insert: {
          account_id: string;
          created_at?: string | null;
          credit_amount?: number;
          debit_amount?: number;
          id?: string;
          journal_entry_id: string;
        };
        Update: {
          account_id?: string;
          created_at?: string | null;
          credit_amount?: number;
          debit_amount?: number;
          id?: string;
          journal_entry_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey";
            columns: ["journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_configs: {
        Row: {
          channel: string;
          chat_id: string | null;
          config_data: Json;
          created_at: string | null;
          enabled: boolean | null;
          event_types: Json | null;
          id: string;
          organization_id: string;
          updated_at: string | null;
        };
        Insert: {
          channel: string;
          chat_id?: string | null;
          config_data?: Json;
          created_at?: string | null;
          enabled?: boolean | null;
          event_types?: Json | null;
          id?: string;
          organization_id: string;
          updated_at?: string | null;
        };
        Update: {
          channel?: string;
          chat_id?: string | null;
          config_data?: Json;
          created_at?: string | null;
          enabled?: boolean | null;
          event_types?: Json | null;
          id?: string;
          organization_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notification_configs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          channel: string;
          created_at: string | null;
          error_message: string | null;
          event_type: string;
          id: string;
          message: string;
          organization_id: string;
          sent_at: string | null;
          status: string | null;
          title: string;
        };
        Insert: {
          channel: string;
          created_at?: string | null;
          error_message?: string | null;
          event_type: string;
          id?: string;
          message: string;
          organization_id: string;
          sent_at?: string | null;
          status?: string | null;
          title: string;
        };
        Update: {
          channel?: string;
          created_at?: string | null;
          error_message?: string | null;
          event_type?: string;
          id?: string;
          message?: string;
          organization_id?: string;
          sent_at?: string | null;
          status?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          brand_config: Json | null;
          company_type: string;
          created_at: string | null;
          currency: string | null;
          enabled_features: string[] | null;
          has_audit_log: boolean | null;
          has_brands: boolean | null;
          has_categories: boolean | null;
          has_checkout_customer: boolean | null;
          has_checkout_quick_amounts: boolean | null;
          has_receipt_drawer: boolean | null;
          has_customer_credit: boolean | null;
          has_email_reports: boolean | null;
          has_inventory: boolean | null;
          has_multi_branch: boolean | null;
          has_suppliers: boolean | null;
          has_uom: boolean | null;
          has_variants: boolean | null;
          id: string;
          name: string;
          onboarding_completed: boolean | null;
          report_email_enabled: boolean;
          report_email_recipient: string | null;
          report_email_time: string | null;
          shop_default_payment_method: string;
          slug: string;
        };
        Insert: {
          brand_config?: Json | null;
          company_type?: string;
          created_at?: string | null;
          currency?: string | null;
          enabled_features?: string[] | null;
          has_audit_log?: boolean | null;
          has_brands?: boolean | null;
          has_categories?: boolean | null;
          has_checkout_customer?: boolean | null;
          has_checkout_quick_amounts?: boolean | null;
          has_receipt_drawer?: boolean | null;
          has_customer_credit?: boolean | null;
          has_email_reports?: boolean | null;
          has_inventory?: boolean | null;
          has_multi_branch?: boolean | null;
          has_suppliers?: boolean | null;
          has_uom?: boolean | null;
          has_variants?: boolean | null;
          id?: string;
          name: string;
          onboarding_completed?: boolean | null;
          report_email_enabled?: boolean;
          report_email_recipient?: string | null;
          report_email_time?: string | null;
          shop_default_payment_method?: string;
          slug: string;
        };
        Update: {
          brand_config?: Json | null;
          company_type?: string;
          created_at?: string | null;
          currency?: string | null;
          enabled_features?: string[] | null;
          has_audit_log?: boolean | null;
          has_brands?: boolean | null;
          has_categories?: boolean | null;
          has_checkout_customer?: boolean | null;
          has_checkout_quick_amounts?: boolean | null;
          has_receipt_drawer?: boolean | null;
          has_customer_credit?: boolean | null;
          has_email_reports?: boolean | null;
          has_inventory?: boolean | null;
          has_multi_branch?: boolean | null;
          has_suppliers?: boolean | null;
          has_uom?: boolean | null;
          has_variants?: boolean | null;
          id?: string;
          name?: string;
          onboarding_completed?: boolean | null;
          report_email_enabled?: boolean;
          report_email_recipient?: string | null;
          report_email_time?: string | null;
          shop_default_payment_method?: string;
          slug?: string;
        };
        Relationships: [];
      };
      product_bundle_items: {
        Row: {
          bundle_id: string;
          id: string;
          product_id: string | null;
          quantity: number;
          variant_id: string | null;
        };
        Insert: {
          bundle_id: string;
          id?: string;
          product_id?: string | null;
          quantity?: number;
          variant_id?: string | null;
        };
        Update: {
          bundle_id?: string;
          id?: string;
          product_id?: string | null;
          quantity?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_bundle_items_bundle_id_fkey";
            columns: ["bundle_id"];
            isOneToOne: false;
            referencedRelation: "product_bundles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_bundle_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_bundle_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_bundles: {
        Row: {
          cost_price: number | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string;
          sale_price: number | null;
          sku: string | null;
          updated_at: string | null;
        };
        Insert: {
          cost_price?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id: string;
          sale_price?: number | null;
          sku?: string | null;
          updated_at?: string | null;
        };
        Update: {
          cost_price?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string;
          sale_price?: number | null;
          sku?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_bundles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      product_presets: {
        Row: {
          brand_logo_url: string | null;
          brand_name: string;
          category_name: string | null;
          cost_price: number | null;
          created_at: string | null;
          id: string;
          min_stock: number | null;
          product_name: string;
          product_sku: string | null;
          sale_price: number | null;
          sort_order: number | null;
          unit: string | null;
        };
        Insert: {
          brand_logo_url?: string | null;
          brand_name: string;
          category_name?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          id?: string;
          min_stock?: number | null;
          product_name: string;
          product_sku?: string | null;
          sale_price?: number | null;
          sort_order?: number | null;
          unit?: string | null;
        };
        Update: {
          brand_logo_url?: string | null;
          brand_name?: string;
          category_name?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          id?: string;
          min_stock?: number | null;
          product_name?: string;
          product_sku?: string | null;
          sale_price?: number | null;
          sort_order?: number | null;
          unit?: string | null;
        };
        Relationships: [];
      };
      product_variant_assignments: {
        Row: {
          id: string;
          option_id: string;
          variant_id: string;
        };
        Insert: {
          id?: string;
          option_id: string;
          variant_id: string;
        };
        Update: {
          id?: string;
          option_id?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variant_assignments_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "product_variant_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variant_assignments_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variant_groups: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          product_id: string;
          sort_order: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          product_id: string;
          sort_order?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          product_id?: string;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variant_groups_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variant_options: {
        Row: {
          created_at: string | null;
          group_id: string;
          id: string;
          sort_order: number | null;
          value: string;
        };
        Insert: {
          created_at?: string | null;
          group_id: string;
          id?: string;
          sort_order?: number | null;
          value: string;
        };
        Update: {
          created_at?: string | null;
          group_id?: string;
          id?: string;
          sort_order?: number | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variant_options_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "product_variant_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          barcode: string | null;
          cost_price: number | null;
          created_at: string | null;
          current_stock: number | null;
          id: string;
          image_urls: string[] | null;
          is_active: boolean | null;
          min_stock: number | null;
          product_id: string;
          sale_price: number | null;
          sku: string | null;
        };
        Insert: {
          barcode?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          current_stock?: number | null;
          id?: string;
          image_urls?: string[] | null;
          is_active?: boolean | null;
          min_stock?: number | null;
          product_id: string;
          sale_price?: number | null;
          sku?: string | null;
        };
        Update: {
          barcode?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          current_stock?: number | null;
          id?: string;
          image_urls?: string[] | null;
          is_active?: boolean | null;
          min_stock?: number | null;
          product_id?: string;
          sale_price?: number | null;
          sku?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          barcode: string | null;
          brand_id: string | null;
          category_id: string | null;
          cost_price: number | null;
          created_at: string | null;
          current_stock: number | null;
          deleted_at: string | null;
          id: string;
          image_url: string | null;
          image_urls: string[] | null;
          min_stock: number | null;
          name: string;
          organization_id: string;
          sale_price: number | null;
          sku: string | null;
          unit: string | null;
        };
        Insert: {
          barcode?: string | null;
          brand_id?: string | null;
          category_id?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          current_stock?: number | null;
          deleted_at?: string | null;
          id?: string;
          image_url?: string | null;
          image_urls?: string[] | null;
          min_stock?: number | null;
          name: string;
          organization_id: string;
          sale_price?: number | null;
          sku?: string | null;
          unit?: string | null;
        };
        Update: {
          barcode?: string | null;
          brand_id?: string | null;
          category_id?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          current_stock?: number | null;
          deleted_at?: string | null;
          id?: string;
          image_url?: string | null;
          image_urls?: string[] | null;
          min_stock?: number | null;
          name?: string;
          organization_id?: string;
          sale_price?: number | null;
          sku?: string | null;
          unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          branch_id: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string;
          organization_id: string | null;
          role: string | null;
          role_id: string | null;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          organization_id?: string | null;
          role?: string | null;
          role_id?: string | null;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          organization_id?: string | null;
          role?: string | null;
          role_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_order_items: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          product_id: string | null;
          purchase_order_id: string;
          quantity: number;
          received_quantity: number;
          total_cost: number | null;
          unit_cost: number;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          product_id?: string | null;
          purchase_order_id: string;
          quantity?: number;
          received_quantity?: number;
          total_cost?: number | null;
          unit_cost?: number;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          product_id?: string | null;
          purchase_order_id?: string;
          quantity?: number;
          received_quantity?: number;
          total_cost?: number | null;
          unit_cost?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey";
            columns: ["purchase_order_id"];
            isOneToOne: false;
            referencedRelation: "purchase_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_orders: {
        Row: {
          branch_id: string;
          created_at: string | null;
          created_by: string | null;
          expected_date: string | null;
          id: string;
          notes: string | null;
          order_date: string;
          order_number: string;
          organization_id: string;
          status: string;
          supplier_id: string | null;
          total_amount: number;
        };
        Insert: {
          branch_id: string;
          created_at?: string | null;
          created_by?: string | null;
          expected_date?: string | null;
          id?: string;
          notes?: string | null;
          order_date?: string;
          order_number: string;
          organization_id: string;
          status?: string;
          supplier_id?: string | null;
          total_amount?: number;
        };
        Update: {
          branch_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          expected_date?: string | null;
          id?: string;
          notes?: string | null;
          order_date?: string;
          order_number?: string;
          organization_id?: string;
          status?: string;
          supplier_id?: string | null;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_orders_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      quotation_items: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          product_id: string | null;
          quantity: number;
          quotation_id: string;
          total_price: number | null;
          unit_price: number;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          product_id?: string | null;
          quantity?: number;
          quotation_id: string;
          total_price?: number | null;
          unit_price?: number;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          product_id?: string | null;
          quantity?: number;
          quotation_id?: string;
          total_price?: number | null;
          unit_price?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey";
            columns: ["quotation_id"];
            isOneToOne: false;
            referencedRelation: "quotations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotation_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      quotations: {
        Row: {
          branch_id: string;
          contact_id: string | null;
          converted_to_sale_id: string | null;
          created_at: string | null;
          created_by: string | null;
          expiry_date: string | null;
          id: string;
          issue_date: string;
          notes: string | null;
          organization_id: string;
          quote_number: string;
          status: string;
          total_amount: number;
        };
        Insert: {
          branch_id: string;
          contact_id?: string | null;
          converted_to_sale_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          expiry_date?: string | null;
          id?: string;
          issue_date?: string;
          notes?: string | null;
          organization_id: string;
          quote_number: string;
          status?: string;
          total_amount?: number;
        };
        Update: {
          branch_id?: string;
          contact_id?: string | null;
          converted_to_sale_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          expiry_date?: string | null;
          id?: string;
          issue_date?: string;
          notes?: string | null;
          organization_id?: string;
          quote_number?: string;
          status?: string;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quotations_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotations_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotations_converted_to_sale_id_fkey";
            columns: ["converted_to_sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      report_email_log: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          id: string;
          organization_id: string;
          recipient_email: string;
          report_date: string;
          sent_at: string | null;
          smtp_config_id: string | null;
          status: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          organization_id: string;
          recipient_email: string;
          report_date?: string;
          sent_at?: string | null;
          smtp_config_id?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          organization_id?: string;
          recipient_email?: string;
          report_date?: string;
          sent_at?: string | null;
          smtp_config_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_email_log_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_email_log_smtp_config_id_fkey";
            columns: ["smtp_config_id"];
            isOneToOne: false;
            referencedRelation: "smtp_configs";
            referencedColumns: ["id"];
          },
        ];
      };
      return_items: {
        Row: {
          created_at: string | null;
          id: string;
          product_id: string | null;
          quantity: number;
          reason: string | null;
          return_id: string;
          total_price: number | null;
          unit_price: number;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          product_id?: string | null;
          quantity: number;
          reason?: string | null;
          return_id: string;
          total_price?: number | null;
          unit_price?: number;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          product_id?: string | null;
          quantity?: number;
          reason?: string | null;
          return_id?: string;
          total_price?: number | null;
          unit_price?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "return_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_items_return_id_fkey";
            columns: ["return_id"];
            isOneToOne: false;
            referencedRelation: "returns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      returns: {
        Row: {
          branch_id: string;
          contact_id: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          organization_id: string;
          reason: string | null;
          reference_id: string | null;
          reference_type: string | null;
          return_date: string;
          return_number: string;
          status: string;
          total_amount: number;
          type: string;
        };
        Insert: {
          branch_id: string;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          organization_id: string;
          reason?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          return_date?: string;
          return_number: string;
          status?: string;
          total_amount?: number;
          type: string;
        };
        Update: {
          branch_id?: string;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          organization_id?: string;
          reason?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          return_date?: string;
          return_number?: string;
          status?: string;
          total_amount?: number;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "returns_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "returns_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "returns_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "returns_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string | null;
          id: string;
          permission: Database["public"]["Enums"]["app_permission"];
          role_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          permission: Database["public"]["Enums"]["app_permission"];
          role_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          permission?: Database["public"]["Enums"]["app_permission"];
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string | null;
          description: string | null;
          hierarchy_level: number;
          id: string;
          is_system_role: boolean;
          name: string;
          organization_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          hierarchy_level?: number;
          id?: string;
          is_system_role?: boolean;
          name: string;
          organization_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          hierarchy_level?: number;
          id?: string;
          is_system_role?: boolean;
          name?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          commission_amount: number;
          id: string;
          product_id: string | null;
          quantity: number;
          sale_id: string;
          total_price: number;
          unit_price: number;
          variant_id: string | null;
        };
        Insert: {
          commission_amount?: number;
          id?: string;
          product_id?: string | null;
          quantity: number;
          sale_id: string;
          total_price: number;
          unit_price: number;
          variant_id?: string | null;
        };
        Update: {
          commission_amount?: number;
          id?: string;
          product_id?: string | null;
          quantity?: number;
          sale_id?: string;
          total_price?: number;
          unit_price?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          branch_id: string;
          contact_id: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          paid_amount: number | null;
          payment_method: string | null;
          payment_splits: Json | null;
          sale_date: string;
          salesperson_id: string | null;
          status: string | null;
          total_amount: number;
        };
        Insert: {
          branch_id: string;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          organization_id: string;
          paid_amount?: number | null;
          payment_method?: string | null;
          payment_splits?: Json | null;
          sale_date?: string;
          salesperson_id?: string | null;
          status?: string | null;
          total_amount: number;
        };
        Update: {
          branch_id?: string;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          organization_id?: string;
          paid_amount?: number | null;
          payment_method?: string | null;
          payment_splits?: Json | null;
          sale_date?: string;
          salesperson_id?: string | null;
          status?: string | null;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_salesperson_id_fkey";
            columns: ["salesperson_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      shared_reports: {
        Row: {
          branch_id: string | null;
          created_at: string | null;
          created_by: string | null;
          date_from: string;
          date_to: string;
          id: string;
          organization_id: string;
          token: string;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_from: string;
          date_to: string;
          id?: string;
          organization_id: string;
          token: string;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_from?: string;
          date_to?: string;
          id?: string;
          organization_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shared_reports_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_reports_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_reports_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      smtp_configs: {
        Row: {
          created_at: string | null;
          daily_count: number | null;
          from_email: string;
          from_name: string | null;
          host: string;
          id: string;
          is_active: boolean | null;
          last_reset_date: string | null;
          password: string;
          port: number;
          priority: number | null;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          created_at?: string | null;
          daily_count?: number | null;
          from_email: string;
          from_name?: string | null;
          host?: string;
          id?: string;
          is_active?: boolean | null;
          last_reset_date?: string | null;
          password: string;
          port?: number;
          priority?: number | null;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          created_at?: string | null;
          daily_count?: number | null;
          from_email?: string;
          from_name?: string | null;
          host?: string;
          id?: string;
          is_active?: boolean | null;
          last_reset_date?: string | null;
          password?: string;
          port?: number;
          priority?: number | null;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          batch_id: string | null;
          branch_id: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          product_id: string;
          quantity: number;
          reference: string | null;
          type: string;
          unit_cost: number | null;
          variant_id: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          batch_id?: string | null;
          branch_id: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          organization_id: string;
          product_id: string;
          quantity: number;
          reference?: string | null;
          type: string;
          unit_cost?: number | null;
          variant_id?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          batch_id?: string | null;
          branch_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          organization_id?: string;
          product_id?: string;
          quantity?: number;
          reference?: string | null;
          type?: string;
          unit_cost?: number | null;
          variant_id?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      telegram_agent_links: {
        Row: {
          id: string;
          last_active_at: string;
          linked_at: string;
          organization_id: string;
          telegram_chat_id: string;
          telegram_username: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          last_active_at?: string;
          linked_at?: string;
          organization_id: string;
          telegram_chat_id: string;
          telegram_username?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          last_active_at?: string;
          linked_at?: string;
          organization_id?: string;
          telegram_chat_id?: string;
          telegram_username?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "telegram_agent_links_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "telegram_agent_links_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      uom_conversions: {
        Row: {
          conversion_factor: number;
          created_at: string | null;
          from_unit: string;
          id: string;
          organization_id: string;
          product_id: string | null;
          to_unit: string;
        };
        Insert: {
          conversion_factor: number;
          created_at?: string | null;
          from_unit: string;
          id?: string;
          organization_id: string;
          product_id?: string | null;
          to_unit: string;
        };
        Update: {
          conversion_factor?: number;
          created_at?: string | null;
          from_unit?: string;
          id?: string;
          organization_id?: string;
          product_id?: string | null;
          to_unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "uom_conversions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "uom_conversions_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_products: {
        Row: {
          current_stock: number | null;
          id: string;
          min_stock: number | null;
          product_id: string;
          updated_at: string | null;
          warehouse_id: string;
        };
        Insert: {
          current_stock?: number | null;
          id?: string;
          min_stock?: number | null;
          product_id: string;
          updated_at?: string | null;
          warehouse_id: string;
        };
        Update: {
          current_stock?: number | null;
          id?: string;
          min_stock?: number | null;
          product_id?: string;
          updated_at?: string | null;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_products_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouses: {
        Row: {
          branch_id: string | null;
          created_at: string | null;
          id: string;
          is_default: boolean | null;
          location: string | null;
          name: string;
          organization_id: string;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          location?: string | null;
          name: string;
          organization_id: string;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          location?: string | null;
          name?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: true;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouses_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      business_event_stock_targets: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          demand_multiplier: number | null;
          event_id: string;
          id: string;
          organization_id: string;
          product_id: string | null;
          target_quantity: number;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          demand_multiplier?: number | null;
          event_id: string;
          id?: string;
          organization_id: string;
          product_id?: string | null;
          target_quantity: number;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          demand_multiplier?: number | null;
          event_id?: string;
          id?: string;
          organization_id?: string;
          product_id?: string | null;
          target_quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bst_event_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "business_events";
            referencedColumns: ["id"];
          },
        ];
      };
      business_events: {
        Row: {
          created_at: string | null;
          end_date: string;
          id: string;
          is_active: boolean | null;
          name: string;
          notes: string | null;
          organization_id: string;
          preparation_lead_days: number | null;
          recurrence_source: string | null;
          start_date: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          end_date: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          notes?: string | null;
          organization_id: string;
          preparation_lead_days?: number | null;
          recurrence_source?: string | null;
          start_date: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          end_date?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          notes?: string | null;
          organization_id?: string;
          preparation_lead_days?: number | null;
          recurrence_source?: string | null;
          start_date?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      customer_account_entries: {
        Row: {
          actor_id: string | null;
          amount: number;
          contact_id: string;
          created_at: string | null;
          entry_date: string | null;
          entry_type: string;
          id: string;
          note: string | null;
          organization_id: string;
          source_id: string | null;
          source_type: string | null;
        };
        Insert: {
          actor_id?: string | null;
          amount: number;
          contact_id: string;
          created_at?: string | null;
          entry_date?: string | null;
          entry_type: string;
          id?: string;
          note?: string | null;
          organization_id: string;
          source_id?: string | null;
          source_type?: string | null;
        };
        Update: {
          actor_id?: string | null;
          amount?: number;
          contact_id?: string;
          created_at?: string | null;
          entry_date?: string | null;
          entry_type?: string;
          id?: string;
          note?: string | null;
          organization_id?: string;
          source_id?: string | null;
          source_type?: string | null;
        };
        Relationships: [];
      };
      customer_segments: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string;
          slug: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id: string;
          slug: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      gift_options: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          organization_id: string;
          price: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          organization_id: string;
          price?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string;
          price?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      order_template_items: {
        Row: {
          created_at: string | null;
          id: string;
          organization_id: string;
          product_id: string;
          quantity: number;
          template_id: string;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          organization_id: string;
          product_id: string;
          quantity?: number;
          template_id: string;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          organization_id?: string;
          product_id?: string;
          quantity?: number;
          template_id?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "oti_template_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "order_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      order_templates: {
        Row: {
          contact_id: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          next_run_date: string | null;
          notes: string | null;
          organization_id: string;
          schedule_interval_days: number | null;
          updated_at: string | null;
        };
        Insert: {
          contact_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          next_run_date?: string | null;
          notes?: string | null;
          organization_id: string;
          schedule_interval_days?: number | null;
          updated_at?: string | null;
        };
        Update: {
          contact_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          next_run_date?: string | null;
          notes?: string | null;
          organization_id?: string;
          schedule_interval_days?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      price_list_rules: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          id: string;
          min_quantity: number | null;
          organization_id: string;
          percentage_adjustment: number | null;
          price_list_id: string;
          product_id: string | null;
          unit_price: number | null;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          id?: string;
          min_quantity?: number | null;
          organization_id: string;
          percentage_adjustment?: number | null;
          price_list_id: string;
          product_id?: string | null;
          unit_price?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          id?: string;
          min_quantity?: number | null;
          organization_id?: string;
          percentage_adjustment?: number | null;
          price_list_id?: string;
          product_id?: string | null;
          unit_price?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "plr_pl_fkey";
            columns: ["price_list_id"];
            isOneToOne: false;
            referencedRelation: "price_lists";
            referencedColumns: ["id"];
          },
        ];
      };
      price_list_segments: {
        Row: {
          customer_segment_id: string;
          id: string;
          organization_id: string;
          price_list_id: string;
        };
        Insert: {
          customer_segment_id: string;
          id?: string;
          organization_id: string;
          price_list_id: string;
        };
        Update: {
          customer_segment_id?: string;
          id?: string;
          organization_id?: string;
          price_list_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pls_seg_fkey";
            columns: ["customer_segment_id"];
            isOneToOne: false;
            referencedRelation: "customer_segments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pls_pl_fkey";
            columns: ["price_list_id"];
            isOneToOne: false;
            referencedRelation: "price_lists";
            referencedColumns: ["id"];
          },
        ];
      };
      price_lists: {
        Row: {
          created_at: string | null;
          currency: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string;
          priority: number | null;
          updated_at: string | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id: string;
          priority?: number | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string;
          priority?: number | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      product_attribute_categories: {
        Row: {
          attribute_definition_id: string;
          category_id: string;
          id: string;
          organization_id: string;
        };
        Insert: {
          attribute_definition_id: string;
          category_id: string;
          id?: string;
          organization_id: string;
        };
        Update: {
          attribute_definition_id?: string;
          category_id?: string;
          id?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pac_definition_fkey";
            columns: ["attribute_definition_id"];
            isOneToOne: false;
            referencedRelation: "product_attribute_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      product_attribute_definitions: {
        Row: {
          created_at: string | null;
          id: string;
          is_filterable: boolean | null;
          is_required: boolean | null;
          name: string;
          options: Json | null;
          organization_id: string;
          slug: string;
          sort_order: number | null;
          unit: string | null;
          updated_at: string | null;
          value_type: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_filterable?: boolean | null;
          is_required?: boolean | null;
          name: string;
          options?: Json | null;
          organization_id: string;
          slug: string;
          sort_order?: number | null;
          unit?: string | null;
          updated_at?: string | null;
          value_type: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_filterable?: boolean | null;
          is_required?: boolean | null;
          name?: string;
          options?: Json | null;
          organization_id?: string;
          slug?: string;
          sort_order?: number | null;
          unit?: string | null;
          updated_at?: string | null;
          value_type?: string;
        };
        Relationships: [];
      };
      product_attribute_values: {
        Row: {
          attribute_definition_id: string;
          created_at: string | null;
          id: string;
          organization_id: string;
          product_id: string;
          updated_at: string | null;
          value_boolean: boolean | null;
          value_number: number | null;
          value_text: string | null;
        };
        Insert: {
          attribute_definition_id: string;
          created_at?: string | null;
          id?: string;
          organization_id: string;
          product_id: string;
          updated_at?: string | null;
          value_boolean?: boolean | null;
          value_number?: number | null;
          value_text?: string | null;
        };
        Update: {
          attribute_definition_id?: string;
          created_at?: string | null;
          id?: string;
          organization_id?: string;
          product_id?: string;
          updated_at?: string | null;
          value_boolean?: boolean | null;
          value_number?: number | null;
          value_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pav_definition_fkey";
            columns: ["attribute_definition_id"];
            isOneToOne: false;
            referencedRelation: "product_attribute_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_addons: {
        Row: {
          addon_type: string;
          created_at: string | null;
          gift_message: string | null;
          gift_option_id: string | null;
          id: string;
          name_snapshot: string;
          organization_id: string;
          price_snapshot: number;
          sale_id: string;
        };
        Insert: {
          addon_type?: string;
          created_at?: string | null;
          gift_message?: string | null;
          gift_option_id?: string | null;
          id?: string;
          name_snapshot: string;
          organization_id: string;
          price_snapshot: number;
          sale_id: string;
        };
        Update: {
          addon_type?: string;
          created_at?: string | null;
          gift_message?: string | null;
          gift_option_id?: string | null;
          id?: string;
          name_snapshot?: string;
          organization_id?: string;
          price_snapshot?: number;
          sale_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sa_sale_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sa_gift_option_fkey";
            columns: ["gift_option_id"];
            isOneToOne: false;
            referencedRelation: "gift_options";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    attendance_records: {
      Row: {
        clock_in: string | null;
        clock_out: string | null;
        created_at: string | null;
        date: string;
        employee_id: string;
        hours_worked: number | null;
        id: string;
        notes: string | null;
        organization_id: string;
      };
      Insert: {
        clock_in?: string | null;
        clock_out?: string | null;
        created_at?: string | null;
        date: string;
        employee_id: string;
        hours_worked?: number | null;
        id?: string;
        notes?: string | null;
        organization_id: string;
      };
      Update: {
        clock_in?: string | null;
        clock_out?: string | null;
        created_at?: string | null;
        date?: string;
        employee_id?: string;
        hours_worked?: number | null;
        id?: string;
        notes?: string | null;
        organization_id?: string;
      };
      Relationships: [
        {
          foreignKeyName: "attendance_records_employee_id_fkey";
          columns: ["employee_id"];
          isOneToOne: false;
          referencedRelation: "employees";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "attendance_records_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    business_event_stock_targets: {
      Row: {
        category_id: string;
        created_at: string | null;
        current_stock: number | null;
        event_id: string;
        id: string;
        organization_id: string;
        product_id: string;
        target_stock: number;
      };
      Insert: {
        category_id: string;
        created_at?: string | null;
        current_stock?: number | null;
        event_id: string;
        id?: string;
        organization_id: string;
        product_id: string;
        target_stock: number;
      };
      Update: {
        category_id?: string;
        created_at?: string | null;
        current_stock?: number | null;
        event_id?: string;
        id?: string;
        organization_id?: string;
        product_id?: string;
        target_stock?: number;
      };
      Relationships: [
        {
          foreignKeyName: "business_event_stock_targets_category_id_fkey";
          columns: ["category_id"];
          isOneToOne: false;
          referencedRelation: "categories";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "business_event_stock_targets_event_id_fkey";
          columns: ["event_id"];
          isOneToOne: false;
          referencedRelation: "business_events";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "business_event_stock_targets_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "business_event_stock_targets_product_id_fkey";
          columns: ["product_id"];
          isOneToOne: false;
          referencedRelation: "products";
          referencedColumns: ["id"];
        },
      ];
    };

    business_events: {
      Row: {
        created_at: string | null;
        description: string | null;
        discount_type: string | null;
        discount_value: number | null;
        end_date: string | null;
        event_type: string;
        id: string;
        is_active: boolean | null;
        name: string;
        organization_id: string;
        start_date: string | null;
        updated_at: string | null;
      };
      Insert: {
        created_at?: string | null;
        description?: string | null;
        discount_type?: string | null;
        discount_value?: number | null;
        end_date?: string | null;
        event_type: string;
        id?: string;
        is_active?: boolean | null;
        name: string;
        organization_id: string;
        start_date?: string | null;
        updated_at?: string | null;
      };
      Update: {
        created_at?: string | null;
        description?: string | null;
        discount_type?: string | null;
        discount_value?: number | null;
        end_date?: string | null;
        event_type?: string;
        id?: string;
        is_active?: boolean | null;
        name?: string;
        organization_id?: string;
        start_date?: string | null;
        updated_at?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "business_events_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    custom_bots: {
      Row: {
        bot_token: string;
        created_at: string | null;
        id: string;
        is_active: boolean | null;
        name: string;
        organization_id: string;
        updated_at: string | null;
        webhook_url: string | null;
      };
      Insert: {
        bot_token: string;
        created_at?: string | null;
        id?: string;
        is_active?: boolean | null;
        name: string;
        organization_id: string;
        updated_at?: string | null;
        webhook_url?: string | null;
      };
      Update: {
        bot_token?: string;
        created_at?: string | null;
        id?: string;
        is_active?: boolean | null;
        name?: string;
        organization_id?: string;
        updated_at?: string | null;
        webhook_url?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "custom_bots_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    customer_account_entries: {
      Row: {
        amount: number;
        contact_id: string;
        created_at: string | null;
        entry_date: string | null;
        entry_type: string;
        id: string;
        note: string | null;
        organization_id: string;
        source_id: string | null;
        source_type: string | null;
      };
      Insert: {
        amount: number;
        contact_id: string;
        created_at?: string | null;
        entry_date?: string | null;
        entry_type: string;
        id?: string;
        note?: string | null;
        organization_id: string;
        source_id?: string | null;
        source_type?: string | null;
      };
      Update: {
        amount?: number;
        contact_id?: string;
        created_at?: string | null;
        entry_date?: string | null;
        entry_type?: string;
        id?: string;
        note?: string | null;
        organization_id?: string;
        source_id?: string | null;
        source_type?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "customer_account_entries_contact_id_fkey";
          columns: ["contact_id"];
          isOneToOne: false;
          referencedRelation: "contacts";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "customer_account_entries_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    customer_segments: {
      Row: {
        created_at: string | null;
        id: string;
        is_active: boolean | null;
        name: string;
        organization_id: string;
        slug: string;
        sort_order: number | null;
        updated_at: string | null;
      };
      Insert: {
        created_at?: string | null;
        id?: string;
        is_active?: boolean | null;
        name: string;
        organization_id: string;
        slug: string;
        sort_order?: number | null;
        updated_at?: string | null;
      };
      Update: {
        created_at?: string | null;
        id?: string;
        is_active?: boolean | null;
        name?: string;
        organization_id?: string;
        slug?: string;
        sort_order?: number | null;
        updated_at?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "customer_segments_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    gift_options: {
      Row: {
        created_at: string | null;
        description: string | null;
        id: string;
        image_url: string | null;
        is_active: boolean | null;
        name: string;
        organization_id: string;
        price: number;
        updated_at: string | null;
      };
      Insert: {
        created_at?: string | null;
        description?: string | null;
        id?: string;
        image_url?: string | null;
        is_active?: boolean | null;
        name: string;
        organization_id: string;
        price: number;
        updated_at?: string | null;
      };
      Update: {
        created_at?: string | null;
        description?: string | null;
        id?: string;
        image_url?: string | null;
        is_active?: boolean | null;
        name?: string;
        organization_id?: string;
        price?: number;
        updated_at?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "gift_options_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    leave_requests: {
      Row: {
        approved_by: string | null;
        created_at: string | null;
        days: number;
        employee_id: string;
        end_date: string;
        id: string;
        leave_type: string;
        organization_id: string;
        reason: string | null;
        start_date: string;
        status: string;
        updated_at: string | null;
      };
      Insert: {
        approved_by?: string | null;
        created_at?: string | null;
        days: number;
        employee_id: string;
        end_date: string;
        id?: string;
        leave_type: string;
        organization_id: string;
        reason?: string | null;
        start_date: string;
        status: string;
        updated_at?: string | null;
      };
      Update: {
        approved_by?: string | null;
        created_at?: string | null;
        days?: number;
        employee_id?: string;
        end_date?: string;
        id?: string;
        leave_type?: string;
        organization_id?: string;
        reason?: string | null;
        start_date?: string;
        status?: string;
        updated_at?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "leave_requests_approved_by_fkey";
          columns: ["approved_by"];
          isOneToOne: false;
          referencedRelation: "profiles";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "leave_requests_employee_id_fkey";
          columns: ["employee_id"];
          isOneToOne: false;
          referencedRelation: "employees";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "leave_requests_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    order_template_items: {
      Row: {
        created_at: string | null;
        id: string;
        organization_id: string;
        product_id: string;
        quantity: number;
        sort_order: number | null;
        template_id: string;
        variant_id: string | null;
      };
      Insert: {
        created_at?: string | null;
        id?: string;
        organization_id: string;
        product_id: string;
        quantity: number;
        sort_order?: number | null;
        template_id: string;
        variant_id?: string | null;
      };
      Update: {
        created_at?: string | null;
        id?: string;
        organization_id?: string;
        product_id?: string;
        quantity?: number;
        sort_order?: number | null;
        template_id?: string;
        variant_id?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "order_template_items_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "order_template_items_product_id_fkey";
          columns: ["product_id"];
          isOneToOne: false;
          referencedRelation: "products";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "order_template_items_template_id_fkey";
          columns: ["template_id"];
          isOneToOne: false;
          referencedRelation: "order_templates";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "order_template_items_variant_id_fkey";
          columns: ["variant_id"];
          isOneToOne: false;
          referencedRelation: "product_variants";
          referencedColumns: ["id"];
        },
      ];
    };

    order_templates: {
      Row: {
        contact_id: string | null;
        created_at: string | null;
        created_by: string | null;
        description: string | null;
        id: string;
        is_active: boolean | null;
        name: string;
        organization_id: string;
        updated_at: string | null;
      };
      Insert: {
        contact_id?: string | null;
        created_at?: string | null;
        created_by?: string | null;
        description?: string | null;
        id?: string;
        is_active?: boolean | null;
        name: string;
        organization_id: string;
        updated_at?: string | null;
      };
      Update: {
        contact_id?: string | null;
        created_at?: string | null;
        created_by?: string | null;
        description?: string | null;
        id?: string;
        is_active?: boolean | null;
        name?: string;
        organization_id?: string;
        updated_at?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "order_templates_contact_id_fkey";
          columns: ["contact_id"];
          isOneToOne: false;
          referencedRelation: "contacts";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "order_templates_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    payroll_items: {
      Row: {
        allowances: number | null;
        base_salary: number;
        created_at: string | null;
        deductions: number | null;
        employee_id: string;
        id: string;
        net_pay: number;
        payroll_run_id: string;
        status: string;
      };
      Insert: {
        allowances?: number | null;
        base_salary: number;
        created_at?: string | null;
        deductions?: number | null;
        employee_id: string;
        id?: string;
        net_pay: number;
        payroll_run_id: string;
        status: string;
      };
      Update: {
        allowances?: number | null;
        base_salary?: number;
        created_at?: string | null;
        deductions?: number | null;
        employee_id?: string;
        id?: string;
        net_pay?: number;
        payroll_run_id?: string;
        status?: string;
      };
      Relationships: [
        {
          foreignKeyName: "payroll_items_employee_id_fkey";
          columns: ["employee_id"];
          isOneToOne: false;
          referencedRelation: "employees";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "payroll_items_payroll_run_id_fkey";
          columns: ["payroll_run_id"];
          isOneToOne: false;
          referencedRelation: "payroll_runs";
          referencedColumns: ["id"];
        },
      ];
    };

    price_list_rules: {
      Row: {
        category_id: string | null;
        created_at: string | null;
        id: string;
        min_quantity: number | null;
        organization_id: string;
        price: number;
        price_list_id: string;
        product_id: string;
        variant_id: string | null;
      };
      Insert: {
        category_id?: string | null;
        created_at?: string | null;
        id?: string;
        min_quantity?: number | null;
        organization_id: string;
        price: number;
        price_list_id: string;
        product_id: string;
        variant_id?: string | null;
      };
      Update: {
        category_id?: string | null;
        created_at?: string | null;
        id?: string;
        min_quantity?: number | null;
        organization_id?: string;
        price?: number;
        price_list_id?: string;
        product_id?: string;
        variant_id?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "price_list_rules_category_id_fkey";
          columns: ["category_id"];
          isOneToOne: false;
          referencedRelation: "categories";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "price_list_rules_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "price_list_rules_price_list_id_fkey";
          columns: ["price_list_id"];
          isOneToOne: false;
          referencedRelation: "price_lists";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "price_list_rules_product_id_fkey";
          columns: ["product_id"];
          isOneToOne: false;
          referencedRelation: "products";
          referencedColumns: ["id"];
        },
      ];
    };

    price_list_segments: {
      Row: {
        created_at: string | null;
        customer_segment_id: string;
        id: string;
        organization_id: string;
        price_list_id: string;
      };
      Insert: {
        created_at?: string | null;
        customer_segment_id: string;
        id?: string;
        organization_id: string;
        price_list_id: string;
      };
      Update: {
        created_at?: string | null;
        customer_segment_id?: string;
        id?: string;
        organization_id?: string;
        price_list_id?: string;
      };
      Relationships: [
        {
          foreignKeyName: "price_list_segments_customer_segment_id_fkey";
          columns: ["customer_segment_id"];
          isOneToOne: false;
          referencedRelation: "customer_segments";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "price_list_segments_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "price_list_segments_price_list_id_fkey";
          columns: ["price_list_id"];
          isOneToOne: false;
          referencedRelation: "price_lists";
          referencedColumns: ["id"];
        },
      ];
    };

    price_lists: {
      Row: {
        created_at: string | null;
        id: string;
        is_active: boolean | null;
        name: string;
        organization_id: string;
        priority: number;
        updated_at: string | null;
        valid_from: string | null;
        valid_until: string | null;
      };
      Insert: {
        created_at?: string | null;
        id?: string;
        is_active?: boolean | null;
        name: string;
        organization_id: string;
        priority: number;
        updated_at?: string | null;
        valid_from?: string | null;
        valid_until?: string | null;
      };
      Update: {
        created_at?: string | null;
        id?: string;
        is_active?: boolean | null;
        name?: string;
        organization_id?: string;
        priority?: number;
        updated_at?: string | null;
        valid_from?: string | null;
        valid_until?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "price_lists_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    product_attribute_categories: {
      Row: {
        attribute_definition_id: string;
        category_id: string;
        created_at: string | null;
        id: string;
        organization_id: string;
      };
      Insert: {
        attribute_definition_id: string;
        category_id: string;
        created_at?: string | null;
        id?: string;
        organization_id: string;
      };
      Update: {
        attribute_definition_id?: string;
        category_id?: string;
        created_at?: string | null;
        id?: string;
        organization_id?: string;
      };
      Relationships: [
        {
          foreignKeyName: "product_attribute_categories_attribute_definition_id_fkey";
          columns: ["attribute_definition_id"];
          isOneToOne: false;
          referencedRelation: "product_attribute_definitions";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "product_attribute_categories_category_id_fkey";
          columns: ["category_id"];
          isOneToOne: false;
          referencedRelation: "categories";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "product_attribute_categories_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    product_attribute_definitions: {
      Row: {
        created_at: string | null;
        id: string;
        is_filterable: boolean | null;
        is_required: boolean | null;
        name: string;
        organization_id: string;
        slug: string;
        sort_order: number | null;
        updated_at: string | null;
        value_type: string;
      };
      Insert: {
        created_at?: string | null;
        id?: string;
        is_filterable?: boolean | null;
        is_required?: boolean | null;
        name: string;
        organization_id: string;
        slug: string;
        sort_order?: number | null;
        updated_at?: string | null;
        value_type: string;
      };
      Update: {
        created_at?: string | null;
        id?: string;
        is_filterable?: boolean | null;
        is_required?: boolean | null;
        name?: string;
        organization_id?: string;
        slug?: string;
        sort_order?: number | null;
        updated_at?: string | null;
        value_type?: string;
      };
      Relationships: [
        {
          foreignKeyName: "product_attribute_definitions_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    product_attribute_values: {
      Row: {
        attribute_definition_id: string;
        created_at: string | null;
        id: string;
        organization_id: string;
        product_id: string;
        value: string;
      };
      Insert: {
        attribute_definition_id: string;
        created_at?: string | null;
        id?: string;
        organization_id: string;
        product_id: string;
        value: string;
      };
      Update: {
        attribute_definition_id?: string;
        created_at?: string | null;
        id?: string;
        organization_id?: string;
        product_id?: string;
        value?: string;
      };
      Relationships: [
        {
          foreignKeyName: "product_attribute_values_attribute_definition_id_fkey";
          columns: ["attribute_definition_id"];
          isOneToOne: false;
          referencedRelation: "product_attribute_definitions";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "product_attribute_values_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "product_attribute_values_product_id_fkey";
          columns: ["product_id"];
          isOneToOne: false;
          referencedRelation: "products";
          referencedColumns: ["id"];
        },
      ];
    };

    sale_addons: {
      Row: {
        addon_type: string;
        created_at: string | null;
        gift_message: string | null;
        gift_option_id: string | null;
        id: string;
        name_snapshot: string;
        organization_id: string;
        price_snapshot: number;
        sale_id: string;
      };
      Insert: {
        addon_type: string;
        created_at?: string | null;
        gift_message?: string | null;
        gift_option_id?: string | null;
        id?: string;
        name_snapshot: string;
        organization_id: string;
        price_snapshot: number;
        sale_id: string;
      };
      Update: {
        addon_type?: string;
        created_at?: string | null;
        gift_message?: string | null;
        gift_option_id?: string | null;
        id?: string;
        name_snapshot?: string;
        organization_id?: string;
        price_snapshot?: number;
        sale_id?: string;
      };
      Relationships: [
        {
          foreignKeyName: "sale_addons_gift_option_id_fkey";
          columns: ["gift_option_id"];
          isOneToOne: false;
          referencedRelation: "gift_options";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "sale_addons_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "sale_addons_sale_id_fkey";
          columns: ["sale_id"];
          isOneToOne: false;
          referencedRelation: "sales";
          referencedColumns: ["id"];
        },
      ];
    };

    telegram_links: {
      Row: {
        created_at: string;
        first_name: string | null;
        id: string;
        is_active: boolean | null;
        last_active_at: string | null;
        last_name: string | null;
        linked_at: string | null;
        notification_preferences: Json;
        organization_id: string;
        product_type: string;
        telegram_chat_id: number;
        telegram_user_id: number;
        telegram_username: string | null;
        updated_at: string;
        user_id: string;
      };
      Insert: {
        created_at?: string;
        first_name?: string | null;
        id?: string;
        is_active?: boolean | null;
        last_active_at?: string | null;
        last_name?: string | null;
        linked_at?: string | null;
        notification_preferences: Json;
        organization_id: string;
        product_type: string;
        telegram_chat_id: number;
        telegram_user_id: number;
        telegram_username?: string | null;
        updated_at?: string;
        user_id: string;
      };
      Update: {
        created_at?: string;
        first_name?: string | null;
        id?: string;
        is_active?: boolean | null;
        last_active_at?: string | null;
        last_name?: string | null;
        linked_at?: string | null;
        notification_preferences?: Json;
        organization_id?: string;
        product_type?: string;
        telegram_chat_id?: number;
        telegram_user_id?: number;
        telegram_username?: string | null;
        updated_at?: string;
        user_id?: string;
      };
      Relationships: [
        {
          foreignKeyName: "telegram_links_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    agent_audit_log: {
      Row: {
        action: string;
        created_at: string | null;
        details: Json | null;
        id: string;
        organization_id: string;
        session_id: string | null;
      };
      Insert: {
        action: string;
        created_at?: string | null;
        details?: Json | null;
        id?: string;
        organization_id: string;
        session_id?: string | null;
      };
      Update: {
        action?: string;
        created_at?: string | null;
        details?: Json | null;
        id?: string;
        organization_id?: string;
        session_id?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "agent_audit_log_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    agent_sessions: {
      Row: {
        channel: string;
        created_at: string | null;
        id: string;
        organization_id: string;
        status: string;
        updated_at: string | null;
        user_id: string | null;
      };
      Insert: {
        channel: string;
        created_at?: string | null;
        id?: string;
        organization_id: string;
        status: string;
        updated_at?: string | null;
        user_id?: string | null;
      };
      Update: {
        channel?: string;
        created_at?: string | null;
        id?: string;
        organization_id?: string;
        status?: string;
        updated_at?: string | null;
        user_id?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "agent_sessions_organization_id_fkey";
          columns: ["organization_id"];
          isOneToOne: false;
          referencedRelation: "organizations";
          referencedColumns: ["id"];
        },
      ];
    };

    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_organization: {
        Args: { org_name: string; org_slug: string; org_type?: string };
        Returns: Json;
      };
      decrement_product_stock_safe: {
        Args: { p_org_id: string; p_product_id: string; p_quantity: number };
        Returns: Json;
      };
      generate_invoice_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      generate_journal_entry_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      generate_purchase_order_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      generate_quote_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      generate_return_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      get_current_organization: { Args: never; Returns: string };
      get_public_product: {
        Args: { p_product_id: string; p_slug: string };
        Returns: Json;
      };
      get_public_products: { Args: { p_slug: string }; Returns: Json };
      get_public_categories: { Args: { p_slug: string }; Returns: Json };
      get_public_report_data: { Args: { p_token: string }; Returns: Json };
      get_trial_balance: {
        Args: {
          p_as_of_date?: string;
          p_branch_id?: string;
          p_organization_id: string;
        };
        Returns: {
          account_code: string;
          account_id: string;
          account_name: string;
          account_type: string;
          credit_balance: number;
          debit_balance: number;
        }[];
      };
      get_user_permissions: {
        Args: never;
        Returns: Database["public"]["Enums"]["app_permission"][];
      };
      has_permission: {
        Args: { p_permission: Database["public"]["Enums"]["app_permission"] };
        Returns: boolean;
      };
      increment_smtp_count: { Args: { config_id: string }; Returns: undefined };
      process_batch_adjustment: {
        Args: {
          p_branch_id: string;
          p_items: Json;
          p_notes?: string;
          p_org_id: string;
          p_reference: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      process_receive_purchase_items: {
        Args: {
          p_branch_id: string;
          p_items: Json;
          p_order_id: string;
          p_org_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      process_restock_stock_movements:
        | {
            Args: {
              p_branch_id: string;
              p_items: Json;
              p_org_id: string;
              p_po_id: string;
              p_user_id: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_branch_id: string;
              p_items: Json;
              p_mark_received?: boolean;
              p_org_id: string;
              p_po_id: string;
              p_user_id: string;
            };
            Returns: Json;
          };
      process_sale_stock_decrement: {
        Args: { p_items: Json; p_org_id: string };
        Returns: Json;
      };
      schedule_daily_report_cron: {
        Args: { app_url: string };
        Returns: string;
      };
      seed_default_chart_of_accounts: {
        Args: { p_organization_id: string };
        Returns: undefined;
      };
      set_role_permissions: {
        Args: {
          p_permissions: Database["public"]["Enums"]["app_permission"][];
          p_role_id: string;
        };
        Returns: Json;
      };
      unschedule_daily_report_cron: { Args: never; Returns: string };
      user_has_branch_access: {
        Args: { target_branch_id: string };
        Returns: boolean;
      };
      user_has_permission: {
        Args: {
          p_permission: Database["public"]["Enums"]["app_permission"];
          p_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_permission:
        | "products.create"
        | "products.read"
        | "products.update"
        | "products.delete"
        | "categories.create"
        | "categories.read"
        | "categories.update"
        | "categories.delete"
        | "brands.create"
        | "brands.read"
        | "brands.update"
        | "brands.delete"
        | "contacts.create"
        | "contacts.read"
        | "contacts.update"
        | "contacts.delete"
        | "sales.create"
        | "sales.read"
        | "sales.update"
        | "sales.delete"
        | "expenses.create"
        | "expenses.read"
        | "expenses.update"
        | "expenses.delete"
        | "invoices.create"
        | "invoices.read"
        | "invoices.update"
        | "invoices.delete"
        | "warehouses.create"
        | "warehouses.read"
        | "warehouses.update"
        | "warehouses.delete"
        | "stock_movements.create"
        | "stock_movements.read"
        | "stock_movements.update"
        | "stock_movements.delete"
        | "uom_conversions.create"
        | "uom_conversions.read"
        | "uom_conversions.update"
        | "uom_conversions.delete"
        | "members.read"
        | "members.invite"
        | "members.remove"
        | "members.manage_role"
        | "roles.manage"
        | "settings.manage"
        | "reports.manage"
        | "notifications.manage"
        | "audit_log.read"
        | "purchases.create"
        | "purchases.read"
        | "purchases.update"
        | "purchases.delete"
        | "quotations.create"
        | "quotations.read"
        | "quotations.update"
        | "quotations.delete"
        | "returns.create"
        | "returns.read"
        | "returns.update"
        | "returns.delete"
        | "accounting.manage"
        | "discounts.create"
        | "discounts.read"
        | "discounts.update"
        | "discounts.delete"
        | "emails.manage";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      buckets_analytics: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          format: string;
          id: string;
          name: string;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          format?: string;
          id?: string;
          name: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          format?: string;
          id?: string;
          name?: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Relationships: [];
      };
      buckets_vectors: {
        Row: {
          created_at: string;
          id: string;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          metadata: Json | null;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          metadata?: Json | null;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          metadata?: Json | null;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey";
            columns: ["upload_id"];
            isOneToOne: false;
            referencedRelation: "s3_multipart_uploads";
            referencedColumns: ["id"];
          },
        ];
      };
      vector_indexes: {
        Row: {
          bucket_id: string;
          created_at: string;
          data_type: string;
          dimension: number;
          distance_metric: string;
          id: string;
          metadata_configuration: Json | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          data_type: string;
          dimension: number;
          distance_metric: string;
          id?: string;
          metadata_configuration?: Json | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          data_type?: string;
          dimension?: number;
          distance_metric?: string;
          id?: string;
          metadata_configuration?: Json | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets_vectors";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] };
        Returns: boolean;
      };
      allow_only_operation: {
        Args: { expected_operation: string };
        Returns: boolean;
      };
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string };
        Returns: undefined;
      };
      extension: { Args: { name: string }; Returns: string };
      filename: { Args: { name: string }; Returns: string };
      foldername: { Args: { name: string }; Returns: string[] };
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string };
        Returns: string;
      };
      get_size_by_bucket: {
        Args: never;
        Returns: {
          bucket_id: string;
          size: number;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
          prefix_param: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_token?: string;
          prefix_param: string;
          sort_order?: string;
          start_after?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      operation: { Args: never; Returns: string };
      search: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_by_timestamp: {
        Args: {
          p_bucket_id: string;
          p_level: number;
          p_limit: number;
          p_prefix: string;
          p_sort_column: string;
          p_sort_column_after: string;
          p_sort_order: string;
          p_start_after: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v2: {
        Args: {
          bucket_name: string;
          levels?: number;
          limits?: number;
          prefix: string;
          sort_column?: string;
          sort_column_after?: string;
          sort_order?: string;
          start_after?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_permission: [
        "products.create",
        "products.read",
        "products.update",
        "products.delete",
        "categories.create",
        "categories.read",
        "categories.update",
        "categories.delete",
        "brands.create",
        "brands.read",
        "brands.update",
        "brands.delete",
        "contacts.create",
        "contacts.read",
        "contacts.update",
        "contacts.delete",
        "sales.create",
        "sales.read",
        "sales.update",
        "sales.delete",
        "expenses.create",
        "expenses.read",
        "expenses.update",
        "expenses.delete",
        "invoices.create",
        "invoices.read",
        "invoices.update",
        "invoices.delete",
        "warehouses.create",
        "warehouses.read",
        "warehouses.update",
        "warehouses.delete",
        "stock_movements.create",
        "stock_movements.read",
        "stock_movements.update",
        "stock_movements.delete",
        "uom_conversions.create",
        "uom_conversions.read",
        "uom_conversions.update",
        "uom_conversions.delete",
        "members.read",
        "members.invite",
        "members.remove",
        "members.manage_role",
        "roles.manage",
        "settings.manage",
        "reports.manage",
        "notifications.manage",
        "audit_log.read",
        "purchases.create",
        "purchases.read",
        "purchases.update",
        "purchases.delete",
        "quotations.create",
        "quotations.read",
        "quotations.update",
        "quotations.delete",
        "returns.create",
        "returns.read",
        "returns.update",
        "returns.delete",
        "accounting.manage",
        "discounts.create",
        "discounts.read",
        "discounts.update",
        "discounts.delete",
        "emails.manage",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const;
