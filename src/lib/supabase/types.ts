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
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          organization_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
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
          email: string | null;
          id: string;
          name: string;
          organization_id: string;
          phone: string | null;
          type: string;
        };
        Insert: {
          address?: string | null;
          balance?: number | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          phone?: string | null;
          type: string;
        };
        Update: {
          address?: string | null;
          balance?: number | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          phone?: string | null;
          type?: string;
        };
        Relationships: [
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
          total_amount: number | null;
        };
        Insert: {
          branch_id: string;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number: string;
          issue_date?: string;
          notes?: string | null;
          organization_id: string;
          paid_amount?: number | null;
          sale_id?: string | null;
          status?: string | null;
          token?: string | null;
          total_amount?: number | null;
        };
        Update: {
          branch_id?: string;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number?: string;
          issue_date?: string;
          notes?: string | null;
          organization_id?: string;
          paid_amount?: number | null;
          sale_id?: string | null;
          status?: string | null;
          token?: string | null;
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
          has_customer_credit: boolean | null;
          has_inventory: boolean | null;
          has_multi_branch: boolean | null;
          has_suppliers: boolean | null;
          has_variants: boolean | null;
          has_uom: boolean | null;
          has_brands: boolean | null;
          has_categories: boolean | null;
          has_email_reports: boolean | null;
          has_audit_log: boolean | null;
          id: string;
          name: string;
          onboarding_completed: boolean | null;
          report_email_enabled: boolean;
          report_email_recipient: string | null;
          report_email_time: string | null;
          slug: string;
        };
        Insert: {
          brand_config?: Json | null;
          company_type?: string;
          created_at?: string | null;
          currency?: string | null;
          enabled_features?: string[] | null;
          has_customer_credit?: boolean | null;
          has_inventory?: boolean | null;
          has_multi_branch?: boolean | null;
          has_suppliers?: boolean | null;
          has_variants?: boolean | null;
          has_uom?: boolean | null;
          has_brands?: boolean | null;
          has_categories?: boolean | null;
          has_email_reports?: boolean | null;
          has_audit_log?: boolean | null;
          id?: string;
          name: string;
          onboarding_completed?: boolean | null;
          report_email_enabled?: boolean;
          report_email_recipient?: string | null;
          report_email_time?: string | null;
          slug: string;
        };
        Update: {
          brand_config?: Json | null;
          company_type?: string;
          created_at?: string | null;
          currency?: string | null;
          enabled_features?: string[] | null;
          has_customer_credit?: boolean | null;
          has_inventory?: boolean | null;
          has_multi_branch?: boolean | null;
          has_suppliers?: boolean | null;
          has_variants?: boolean | null;
          has_uom?: boolean | null;
          has_brands?: boolean | null;
          has_categories?: boolean | null;
          has_email_reports?: boolean | null;
          has_audit_log?: boolean | null;
          id?: string;
          name?: string;
          onboarding_completed?: boolean | null;
          report_email_enabled?: boolean;
          report_email_recipient?: string | null;
          report_email_time?: string | null;
          slug?: string;
        };
        Relationships: [];
      };
      product_presets: {
        Row: {
          brand_logo_url: string | null;
          brand_name: string;
          category_name: string | null;
          cost_price: number | null;
          created_at: string | null;
          id: string;
          image_url: string | null;
          image_urls: string[];
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
          image_url?: string | null;
          image_urls?: string[];
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
          image_url?: string | null;
          image_urls?: string[];
          min_stock?: number | null;
          product_name?: string;
          product_sku?: string | null;
          sale_price?: number | null;
          sort_order?: number | null;
          unit?: string | null;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_organization: {
        Args: { org_name: string; org_slug: string; org_type?: string };
        Returns: Json;
      };
      generate_invoice_number: { Args: never; Returns: string };
      generate_journal_entry_number: { Args: never; Returns: string };
      generate_purchase_order_number: { Args: never; Returns: string };
      generate_quote_number: { Args: never; Returns: string };
      generate_return_number: { Args: never; Returns: string };
      get_current_organization: { Args: never; Returns: string };
      get_public_product: {
        Args: { p_product_id: string; p_slug: string };
        Returns: Json;
      };
      get_public_products: { Args: { p_slug: string }; Returns: Json };
      get_public_report_data: { Args: { p_token: string }; Returns: Json };
      get_trial_balance: {
        Args: { p_as_of_date?: string; p_organization_id: string };
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
} as const;
