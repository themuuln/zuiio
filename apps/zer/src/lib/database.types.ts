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
      agent_async_jobs: {
        Row: {
          attempts: number;
          channel: string;
          created_at: string;
          id: string;
          last_error: string | null;
          organization_id: string;
          payload: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          channel: string;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          organization_id: string;
          payload: Json;
          status?: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          channel?: string;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          organization_id?: string;
          payload?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_audit_log: {
        Row: {
          channel: string | null;
          channel_chat_id: string | null;
          channel_user_id: string | null;
          chat_id: number;
          created_at: string | null;
          duration_ms: number | null;
          error: string | null;
          id: string;
          organization_id: string;
          telegram_user_id: number;
          tool_args: Json | null;
          tool_name: string;
          tool_result: Json | null;
          user_id: string;
        };
        Insert: {
          channel?: string | null;
          channel_chat_id?: string | null;
          channel_user_id?: string | null;
          chat_id: number;
          created_at?: string | null;
          duration_ms?: number | null;
          error?: string | null;
          id?: string;
          organization_id: string;
          telegram_user_id: number;
          tool_args?: Json | null;
          tool_name: string;
          tool_result?: Json | null;
          user_id: string;
        };
        Update: {
          channel?: string | null;
          channel_chat_id?: string | null;
          channel_user_id?: string | null;
          chat_id?: number;
          created_at?: string | null;
          duration_ms?: number | null;
          error?: string | null;
          id?: string;
          organization_id?: string;
          telegram_user_id?: number;
          tool_args?: Json | null;
          tool_name?: string;
          tool_result?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      agent_briefing_log: {
        Row: {
          admin_chat_id: number;
          briefing_text: string;
          delivered_at: string | null;
          events_summary: Json | null;
          id: string;
          organization_id: string;
          overnight_messages: number | null;
          overnight_tool_calls: number | null;
          pending_handoffs: number | null;
        };
        Insert: {
          admin_chat_id: number;
          briefing_text: string;
          delivered_at?: string | null;
          events_summary?: Json | null;
          id?: string;
          organization_id: string;
          overnight_messages?: number | null;
          overnight_tool_calls?: number | null;
          pending_handoffs?: number | null;
        };
        Update: {
          admin_chat_id?: number;
          briefing_text?: string;
          delivered_at?: string | null;
          events_summary?: Json | null;
          id?: string;
          organization_id?: string;
          overnight_messages?: number | null;
          overnight_tool_calls?: number | null;
          pending_handoffs?: number | null;
        };
        Relationships: [];
      };
      agent_context_profiles: {
        Row: {
          assistant_name: string | null;
          audience: string;
          business_hours: Json | null;
          business_summary: string | null;
          contact_details: string | null;
          created_at: string | null;
          handoff_message: string | null;
          id: string;
          is_active: boolean | null;
          organization_id: string;
          response_language: string | null;
          response_rules: string | null;
          tone: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          assistant_name?: string | null;
          audience: string;
          business_hours?: Json | null;
          business_summary?: string | null;
          contact_details?: string | null;
          created_at?: string | null;
          handoff_message?: string | null;
          id?: string;
          is_active?: boolean | null;
          organization_id: string;
          response_language?: string | null;
          response_rules?: string | null;
          tone?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          assistant_name?: string | null;
          audience?: string;
          business_hours?: Json | null;
          business_summary?: string | null;
          contact_details?: string | null;
          created_at?: string | null;
          handoff_message?: string | null;
          id?: string;
          is_active?: boolean | null;
          organization_id?: string;
          response_language?: string | null;
          response_rules?: string | null;
          tone?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      agent_customer_memory: {
        Row: {
          confidence: number;
          created_at: string | null;
          customer_id: string;
          customer_name: string | null;
          fact: string;
          fact_type: string;
          id: string;
          is_active: boolean | null;
          organization_id: string;
          source_chat_id: number | null;
          updated_at: string | null;
        };
        Insert: {
          confidence?: number;
          created_at?: string | null;
          customer_id: string;
          customer_name?: string | null;
          fact: string;
          fact_type?: string;
          id?: string;
          is_active?: boolean | null;
          organization_id: string;
          source_chat_id?: number | null;
          updated_at?: string | null;
        };
        Update: {
          confidence?: number;
          created_at?: string | null;
          customer_id?: string;
          customer_name?: string | null;
          fact?: string;
          fact_type?: string;
          id?: string;
          is_active?: boolean | null;
          organization_id?: string;
          source_chat_id?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      agent_daily_spend: {
        Row: {
          api_calls: number;
          created_at: string | null;
          date: string;
          id: string;
          organization_id: string;
          tokens_used: number;
          updated_at: string | null;
        };
        Insert: {
          api_calls?: number;
          created_at?: string | null;
          date: string;
          id?: string;
          organization_id: string;
          tokens_used?: number;
          updated_at?: string | null;
        };
        Update: {
          api_calls?: number;
          created_at?: string | null;
          date?: string;
          id?: string;
          organization_id?: string;
          tokens_used?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      agent_handoff_config: {
        Row: {
          admin_chat_id: number | null;
          auto_handoff_after_hours: boolean | null;
          created_at: string | null;
          id: string;
          keyword_triggers: string[] | null;
          low_confidence_threshold: number | null;
          organization_id: string;
          sentiment_enabled: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          admin_chat_id?: number | null;
          auto_handoff_after_hours?: boolean | null;
          created_at?: string | null;
          id?: string;
          keyword_triggers?: string[] | null;
          low_confidence_threshold?: number | null;
          organization_id: string;
          sentiment_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          admin_chat_id?: number | null;
          auto_handoff_after_hours?: boolean | null;
          created_at?: string | null;
          id?: string;
          keyword_triggers?: string[] | null;
          low_confidence_threshold?: number | null;
          organization_id?: string;
          sentiment_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      agent_handoff_events: {
        Row: {
          admin_chat_id: number | null;
          admin_user_id: number | null;
          bot_response: string | null;
          chat_id: number;
          created_at: string | null;
          customer_query: string | null;
          escalated_by: string | null;
          id: string;
          organization_id: string;
          reason: string | null;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["handoff_status"];
          updated_at: string | null;
          user_id: number;
        };
        Insert: {
          admin_chat_id?: number | null;
          admin_user_id?: number | null;
          bot_response?: string | null;
          chat_id: number;
          created_at?: string | null;
          customer_query?: string | null;
          escalated_by?: string | null;
          id?: string;
          organization_id: string;
          reason?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["handoff_status"];
          updated_at?: string | null;
          user_id: number;
        };
        Update: {
          admin_chat_id?: number | null;
          admin_user_id?: number | null;
          bot_response?: string | null;
          chat_id?: number;
          created_at?: string | null;
          customer_query?: string | null;
          escalated_by?: string | null;
          id?: string;
          organization_id?: string;
          reason?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["handoff_status"];
          updated_at?: string | null;
          user_id?: number;
        };
        Relationships: [];
      };
      agent_knowledge_sources: {
        Row: {
          content: string;
          created_at: string | null;
          embedding: string | null;
          id: string;
          is_active: boolean | null;
          organization_id: string;
          source_type: string;
          title: string | null;
          updated_at: string | null;
          url: string | null;
          visibility: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          is_active?: boolean | null;
          organization_id: string;
          source_type: string;
          title?: string | null;
          updated_at?: string | null;
          url?: string | null;
          visibility?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          is_active?: boolean | null;
          organization_id?: string;
          source_type?: string;
          title?: string | null;
          updated_at?: string | null;
          url?: string | null;
          visibility?: string | null;
        };
        Relationships: [];
      };
      agent_notification_triggers: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          last_fired_at: string | null;
          message_template: string | null;
          organization_id: string;
          trigger_config: Json;
          trigger_type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_fired_at?: string | null;
          message_template?: string | null;
          organization_id: string;
          trigger_config?: Json;
          trigger_type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_fired_at?: string | null;
          message_template?: string | null;
          organization_id?: string;
          trigger_config?: Json;
          trigger_type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      agent_sessions: {
        Row: {
          channel: string | null;
          channel_chat_id: string | null;
          channel_user_id: string | null;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          messages: Json;
          organization_id: string;
          telegram_chat_id: number;
          telegram_user_id: number;
          token_count: number;
          updated_at: string | null;
        };
        Insert: {
          channel?: string | null;
          channel_chat_id?: string | null;
          channel_user_id?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          messages?: Json;
          organization_id: string;
          telegram_chat_id: number;
          telegram_user_id: number;
          token_count?: number;
          updated_at?: string | null;
        };
        Update: {
          channel?: string | null;
          channel_chat_id?: string | null;
          channel_user_id?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          messages?: Json;
          organization_id?: string;
          telegram_chat_id?: number;
          telegram_user_id?: number;
          token_count?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      agent_webchat_widgets: {
        Row: {
          created_at: string;
          display_name: string | null;
          greeting: string | null;
          id: string;
          is_active: boolean;
          organization_id: string;
          product_type: string;
          widget_key: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          greeting?: string | null;
          id?: string;
          is_active?: boolean;
          organization_id: string;
          product_type: string;
          widget_key?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          greeting?: string | null;
          id?: string;
          is_active?: boolean;
          organization_id?: string;
          product_type?: string;
          widget_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_webchat_widgets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
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
      attendance_records: {
        Row: {
          break_minutes: number;
          clock_in: string | null;
          clock_out: string | null;
          created_at: string | null;
          date: string;
          employee_id: string;
          id: string;
          status: string;
        };
        Insert: {
          break_minutes?: number;
          clock_in?: string | null;
          clock_out?: string | null;
          created_at?: string | null;
          date: string;
          employee_id: string;
          id?: string;
          status?: string;
        };
        Update: {
          break_minutes?: number;
          clock_in?: string | null;
          clock_out?: string | null;
          created_at?: string | null;
          date?: string;
          employee_id?: string;
          id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
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
      bank_accounts: {
        Row: {
          account_number: string | null;
          account_type: string;
          bank_name: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean;
          is_default: boolean;
          name: string;
          organization_id: string;
        };
        Insert: {
          account_number?: string | null;
          account_type?: string;
          bank_name?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          name: string;
          organization_id: string;
        };
        Update: {
          account_number?: string | null;
          account_type?: string;
          bank_name?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          name?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bank_accounts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_posts: {
        Row: {
          content: string;
          cover_image_url: string | null;
          created_at: string | null;
          created_by: string | null;
          excerpt: string | null;
          id: string;
          is_published: boolean;
          organization_id: string;
          published_at: string | null;
          slug: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          cover_image_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          excerpt?: string | null;
          id?: string;
          is_published?: boolean;
          organization_id: string;
          published_at?: string | null;
          slug: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          cover_image_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          excerpt?: string | null;
          id?: string;
          is_published?: boolean;
          organization_id?: string;
          published_at?: string | null;
          slug?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "blog_posts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_posts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      bom_items: {
        Row: {
          bom_id: string;
          created_at: string;
          deleted_at: string | null;
          estimated_unit_cost: number | null;
          id: string;
          material_product_id: string;
          notes: string | null;
          organization_id: string;
          quantity: number;
          required_length_mm: number | null;
          required_thickness_mm: number | null;
          required_width_mm: number | null;
          sort_order: number;
          unit: string;
          updated_at: string;
        };
        Insert: {
          bom_id: string;
          created_at?: string;
          deleted_at?: string | null;
          estimated_unit_cost?: number | null;
          id?: string;
          material_product_id: string;
          notes?: string | null;
          organization_id: string;
          quantity: number;
          required_length_mm?: number | null;
          required_thickness_mm?: number | null;
          required_width_mm?: number | null;
          sort_order?: number;
          unit: string;
          updated_at?: string;
        };
        Update: {
          bom_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          estimated_unit_cost?: number | null;
          id?: string;
          material_product_id?: string;
          notes?: string | null;
          organization_id?: string;
          quantity?: number;
          required_length_mm?: number | null;
          required_thickness_mm?: number | null;
          required_width_mm?: number | null;
          sort_order?: number;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bom_items_bom_id_fkey";
            columns: ["bom_id"];
            isOneToOne: false;
            referencedRelation: "product_boms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bom_items_material_product_id_fkey";
            columns: ["material_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bom_items_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      bot_buyer_sessions: {
        Row: {
          channel: string;
          created_at: string;
          external_id: string;
          id: string;
          last_active_at: string;
          organization_id: string;
        };
        Insert: {
          channel: string;
          created_at?: string;
          external_id: string;
          id?: string;
          last_active_at?: string;
          organization_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          external_id?: string;
          id?: string;
          last_active_at?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bot_buyer_sessions_organization_id_fkey";
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
      budgets: {
        Row: {
          alert_threshold: number;
          amount: number;
          category: string | null;
          created_at: string;
          end_date: string;
          id: string;
          name: string;
          organization_id: string;
          period: string;
          spent: number;
          start_date: string;
        };
        Insert: {
          alert_threshold?: number;
          amount: number;
          category?: string | null;
          created_at?: string;
          end_date: string;
          id?: string;
          name: string;
          organization_id: string;
          period?: string;
          spent?: number;
          start_date: string;
        };
        Update: {
          alert_threshold?: number;
          amount?: number;
          category?: string | null;
          created_at?: string;
          end_date?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          period?: string;
          spent?: number;
          start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_organization_id_fkey";
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
      cash_registers: {
        Row: {
          branch_id: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cash_registers_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_registers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      cash_sessions: {
        Row: {
          actual_amount: number | null;
          branch_id: string | null;
          closed_at: string | null;
          closing_balance: number | null;
          created_at: string | null;
          difference: number | null;
          expected_amount: number | null;
          id: string;
          notes: string | null;
          opened_at: string;
          opened_by: string | null;
          opening_balance: number;
          organization_id: string;
          register_id: string;
          status: string;
        };
        Insert: {
          actual_amount?: number | null;
          branch_id?: string | null;
          closed_at?: string | null;
          closing_balance?: number | null;
          created_at?: string | null;
          difference?: number | null;
          expected_amount?: number | null;
          id?: string;
          notes?: string | null;
          opened_at?: string;
          opened_by?: string | null;
          opening_balance?: number;
          organization_id: string;
          register_id: string;
          status?: string;
        };
        Update: {
          actual_amount?: number | null;
          branch_id?: string | null;
          closed_at?: string | null;
          closing_balance?: number | null;
          created_at?: string | null;
          difference?: number | null;
          expected_amount?: number | null;
          id?: string;
          notes?: string | null;
          opened_at?: string;
          opened_by?: string | null;
          opening_balance?: number;
          organization_id?: string;
          register_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cash_sessions_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_sessions_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_sessions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_sessions_register_id_fkey";
            columns: ["register_id"];
            isOneToOne: false;
            referencedRelation: "cash_registers";
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
          slug: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          slug: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          slug?: string;
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
      channel_connections: {
        Row: {
          audience: string;
          bot_key: string | null;
          channel: string;
          channel_chat_id: string;
          channel_user_id: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          last_user_message_at: string | null;
          metadata: Json | null;
          organization_id: string;
          page_access_token: string | null;
          page_id: string | null;
          page_name: string | null;
          product_type: string;
          token_encrypted: boolean | null;
          token_expires_at: string | null;
          updated_at: string | null;
          user_id: string | null;
          webhook_subscribed_at: string | null;
        };
        Insert: {
          audience?: string;
          bot_key?: string | null;
          channel: string;
          channel_chat_id: string;
          channel_user_id: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_user_message_at?: string | null;
          metadata?: Json | null;
          organization_id: string;
          page_access_token?: string | null;
          page_id?: string | null;
          page_name?: string | null;
          product_type: string;
          token_encrypted?: boolean | null;
          token_expires_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          webhook_subscribed_at?: string | null;
        };
        Update: {
          audience?: string;
          bot_key?: string | null;
          channel?: string;
          channel_chat_id?: string;
          channel_user_id?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_user_message_at?: string | null;
          metadata?: Json | null;
          organization_id?: string;
          page_access_token?: string | null;
          page_id?: string | null;
          page_name?: string | null;
          product_type?: string;
          token_encrypted?: boolean | null;
          token_expires_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          webhook_subscribed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "channel_connections_organization_id_fkey";
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
          {
            foreignKeyName: "commission_payout_items_sale_item_id_fkey";
            columns: ["sale_item_id"];
            isOneToOne: true;
            referencedRelation: "sale_items_v";
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
          points_balance: number | null;
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
          points_balance?: number | null;
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
          points_balance?: number | null;
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
      conversation_runs: {
        Row: {
          assignments: Json | null;
          channel: string;
          channel_chat_id: string;
          channel_meta: Json | null;
          channel_user_id: string;
          current_node_id: string;
          expires_at: string | null;
          fields: Json | null;
          flow_version_id: string;
          id: string;
          organization_id: string;
          started_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          assignments?: Json | null;
          channel: string;
          channel_chat_id: string;
          channel_meta?: Json | null;
          channel_user_id: string;
          current_node_id: string;
          expires_at?: string | null;
          fields?: Json | null;
          flow_version_id: string;
          id?: string;
          organization_id: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          assignments?: Json | null;
          channel?: string;
          channel_chat_id?: string;
          channel_meta?: Json | null;
          channel_user_id?: string;
          current_node_id?: string;
          expires_at?: string | null;
          fields?: Json | null;
          flow_version_id?: string;
          id?: string;
          organization_id?: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_runs_flow_version_id_fkey";
            columns: ["flow_version_id"];
            isOneToOne: false;
            referencedRelation: "flow_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_runs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      coupon_category_scope: {
        Row: {
          category_id: string;
          coupon_id: string;
          created_at: string | null;
          id: string;
          organization_id: string;
        };
        Insert: {
          category_id: string;
          coupon_id: string;
          created_at?: string | null;
          id?: string;
          organization_id: string;
        };
        Update: {
          category_id?: string;
          coupon_id?: string;
          created_at?: string | null;
          id?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupon_category_scope_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupon_category_scope_coupon_id_fkey";
            columns: ["coupon_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupon_category_scope_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      coupon_product_scope: {
        Row: {
          coupon_id: string;
          created_at: string | null;
          id: string;
          organization_id: string;
          product_id: string;
        };
        Insert: {
          coupon_id: string;
          created_at?: string | null;
          id?: string;
          organization_id: string;
          product_id: string;
        };
        Update: {
          coupon_id?: string;
          created_at?: string | null;
          id?: string;
          organization_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupon_product_scope_coupon_id_fkey";
            columns: ["coupon_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupon_product_scope_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupon_product_scope_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      coupon_usage: {
        Row: {
          contact_id: string | null;
          coupon_id: string;
          id: string;
          organization_id: string;
          sale_id: string | null;
          used_at: string | null;
        };
        Insert: {
          contact_id?: string | null;
          coupon_id: string;
          id?: string;
          organization_id: string;
          sale_id?: string | null;
          used_at?: string | null;
        };
        Update: {
          contact_id?: string | null;
          coupon_id?: string;
          id?: string;
          organization_id?: string;
          sale_id?: string | null;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "coupon_usage_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey";
            columns: ["coupon_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupon_usage_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupon_usage_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          applies_to: string;
          code: string;
          created_at: string | null;
          description: string | null;
          discount_type: string;
          discount_value: number;
          id: string;
          is_active: boolean;
          max_discount_amount: number | null;
          min_purchase_amount: number;
          organization_id: string;
          per_customer_limit: number | null;
          usage_limit: number | null;
          used_count: number;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          applies_to?: string;
          code: string;
          created_at?: string | null;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          id?: string;
          is_active?: boolean;
          max_discount_amount?: number | null;
          min_purchase_amount?: number;
          organization_id: string;
          per_customer_limit?: number | null;
          usage_limit?: number | null;
          used_count?: number;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          applies_to?: string;
          code?: string;
          created_at?: string | null;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          id?: string;
          is_active?: boolean;
          max_discount_amount?: number | null;
          min_purchase_amount?: number;
          organization_id?: string;
          per_customer_limit?: number | null;
          usage_limit?: number | null;
          used_count?: number;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "coupons_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      currencies: {
        Row: {
          code: string;
          created_at: string;
          exchange_rate: number;
          id: string;
          is_default: boolean;
          last_updated: string | null;
          name: string;
          organization_id: string;
          symbol: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          exchange_rate?: number;
          id?: string;
          is_default?: boolean;
          last_updated?: string | null;
          name: string;
          organization_id: string;
          symbol: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          exchange_rate?: number;
          id?: string;
          is_default?: boolean;
          last_updated?: string | null;
          name?: string;
          organization_id?: string;
          symbol?: string;
        };
        Relationships: [
          {
            foreignKeyName: "currencies_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      custom_bots: {
        Row: {
          bot_token_hash: string;
          bot_username: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          organization_id: string;
          product_type: string;
          updated_at: string | null;
          webhook_set_at: string | null;
        };
        Insert: {
          bot_token_hash: string;
          bot_username: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          organization_id: string;
          product_type: string;
          updated_at?: string | null;
          webhook_set_at?: string | null;
        };
        Update: {
          bot_token_hash?: string;
          bot_username?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          organization_id?: string;
          product_type?: string;
          updated_at?: string | null;
          webhook_set_at?: string | null;
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
      deliveries: {
        Row: {
          address: string | null;
          address_note: string | null;
          assigned_to: string | null;
          branch_id: string;
          contact_name: string;
          contact_phone: string;
          courier_notes: string | null;
          created_at: string | null;
          delivered_at: string | null;
          delivery_fee: number;
          estimated_at: string | null;
          external_tracking_id: string | null;
          external_tracking_url: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          picked_up_at: string | null;
          provider_data: Json | null;
          provider_id: string | null;
          requested_at: string | null;
          sale_id: string;
          status: string;
          updated_at: string | null;
          zone_id: string | null;
        };
        Insert: {
          address?: string | null;
          address_note?: string | null;
          assigned_to?: string | null;
          branch_id: string;
          contact_name: string;
          contact_phone: string;
          courier_notes?: string | null;
          created_at?: string | null;
          delivered_at?: string | null;
          delivery_fee?: number;
          estimated_at?: string | null;
          external_tracking_id?: string | null;
          external_tracking_url?: string | null;
          id?: string;
          notes?: string | null;
          organization_id: string;
          picked_up_at?: string | null;
          provider_data?: Json | null;
          provider_id?: string | null;
          requested_at?: string | null;
          sale_id: string;
          status?: string;
          updated_at?: string | null;
          zone_id?: string | null;
        };
        Update: {
          address?: string | null;
          address_note?: string | null;
          assigned_to?: string | null;
          branch_id?: string;
          contact_name?: string;
          contact_phone?: string;
          courier_notes?: string | null;
          created_at?: string | null;
          delivered_at?: string | null;
          delivery_fee?: number;
          estimated_at?: string | null;
          external_tracking_id?: string | null;
          external_tracking_url?: string | null;
          id?: string;
          notes?: string | null;
          organization_id?: string;
          picked_up_at?: string | null;
          provider_data?: Json | null;
          provider_id?: string | null;
          requested_at?: string | null;
          sale_id?: string;
          status?: string;
          updated_at?: string | null;
          zone_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deliveries_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliveries_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliveries_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliveries_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "delivery_providers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliveries_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliveries_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_providers: {
        Row: {
          api_key: string | null;
          api_secret: string | null;
          config: Json | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string;
          provider_type: string;
          updated_at: string | null;
        };
        Insert: {
          api_key?: string | null;
          api_secret?: string | null;
          config?: Json | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id: string;
          provider_type?: string;
          updated_at?: string | null;
        };
        Update: {
          api_key?: string | null;
          api_secret?: string | null;
          config?: Json | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string;
          provider_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_providers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string | null;
          delivery_id: string;
          id: string;
          notes: string | null;
          status: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string | null;
          delivery_id: string;
          id?: string;
          notes?: string | null;
          status: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string | null;
          delivery_id?: string;
          id?: string;
          notes?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_status_history_delivery_id_fkey";
            columns: ["delivery_id"];
            isOneToOne: false;
            referencedRelation: "deliveries";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_webhooks: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          last_called_at: string | null;
          organization_id: string;
          provider_id: string | null;
          secret_token: string | null;
          webhook_path: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_called_at?: string | null;
          organization_id: string;
          provider_id?: string | null;
          secret_token?: string | null;
          webhook_path: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_called_at?: string | null;
          organization_id?: string;
          provider_id?: string | null;
          secret_token?: string | null;
          webhook_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_webhooks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_webhooks_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "delivery_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_zones: {
        Row: {
          base_fee: number;
          created_at: string | null;
          description: string | null;
          estimated_delivery_minutes: number | null;
          free_delivery_threshold: number | null;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          base_fee?: number;
          created_at?: string | null;
          description?: string | null;
          estimated_delivery_minutes?: number | null;
          free_delivery_threshold?: number | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          base_fee?: number;
          created_at?: string | null;
          description?: string | null;
          estimated_delivery_minutes?: number | null;
          free_delivery_threshold?: number | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_zones_organization_id_fkey";
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
      embed_tokens: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          expires_at: string;
          id: string;
          label: string;
          organization_id: string;
          revoked_at: string | null;
          scopes: string[];
          token_hash: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          expires_at: string;
          id?: string;
          label: string;
          organization_id: string;
          revoked_at?: string | null;
          scopes?: string[];
          token_hash: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          label?: string;
          organization_id?: string;
          revoked_at?: string | null;
          scopes?: string[];
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "embed_tokens_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          bank_account: string | null;
          base_salary: number;
          branch_id: string | null;
          contract_type: string;
          created_at: string | null;
          department: string | null;
          full_name: string;
          hire_date: string;
          id: string;
          is_active: boolean;
          organization_id: string;
          position: string | null;
          profile_id: string | null;
          salary_type: string;
        };
        Insert: {
          bank_account?: string | null;
          base_salary: number;
          branch_id?: string | null;
          contract_type?: string;
          created_at?: string | null;
          department?: string | null;
          full_name: string;
          hire_date: string;
          id?: string;
          is_active?: boolean;
          organization_id: string;
          position?: string | null;
          profile_id?: string | null;
          salary_type?: string;
        };
        Update: {
          bank_account?: string | null;
          base_salary?: number;
          branch_id?: string | null;
          contract_type?: string;
          created_at?: string | null;
          department?: string | null;
          full_name?: string;
          hire_date?: string;
          id?: string;
          is_active?: boolean;
          organization_id?: string;
          position?: string | null;
          profile_id?: string | null;
          salary_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
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
        ];
      };
      expenses: {
        Row: {
          amount: number;
          bank_account_id: string | null;
          branch_id: string;
          category: string;
          created_at: string | null;
          created_by: string | null;
          currency_id: string | null;
          deleted_at: string | null;
          description: string | null;
          exchange_rate: number | null;
          expense_date: string;
          id: string;
          organization_id: string;
          original_amount: number | null;
          payment_method: string | null;
        };
        Insert: {
          amount: number;
          bank_account_id?: string | null;
          branch_id: string;
          category: string;
          created_at?: string | null;
          created_by?: string | null;
          currency_id?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          exchange_rate?: number | null;
          expense_date?: string;
          id?: string;
          organization_id: string;
          original_amount?: number | null;
          payment_method?: string | null;
        };
        Update: {
          amount?: number;
          bank_account_id?: string | null;
          branch_id?: string;
          category?: string;
          created_at?: string | null;
          created_by?: string | null;
          currency_id?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          exchange_rate?: number | null;
          expense_date?: string;
          id?: string;
          organization_id?: string;
          original_amount?: number | null;
          payment_method?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_bank_account_id_fkey";
            columns: ["bank_account_id"];
            isOneToOne: false;
            referencedRelation: "bank_accounts";
            referencedColumns: ["id"];
          },
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
            foreignKeyName: "expenses_currency_id_fkey";
            columns: ["currency_id"];
            isOneToOne: false;
            referencedRelation: "currencies";
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
      fiscal_periods: {
        Row: {
          closed_at: string | null;
          closed_by: string | null;
          created_at: string | null;
          end_date: string;
          id: string;
          is_closed: boolean | null;
          organization_id: string;
          period_name: string;
          start_date: string;
        };
        Insert: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string | null;
          end_date: string;
          id?: string;
          is_closed?: boolean | null;
          organization_id: string;
          period_name: string;
          start_date: string;
        };
        Update: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string | null;
          end_date?: string;
          id?: string;
          is_closed?: boolean | null;
          organization_id?: string;
          period_name?: string;
          start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fiscal_periods_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fiscal_periods_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      flow_outbox: {
        Row: {
          channel: string;
          channel_chat_id: string;
          created_at: string;
          error: string | null;
          id: string;
          max_retries: number | null;
          payload: Json;
          retry_count: number | null;
          run_id: string;
          sent_at: string | null;
          status: string;
        };
        Insert: {
          channel: string;
          channel_chat_id: string;
          created_at?: string;
          error?: string | null;
          id?: string;
          max_retries?: number | null;
          payload: Json;
          retry_count?: number | null;
          run_id: string;
          sent_at?: string | null;
          status?: string;
        };
        Update: {
          channel?: string;
          channel_chat_id?: string;
          created_at?: string;
          error?: string | null;
          id?: string;
          max_retries?: number | null;
          payload?: Json;
          retry_count?: number | null;
          run_id?: string;
          sent_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flow_outbox_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "conversation_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      flow_versions: {
        Row: {
          channel: string | null;
          created_at: string | null;
          edges: Json;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          nodes: Json;
          organization_id: string;
          product_type: string;
          trigger_keywords: Json | null;
          updated_at: string | null;
          version: number;
        };
        Insert: {
          channel?: string | null;
          created_at?: string | null;
          edges?: Json;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          nodes?: Json;
          organization_id: string;
          product_type: string;
          trigger_keywords?: Json | null;
          updated_at?: string | null;
          version?: number;
        };
        Update: {
          channel?: string | null;
          created_at?: string | null;
          edges?: Json;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          nodes?: Json;
          organization_id?: string;
          product_type?: string;
          trigger_keywords?: Json | null;
          updated_at?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "flow_versions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      flow_wait_states: {
        Row: {
          callback_pattern: string | null;
          created_at: string;
          expected_input: string | null;
          id: string;
          run_id: string;
          scheduled_at: string | null;
          wait_type: string;
        };
        Insert: {
          callback_pattern?: string | null;
          created_at?: string;
          expected_input?: string | null;
          id?: string;
          run_id: string;
          scheduled_at?: string | null;
          wait_type: string;
        };
        Update: {
          callback_pattern?: string | null;
          created_at?: string;
          expected_input?: string | null;
          id?: string;
          run_id?: string;
          scheduled_at?: string | null;
          wait_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flow_wait_states_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "conversation_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      gift_card_transactions: {
        Row: {
          amount: number;
          balance_after: number;
          balance_before: number;
          created_at: string | null;
          created_by: string | null;
          gift_card_id: string;
          id: string;
          note: string | null;
          organization_id: string;
          reference_id: string | null;
          reference_type: string | null;
          transaction_type: string;
        };
        Insert: {
          amount: number;
          balance_after: number;
          balance_before: number;
          created_at?: string | null;
          created_by?: string | null;
          gift_card_id: string;
          id?: string;
          note?: string | null;
          organization_id: string;
          reference_id?: string | null;
          reference_type?: string | null;
          transaction_type: string;
        };
        Update: {
          amount?: number;
          balance_after?: number;
          balance_before?: number;
          created_at?: string | null;
          created_by?: string | null;
          gift_card_id?: string;
          id?: string;
          note?: string | null;
          organization_id?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          transaction_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey";
            columns: ["gift_card_id"];
            isOneToOne: false;
            referencedRelation: "gift_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gift_card_transactions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      gift_cards: {
        Row: {
          code: string;
          created_at: string | null;
          created_by: string | null;
          currency_code: string;
          current_balance: number;
          expires_at: string | null;
          id: string;
          initial_balance: number;
          is_active: boolean;
          issued_at: string | null;
          message: string | null;
          organization_id: string;
          recipient_email: string | null;
          recipient_name: string | null;
          sender_name: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          created_by?: string | null;
          currency_code?: string;
          current_balance: number;
          expires_at?: string | null;
          id?: string;
          initial_balance: number;
          is_active?: boolean;
          issued_at?: string | null;
          message?: string | null;
          organization_id: string;
          recipient_email?: string | null;
          recipient_name?: string | null;
          sender_name?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          created_by?: string | null;
          currency_code?: string;
          current_balance?: number;
          expires_at?: string | null;
          id?: string;
          initial_balance?: number;
          is_active?: boolean;
          issued_at?: string | null;
          message?: string | null;
          organization_id?: string;
          recipient_email?: string | null;
          recipient_name?: string | null;
          sender_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gift_cards_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gift_cards_organization_id_fkey";
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
      invoice_items: {
        Row: {
          deleted_at: string | null;
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
          deleted_at?: string | null;
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
          deleted_at?: string | null;
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
          branch_snapshot: Json | null;
          buyer_snapshot: Json | null;
          cashier_name: string | null;
          contact_id: string | null;
          created_at: string | null;
          created_by: string | null;
          deleted_at: string | null;
          due_date: string | null;
          ebarimt_id: string | null;
          expires_at: string | null;
          id: string;
          invoice_number: string;
          is_receipt: boolean | null;
          issue_date: string;
          lines_snapshot: Json | null;
          notes: string | null;
          organization_id: string;
          paid_amount: number | null;
          payment_splits: Json | null;
          receipt_expires_at: string | null;
          receipt_number: string | null;
          receipt_revoked_at: string | null;
          receipt_token_hash: string | null;
          revoked_at: string | null;
          rotated_at: string | null;
          sale_id: string | null;
          seller_snapshot: Json | null;
          status: string | null;
          token: string | null;
          token_hash: string | null;
          total_amount: number | null;
          totals_snapshot: Json | null;
        };
        Insert: {
          branch_id: string;
          branch_snapshot?: Json | null;
          buyer_snapshot?: Json | null;
          cashier_name?: string | null;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          due_date?: string | null;
          ebarimt_id?: string | null;
          expires_at?: string | null;
          id?: string;
          invoice_number: string;
          is_receipt?: boolean | null;
          issue_date?: string;
          lines_snapshot?: Json | null;
          notes?: string | null;
          organization_id: string;
          paid_amount?: number | null;
          payment_splits?: Json | null;
          receipt_expires_at?: string | null;
          receipt_number?: string | null;
          receipt_revoked_at?: string | null;
          receipt_token_hash?: string | null;
          revoked_at?: string | null;
          rotated_at?: string | null;
          sale_id?: string | null;
          seller_snapshot?: Json | null;
          status?: string | null;
          token?: string | null;
          token_hash?: string | null;
          total_amount?: number | null;
          totals_snapshot?: Json | null;
        };
        Update: {
          branch_id?: string;
          branch_snapshot?: Json | null;
          buyer_snapshot?: Json | null;
          cashier_name?: string | null;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          due_date?: string | null;
          ebarimt_id?: string | null;
          expires_at?: string | null;
          id?: string;
          invoice_number?: string;
          is_receipt?: boolean | null;
          issue_date?: string;
          lines_snapshot?: Json | null;
          notes?: string | null;
          organization_id?: string;
          paid_amount?: number | null;
          payment_splits?: Json | null;
          receipt_expires_at?: string | null;
          receipt_number?: string | null;
          receipt_revoked_at?: string | null;
          receipt_token_hash?: string | null;
          revoked_at?: string | null;
          rotated_at?: string | null;
          sale_id?: string | null;
          seller_snapshot?: Json | null;
          status?: string | null;
          token?: string | null;
          token_hash?: string | null;
          total_amount?: number | null;
          totals_snapshot?: Json | null;
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
          deleted_at: string | null;
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
          deleted_at?: string | null;
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
          deleted_at?: string | null;
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
          deleted_at: string | null;
          id: string;
          journal_entry_id: string;
        };
        Insert: {
          account_id: string;
          created_at?: string | null;
          credit_amount?: number;
          debit_amount?: number;
          deleted_at?: string | null;
          id?: string;
          journal_entry_id: string;
        };
        Update: {
          account_id?: string;
          created_at?: string | null;
          credit_amount?: number;
          debit_amount?: number;
          deleted_at?: string | null;
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
      leave_requests: {
        Row: {
          approved_by: string | null;
          created_at: string | null;
          employee_id: string;
          end_date: string;
          id: string;
          leave_type: string;
          organization_id: string;
          reason: string | null;
          start_date: string;
          status: string;
        };
        Insert: {
          approved_by?: string | null;
          created_at?: string | null;
          employee_id: string;
          end_date: string;
          id?: string;
          leave_type: string;
          organization_id: string;
          reason?: string | null;
          start_date: string;
          status?: string;
        };
        Update: {
          approved_by?: string | null;
          created_at?: string | null;
          employee_id?: string;
          end_date?: string;
          id?: string;
          leave_type?: string;
          organization_id?: string;
          reason?: string | null;
          start_date?: string;
          status?: string;
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
      loyalty_points: {
        Row: {
          created_at: string;
          customer_id: string;
          expires_at: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          points: number;
          reference_id: string | null;
          type: string;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          expires_at?: string | null;
          id?: string;
          notes?: string | null;
          organization_id: string;
          points: number;
          reference_id?: string | null;
          type: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          expires_at?: string | null;
          id?: string;
          notes?: string | null;
          organization_id?: string;
          points?: number;
          reference_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_points_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loyalty_points_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      loyalty_rewards: {
        Row: {
          created_at: string;
          description: string | null;
          discount_type: string | null;
          discount_value: number | null;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          points_cost: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          discount_type?: string | null;
          discount_value?: number | null;
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
          points_cost: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          discount_type?: string | null;
          discount_value?: number | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          points_cost?: number;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      loyalty_settings: {
        Row: {
          created_at: string;
          id: string;
          is_enabled: boolean;
          min_purchase: number;
          organization_id: string;
          points_per_mnt: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          min_purchase?: number;
          organization_id: string;
          points_per_mnt?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          min_purchase?: number;
          organization_id?: string;
          points_per_mnt?: number;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      message_log: {
        Row: {
          channel_id: string | null;
          created_at: string;
          error: string | null;
          id: string;
          organization_id: string;
          recipient: string;
          sent_at: string | null;
          status: string;
          template_id: string | null;
        };
        Insert: {
          channel_id?: string | null;
          created_at?: string;
          error?: string | null;
          id?: string;
          organization_id: string;
          recipient: string;
          sent_at?: string | null;
          status?: string;
          template_id?: string | null;
        };
        Update: {
          channel_id?: string | null;
          created_at?: string;
          error?: string | null;
          id?: string;
          organization_id?: string;
          recipient?: string;
          sent_at?: string | null;
          status?: string;
          template_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "message_log_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "notification_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_log_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_log_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "message_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      message_templates: {
        Row: {
          body: string;
          channel_id: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          subject: string | null;
        };
        Insert: {
          body: string;
          channel_id: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
          subject?: string | null;
        };
        Update: {
          body?: string;
          channel_id?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          subject?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "message_templates_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "notification_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_templates_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      messenger_agent_links: {
        Row: {
          created_at: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean | null;
          last_active_at: string | null;
          last_name: string | null;
          organization_id: string;
          page_id: string;
          psid: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          first_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_active_at?: string | null;
          last_name?: string | null;
          organization_id: string;
          page_id: string;
          psid: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          first_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_active_at?: string | null;
          last_name?: string | null;
          organization_id?: string;
          page_id?: string;
          psid?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messenger_agent_links_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messenger_agent_links_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_channels: {
        Row: {
          config: Json | null;
          created_at: string;
          id: string;
          is_enabled: boolean;
          organization_id: string;
          type: string;
        };
        Insert: {
          config?: Json | null;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          organization_id: string;
          type: string;
        };
        Update: {
          config?: Json | null;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          organization_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_channels_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
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
      one_time_tokens: {
        Row: {
          created_at: string | null;
          expires_at: string;
          id: string;
          organization_id: string;
          product_type: string;
          token_hash: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at: string;
          id?: string;
          organization_id: string;
          product_type: string;
          token_hash: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          organization_id?: string;
          product_type?: string;
          token_hash?: string;
          used_at?: string | null;
          user_id?: string;
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
      organization_public_profiles: {
        Row: {
          address: string | null;
          banner_url: string | null;
          business_hours: Json | null;
          catalog_enabled: boolean;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string | null;
          custom_domain: string | null;
          delivery_enabled: boolean;
          delivery_fee_amount: number;
          description: string | null;
          display_name: string | null;
          domain_verified: boolean;
          estimated_delivery_hours: number | null;
          free_delivery_threshold: number;
          ga_measurement_id: string | null;
          id: string;
          logo_url: string | null;
          meta_description: string | null;
          meta_pixel_id: string | null;
          meta_title: string | null;
          og_image_url: string | null;
          organization_id: string;
          payment_account_name: string | null;
          payment_bank_account: string | null;
          payment_bank_name: string | null;
          pickup_enabled: boolean;
          policies: string | null;
          qpay_qr_url: string | null;
          show_stock: boolean;
          social_links: Json | null;
          updated_at: string | null;
          website_url: string | null;
        };
        Insert: {
          address?: string | null;
          banner_url?: string | null;
          business_hours?: Json | null;
          catalog_enabled?: boolean;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          custom_domain?: string | null;
          delivery_enabled?: boolean;
          delivery_fee_amount?: number;
          description?: string | null;
          display_name?: string | null;
          domain_verified?: boolean;
          estimated_delivery_hours?: number | null;
          free_delivery_threshold?: number;
          ga_measurement_id?: string | null;
          id?: string;
          logo_url?: string | null;
          meta_description?: string | null;
          meta_pixel_id?: string | null;
          meta_title?: string | null;
          og_image_url?: string | null;
          organization_id: string;
          payment_account_name?: string | null;
          payment_bank_account?: string | null;
          payment_bank_name?: string | null;
          pickup_enabled?: boolean;
          policies?: string | null;
          qpay_qr_url?: string | null;
          show_stock?: boolean;
          social_links?: Json | null;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          address?: string | null;
          banner_url?: string | null;
          business_hours?: Json | null;
          catalog_enabled?: boolean;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          custom_domain?: string | null;
          delivery_enabled?: boolean;
          delivery_fee_amount?: number;
          description?: string | null;
          display_name?: string | null;
          domain_verified?: boolean;
          estimated_delivery_hours?: number | null;
          free_delivery_threshold?: number;
          ga_measurement_id?: string | null;
          id?: string;
          logo_url?: string | null;
          meta_description?: string | null;
          meta_pixel_id?: string | null;
          meta_title?: string | null;
          og_image_url?: string | null;
          organization_id?: string;
          payment_account_name?: string | null;
          payment_bank_account?: string | null;
          payment_bank_name?: string | null;
          pickup_enabled?: boolean;
          policies?: string | null;
          qpay_qr_url?: string | null;
          show_stock?: boolean;
          social_links?: Json | null;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organization_public_profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
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
          dashboard_template: string;
          enabled_features: string[] | null;
          has_audit_log: boolean | null;
          has_brands: boolean | null;
          has_buddhist_presets: boolean | null;
          has_categories: boolean | null;
          has_checkout_customer: boolean | null;
          has_checkout_quick_amounts: boolean | null;
          has_coupons: boolean | null;
          has_customer_credit: boolean | null;
          has_delivery_tracking: boolean | null;
          has_email_reports: boolean | null;
          has_gift_cards: boolean | null;
          has_inventory: boolean | null;
          has_multi_branch: boolean | null;
          has_promotions: boolean | null;
          has_receipt_drawer: boolean | null;
          has_receipt_printer: boolean;
          has_suppliers: boolean | null;
          has_track_stock: boolean | null;
          has_uom: boolean | null;
          has_variants: boolean | null;
          id: string;
          invoice_number_prefix: string | null;
          je_number_prefix: string;
          name: string;
          onboarding_completed: boolean | null;
          po_number_prefix: string | null;
          quote_number_prefix: string | null;
          report_email_enabled: boolean;
          report_email_recipient: string | null;
          report_email_time: string | null;
          return_number_prefix: string | null;
          shop_default_payment_method: string;
          slug: string;
        };
        Insert: {
          brand_config?: Json | null;
          company_type?: string;
          created_at?: string | null;
          currency?: string | null;
          dashboard_template?: string;
          enabled_features?: string[] | null;
          has_audit_log?: boolean | null;
          has_brands?: boolean | null;
          has_buddhist_presets?: boolean | null;
          has_categories?: boolean | null;
          has_checkout_customer?: boolean | null;
          has_checkout_quick_amounts?: boolean | null;
          has_coupons?: boolean | null;
          has_customer_credit?: boolean | null;
          has_delivery_tracking?: boolean | null;
          has_email_reports?: boolean | null;
          has_gift_cards?: boolean | null;
          has_inventory?: boolean | null;
          has_multi_branch?: boolean | null;
          has_promotions?: boolean | null;
          has_receipt_drawer?: boolean | null;
          has_receipt_printer?: boolean;
          has_suppliers?: boolean | null;
          has_track_stock?: boolean | null;
          has_uom?: boolean | null;
          has_variants?: boolean | null;
          id?: string;
          invoice_number_prefix?: string | null;
          je_number_prefix?: string;
          name: string;
          onboarding_completed?: boolean | null;
          po_number_prefix?: string | null;
          quote_number_prefix?: string | null;
          report_email_enabled?: boolean;
          report_email_recipient?: string | null;
          report_email_time?: string | null;
          return_number_prefix?: string | null;
          shop_default_payment_method?: string;
          slug: string;
        };
        Update: {
          brand_config?: Json | null;
          company_type?: string;
          created_at?: string | null;
          currency?: string | null;
          dashboard_template?: string;
          enabled_features?: string[] | null;
          has_audit_log?: boolean | null;
          has_brands?: boolean | null;
          has_buddhist_presets?: boolean | null;
          has_categories?: boolean | null;
          has_checkout_customer?: boolean | null;
          has_checkout_quick_amounts?: boolean | null;
          has_coupons?: boolean | null;
          has_customer_credit?: boolean | null;
          has_delivery_tracking?: boolean | null;
          has_email_reports?: boolean | null;
          has_gift_cards?: boolean | null;
          has_inventory?: boolean | null;
          has_multi_branch?: boolean | null;
          has_promotions?: boolean | null;
          has_receipt_drawer?: boolean | null;
          has_receipt_printer?: boolean;
          has_suppliers?: boolean | null;
          has_track_stock?: boolean | null;
          has_uom?: boolean | null;
          has_variants?: boolean | null;
          id?: string;
          invoice_number_prefix?: string | null;
          je_number_prefix?: string;
          name?: string;
          onboarding_completed?: boolean | null;
          po_number_prefix?: string | null;
          quote_number_prefix?: string | null;
          report_email_enabled?: boolean;
          report_email_recipient?: string | null;
          report_email_time?: string | null;
          return_number_prefix?: string | null;
          shop_default_payment_method?: string;
          slug?: string;
        };
        Relationships: [];
      };
      payroll_items: {
        Row: {
          base_salary: number;
          bonus: number;
          created_at: string | null;
          deduction: number;
          employee_id: string;
          gross_pay: number;
          id: string;
          income_tax: number;
          net_pay: number;
          overtime_pay: number;
          payroll_run_id: string;
          si_employee: number;
          si_employer: number;
        };
        Insert: {
          base_salary?: number;
          bonus?: number;
          created_at?: string | null;
          deduction?: number;
          employee_id: string;
          gross_pay?: number;
          id?: string;
          income_tax?: number;
          net_pay?: number;
          overtime_pay?: number;
          payroll_run_id: string;
          si_employee?: number;
          si_employer?: number;
        };
        Update: {
          base_salary?: number;
          bonus?: number;
          created_at?: string | null;
          deduction?: number;
          employee_id?: string;
          gross_pay?: number;
          id?: string;
          income_tax?: number;
          net_pay?: number;
          overtime_pay?: number;
          payroll_run_id?: string;
          si_employee?: number;
          si_employer?: number;
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
      payroll_runs: {
        Row: {
          created_at: string | null;
          id: string;
          organization_id: string;
          period_end: string;
          period_start: string;
          status: string;
          total_deductions: number;
          total_gross: number;
          total_income_tax: number;
          total_net: number;
          total_si_employee: number;
          total_si_employer: number;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          organization_id: string;
          period_end: string;
          period_start: string;
          status?: string;
          total_deductions?: number;
          total_gross?: number;
          total_income_tax?: number;
          total_net?: number;
          total_si_employee?: number;
          total_si_employer?: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          organization_id?: string;
          period_end?: string;
          period_start?: string;
          status?: string;
          total_deductions?: number;
          total_gross?: number;
          total_income_tax?: number;
          total_net?: number;
          total_si_employee?: number;
          total_si_employer?: number;
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
      pending_updates: {
        Row: {
          created_at: string | null;
          id: number;
          processed: boolean | null;
          processed_at: string | null;
          raw_json: Json;
          update_id: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          processed?: boolean | null;
          processed_at?: string | null;
          raw_json: Json;
          update_id?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          processed?: boolean | null;
          processed_at?: string | null;
          raw_json?: Json;
          update_id?: number | null;
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
      product_boms: {
        Row: {
          activated_at: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          notes: string | null;
          organization_id: string;
          product_id: string;
          status: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          activated_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          organization_id: string;
          product_id: string;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          activated_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          organization_id?: string;
          product_id?: string;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_boms_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_boms_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
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
      product_images: {
        Row: {
          created_at: string | null;
          id: string;
          organization_id: string;
          product_id: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          organization_id: string;
          product_id: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          organization_id?: string;
          product_id?: string;
          sort_order?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
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
      production_materials: {
        Row: {
          created_at: string;
          estimated_unit_cost_snapshot: number | null;
          id: string;
          issued_quantity: number;
          organization_id: string;
          product_id: string;
          production_order_id: string;
          required_length_mm: number | null;
          required_quantity: number;
          required_thickness_mm: number | null;
          required_width_mm: number | null;
          returned_quantity: number;
          source_bom_item_id: string | null;
          unit: string;
          updated_at: string;
          used_quantity: number;
          warehouse_id: string | null;
        };
        Insert: {
          created_at?: string;
          estimated_unit_cost_snapshot?: number | null;
          id?: string;
          issued_quantity?: number;
          organization_id: string;
          product_id: string;
          production_order_id: string;
          required_length_mm?: number | null;
          required_quantity: number;
          required_thickness_mm?: number | null;
          required_width_mm?: number | null;
          returned_quantity?: number;
          source_bom_item_id?: string | null;
          unit: string;
          updated_at?: string;
          used_quantity?: number;
          warehouse_id?: string | null;
        };
        Update: {
          created_at?: string;
          estimated_unit_cost_snapshot?: number | null;
          id?: string;
          issued_quantity?: number;
          organization_id?: string;
          product_id?: string;
          production_order_id?: string;
          required_length_mm?: number | null;
          required_quantity?: number;
          required_thickness_mm?: number | null;
          required_width_mm?: number | null;
          returned_quantity?: number;
          source_bom_item_id?: string | null;
          unit?: string;
          updated_at?: string;
          used_quantity?: number;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "production_materials_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_materials_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_materials_production_order_id_fkey";
            columns: ["production_order_id"];
            isOneToOne: false;
            referencedRelation: "production_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_materials_source_bom_item_id_fkey";
            columns: ["source_bom_item_id"];
            isOneToOne: false;
            referencedRelation: "bom_items";
            referencedColumns: ["id"];
          },
        ];
      };
      production_orders: {
        Row: {
          actual_end_at: string | null;
          actual_start_at: string | null;
          bom_id: string;
          bom_version: number;
          branch_id: string;
          completed_actual_cost: number | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          estimated_cost_snapshot: number | null;
          id: string;
          notes: string | null;
          order_number: string;
          organization_id: string;
          planned_end_date: string | null;
          planned_start_date: string | null;
          priority: string;
          product_id: string;
          quantity: number;
          sale_item_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          actual_end_at?: string | null;
          actual_start_at?: string | null;
          bom_id: string;
          bom_version: number;
          branch_id: string;
          completed_actual_cost?: number | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          estimated_cost_snapshot?: number | null;
          id?: string;
          notes?: string | null;
          order_number: string;
          organization_id: string;
          planned_end_date?: string | null;
          planned_start_date?: string | null;
          priority?: string;
          product_id: string;
          quantity: number;
          sale_item_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          actual_end_at?: string | null;
          actual_start_at?: string | null;
          bom_id?: string;
          bom_version?: number;
          branch_id?: string;
          completed_actual_cost?: number | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          estimated_cost_snapshot?: number | null;
          id?: string;
          notes?: string | null;
          order_number?: string;
          organization_id?: string;
          planned_end_date?: string | null;
          planned_start_date?: string | null;
          priority?: string;
          product_id?: string;
          quantity?: number;
          sale_item_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "production_orders_bom_id_fkey";
            columns: ["bom_id"];
            isOneToOne: false;
            referencedRelation: "product_boms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_orders_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_orders_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      production_stage_labor: {
        Row: {
          created_at: string;
          employee_id: string;
          hourly_rate_snapshot: number;
          hours: number;
          id: string;
          labor_cost: number | null;
          notes: string | null;
          organization_id: string;
          production_stage_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          employee_id: string;
          hourly_rate_snapshot: number;
          hours: number;
          id?: string;
          labor_cost?: number | null;
          notes?: string | null;
          organization_id: string;
          production_stage_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          employee_id?: string;
          hourly_rate_snapshot?: number;
          hours?: number;
          id?: string;
          labor_cost?: number | null;
          notes?: string | null;
          organization_id?: string;
          production_stage_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "production_stage_labor_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_stage_labor_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_stage_labor_production_stage_id_fkey";
            columns: ["production_stage_id"];
            isOneToOne: false;
            referencedRelation: "production_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      production_stages: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          organization_id: string;
          production_order_id: string;
          stage_name: string;
          stage_order: number;
          started_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          organization_id: string;
          production_order_id: string;
          stage_name: string;
          stage_order: number;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          organization_id?: string;
          production_order_id?: string;
          stage_name?: string;
          stage_order?: number;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "production_stages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_stages_production_order_id_fkey";
            columns: ["production_order_id"];
            isOneToOne: false;
            referencedRelation: "production_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          additional_info: string | null;
          barcode: string | null;
          brand_id: string | null;
          care_instructions: string | null;
          category_id: string | null;
          cost_price: number | null;
          created_at: string | null;
          current_stock: number | null;
          deleted_at: string | null;
          description: string | null;
          has_variants: boolean;
          id: string;
          image_url: string | null;
          image_urls: string[] | null;
          is_public: boolean;
          material_type: string | null;
          min_stock: number | null;
          name: string;
          name_norm: string | null;
          organization_id: string;
          published_at: string | null;
          published_by: string | null;
          sale_price: number | null;
          search_vector: unknown;
          sku: string | null;
          unit: string | null;
          usage_instructions: string | null;
        };
        Insert: {
          additional_info?: string | null;
          barcode?: string | null;
          brand_id?: string | null;
          care_instructions?: string | null;
          category_id?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          current_stock?: number | null;
          deleted_at?: string | null;
          description?: string | null;
          has_variants?: boolean;
          id?: string;
          image_url?: string | null;
          image_urls?: string[] | null;
          is_public?: boolean;
          material_type?: string | null;
          min_stock?: number | null;
          name: string;
          name_norm?: string | null;
          organization_id: string;
          published_at?: string | null;
          published_by?: string | null;
          sale_price?: number | null;
          search_vector?: unknown;
          sku?: string | null;
          unit?: string | null;
          usage_instructions?: string | null;
        };
        Update: {
          additional_info?: string | null;
          barcode?: string | null;
          brand_id?: string | null;
          care_instructions?: string | null;
          category_id?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          current_stock?: number | null;
          deleted_at?: string | null;
          description?: string | null;
          has_variants?: boolean;
          id?: string;
          image_url?: string | null;
          image_urls?: string[] | null;
          is_public?: boolean;
          material_type?: string | null;
          min_stock?: number | null;
          name?: string;
          name_norm?: string | null;
          organization_id?: string;
          published_at?: string | null;
          published_by?: string | null;
          sale_price?: number | null;
          search_vector?: unknown;
          sku?: string | null;
          unit?: string | null;
          usage_instructions?: string | null;
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
          {
            foreignKeyName: "products_published_by_fkey";
            columns: ["published_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
      promotion_conditions: {
        Row: {
          condition_type: string;
          condition_value: string;
          created_at: string | null;
          id: string;
          operator: string;
          promotion_id: string;
        };
        Insert: {
          condition_type: string;
          condition_value: string;
          created_at?: string | null;
          id?: string;
          operator?: string;
          promotion_id: string;
        };
        Update: {
          condition_type?: string;
          condition_value?: string;
          created_at?: string | null;
          id?: string;
          operator?: string;
          promotion_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promotion_conditions_promotion_id_fkey";
            columns: ["promotion_id"];
            isOneToOne: false;
            referencedRelation: "promotions";
            referencedColumns: ["id"];
          },
        ];
      };
      promotion_rewards: {
        Row: {
          created_at: string | null;
          id: string;
          promotion_id: string;
          reward_max_count: number | null;
          reward_product_id: string | null;
          reward_type: string;
          reward_value: number;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          promotion_id: string;
          reward_max_count?: number | null;
          reward_product_id?: string | null;
          reward_type: string;
          reward_value: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          promotion_id?: string;
          reward_max_count?: number | null;
          reward_product_id?: string | null;
          reward_type?: string;
          reward_value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "promotion_rewards_promotion_id_fkey";
            columns: ["promotion_id"];
            isOneToOne: false;
            referencedRelation: "promotions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promotion_rewards_reward_product_id_fkey";
            columns: ["reward_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      promotions: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          priority: number;
          stackable: boolean;
          type: string;
          usage_limit: number | null;
          used_count: number;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
          priority?: number;
          stackable?: boolean;
          type: string;
          usage_limit?: number | null;
          used_count?: number;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          priority?: number;
          stackable?: boolean;
          type?: string;
          usage_limit?: number | null;
          used_count?: number;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "promotions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promotions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_order_items: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
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
          deleted_at?: string | null;
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
          deleted_at?: string | null;
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
          currency_id: string | null;
          deleted_at: string | null;
          exchange_rate: number | null;
          expected_date: string | null;
          id: string;
          notes: string | null;
          order_date: string;
          order_number: string;
          organization_id: string;
          original_amount: number | null;
          status: string;
          supplier_id: string | null;
          total_amount: number;
        };
        Insert: {
          branch_id: string;
          created_at?: string | null;
          created_by?: string | null;
          currency_id?: string | null;
          deleted_at?: string | null;
          exchange_rate?: number | null;
          expected_date?: string | null;
          id?: string;
          notes?: string | null;
          order_date?: string;
          order_number: string;
          organization_id: string;
          original_amount?: number | null;
          status?: string;
          supplier_id?: string | null;
          total_amount?: number;
        };
        Update: {
          branch_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          currency_id?: string | null;
          deleted_at?: string | null;
          exchange_rate?: number | null;
          expected_date?: string | null;
          id?: string;
          notes?: string | null;
          order_date?: string;
          order_number?: string;
          organization_id?: string;
          original_amount?: number | null;
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
            foreignKeyName: "purchase_orders_currency_id_fkey";
            columns: ["currency_id"];
            isOneToOne: false;
            referencedRelation: "currencies";
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
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string | null;
          endpoint: string;
          id: string;
          organization_id: string;
          p256dh: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string | null;
          endpoint: string;
          id?: string;
          organization_id: string;
          p256dh: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string | null;
          endpoint?: string;
          id?: string;
          organization_id?: string;
          p256dh?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      quality_checks: {
        Row: {
          check_type: string;
          checked_at: string;
          checked_by: string;
          created_at: string;
          defect_description: string | null;
          defect_photos: string[] | null;
          id: string;
          organization_id: string;
          production_order_id: string;
          production_stage_id: string | null;
          result: string;
        };
        Insert: {
          check_type: string;
          checked_at?: string;
          checked_by: string;
          created_at?: string;
          defect_description?: string | null;
          defect_photos?: string[] | null;
          id?: string;
          organization_id: string;
          production_order_id: string;
          production_stage_id?: string | null;
          result: string;
        };
        Update: {
          check_type?: string;
          checked_at?: string;
          checked_by?: string;
          created_at?: string;
          defect_description?: string | null;
          defect_photos?: string[] | null;
          id?: string;
          organization_id?: string;
          production_order_id?: string;
          production_stage_id?: string | null;
          result?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quality_checks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quality_checks_production_order_id_fkey";
            columns: ["production_order_id"];
            isOneToOne: false;
            referencedRelation: "production_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quality_checks_production_stage_id_fkey";
            columns: ["production_stage_id"];
            isOneToOne: false;
            referencedRelation: "production_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      quotation_items: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
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
          deleted_at?: string | null;
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
          deleted_at?: string | null;
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
          deleted_at: string | null;
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
          deleted_at?: string | null;
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
          deleted_at?: string | null;
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
          deleted_at: string | null;
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
          deleted_at?: string | null;
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
          deleted_at?: string | null;
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
          deleted_at: string | null;
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
          deleted_at?: string | null;
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
          deleted_at?: string | null;
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
      reviews: {
        Row: {
          comment: string;
          contact_id: string | null;
          created_at: string | null;
          customer_name: string;
          id: string;
          moderated_at: string | null;
          moderated_by: string | null;
          organization_id: string;
          product_id: string;
          rating: number;
          status: string;
        };
        Insert: {
          comment: string;
          contact_id?: string | null;
          created_at?: string | null;
          customer_name: string;
          id?: string;
          moderated_at?: string | null;
          moderated_by?: string | null;
          organization_id: string;
          product_id: string;
          rating: number;
          status?: string;
        };
        Update: {
          comment?: string;
          contact_id?: string | null;
          created_at?: string | null;
          customer_name?: string;
          id?: string;
          moderated_at?: string | null;
          moderated_by?: string | null;
          organization_id?: string;
          product_id?: string;
          rating?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_moderated_by_fkey";
            columns: ["moderated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
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
      sale_items: {
        Row: {
          commission_amount: number;
          deleted_at: string | null;
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
          deleted_at?: string | null;
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
          deleted_at?: string | null;
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
          bank_account_id: string | null;
          branch_id: string;
          contact_email: string | null;
          contact_id: string | null;
          coupon_id: string | null;
          created_at: string | null;
          created_by: string | null;
          currency_code: string | null;
          currency_id: string | null;
          currency_symbol: string | null;
          dedupe_key: string | null;
          deleted_at: string | null;
          delivery_address: string | null;
          delivery_fee: number;
          delivery_note: string | null;
          delivery_type: string | null;
          discount_amount: number;
          exchange_rate: number | null;
          gift_card_amount: number;
          gift_card_id: string | null;
          id: string;
          is_online: boolean;
          notes: string | null;
          organization_id: string;
          original_amount: number | null;
          paid_amount: number | null;
          payment_method: string | null;
          payment_splits: Json | null;
          promotion_discount: number;
          promotion_id: string | null;
          sale_date: string;
          salesperson_id: string | null;
          status: string | null;
          status_history: Json;
          store_account_id: string | null;
          total_amount: number;
        };
        Insert: {
          bank_account_id?: string | null;
          branch_id: string;
          contact_email?: string | null;
          contact_id?: string | null;
          coupon_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency_code?: string | null;
          currency_id?: string | null;
          currency_symbol?: string | null;
          dedupe_key?: string | null;
          deleted_at?: string | null;
          delivery_address?: string | null;
          delivery_fee?: number;
          delivery_note?: string | null;
          delivery_type?: string | null;
          discount_amount?: number;
          exchange_rate?: number | null;
          gift_card_amount?: number;
          gift_card_id?: string | null;
          id?: string;
          is_online?: boolean;
          notes?: string | null;
          organization_id: string;
          original_amount?: number | null;
          paid_amount?: number | null;
          payment_method?: string | null;
          payment_splits?: Json | null;
          promotion_discount?: number;
          promotion_id?: string | null;
          sale_date?: string;
          salesperson_id?: string | null;
          status?: string | null;
          status_history?: Json;
          store_account_id?: string | null;
          total_amount: number;
        };
        Update: {
          bank_account_id?: string | null;
          branch_id?: string;
          contact_email?: string | null;
          contact_id?: string | null;
          coupon_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency_code?: string | null;
          currency_id?: string | null;
          currency_symbol?: string | null;
          dedupe_key?: string | null;
          deleted_at?: string | null;
          delivery_address?: string | null;
          delivery_fee?: number;
          delivery_note?: string | null;
          delivery_type?: string | null;
          discount_amount?: number;
          exchange_rate?: number | null;
          gift_card_amount?: number;
          gift_card_id?: string | null;
          id?: string;
          is_online?: boolean;
          notes?: string | null;
          organization_id?: string;
          original_amount?: number | null;
          paid_amount?: number | null;
          payment_method?: string | null;
          payment_splits?: Json | null;
          promotion_discount?: number;
          promotion_id?: string | null;
          sale_date?: string;
          salesperson_id?: string | null;
          status?: string | null;
          status_history?: Json;
          store_account_id?: string | null;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sales_bank_account_id_fkey";
            columns: ["bank_account_id"];
            isOneToOne: false;
            referencedRelation: "bank_accounts";
            referencedColumns: ["id"];
          },
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
            foreignKeyName: "sales_currency_id_fkey";
            columns: ["currency_id"];
            isOneToOne: false;
            referencedRelation: "currencies";
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
          {
            foreignKeyName: "sales_store_account_id_fkey";
            columns: ["store_account_id"];
            isOneToOne: false;
            referencedRelation: "store_accounts";
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
          expires_at: string | null;
          id: string;
          organization_id: string;
          revoked_at: string | null;
          rotated_at: string | null;
          token: string | null;
          token_hash: string | null;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_from: string;
          date_to: string;
          expires_at?: string | null;
          id?: string;
          organization_id: string;
          revoked_at?: string | null;
          rotated_at?: string | null;
          token?: string | null;
          token_hash?: string | null;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_from?: string;
          date_to?: string;
          expires_at?: string | null;
          id?: string;
          organization_id?: string;
          revoked_at?: string | null;
          rotated_at?: string | null;
          token?: string | null;
          token_hash?: string | null;
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
          operation_id: string | null;
          organization_id: string;
          product_id: string;
          production_material_id: string | null;
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
          operation_id?: string | null;
          organization_id: string;
          product_id: string;
          production_material_id?: string | null;
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
          operation_id?: string | null;
          organization_id?: string;
          product_id?: string;
          production_material_id?: string | null;
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
            foreignKeyName: "stock_movements_production_material_id_fkey";
            columns: ["production_material_id"];
            isOneToOne: false;
            referencedRelation: "production_materials";
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
      stock_transfer_items: {
        Row: {
          created_at: string | null;
          id: string;
          product_id: string;
          quantity: number;
          transfer_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          product_id: string;
          quantity: number;
          transfer_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          product_id?: string;
          quantity?: number;
          transfer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey";
            columns: ["transfer_id"];
            isOneToOne: false;
            referencedRelation: "stock_transfers";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_transfers: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          created_by: string | null;
          from_warehouse_id: string;
          id: string;
          notes: string | null;
          organization_id: string;
          status: string;
          to_warehouse_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          from_warehouse_id: string;
          id?: string;
          notes?: string | null;
          organization_id: string;
          status?: string;
          to_warehouse_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          from_warehouse_id?: string;
          id?: string;
          notes?: string | null;
          organization_id?: string;
          status?: string;
          to_warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_warehouse_id_fkey";
            columns: ["from_warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_transfers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_transfers_to_warehouse_id_fkey";
            columns: ["to_warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      store_account_addresses: {
        Row: {
          address: string;
          address_note: string | null;
          created_at: string | null;
          id: string;
          is_default: boolean;
          label: string;
          phone: string | null;
          store_account_id: string;
          updated_at: string | null;
        };
        Insert: {
          address: string;
          address_note?: string | null;
          created_at?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string;
          phone?: string | null;
          store_account_id: string;
          updated_at?: string | null;
        };
        Update: {
          address?: string;
          address_note?: string | null;
          created_at?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string;
          phone?: string | null;
          store_account_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "store_account_addresses_store_account_id_fkey";
            columns: ["store_account_id"];
            isOneToOne: false;
            referencedRelation: "store_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      store_accounts: {
        Row: {
          created_at: string | null;
          display_name: string | null;
          email: string;
          id: string;
          phone: string | null;
        };
        Insert: {
          created_at?: string | null;
          display_name?: string | null;
          email: string;
          id: string;
          phone?: string | null;
        };
        Update: {
          created_at?: string | null;
          display_name?: string | null;
          email?: string;
          id?: string;
          phone?: string | null;
        };
        Relationships: [];
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
          notification_preferences?: Json;
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
        Relationships: [];
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
      webhook_deliveries: {
        Row: {
          attempts: number;
          created_at: string | null;
          delivered_at: string | null;
          event_type: string;
          id: string;
          organization_id: string;
          payload: Json;
          response_body: string | null;
          status: string;
          status_code: number | null;
          subscription_id: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string | null;
          delivered_at?: string | null;
          event_type: string;
          id?: string;
          organization_id: string;
          payload?: Json;
          response_body?: string | null;
          status?: string;
          status_code?: number | null;
          subscription_id: string;
        };
        Update: {
          attempts?: number;
          created_at?: string | null;
          delivered_at?: string | null;
          event_type?: string;
          id?: string;
          organization_id?: string;
          payload?: Json;
          response_body?: string | null;
          status?: string;
          status_code?: number | null;
          subscription_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webhook_deliveries_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "webhook_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_subscriptions: {
        Row: {
          created_at: string | null;
          event_types: string[];
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          secret: string | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          event_types?: string[];
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
          secret?: string | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          event_types?: string[];
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          secret?: string | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      invoice_items_v: {
        Row: {
          deleted_at: string | null;
          description: string | null;
          id: string | null;
          invoice_id: string | null;
          issue_date: string | null;
          organization_id: string | null;
          product_id: string | null;
          product_name: string | null;
          quantity: number | null;
          total_price: number | null;
          unit_price: number | null;
          variant_id: string | null;
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
          {
            foreignKeyName: "invoices_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_order_items_v: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string | null;
          order_date: string | null;
          organization_id: string | null;
          product_id: string | null;
          product_name: string | null;
          purchase_order_id: string | null;
          quantity: number | null;
          received_quantity: number | null;
          total_cost: number | null;
          unit_cost: number | null;
          variant_id: string | null;
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
          {
            foreignKeyName: "purchase_orders_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      return_items_v: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string | null;
          organization_id: string | null;
          product_id: string | null;
          product_name: string | null;
          quantity: number | null;
          reason: string | null;
          return_date: string | null;
          return_id: string | null;
          total_price: number | null;
          unit_price: number | null;
          variant_id: string | null;
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
          {
            foreignKeyName: "returns_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items_v: {
        Row: {
          commission_amount: number | null;
          deleted_at: string | null;
          id: string | null;
          organization_id: string | null;
          product_id: string | null;
          product_name: string | null;
          quantity: number | null;
          sale_date: string | null;
          sale_id: string | null;
          total_price: number | null;
          unit_price: number | null;
          variant_id: string | null;
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
          {
            foreignKeyName: "sales_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      activate_bom: { Args: { p_bom_id: string }; Returns: undefined };
      append_sale_status_history: {
        Args: { p_by: string; p_sale_id: string; p_status: string };
        Returns: undefined;
      };
      approve_stock_transfer: {
        Args: { p_transfer_id: string };
        Returns: Json;
      };
      cancel_my_order: {
        Args: { p_order_id: string; p_slug: string };
        Returns: {
          order_id: string;
          status: string;
        }[];
      };
      check_period_locked: {
        Args: { p_check_date: string; p_org_id: string };
        Returns: boolean;
      };
      close_fiscal_period: { Args: { p_period_id: string }; Returns: Json };
      create_default_stages: {
        Args: { p_order_id: string; p_org_id: string };
        Returns: undefined;
      };
      create_organization: {
        Args: { org_name: string; org_slug: string; org_type?: string };
        Returns: Json;
      };
      daitch_mokotoff: { Args: { "": string }; Returns: string[] };
      decrement_product_stock_safe: {
        Args: { p_org_id: string; p_product_id: string; p_quantity: number };
        Returns: Json;
      };
      dmetaphone: { Args: { "": string }; Returns: string };
      dmetaphone_alt: { Args: { "": string }; Returns: string };
      evaluate_promotions: {
        Args: { p_items: Json; p_org_id: string; p_subtotal: number };
        Returns: Json;
      };
      generate_invoice_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      generate_journal_entry_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      generate_order_number: { Args: { p_org_id: string }; Returns: string };
      generate_purchase_order_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      generate_quote_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      generate_return_number:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string };
      get_active_handoff: {
        Args: { p_chat_id: number; p_org_id: string };
        Returns: {
          admin_user_id: number;
          created_at: string;
          customer_query: string;
          escalated_by: string;
          id: string;
          reason: string;
          status: Database["public"]["Enums"]["handoff_status"];
        }[];
      };
      get_balance_sheet: {
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
          balance: number;
        }[];
      };
      get_cash_flow: {
        Args: {
          p_branch_id?: string;
          p_date_from: string;
          p_date_to: string;
          p_organization_id: string;
        };
        Returns: {
          amount: number;
          category: string;
        }[];
      };
      get_current_organization: { Args: never; Returns: string };
      get_dashboard_quick_stats: {
        Args: { p_organization_id: string };
        Returns: {
          customer_count: number;
          inventory_value: number;
          low_stock_count: number;
          product_count: number;
          supplier_count: number;
        }[];
      };
      get_inventory_valuation: {
        Args: { p_branch_id?: string; p_organization_id: string };
        Returns: {
          average_cost: number;
          product_id: string;
          product_name: string;
          sku: string;
          total_cost: number;
          total_quantity: number;
        }[];
      };
      get_my_orders: {
        Args: never;
        Returns: {
          contact_email: string;
          created_at: string;
          delivery_address: string;
          delivery_fee: number;
          delivery_status: string;
          delivery_type: string;
          discount_amount: number;
          external_tracking_id: string;
          gift_card_amount: number;
          id: string;
          invoice_number: string;
          items: Json;
          status: string;
          total_amount: number;
        }[];
      };
      get_product_promo: {
        Args: { p_org_id: string; p_product_id: string };
        Returns: Json;
      };
      get_profit_loss: {
        Args: {
          p_branch_id?: string;
          p_date_from: string;
          p_date_to: string;
          p_organization_id: string;
        };
        Returns: {
          account_code: string;
          account_id: string;
          account_name: string;
          account_type: string;
          amount: number;
        }[];
      };
      get_promo_reward_label: { Args: { p_promo_id: string }; Returns: string };
      get_public_blog_post: {
        Args: { p_post_slug: string; p_slug: string };
        Returns: Json;
      };
      get_public_blog_posts: { Args: { p_slug: string }; Returns: Json };
      get_public_branches: { Args: { p_slug: string }; Returns: Json };
      get_public_categories: { Args: { p_slug: string }; Returns: Json };
      get_public_invoice: { Args: { p_token: string }; Returns: Json };
      get_public_order: {
        Args: { p_order_id: string; p_slug: string };
        Returns: Json;
      };
      get_public_product: {
        Args: { p_product_id: string; p_slug: string };
        Returns: Json;
      };
      get_public_products: {
        Args: {
          p_category_id?: string;
          p_max_price?: number;
          p_min_price?: number;
          p_page?: number;
          p_page_size?: number;
          p_product_ids?: string[];
          p_search?: string;
          p_slug: string;
          p_sort?: string;
        };
        Returns: Json;
      };
      get_public_promotions: { Args: { p_slug: string }; Returns: Json };
      get_public_receipt: { Args: { p_token: string }; Returns: Json };
      get_public_report_data: { Args: { p_token: string }; Returns: Json };
      get_public_reviews: {
        Args: { p_product_id: string; p_slug: string };
        Returns: Json;
      };
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
      get_user_organization_id: { Args: never; Returns: string };
      get_user_permissions: {
        Args: never;
        Returns: Database["public"]["Enums"]["app_permission"][];
      };
      has_permission: {
        Args: { p_permission: Database["public"]["Enums"]["app_permission"] };
        Returns: boolean;
      };
      increment_daily_spend: {
        Args: { p_date: string; p_org_id: string; p_tokens: number };
        Returns: undefined;
      };
      increment_smtp_count: {
        Args: { p_config_id: string };
        Returns: undefined;
      };
      issue_production_materials: {
        Args: {
          p_material_ids: string[];
          p_operation_id: string;
          p_production_order_id: string;
          p_quantities: number[];
        };
        Returns: undefined;
      };
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
      process_shop_sale: {
        Args: {
          p_branch_id: string;
          p_contact_id: string;
          p_currency_code?: string;
          p_currency_symbol?: string;
          p_dedupe_key?: string;
          p_exchange_rate?: number;
          p_items: Json;
          p_movements: Json;
          p_org_id: string;
          p_original_amount?: number;
          p_paid_amount: number;
          p_payment_method: string;
          p_salesperson_id: string;
          p_total_amount: number;
          p_user_id: string;
        };
        Returns: Json;
      };
      record_production_usage: {
        Args: {
          p_material_ids: string[];
          p_operation_id: string;
          p_production_order_id: string;
          p_quantities: number[];
        };
        Returns: undefined;
      };
      redeem_gift_card: {
        Args: {
          p_amount: number;
          p_gift_card_id: string;
          p_organization_id: string;
          p_sale_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      resolve_org_from_channel: {
        Args: {
          p_channel: string;
          p_channel_chat_id: string;
          p_channel_user_id: string;
        };
        Returns: {
          org_id: string;
          page_access_token: string;
          page_id: string;
          product_type: string;
        }[];
      };
      resolve_org_from_page: {
        Args: { p_page_id: string };
        Returns: {
          channel: string;
          org_id: string;
          page_access_token: string;
          product_type: string;
        }[];
      };
      restore_record: {
        Args: { p_record_id: string; p_table_name: string };
        Returns: Json;
      };
      return_production_materials: {
        Args: {
          p_material_ids: string[];
          p_operation_id: string;
          p_production_order_id: string;
          p_quantities: number[];
        };
        Returns: undefined;
      };
      save_product_catalog: {
        Args: {
          p_attribute_values: Json;
          p_product: Json;
          p_product_id: string;
        };
        Returns: string;
      };
      schedule_daily_report_cron: {
        Args: { app_url: string };
        Returns: string;
      };
      search_agent_knowledge: {
        Args: {
          p_limit?: number;
          p_org_id: string;
          p_query_embedding: string;
          p_similarity_threshold?: number;
        };
        Returns: {
          content: string;
          id: string;
          similarity: number;
          source_type: string;
          title: string;
        }[];
      };
      search_products:
        | {
            Args: { p_limit?: number; p_query: string };
            Returns: {
              additional_info: string | null;
              barcode: string | null;
              brand_id: string | null;
              care_instructions: string | null;
              category_id: string | null;
              cost_price: number | null;
              created_at: string | null;
              current_stock: number | null;
              deleted_at: string | null;
              description: string | null;
              has_variants: boolean;
              id: string;
              image_url: string | null;
              image_urls: string[] | null;
              is_public: boolean;
              material_type: string | null;
              min_stock: number | null;
              name: string;
              name_norm: string | null;
              organization_id: string;
              published_at: string | null;
              published_by: string | null;
              sale_price: number | null;
              search_vector: unknown;
              sku: string | null;
              unit: string | null;
              usage_instructions: string | null;
            }[];
            SetofOptions: {
              from: "*";
              to: "products";
              isOneToOne: false;
              isSetofReturn: true;
            };
          }
        | {
            Args: {
              p_attribute_filters?: Json;
              p_limit?: number;
              p_query: string;
            };
            Returns: {
              additional_info: string | null;
              barcode: string | null;
              brand_id: string | null;
              care_instructions: string | null;
              category_id: string | null;
              cost_price: number | null;
              created_at: string | null;
              current_stock: number | null;
              deleted_at: string | null;
              description: string | null;
              has_variants: boolean;
              id: string;
              image_url: string | null;
              image_urls: string[] | null;
              is_public: boolean;
              material_type: string | null;
              min_stock: number | null;
              name: string;
              name_norm: string | null;
              organization_id: string;
              published_at: string | null;
              published_by: string | null;
              sale_price: number | null;
              search_vector: unknown;
              sku: string | null;
              unit: string | null;
              usage_instructions: string | null;
            }[];
            SetofOptions: {
              from: "*";
              to: "products";
              isOneToOne: false;
              isSetofReturn: true;
            };
          };
      seed_default_bank_accounts: {
        Args: { p_organization_id: string };
        Returns: undefined;
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
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
      soft_delete_record: {
        Args: { p_record_id: string; p_table_name: string };
        Returns: Json;
      };
      soundex: { Args: { "": string }; Returns: string };
      submit_product_review: {
        Args: {
          p_comment: string;
          p_customer_name: string;
          p_product_id: string;
          p_rating: number;
          p_slug: string;
        };
        Returns: Json;
      };
      submit_shop_order: {
        Args: {
          p_address?: string;
          p_address_note?: string;
          p_branch_slug?: string;
          p_contact_email?: string;
          p_contact_name?: string;
          p_contact_phone?: string;
          p_coupon_code?: string;
          p_currency_code?: string;
          p_delivery_type?: string;
          p_gift_card_code?: string;
          p_idempotency_key?: string;
          p_items: Json;
          p_org_slug: string;
          p_payment_method?: string;
          p_pickup_branch_slug?: string;
        };
        Returns: {
          delivery_fee: number;
          discount_amount: number;
          gift_card_amount: number;
          order_id: string;
          payment_instructions: Json;
          status: string;
          total_amount: number;
        }[];
      };
      text_soundex: { Args: { "": string }; Returns: string };
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
      validate_journal_balance: { Args: { p_entry_id: string }; Returns: Json };
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
        | "emails.manage"
        | "boms.create"
        | "boms.read"
        | "boms.update"
        | "boms.delete"
        | "production_orders.create"
        | "production_orders.read"
        | "production_orders.update"
        | "production_orders.delete"
        | "production_costs.read"
        | "quality_checks.create"
        | "quality_checks.read"
        | "coupons.create"
        | "coupons.read"
        | "coupons.update"
        | "coupons.delete"
        | "gift_cards.create"
        | "gift_cards.read"
        | "gift_cards.update"
        | "gift_cards.delete"
        | "promotions.create"
        | "promotions.read"
        | "promotions.update"
        | "promotions.delete"
        | "reviews.create"
        | "reviews.read"
        | "reviews.update"
        | "reviews.delete"
        | "blog.create"
        | "blog.read"
        | "blog.update"
        | "blog.delete"
        | "webhooks.create"
        | "webhooks.read"
        | "webhooks.update"
        | "webhooks.delete"
        | "settings.read"
        | "settings.update"
        | "reports.read"
        | "access"
        | "inventory.create"
        | "inventory.read"
        | "inventory.update"
        | "inventory.delete"
        | "hr.create"
        | "hr.read"
        | "hr.update"
        | "hr.delete"
        | "manufacturing.create"
        | "manufacturing.read"
        | "manufacturing.update"
        | "manufacturing.delete";
      handoff_status:
        | "bot"
        | "pending_human"
        | "human_active"
        | "human_resolved"
        | "bot_resumed";
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
        "boms.create",
        "boms.read",
        "boms.update",
        "boms.delete",
        "production_orders.create",
        "production_orders.read",
        "production_orders.update",
        "production_orders.delete",
        "production_costs.read",
        "quality_checks.create",
        "quality_checks.read",
        "coupons.create",
        "coupons.read",
        "coupons.update",
        "coupons.delete",
        "gift_cards.create",
        "gift_cards.read",
        "gift_cards.update",
        "gift_cards.delete",
        "promotions.create",
        "promotions.read",
        "promotions.update",
        "promotions.delete",
        "reviews.create",
        "reviews.read",
        "reviews.update",
        "reviews.delete",
        "blog.create",
        "blog.read",
        "blog.update",
        "blog.delete",
        "webhooks.create",
        "webhooks.read",
        "webhooks.update",
        "webhooks.delete",
        "settings.read",
        "settings.update",
        "reports.read",
        "access",
        "inventory.create",
        "inventory.read",
        "inventory.update",
        "inventory.delete",
        "hr.create",
        "hr.read",
        "hr.update",
        "hr.delete",
        "manufacturing.create",
        "manufacturing.read",
        "manufacturing.update",
        "manufacturing.delete",
      ],
      handoff_status: [
        "bot",
        "pending_human",
        "human_active",
        "human_resolved",
        "bot_resumed",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const;
