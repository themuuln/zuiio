export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      parts_catalog: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          default_price: number | null
          deleted_at: string | null
          description: string | null
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
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_price?: number | null
          deleted_at?: string | null
          description?: string | null
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
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_price?: number | null
          deleted_at?: string | null
          description?: string | null
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
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
      ]
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "partial",
        "overdue",
        "cancelled",
      ]
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
      ]
      permission_action: [
        "create",
        "read",
        "update",
        "delete",
        "manage",
        "write",
        "invite",
      ]
      plan_type: ["starter", "pro", "business", "enterprise"]
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
