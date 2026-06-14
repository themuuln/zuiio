export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
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
      expenses: {
        Row: {
          amount: number;
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
      organizations: {
        Row: {
          company_type: string;
          created_at: string | null;
          currency: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          company_type?: string;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          company_type?: string;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          barcode: string | null;
          category_id: string | null;
          cost_price: number | null;
          created_at: string | null;
          current_stock: number | null;
          id: string;
          min_stock: number | null;
          name: string;
          organization_id: string;
          sale_price: number | null;
          sku: string | null;
          unit: string | null;
        };
        Insert: {
          barcode?: string | null;
          category_id?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          current_stock?: number | null;
          id?: string;
          min_stock?: number | null;
          name: string;
          organization_id: string;
          sale_price?: number | null;
          sku?: string | null;
          unit?: string | null;
        };
        Update: {
          barcode?: string | null;
          category_id?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          current_stock?: number | null;
          id?: string;
          min_stock?: number | null;
          name?: string;
          organization_id?: string;
          sale_price?: number | null;
          sku?: string | null;
          unit?: string | null;
        };
        Relationships: [
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
          created_at: string | null;
          full_name: string | null;
          id: string;
          organization_id: string | null;
          role: string | null;
        };
        Insert: {
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          organization_id?: string | null;
          role?: string | null;
        };
        Update: {
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          organization_id?: string | null;
          role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          id: string;
          product_id: string | null;
          quantity: number;
          sale_id: string;
          total_price: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          quantity: number;
          sale_id: string;
          total_price: number;
          unit_price: number;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          quantity?: number;
          sale_id?: string;
          total_price?: number;
          unit_price?: number;
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
        ];
      };
      sales: {
        Row: {
          contact_id: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          paid_amount: number | null;
          payment_method: string | null;
          sale_date: string;
          status: string | null;
          total_amount: number;
        };
        Insert: {
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          organization_id: string;
          paid_amount?: number | null;
          payment_method?: string | null;
          sale_date?: string;
          status?: string | null;
          total_amount: number;
        };
        Update: {
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          organization_id?: string;
          paid_amount?: number | null;
          payment_method?: string | null;
          sale_date?: string;
          status?: string | null;
          total_amount?: number;
        };
        Relationships: [
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
        ];
      };
      shared_reports: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          date_from: string;
          date_to: string;
          id: string;
          organization_id: string;
          token: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          date_from: string;
          date_to: string;
          id?: string;
          organization_id: string;
          token: string;
        };
        Update: {
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
      stock_movements: {
        Row: {
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
        };
        Insert: {
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
        };
        Update: {
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
        };
        Relationships: [
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
      get_current_organization: { Args: never; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
