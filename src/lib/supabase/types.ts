export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          field_changes: Json | null
          id: string
          organization_id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          field_changes?: Json | null
          id?: string
          organization_id: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          field_changes?: Json | null
          id?: string
          organization_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payout_items: {
        Row: {
          commission_amount: number
          created_at: string | null
          id: string
          payout_id: string
          sale_item_id: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string | null
          id?: string
          payout_id: string
          sale_item_id: string
        }
        Update: {
          commission_amount?: number
          created_at?: string | null
          id?: string
          payout_id?: string
          sale_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payout_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "commission_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payout_items_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: true
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payouts: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string
          paid_at: string
          paid_by: string
          profile_id: string
          status: string
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          paid_at?: string
          paid_by: string
          profile_id: string
          status?: string
          total_amount?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string
          paid_by?: string
          profile_id?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payouts_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payouts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          balance: number | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          type: string
        }
        Insert: {
          address?: string | null
          balance?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          type: string
        }
        Update: {
          address?: string | null
          balance?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
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
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          organization_id: string
          payment_method: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          organization_id: string
          payment_method?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          organization_id?: string
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      invoice_items: {
        Row: {
          description: string | null
          id: string
          invoice_id: string
          product_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          description?: string | null
          id?: string
          invoice_id: string
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          description?: string | null
          id?: string
          invoice_id?: string
          product_id?: string | null
          quantity?: number
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
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          organization_id: string
          paid_amount: number | null
          sale_id: string | null
          status: string | null
          token: string | null
          total_amount: number | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          sale_id?: string | null
          status?: string | null
          token?: string | null
          total_amount?: number | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          sale_id?: string | null
          status?: string | null
          token?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_configs: {
        Row: {
          channel: string
          chat_id: string | null
          config_data: Json
          created_at: string | null
          enabled: boolean | null
          event_types: Json | null
          id: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          channel: string
          chat_id?: string | null
          config_data?: Json
          created_at?: string | null
          enabled?: boolean | null
          event_types?: Json | null
          id?: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          channel?: string
          chat_id?: string | null
          config_data?: Json
          created_at?: string | null
          enabled?: boolean | null
          event_types?: Json | null
          id?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          message: string
          organization_id: string
          sent_at: string | null
          status: string | null
          title: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          message: string
          organization_id: string
          sent_at?: string | null
          status?: string | null
          title: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          message?: string
          organization_id?: string
          sent_at?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          company_type: string
          created_at: string | null
          currency: string | null
          id: string
          name: string
          report_email_enabled: boolean
          report_email_recipient: string | null
          report_email_time: string | null
          slug: string
        }
        Insert: {
          company_type?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          name: string
          report_email_enabled?: boolean
          report_email_recipient?: string | null
          report_email_time?: string | null
          slug: string
        }
        Update: {
          company_type?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          name?: string
          report_email_enabled?: boolean
          report_email_recipient?: string | null
          report_email_time?: string | null
          slug?: string
        }
        Relationships: []
      }
      product_presets: {
        Row: {
          brand_logo_url: string | null
          brand_name: string
          category_name: string | null
          cost_price: number | null
          created_at: string | null
          id: string
          min_stock: number | null
          product_name: string
          product_sku: string | null
          sale_price: number | null
          sort_order: number | null
          unit: string | null
        }
        Insert: {
          brand_logo_url?: string | null
          brand_name: string
          category_name?: string | null
          cost_price?: number | null
          created_at?: string | null
          id?: string
          min_stock?: number | null
          product_name: string
          product_sku?: string | null
          sale_price?: number | null
          sort_order?: number | null
          unit?: string | null
        }
        Update: {
          brand_logo_url?: string | null
          brand_name?: string
          category_name?: string | null
          cost_price?: number | null
          created_at?: string | null
          id?: string
          min_stock?: number | null
          product_name?: string
          product_sku?: string | null
          sale_price?: number | null
          sort_order?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          current_stock: number | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          min_stock: number | null
          name: string
          organization_id: string
          sale_price: number | null
          sku: string | null
          unit: string | null
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          min_stock?: number | null
          name: string
          organization_id: string
          sale_price?: number | null
          sku?: string | null
          unit?: string | null
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          min_stock?: number | null
          name?: string
          organization_id?: string
          sale_price?: number | null
          sku?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          role: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
          role?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          role?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          purchase_order_id: string
          product_id: string | null
          description: string | null
          quantity: number
          unit_cost: number
          total_cost: number
          received_quantity: number
          created_at: string | null
        }
        Insert: {
          id?: string
          purchase_order_id: string
          product_id?: string | null
          description?: string | null
          quantity?: number
          unit_cost?: number
          total_cost?: number
          received_quantity?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          purchase_order_id?: string
          product_id?: string | null
          description?: string | null
          quantity?: number
          unit_cost?: number
          total_cost?: number
          received_quantity?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          id: string
          organization_id: string
          supplier_id: string | null
          order_number: string
          order_date: string
          expected_date: string | null
          status: string
          total_amount: number
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          supplier_id?: string | null
          order_number: string
          order_date?: string
          expected_date?: string | null
          status?: string
          total_amount?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          supplier_id?: string | null
          order_number?: string
          order_date?: string
          expected_date?: string | null
          status?: string
          total_amount?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
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
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          id: string
          quotation_id: string
          product_id: string | null
          description: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at: string | null
        }
        Insert: {
          id?: string
          quotation_id: string
          product_id?: string | null
          description?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          quotation_id?: string
          product_id?: string | null
          description?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          id: string
          organization_id: string
          contact_id: string | null
          quote_number: string
          issue_date: string
          expiry_date: string | null
          status: string
          total_amount: number
          notes: string | null
          converted_to_sale_id: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id?: string | null
          quote_number: string
          issue_date?: string
          expiry_date?: string | null
          status?: string
          total_amount?: number
          notes?: string | null
          converted_to_sale_id?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string | null
          quote_number?: string
          issue_date?: string
          expiry_date?: string | null
          status?: string
          total_amount?: number
          notes?: string | null
          converted_to_sale_id?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_converted_to_sale_id_fkey"
            columns: ["converted_to_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      return_items: {
        Row: {
          id: string
          return_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          return_id: string
          product_id?: string | null
          quantity: number
          unit_price?: number
          total_price?: number
          reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          return_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          reason?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          id: string
          organization_id: string
          return_number: string
          return_date: string
          type: string
          reference_type: string | null
          reference_id: string | null
          contact_id: string | null
          status: string
          total_amount: number
          reason: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          return_number: string
          return_date?: string
          type: string
          reference_type?: string | null
          reference_id?: string | null
          contact_id?: string | null
          status?: string
          total_amount?: number
          reason?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          return_number?: string
          return_date?: string
          type?: string
          reference_type?: string | null
          reference_id?: string | null
          contact_id?: string | null
          status?: string
          total_amount?: number
          reason?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_email_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          organization_id: string
          recipient_email: string
          report_date: string
          sent_at: string | null
          smtp_config_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          organization_id: string
          recipient_email: string
          report_date?: string
          sent_at?: string | null
          smtp_config_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string
          recipient_email?: string
          report_date?: string
          sent_at?: string | null
          smtp_config_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_email_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_email_log_smtp_config_id_fkey"
            columns: ["smtp_config_id"]
            isOneToOne: false
            referencedRelation: "smtp_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role_id?: string
        }
        Relationships: [
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
          created_at: string | null
          description: string | null
          hierarchy_level: number
          id: string
          is_system_role: boolean
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hierarchy_level?: number
          id?: string
          is_system_role?: boolean
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hierarchy_level?: number
          id?: string
          is_system_role?: boolean
          name?: string
          organization_id?: string
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
      sale_items: {
        Row: {
          commission_amount: number
          id: string
          product_id: string | null
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          commission_amount?: number
          id?: string
          product_id?: string | null
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          commission_amount?: number
          id?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          paid_amount: number | null
          payment_method: string | null
          sale_date: string
          salesperson_id: string | null
          status: string | null
          total_amount: number
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          payment_method?: string | null
          sale_date?: string
          salesperson_id?: string | null
          status?: string | null
          total_amount: number
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          payment_method?: string | null
          sale_date?: string
          salesperson_id?: string | null
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          date_from: string
          date_to: string
          id: string
          organization_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date_from: string
          date_to: string
          id?: string
          organization_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date_from?: string
          date_to?: string
          id?: string
          organization_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      smtp_configs: {
        Row: {
          created_at: string | null
          daily_count: number | null
          from_email: string
          from_name: string | null
          host: string
          id: string
          is_active: boolean | null
          last_reset_date: string | null
          password: string
          port: number
          priority: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          daily_count?: number | null
          from_email: string
          from_name?: string | null
          host?: string
          id?: string
          is_active?: boolean | null
          last_reset_date?: string | null
          password: string
          port?: number
          priority?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          daily_count?: number | null
          from_email?: string
          from_name?: string | null
          host?: string
          id?: string
          is_active?: boolean | null
          last_reset_date?: string | null
          password?: string
          port?: number
          priority?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          product_id: string
          quantity: number
          reference: string | null
          type: string
          unit_cost: number | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          product_id: string
          quantity: number
          reference?: string | null
          type: string
          unit_cost?: number | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          product_id?: string
          quantity?: number
          reference?: string | null
          type?: string
          unit_cost?: number | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      uom_conversions: {
        Row: {
          conversion_factor: number
          created_at: string | null
          from_unit: string
          id: string
          organization_id: string
          product_id: string | null
          to_unit: string
        }
        Insert: {
          conversion_factor: number
          created_at?: string | null
          from_unit: string
          id?: string
          organization_id: string
          product_id?: string | null
          to_unit: string
        }
        Update: {
          conversion_factor?: number
          created_at?: string | null
          from_unit?: string
          id?: string
          organization_id?: string
          product_id?: string | null
          to_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "uom_conversions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uom_conversions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_products: {
        Row: {
          current_stock: number | null
          id: string
          min_stock: number | null
          product_id: string
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          current_stock?: number | null
          id?: string
          min_stock?: number | null
          product_id: string
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          current_stock?: number | null
          id?: string
          min_stock?: number | null
          product_id?: string
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_products_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          location: string | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          location?: string | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          location?: string | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          id: string
          organization_id: string
          code: string
          name: string
          type: string
          parent_id: string | null
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          code: string
          name: string
          type: string
          parent_id?: string | null
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          code?: string
          name?: string
          type?: string
          parent_id?: string | null
          is_active?: boolean
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          type: string
          value: number
          applies_to: string
          min_purchase_amount: number
          valid_from: string
          valid_until: string | null
          is_active: boolean
          usage_limit: number | null
          used_count: number
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          type: string
          value: number
          applies_to?: string
          min_purchase_amount?: number
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
          usage_limit?: number | null
          used_count?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          type?: string
          value?: number
          applies_to?: string
          min_purchase_amount?: number
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
          usage_limit?: number | null
          used_count?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_conditions: {
        Row: {
          id: string
          discount_id: string
          condition_type: string
          condition_value: string
          created_at: string | null
        }
        Insert: {
          id?: string
          discount_id: string
          condition_type: string
          condition_value: string
          created_at?: string | null
        }
        Update: {
          id?: string
          discount_id?: string
          condition_type?: string
          condition_value?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_conditions_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          id: string
          organization_id: string
          entry_date: string
          entry_number: string
          reference_type: string | null
          reference_id: string | null
          description: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          entry_date?: string
          entry_number: string
          reference_type?: string | null
          reference_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          entry_date?: string
          entry_number?: string
          reference_type?: string | null
          reference_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          id: string
          journal_entry_id: string
          account_id: string
          debit_amount: number
          credit_amount: number
          created_at: string | null
        }
        Insert: {
          id?: string
          journal_entry_id: string
          account_id: string
          debit_amount?: number
          credit_amount?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          journal_entry_id?: string
          account_id?: string
          debit_amount?: number
          credit_amount?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: {
        Args: { org_name: string; org_slug: string; org_type?: string }
        Returns: Json
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_journal_entry_number: { Args: never; Returns: string }
      generate_purchase_order_number: { Args: never; Returns: string }
      generate_quote_number: { Args: never; Returns: string }
      generate_return_number: { Args: never; Returns: string }
      get_current_organization: { Args: never; Returns: string }
      get_public_product: {
        Args: { p_product_id: string; p_slug: string }
        Returns: Json
      }
      get_public_products: { Args: { p_slug: string }; Returns: Json }
      get_public_report_data: { Args: { p_token: string }; Returns: Json }
      set_role_permissions: {
        Args: { p_role_id: string; p_permissions: Database["public"]["Enums"]["app_permission"][] }
        Returns: Json
      }
      get_user_permissions: {
        Args: never
        Returns: Database["public"]["Enums"]["app_permission"][]
      }
      has_permission: {
        Args: { p_permission: Database["public"]["Enums"]["app_permission"] }
        Returns: boolean
      }
      get_trial_balance: {
        Args: { p_organization_id: string; p_as_of_date?: string }
        Returns: {
          account_id: string
          account_code: string
          account_name: string
          account_type: string
          debit_balance: number
          credit_balance: number
        }[]
      }
      increment_smtp_count: { Args: { config_id: string }; Returns: undefined }
      schedule_daily_report_cron: { Args: { app_url: string }; Returns: string }
      seed_default_chart_of_accounts: { Args: { p_organization_id: string }; Returns: undefined }
      unschedule_daily_report_cron: { Args: never; Returns: string }
      user_has_permission: {
        Args: {
          p_permission: Database["public"]["Enums"]["app_permission"]
          p_user_id: string
        }
        Returns: boolean
      }
    }
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
        | "emails.manage"
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
} as const

