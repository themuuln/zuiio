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
      academy_announcements: {
        Row: {
          academy_id: string
          body: string
          created_at: string
          created_by: string
          id: string
          program_id: string | null
          title: string
        }
        Insert: {
          academy_id: string
          body: string
          created_at?: string
          created_by: string
          id?: string
          program_id?: string | null
          title: string
        }
        Update: {
          academy_id?: string
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          program_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_announcements_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academy_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_announcements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "academy_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_attendance: {
        Row: {
          id: string
          is_offline: boolean | null
          note: string | null
          program_id: string
          recorded_at: string
          recorded_by: string
          session_date: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_offline?: boolean | null
          note?: string | null
          program_id: string
          recorded_at?: string
          recorded_by: string
          session_date: string
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_offline?: boolean | null
          note?: string | null
          program_id?: string
          recorded_at?: string
          recorded_by?: string
          session_date?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_attendance_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "academy_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "academy_students"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_consent_records: {
        Row: {
          expires_at: string | null
          guardian_id: string | null
          id: string
          ip_address: string | null
          is_withdrawn: boolean | null
          signed_at: string
          signed_text: string
          student_id: string
          template_id: string
          withdrawn_at: string | null
        }
        Insert: {
          expires_at?: string | null
          guardian_id?: string | null
          id?: string
          ip_address?: string | null
          is_withdrawn?: boolean | null
          signed_at?: string
          signed_text: string
          student_id: string
          template_id: string
          withdrawn_at?: string | null
        }
        Update: {
          expires_at?: string | null
          guardian_id?: string | null
          id?: string
          ip_address?: string | null
          is_withdrawn?: boolean | null
          signed_at?: string
          signed_text?: string
          student_id?: string
          template_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_consent_records_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "academy_guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_consent_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "academy_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_consent_records_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "academy_consent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_consent_templates: {
        Row: {
          academy_id: string
          body: string
          created_at: string
          id: string
          is_active: boolean | null
          scope: string
          title: string
          version: number
        }
        Insert: {
          academy_id: string
          body: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          scope: string
          title: string
          version?: number
        }
        Update: {
          academy_id?: string
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          scope?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_consent_templates_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_enrollments: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          enrolled_at: string
          id: string
          notes: string | null
          program_id: string
          start_date: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          enrolled_at?: string
          id?: string
          notes?: string | null
          program_id: string
          start_date?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          enrolled_at?: string
          id?: string
          notes?: string | null
          program_id?: string
          start_date?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "academy_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "academy_students"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_guardians: {
        Row: {
          academy_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          relationship: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academy_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          relationship: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academy_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          relationship?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_guardians_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_locations: {
        Row: {
          academy_id: string
          address: string | null
          city: string | null
          created_at: string | null
          hours: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          academy_id: string
          address?: string | null
          city?: string | null
          created_at?: string | null
          hours?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          academy_id?: string
          address?: string | null
          city?: string | null
          created_at?: string | null
          hours?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_locations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_payment_ledger: {
        Row: {
          amount_mnt: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          method: string | null
          notes: string | null
          reference: string | null
          status: string
          student_id: string
          type: string
        }
        Insert: {
          amount_mnt: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          reference?: string | null
          status?: string
          student_id: string
          type: string
        }
        Update: {
          amount_mnt?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          reference?: string | null
          status?: string
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_payment_ledger_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_payment_ledger_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "academy_students"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_profiles: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          organization_id: string
          settings: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          organization_id: string
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_programs: {
        Row: {
          academy_id: string
          age_group: string | null
          created_at: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          is_active: boolean | null
          name: string
          price_mnt: number | null
        }
        Insert: {
          academy_id: string
          age_group?: string | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price_mnt?: number | null
        }
        Update: {
          academy_id?: string
          age_group?: string | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_mnt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_programs_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_student_guardians: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          student_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "academy_guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "academy_students"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_students: {
        Row: {
          academy_id: string
          allergies: string[] | null
          canonical_name: string
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          grade_level: string | null
          id: string
          medical_notes: string | null
          name_latin: string | null
          notes: string | null
          photo_url: string | null
          school_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          allergies?: string[] | null
          canonical_name: string
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          grade_level?: string | null
          id?: string
          medical_notes?: string | null
          name_latin?: string | null
          notes?: string | null
          photo_url?: string | null
          school_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          allergies?: string[] | null
          canonical_name?: string
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          grade_level?: string | null
          id?: string
          medical_notes?: string | null
          name_latin?: string | null
          notes?: string | null
          photo_url?: string | null
          school_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_students_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_trainers: {
        Row: {
          academy_id: string
          bio: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          photo_url: string | null
          specialties: string[] | null
        }
        Insert: {
          academy_id: string
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          specialties?: string[] | null
        }
        Update: {
          academy_id?: string
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          specialties?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_trainers_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_waitlists: {
        Row: {
          created_at: string
          id: string
          note: string | null
          position: number
          program_id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          position: number
          program_id: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          position?: number
          program_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_waitlists_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "academy_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_waitlists_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "academy_students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      auth_continuations: {
        Row: {
          consumed_at: string | null
          expires_at: string
          jti: string
          product_id: string
          return_to: string
        }
        Insert: {
          consumed_at?: string | null
          expires_at: string
          jti?: string
          product_id: string
          return_to: string
        }
        Update: {
          consumed_at?: string | null
          expires_at?: string
          jti?: string
          product_id?: string
          return_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_continuations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      awards: {
        Row: {
          award_type: string
          competition_id: string
          granted_at: string | null
          granted_by: string
          id: string
          note: string | null
          period_end: string | null
          period_start: string | null
          player_id: string
        }
        Insert: {
          award_type: string
          competition_id: string
          granted_at?: string | null
          granted_by: string
          id?: string
          note?: string | null
          period_end?: string | null
          period_start?: string | null
          player_id: string
        }
        Update: {
          award_type?: string
          competition_id?: string
          granted_at?: string | null
          granted_by?: string
          id?: string
          note?: string | null
          period_end?: string | null
          period_start?: string | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "awards_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "awards_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
        ]
      }
      basketball_rulesets: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string
          id: string
          league_id: string
          name: string
          retired_at: string | null
          rules: Json
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from: string
          id?: string
          league_id: string
          name: string
          retired_at?: string | null
          rules: Json
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          id?: string
          league_id?: string
          name?: string
          retired_at?: string | null
          rules?: Json
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_leaders"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_standings"
            referencedColumns: ["league_id"]
          },
        ]
      }
      break_glass_access: {
        Row: {
          created_at: string | null
          expires_at: string
          granted_by: string | null
          granted_to: string
          id: string
          is_expired: boolean | null
          organization_id: string
          reason: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          granted_by?: string | null
          granted_to: string
          id?: string
          is_expired?: boolean | null
          organization_id: string
          reason: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          granted_by?: string | null
          granted_to?: string
          id?: string
          is_expired?: boolean | null
          organization_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_glass_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string
          id: string
          name: string
          season_id: string
          social_links: Json
          tiebreaker_rules: Json
          type: Database["public"]["Enums"]["competition_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          season_id: string
          social_links?: Json
          tiebreaker_rules?: Json
          type?: Database["public"]["Enums"]["competition_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          season_id?: string
          social_links?: Json
          tiebreaker_rules?: Json
          type?: Database["public"]["Enums"]["competition_type"]
        }
        Relationships: [
          {
            foreignKeyName: "competitions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "competitions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_public_leaders"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "competitions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "competitions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "competitions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_public_standings"
            referencedColumns: ["season_id"]
          },
        ]
      }
      consent_policies: {
        Row: {
          created_at: string | null
          data_categories: string[] | null
          description: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          retention_days: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_categories?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          retention_days?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_categories?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          retention_days?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      correction_records: {
        Row: {
          evidence_url: string | null
          game_id: string
          id: string
          proposed_change: Json
          reason: string
          requested_at: string
          requested_by: string
          resolved_at: string | null
          resolved_by: string | null
          resulting_revision_id: string | null
          status: string
        }
        Insert: {
          evidence_url?: string | null
          game_id: string
          id?: string
          proposed_change: Json
          reason: string
          requested_at?: string
          requested_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          resulting_revision_id?: string | null
          status?: string
        }
        Update: {
          evidence_url?: string | null
          game_id?: string
          id?: string
          proposed_change?: Json
          reason?: string
          requested_at?: string
          requested_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          resulting_revision_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "correction_records_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_records_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_records_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_records_resulting_revision_id_fkey"
            columns: ["resulting_revision_id"]
            isOneToOne: false
            referencedRelation: "game_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_records_resulting_revision_id_fkey"
            columns: ["resulting_revision_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["revision_id"]
          },
        ]
      }
      daily_page_views: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          updated_at: string
          view_count: number
          view_date: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string
          view_count?: number
          view_date?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string
          view_count?: number
          view_date?: string
        }
        Relationships: []
      }
      game_assignments: {
        Row: {
          game_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          game_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          game_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_assignments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_assignments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_assignments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_player_stats: {
        Row: {
          ast: number
          blk: number
          dreb: number
          fga: number
          fgm: number
          fta: number
          ftm: number
          game_id: string
          oreb: number
          pf: number
          player_id: string
          pts: number
          revision_id: string | null
          seconds_played: number | null
          stl: number
          team_season_id: string
          tov: number
          tpa: number
          tpm: number
        }
        Insert: {
          ast?: number
          blk?: number
          dreb?: number
          fga?: number
          fgm?: number
          fta?: number
          ftm?: number
          game_id: string
          oreb?: number
          pf?: number
          player_id: string
          pts?: number
          revision_id?: string | null
          seconds_played?: number | null
          stl?: number
          team_season_id: string
          tov?: number
          tpa?: number
          tpm?: number
        }
        Update: {
          ast?: number
          blk?: number
          dreb?: number
          fga?: number
          fgm?: number
          fta?: number
          ftm?: number
          game_id?: string
          oreb?: number
          pf?: number
          player_id?: string
          pts?: number
          revision_id?: string | null
          seconds_played?: number | null
          stl?: number
          team_season_id?: string
          tov?: number
          tpa?: number
          tpm?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_player_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_player_stats_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "game_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      game_revisions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          game_id: string
          id: string
          journal: Json
          parent_revision_id: string | null
          projection: Json
          revision_number: number
          source_submission_id: string
          state: string
          validation_warnings: Json
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          game_id: string
          id?: string
          journal: Json
          parent_revision_id?: string | null
          projection: Json
          revision_number: number
          source_submission_id: string
          state?: string
          validation_warnings?: Json
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          game_id?: string
          id?: string
          journal?: Json
          parent_revision_id?: string | null
          projection?: Json
          revision_number?: number
          source_submission_id?: string
          state?: string
          validation_warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "game_revisions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_revisions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_revisions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_revisions_parent_revision_id_fkey"
            columns: ["parent_revision_id"]
            isOneToOne: false
            referencedRelation: "game_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_revisions_parent_revision_id_fkey"
            columns: ["parent_revision_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "game_revisions_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "source_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_revisions_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["source_submission_id"]
          },
        ]
      }
      game_rosters: {
        Row: {
          dnp_reason: string | null
          game_id: string
          id: string
          is_starter: boolean
          player_id: string
          team_season_id: string
        }
        Insert: {
          dnp_reason?: string | null
          game_id: string
          id?: string
          is_starter?: boolean
          player_id: string
          team_season_id: string
        }
        Update: {
          dnp_reason?: string | null
          game_id?: string
          id?: string
          is_starter?: boolean
          player_id?: string
          team_season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rosters_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rosters_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rosters_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      game_team_stats: {
        Row: {
          ast: number
          blk: number
          dreb: number
          fga: number
          fgm: number
          fta: number
          ftm: number
          game_id: string
          oreb: number
          pf: number
          pts: number
          revision_id: string | null
          stl: number
          team_reb: number
          team_season_id: string
          tov: number
          tpa: number
          tpm: number
        }
        Insert: {
          ast?: number
          blk?: number
          dreb?: number
          fga?: number
          fgm?: number
          fta?: number
          ftm?: number
          game_id: string
          oreb?: number
          pf?: number
          pts?: number
          revision_id?: string | null
          stl?: number
          team_reb?: number
          team_season_id: string
          tov?: number
          tpa?: number
          tpm?: number
        }
        Update: {
          ast?: number
          blk?: number
          dreb?: number
          fga?: number
          fgm?: number
          fta?: number
          ftm?: number
          game_id?: string
          oreb?: number
          pf?: number
          pts?: number
          revision_id?: string | null
          stl?: number
          team_reb?: number
          team_season_id?: string
          tov?: number
          tpa?: number
          tpm?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_team_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_team_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_team_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_team_stats_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "game_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_team_stats_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      games: {
        Row: {
          away_score: number | null
          away_team_season_id: string
          competition_id: string
          created_at: string
          current_period: number
          current_revision_number: number
          home_score: number | null
          home_team_season_id: string
          id: string
          published_at: string | null
          ruleset_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["game_status"]
          venue_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_season_id: string
          competition_id: string
          created_at?: string
          current_period?: number
          current_revision_number?: number
          home_score?: number | null
          home_team_season_id: string
          id?: string
          published_at?: string | null
          ruleset_id?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["game_status"]
          venue_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_season_id?: string
          competition_id?: string
          created_at?: string
          current_period?: number
          current_revision_number?: number
          home_score?: number | null
          home_team_season_id?: string
          id?: string
          published_at?: string | null
          ruleset_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["game_status"]
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_away_team_season_id_fkey"
            columns: ["away_team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey"
            columns: ["away_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey"
            columns: ["away_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey"
            columns: ["away_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey"
            columns: ["away_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey"
            columns: ["away_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey"
            columns: ["away_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "games_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey"
            columns: ["home_team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey"
            columns: ["home_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey"
            columns: ["home_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey"
            columns: ["home_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey"
            columns: ["home_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey"
            columns: ["home_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey"
            columns: ["home_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "games_ruleset_id_fkey"
            columns: ["ruleset_id"]
            isOneToOne: false
            referencedRelation: "basketball_rulesets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          organization_id: string
          slug: string
          sport_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          organization_id: string
          slug: string
          sport_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string
          slug?: string
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leagues_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          id: string
          identifier: string
          ip_address: unknown
          success: boolean
        }
        Insert: {
          attempted_at?: string
          id?: string
          identifier: string
          ip_address?: unknown
          success?: boolean
        }
        Update: {
          attempted_at?: string
          id?: string
          identifier?: string
          ip_address?: unknown
          success?: boolean
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          scope_id: string
          scope_type: Database["public"]["Enums"]["membership_scope"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["membership_role"]
          scope_id: string
          scope_type: Database["public"]["Enums"]["membership_scope"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          scope_id?: string
          scope_type?: Database["public"]["Enums"]["membership_scope"]
          user_id?: string
        }
        Relationships: []
      }
      opponent_notes: {
        Row: {
          created_at: string
          created_by: string
          game_plan: string | null
          id: string
          notes: string | null
          opponent_team_season_id: string
          strengths: string[] | null
          team_season_id: string
          updated_at: string
          weaknesses: string[] | null
        }
        Insert: {
          created_at?: string
          created_by: string
          game_plan?: string | null
          id?: string
          notes?: string | null
          opponent_team_season_id: string
          strengths?: string[] | null
          team_season_id: string
          updated_at?: string
          weaknesses?: string[] | null
        }
        Update: {
          created_at?: string
          created_by?: string
          game_plan?: string | null
          id?: string
          notes?: string | null
          opponent_team_season_id?: string
          strengths?: string[] | null
          team_season_id?: string
          updated_at?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey"
            columns: ["opponent_team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey"
            columns: ["opponent_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey"
            columns: ["opponent_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey"
            columns: ["opponent_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey"
            columns: ["opponent_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey"
            columns: ["opponent_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey"
            columns: ["opponent_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_name: string
          id: string
          items: Json
          phone: string
          qpay_invoice_id: string | null
          qpay_qr_image: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_mnt: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          id?: string
          items: Json
          phone: string
          qpay_invoice_id?: string | null
          qpay_qr_image?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_mnt: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          id?: string
          items?: Json
          phone?: string
          qpay_invoice_id?: string | null
          qpay_qr_image?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_mnt?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      org_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          role_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          role_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          role_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invites_org_id_fkey"
            columns: ["org_id"]
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
      org_memberships: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          org_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_id: string
          role_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_storage_buckets: {
        Row: {
          bucket_id: string
          bucket_name: string
          created_at: string | null
          id: string
          is_tenant_isolation: boolean | null
          organization_id: string
        }
        Insert: {
          bucket_id: string
          bucket_name: string
          created_at?: string | null
          id?: string
          is_tenant_isolation?: boolean | null
          organization_id: string
        }
        Update: {
          bucket_id?: string
          bucket_name?: string
          created_at?: string | null
          id?: string
          is_tenant_isolation?: boolean | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_storage_buckets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          social_links: Json
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          social_links?: Json
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          social_links?: Json
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          description: string | null
          id: string
          resource: string
        }
        Insert: {
          action: string
          description?: string | null
          id?: string
          resource: string
        }
        Update: {
          action?: string
          description?: string | null
          id?: string
          resource?: string
        }
        Relationships: []
      }
      player_aliases: {
        Row: {
          alias: string
          created_at: string
          created_by: string | null
          id: string
          normalized_alias: string
          player_id: string
          source_submission_id: string | null
        }
        Insert: {
          alias: string
          created_at?: string
          created_by?: string | null
          id?: string
          normalized_alias: string
          player_id: string
          source_submission_id?: string | null
        }
        Update: {
          alias?: string
          created_at?: string
          created_by?: string | null
          id?: string
          normalized_alias?: string
          player_id?: string
          source_submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_aliases_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_aliases_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "source_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_aliases_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["source_submission_id"]
          },
        ]
      }
      player_merge_history: {
        Row: {
          created_at: string
          id: string
          kept_player_id: string
          merged_by: string
          merged_player_id: string
          reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          kept_player_id: string
          merged_by: string
          merged_player_id: string
          reason: string
        }
        Update: {
          created_at?: string
          id?: string
          kept_player_id?: string
          merged_by?: string
          merged_player_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey"
            columns: ["kept_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey"
            columns: ["kept_player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey"
            columns: ["kept_player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey"
            columns: ["kept_player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey"
            columns: ["kept_player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey"
            columns: ["kept_player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey"
            columns: ["kept_player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey"
            columns: ["merged_player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey"
            columns: ["merged_player_id"]
            isOneToOne: true
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey"
            columns: ["merged_player_id"]
            isOneToOne: true
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey"
            columns: ["merged_player_id"]
            isOneToOne: true
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey"
            columns: ["merged_player_id"]
            isOneToOne: true
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey"
            columns: ["merged_player_id"]
            isOneToOne: true
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey"
            columns: ["merged_player_id"]
            isOneToOne: true
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
        ]
      }
      players: {
        Row: {
          canonical_name: string
          consent_note: string | null
          consent_recorded_at: string | null
          created_at: string
          dob: string | null
          height_cm: number | null
          id: string
          name_latin: string | null
          nationality: string | null
          photo_url: string | null
          position: string | null
          social_links: Json
          user_id: string | null
          visibility: string
          weight_kg: number | null
        }
        Insert: {
          canonical_name: string
          consent_note?: string | null
          consent_recorded_at?: string | null
          created_at?: string
          dob?: string | null
          height_cm?: number | null
          id?: string
          name_latin?: string | null
          nationality?: string | null
          photo_url?: string | null
          position?: string | null
          social_links?: Json
          user_id?: string | null
          visibility?: string
          weight_kg?: number | null
        }
        Update: {
          canonical_name?: string
          consent_note?: string | null
          consent_recorded_at?: string | null
          created_at?: string
          dob?: string | null
          height_cm?: number | null
          id?: string
          name_latin?: string | null
          nationality?: string | null
          photo_url?: string | null
          position?: string | null
          social_links?: Json
          user_id?: string | null
          visibility?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      product_catalog: {
        Row: {
          client_id: string
          continue_urls: string[]
          display_name: string
          enabled: boolean
          id: string
          logo_url: string | null
          scim_token: string | null
        }
        Insert: {
          client_id: string
          continue_urls?: string[]
          display_name: string
          enabled?: boolean
          id: string
          logo_url?: string | null
          scim_token?: string | null
        }
        Update: {
          client_id?: string
          continue_urls?: string[]
          display_name?: string
          enabled?: boolean
          id?: string
          logo_url?: string | null
          scim_token?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          is_available: boolean | null
          name: string
          name_en: string | null
          price_mnt: number
          slug: string
          updated_at: string | null
          variants: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_available?: boolean | null
          name: string
          name_en?: string | null
          price_mnt: number
          slug: string
          updated_at?: string | null
          variants?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_available?: boolean | null
          name?: string
          name_en?: string | null
          price_mnt?: number
          slug?: string
          updated_at?: string | null
          variants?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      public_error_reports: {
        Row: {
          contact: string | null
          created_at: string | null
          game_id: string | null
          id: string
          message: string
          player_id: string | null
          reporter_hash: string
          status: string
        }
        Insert: {
          contact?: string | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          message: string
          player_id?: string | null
          reporter_hash: string
          status?: string
        }
        Update: {
          contact?: string | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          message?: string
          player_id?: string | null
          reporter_hash?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_error_reports_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_error_reports_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_error_reports_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
        ]
      }
      reserved_usernames: {
        Row: {
          username: string
        }
        Insert: {
          username: string
        }
        Update: {
          username?: string
        }
        Relationships: []
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
          description: string | null
          id: string
          is_system: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      roster_availability: {
        Row: {
          created_at: string
          game_date: string
          id: string
          note: string | null
          player_id: string
          status: string
          team_season_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_date: string
          id?: string
          note?: string | null
          player_id: string
          status: string
          team_season_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_date?: string
          id?: string
          note?: string | null
          player_id?: string
          status?: string
          team_season_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      roster_entries: {
        Row: {
          created_at: string
          id: string
          jersey_number: number | null
          joined_at: string
          left_at: string | null
          player_id: string
          position: string | null
          team_season_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jersey_number?: number | null
          joined_at?: string
          left_at?: string | null
          player_id: string
          position?: string | null
          team_season_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jersey_number?: number | null
          joined_at?: string
          left_at?: string | null
          player_id?: string
          position?: string | null
          team_season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      roster_snapshots: {
        Row: {
          captured_at: string
          created_at: string
          id: string
          jersey_number: number | null
          player_id: string
          position: string | null
          status: string
          team_season_id: string
        }
        Insert: {
          captured_at?: string
          created_at?: string
          id?: string
          jersey_number?: number | null
          player_id: string
          position?: string | null
          status?: string
          team_season_id: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          id?: string
          jersey_number?: number | null
          player_id?: string
          position?: string | null
          status?: string
          team_season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      saml_assertions: {
        Row: {
          attributes: Json | null
          created_at: string
          id: string
          idp_id: string
          ip_address: unknown
          name_id: string | null
          session_index: string | null
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          id?: string
          idp_id: string
          ip_address?: unknown
          name_id?: string | null
          session_index?: string | null
          status: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          id?: string
          idp_id?: string
          ip_address?: unknown
          name_id?: string | null
          session_index?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_assertions_idp_id_fkey"
            columns: ["idp_id"]
            isOneToOne: false
            referencedRelation: "saml_idps"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_idps: {
        Row: {
          active: boolean
          certificate: string
          created_at: string
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string | null
          name: string
          name_id_format: string
          organization_id: string | null
          product_id: string | null
          slo_url: string | null
          sso_url: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          certificate: string
          created_at?: string
          entity_id: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string | null
          name: string
          name_id_format?: string
          organization_id?: string | null
          product_id?: string | null
          slo_url?: string | null
          sso_url: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          certificate?: string
          created_at?: string
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string | null
          name?: string
          name_id_format?: string
          organization_id?: string | null
          product_id?: string | null
          slo_url?: string | null
          sso_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saml_idps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_idps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      season_player_stats: {
        Row: {
          ast: number | null
          blk: number | null
          competition_id: string
          dreb: number | null
          fga: number | null
          fgm: number | null
          fta: number | null
          ftm: number | null
          gp: number
          mpg: number | null
          oreb: number | null
          pf: number | null
          player_id: string
          pts: number | null
          seconds_played: number | null
          stl: number | null
          team_season_id: string
          tov: number | null
          tpa: number | null
          tpm: number | null
        }
        Insert: {
          ast?: number | null
          blk?: number | null
          competition_id: string
          dreb?: number | null
          fga?: number | null
          fgm?: number | null
          fta?: number | null
          ftm?: number | null
          gp?: number
          mpg?: number | null
          oreb?: number | null
          pf?: number | null
          player_id: string
          pts?: number | null
          seconds_played?: number | null
          stl?: number | null
          team_season_id: string
          tov?: number | null
          tpa?: number | null
          tpm?: number | null
        }
        Update: {
          ast?: number | null
          blk?: number | null
          competition_id?: string
          dreb?: number | null
          fga?: number | null
          fgm?: number | null
          fta?: number | null
          ftm?: number | null
          gp?: number
          mpg?: number | null
          oreb?: number | null
          pf?: number | null
          player_id?: string
          pts?: number | null
          seconds_played?: number | null
          stl?: number | null
          team_season_id?: string
          tov?: number | null
          tpa?: number | null
          tpm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "season_player_stats_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_player_stats_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          ends_on: string | null
          id: string
          league_id: string
          name: string
          starts_on: string | null
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          id?: string
          league_id: string
          name: string
          starts_on?: string | null
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          id?: string
          league_id?: string
          name?: string
          starts_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_leaders"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_standings"
            referencedColumns: ["league_id"]
          },
        ]
      }
      source_submissions: {
        Row: {
          confidence: number | null
          evidence_url: string | null
          game_id: string
          id: string
          idempotency_key: string | null
          normalized_payload: Json
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rights_confirmed_at: string | null
          source_type: string
          status: string
          submitted_at: string
          submitted_by: string
        }
        Insert: {
          confidence?: number | null
          evidence_url?: string | null
          game_id: string
          id?: string
          idempotency_key?: string | null
          normalized_payload: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rights_confirmed_at?: string | null
          source_type: string
          status?: string
          submitted_at?: string
          submitted_by: string
        }
        Update: {
          confidence?: number | null
          evidence_url?: string | null
          game_id?: string
          id?: string
          idempotency_key?: string | null
          normalized_payload?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rights_confirmed_at?: string | null
          source_type?: string
          status?: string
          submitted_at?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_submissions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_submissions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_submissions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_placements: {
        Row: {
          competition_id: string
          created_at: string
          ends_on: string
          id: string
          slot: string
          sponsor_id: string
          starts_on: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          ends_on: string
          id?: string
          slot: string
          sponsor_id: string
          starts_on: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          ends_on?: string
          id?: string
          slot?: string
          sponsor_id?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_placements_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_placements_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "sponsor_placements_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_placements_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "v_public_sponsor_slots"
            referencedColumns: ["sponsor_id"]
          },
        ]
      }
      sponsors: {
        Row: {
          active: boolean
          created_at: string
          id: string
          link_url: string | null
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          link_url?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          link_url?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sports: {
        Row: {
          config: Json
          created_at: string
          id: string
          key: string
          name_en: string
          name_mn: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          key: string
          name_en: string
          name_mn: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          key?: string
          name_en?: string
          name_mn?: string
        }
        Relationships: []
      }
      sso_audit_events: {
        Row: {
          client_id: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          occurred_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          occurred_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          occurred_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      standings: {
        Row: {
          competition_id: string
          gb: number | null
          l: number
          last10: string | null
          losses: number
          points_against: number | null
          points_for: number | null
          streak: string | null
          team_season_id: string
          w: number
          win_pct: number
          wins: number
        }
        Insert: {
          competition_id: string
          gb?: number | null
          l?: number
          last10?: string | null
          losses?: number
          points_against?: number | null
          points_for?: number | null
          streak?: string | null
          team_season_id: string
          w?: number
          win_pct?: number
          wins?: number
        }
        Update: {
          competition_id?: string
          gb?: number | null
          l?: number
          last10?: string | null
          losses?: number
          points_against?: number | null
          points_for?: number | null
          streak?: string | null
          team_season_id?: string
          w?: number
          win_pct?: number
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      stat_event_types: {
        Row: {
          category: string
          key: string
          requires_player: boolean
          sport_key: string
        }
        Insert: {
          category: string
          key: string
          requires_player?: boolean
          sport_key: string
        }
        Update: {
          category?: string
          key?: string
          requires_player?: boolean
          sport_key?: string
        }
        Relationships: []
      }
      stat_events: {
        Row: {
          client_id: string
          clock_seconds: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          event_type: string
          game_id: string
          id: string
          local_seq: number
          payload: Json
          period: number
          player_id: string | null
          superseded_by: string | null
          team_season_id: string | null
        }
        Insert: {
          client_id: string
          clock_seconds: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          event_type: string
          game_id: string
          id?: string
          local_seq: number
          payload?: Json
          period: number
          player_id?: string | null
          superseded_by?: string | null
          team_season_id?: string | null
        }
        Update: {
          client_id?: string
          clock_seconds?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          event_type?: string
          game_id?: string
          id?: string
          local_seq?: number
          payload?: Json
          period?: number
          player_id?: string | null
          superseded_by?: string | null
          team_season_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stat_events_event_type_fkey"
            columns: ["event_type"]
            isOneToOne: false
            referencedRelation: "stat_event_types"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "stat_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stat_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stat_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stat_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stat_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "stat_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "stat_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "stat_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stat_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "stat_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "stat_events_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "stat_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      team_seasons: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          team_id: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          team_id: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_id"]
          },
        ]
      }
      team_staff: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          role: string
          team_season_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          role: string
          team_season_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: string
          team_season_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_staff_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      team_transactions: {
        Row: {
          amount_mnt: number
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          id: string
          paid_at: string | null
          paid_by: string | null
          team_season_id: string
          type: string
        }
        Insert: {
          amount_mnt: number
          created_at?: string
          created_by: string
          description: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          team_season_id: string
          type: string
        }
        Update: {
          amount_mnt?: number
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          team_season_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_transactions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          league_id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          short_code: string
          slug: string
          social_links: Json
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          short_code: string
          slug: string
          social_links?: Json
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          short_code?: string
          slug?: string
          social_links?: Json
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_leaders"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["league_id"]
          },
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "v_public_standings"
            referencedColumns: ["league_id"]
          },
        ]
      }
      tracker_sessions: {
        Row: {
          closed_at: string | null
          closure_reason: string | null
          device_info: Json
          game_id: string
          handed_off_to_session_id: string | null
          id: string
          last_acknowledged_sequence: number
          role: string
          scorer_id: string
          started_at: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          closure_reason?: string | null
          device_info?: Json
          game_id: string
          handed_off_to_session_id?: string | null
          id?: string
          last_acknowledged_sequence?: number
          role: string
          scorer_id: string
          started_at?: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          closure_reason?: string | null
          device_info?: Json
          game_id?: string
          handed_off_to_session_id?: string | null
          id?: string
          last_acknowledged_sequence?: number
          role?: string
          scorer_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracker_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_sessions_handed_off_to_session_id_fkey"
            columns: ["handed_off_to_session_id"]
            isOneToOne: false
            referencedRelation: "tracker_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_cancelled: boolean | null
          location: string | null
          scheduled_at: string
          team_season_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_cancelled?: boolean | null
          location?: string | null
          scheduled_at: string
          team_season_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_cancelled?: boolean | null
          location?: string | null
          scheduled_at?: string
          team_season_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      transfers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          effective_from: string
          effective_until: string | null
          from_team_season_id: string | null
          id: string
          note: string | null
          player_id: string
          to_team_season_id: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          effective_from: string
          effective_until?: string | null
          from_team_season_id?: string | null
          id?: string
          note?: string | null
          player_id: string
          to_team_season_id: string
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          effective_from?: string
          effective_until?: string | null
          from_team_season_id?: string | null
          id?: string
          note?: string | null
          player_id?: string
          to_team_season_id?: string
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_team_season_id_fkey"
            columns: ["from_team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey"
            columns: ["from_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey"
            columns: ["from_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey"
            columns: ["from_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey"
            columns: ["from_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey"
            columns: ["from_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey"
            columns: ["from_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey"
            columns: ["to_team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey"
            columns: ["to_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey"
            columns: ["to_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey"
            columns: ["to_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey"
            columns: ["to_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey"
            columns: ["to_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey"
            columns: ["to_team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number | null
          city: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          capacity?: number | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string
          subscription_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type: string
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          status: string
          subscription_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          id: string
          product_id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          product_id: string
          secret?: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          product_id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_public_awards: {
        Row: {
          award_type: string | null
          competition_id: string | null
          competition_name: string | null
          granted_at: string | null
          id: string | null
          note: string | null
          period_end: string | null
          period_start: string | null
          player_id: string | null
          player_name: string | null
        }
        Relationships: []
      }
      v_public_box_score: {
        Row: {
          ast: number | null
          blk: number | null
          dreb: number | null
          evidence_url: string | null
          fga: number | null
          fgm: number | null
          fta: number | null
          ftm: number | null
          game_id: string | null
          jersey_number: number | null
          oreb: number | null
          pf: number | null
          player_id: string | null
          player_name: string | null
          player_name_latin: string | null
          player_position: string | null
          pts: number | null
          revision_approved_at: string | null
          revision_id: string | null
          revision_number: number | null
          seconds_played: number | null
          source_reviewed_at: string | null
          source_type: string | null
          stl: number | null
          team_id: string | null
          team_name: string | null
          team_season_id: string | null
          tov: number | null
          tpa: number | null
          tpm: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_player_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_player_stats_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "game_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_id"]
          },
        ]
      }
      v_public_games: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          away_team_logo_url: string | null
          away_team_name: string | null
          away_team_primary_color: string | null
          away_team_season_id: string | null
          away_team_short_code: string | null
          away_team_slug: string | null
          competition_id: string | null
          competition_name: string | null
          current_period: number | null
          current_revision_number: number | null
          evidence_url: string | null
          home_score: number | null
          home_team_id: string | null
          home_team_logo_url: string | null
          home_team_name: string | null
          home_team_primary_color: string | null
          home_team_season_id: string | null
          home_team_short_code: string | null
          home_team_slug: string | null
          id: string | null
          is_provisional: boolean | null
          league_id: string | null
          league_name: string | null
          league_slug: string | null
          published_at: string | null
          revision_approved_at: string | null
          revision_id: string | null
          revision_number: number | null
          scheduled_at: string | null
          season_id: string | null
          season_name: string | null
          source_reviewed_at: string | null
          source_reviewer_id: string | null
          source_submission_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["game_status"] | null
          venue_id: string | null
          venue_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "games_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      v_public_leaders: {
        Row: {
          ast: number | null
          blk: number | null
          competition_id: string | null
          competition_name: string | null
          dreb: number | null
          fga: number | null
          fgm: number | null
          fta: number | null
          ftm: number | null
          gp: number | null
          league_id: string | null
          league_name: string | null
          league_slug: string | null
          mpg: number | null
          oreb: number | null
          pf: number | null
          player_id: string | null
          player_name: string | null
          player_name_latin: string | null
          player_photo_url: string | null
          player_position: string | null
          pts: number | null
          qualified: boolean | null
          season_id: string | null
          season_name: string | null
          stl: number | null
          team_games_played: number | null
          team_id: string | null
          team_logo_url: string | null
          team_name: string | null
          team_primary_color: string | null
          team_season_id: string | null
          team_short_code: string | null
          team_slug: string | null
          tov: number | null
          tpa: number | null
          tpm: number | null
        }
        Relationships: [
          {
            foreignKeyName: "season_player_stats_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_player_stats_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_directory"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_shot_zones"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_id"]
          },
        ]
      }
      v_public_live_games: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          away_team_logo_url: string | null
          away_team_name: string | null
          away_team_primary_color: string | null
          away_team_season_id: string | null
          away_team_short_code: string | null
          away_team_slug: string | null
          competition_id: string | null
          competition_name: string | null
          current_period: number | null
          current_revision_number: number | null
          evidence_url: string | null
          home_score: number | null
          home_team_id: string | null
          home_team_logo_url: string | null
          home_team_name: string | null
          home_team_primary_color: string | null
          home_team_season_id: string | null
          home_team_short_code: string | null
          home_team_slug: string | null
          id: string | null
          is_provisional: boolean | null
          league_id: string | null
          league_name: string | null
          league_slug: string | null
          published_at: string | null
          revision_approved_at: string | null
          revision_id: string | null
          revision_number: number | null
          scheduled_at: string | null
          season_id: string | null
          season_name: string | null
          source_reviewed_at: string | null
          source_reviewer_id: string | null
          source_submission_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["game_status"] | null
          venue_id: string | null
          venue_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "games_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      v_public_player_directory: {
        Row: {
          assists_per_game: number | null
          games_played: number | null
          photo_url: string | null
          player_id: string | null
          player_name: string | null
          player_name_latin: string | null
          player_position: string | null
          points_per_game: number | null
          rebounds_per_game: number | null
          team_logo_url: string | null
          team_name: string | null
          team_primary_color: string | null
          team_short_code: string | null
          team_slug: string | null
        }
        Relationships: []
      }
      v_public_player_profiles: {
        Row: {
          ast_per_game: number | null
          blk_per_game: number | null
          competition_id: string | null
          competition_name: string | null
          dob: string | null
          dreb_per_game: number | null
          fga_per_game: number | null
          fgm_per_game: number | null
          fta_per_game: number | null
          ftm_per_game: number | null
          games_played: number | null
          height_cm: number | null
          jersey_number: number | null
          league_id: string | null
          league_name: string | null
          league_slug: string | null
          minutes_per_game: number | null
          nationality: string | null
          oreb_per_game: number | null
          pf_per_game: number | null
          photo_url: string | null
          player_id: string | null
          player_name: string | null
          player_name_latin: string | null
          player_position: string | null
          points_per_game: number | null
          season_id: string | null
          season_name: string | null
          social_links: Json | null
          stl_per_game: number | null
          team_id: string | null
          team_logo_url: string | null
          team_name: string | null
          team_primary_color: string | null
          team_season_id: string | null
          team_short_code: string | null
          team_slug: string | null
          tov_per_game: number | null
          tpa_per_game: number | null
          tpm_per_game: number | null
          weight_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_id"]
          },
        ]
      }
      v_public_players: {
        Row: {
          canonical_name: string | null
          id: string | null
          name_latin: string | null
          photo_url: string | null
          short_code: string | null
          team_name: string | null
          team_slug: string | null
        }
        Relationships: []
      }
      v_public_shop_products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          images: Json | null
          name: string | null
          name_en: string | null
          price_mnt: number | null
          slug: string | null
          updated_at: string | null
          variants: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: Json | null
          name?: string | null
          name_en?: string | null
          price_mnt?: number | null
          slug?: string | null
          updated_at?: string | null
          variants?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: Json | null
          name?: string | null
          name_en?: string | null
          price_mnt?: number | null
          slug?: string | null
          updated_at?: string | null
          variants?: Json | null
        }
        Relationships: []
      }
      v_public_shot_zones: {
        Row: {
          attempted: number | null
          competition_id: string | null
          made: number | null
          player_id: string | null
          team_season_id: string | null
          zone_key: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "team_seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
        ]
      }
      v_public_sponsor_slots: {
        Row: {
          competition_id: string | null
          ends_on: string | null
          link_url: string | null
          logo_url: string | null
          placement_id: string | null
          slot: string | null
          sponsor_id: string | null
          sponsor_name: string | null
          starts_on: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_placements_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_placements_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
        ]
      }
      v_public_standings: {
        Row: {
          competition_id: string | null
          competition_name: string | null
          gb: number | null
          last10: string | null
          league_id: string | null
          league_slug: string | null
          losses: number | null
          points_against: number | null
          points_for: number | null
          season_id: string | null
          season_name: string | null
          streak: string | null
          team_id: string | null
          team_logo_url: string | null
          team_name: string | null
          team_primary_color: string | null
          team_season_id: string | null
          team_short_code: string | null
          team_slug: string | null
          win_pct: number | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "standings_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "team_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_season_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_season_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_player_profiles"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "standings_team_season_id_fkey"
            columns: ["team_season_id"]
            isOneToOne: false
            referencedRelation: "v_public_team_roster"
            referencedColumns: ["team_season_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_id"]
          },
        ]
      }
      v_public_team_roster: {
        Row: {
          competition_id: string | null
          jersey_number: number | null
          photo_url: string | null
          player_id: string | null
          player_name: string | null
          player_name_latin: string | null
          player_position: string | null
          roster_entry_id: string | null
          roster_position: string | null
          team_id: string | null
          team_logo_url: string | null
          team_name: string | null
          team_primary_color: string | null
          team_season_id: string | null
          team_short_code: string | null
          team_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "v_public_awards"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_games"
            referencedColumns: ["home_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["away_team_id"]
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_public_live_games"
            referencedColumns: ["home_team_id"]
          },
        ]
      }
    }
    Functions: {
      apply_derived_stats:
        | {
            Args: {
              p_away_score: number
              p_game_id: string
              p_home_score: number
              p_status: Database["public"]["Enums"]["game_status"]
            }
            Returns: undefined
          }
        | {
            Args: {
              p_away_score: number
              p_game_id: string
              p_home_score: number
              p_player_stats: Json
              p_status: string
              p_team_stats: Json
            }
            Returns: undefined
          }
      cmd_apply_correction: {
        Args: {
          p_correction_id: string
          p_journal: Json
          p_projection: Json
          p_validation_warnings?: Json
        }
        Returns: {
          evidence_url: string | null
          game_id: string
          id: string
          proposed_change: Json
          reason: string
          requested_at: string
          requested_by: string
          resolved_at: string | null
          resolved_by: string | null
          resulting_revision_id: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "correction_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_approve_revision: {
        Args: { p_approved: boolean; p_revision_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          game_id: string
          id: string
          journal: Json
          parent_revision_id: string | null
          projection: Json
          revision_number: number
          source_submission_id: string
          state: string
          validation_warnings: Json
        }
        SetofOptions: {
          from: "*"
          to: "game_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_approve_source: {
        Args: { p_approved: boolean; p_note?: string; p_submission_id: string }
        Returns: {
          confidence: number | null
          evidence_url: string | null
          game_id: string
          id: string
          idempotency_key: string | null
          normalized_payload: Json
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rights_confirmed_at: string | null
          source_type: string
          status: string
          submitted_at: string
          submitted_by: string
        }
        SetofOptions: {
          from: "*"
          to: "source_submissions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_assign_role: {
        Args: {
          p_role: Database["public"]["Enums"]["membership_role"]
          p_scope_id: string
          p_scope_type: Database["public"]["Enums"]["membership_scope"]
          p_user_id: string
        }
        Returns: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          scope_id: string
          scope_type: Database["public"]["Enums"]["membership_scope"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_assign_scorer: {
        Args: { p_game_id: string; p_role: string; p_user_id: string }
        Returns: {
          game_id: string
          id: string
          role: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "game_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_assign_team_staff: {
        Args: { p_role: string; p_team_season_id: string; p_user_id: string }
        Returns: {
          created_at: string
          id: string
          is_active: boolean | null
          role: string
          team_season_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "team_staff"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_attach_shop_invoice: {
        Args: {
          p_order_id: string
          p_qpay_invoice_id: string
          p_qpay_qr_image: string
        }
        Returns: Json
      }
      cmd_check_eligibility: {
        Args: { p_competition_id: string; p_player_id: string }
        Returns: {
          eligible: boolean
          reason: string
          team_name: string
        }[]
      }
      cmd_confirm_payment: {
        Args: { p_payment_id: string }
        Returns: {
          amount_mnt: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          method: string | null
          notes: string | null
          reference: string | null
          status: string
          student_id: string
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "academy_payment_ledger"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_confirm_shop_payment: {
        Args: {
          p_currency?: string
          p_order_id: string
          p_paid_amount_mnt: number
          p_qpay_invoice_id: string
        }
        Returns: Json
      }
      cmd_create_announcement: {
        Args: {
          p_academy_id: string
          p_body: string
          p_program_id?: string
          p_title: string
        }
        Returns: {
          academy_id: string
          body: string
          created_at: string
          created_by: string
          id: string
          program_id: string | null
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "academy_announcements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_create_correction: {
        Args: {
          p_evidence_url?: string
          p_game_id: string
          p_proposed_change?: Json
          p_reason: string
        }
        Returns: {
          evidence_url: string | null
          game_id: string
          id: string
          proposed_change: Json
          reason: string
          requested_at: string
          requested_by: string
          resolved_at: string | null
          resolved_by: string | null
          resulting_revision_id: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "correction_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_create_enrollment: {
        Args: {
          p_end_date?: string
          p_notes?: string
          p_program_id: string
          p_start_date?: string
          p_student_id: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          end_date: string | null
          enrolled_at: string
          id: string
          notes: string | null
          program_id: string
          start_date: string | null
          status: string
          student_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "academy_enrollments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_create_revision: {
        Args: {
          p_journal: Json
          p_projection: Json
          p_submission_id: string
          p_validation_warnings?: Json
        }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          game_id: string
          id: string
          journal: Json
          parent_revision_id: string | null
          projection: Json
          revision_number: number
          source_submission_id: string
          state: string
          validation_warnings: Json
        }
        SetofOptions: {
          from: "*"
          to: "game_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_create_shop_order: {
        Args: {
          p_customer_name: string
          p_phone: string
          p_product_id: string
          p_variant_index: number
        }
        Returns: Json
      }
      cmd_create_student: {
        Args: {
          p_academy_id: string
          p_allergies?: string[]
          p_canonical_name: string
          p_date_of_birth?: string
          p_emergency_contact_name?: string
          p_emergency_contact_phone?: string
          p_grade_level?: string
          p_medical_notes?: string
          p_name_latin?: string
          p_notes?: string
          p_photo_url?: string
          p_school_name?: string
        }
        Returns: {
          academy_id: string
          allergies: string[] | null
          canonical_name: string
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          grade_level: string | null
          id: string
          medical_notes: string | null
          name_latin: string | null
          notes: string | null
          photo_url: string | null
          school_name: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "academy_students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_handoff_session: {
        Args: { p_reason: string; p_session_id: string; p_to_user_id: string }
        Returns: {
          closed_at: string | null
          closure_reason: string | null
          device_info: Json
          game_id: string
          handed_off_to_session_id: string | null
          id: string
          last_acknowledged_sequence: number
          role: string
          scorer_id: string
          started_at: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "tracker_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_increment_page_view: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: undefined
      }
      cmd_join_waitlist: {
        Args: { p_program_id: string; p_student_id: string }
        Returns: {
          created_at: string
          id: string
          note: string | null
          position: number
          program_id: string
          status: string
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "academy_waitlists"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_list_members: {
        Args: {
          p_scope_id: string
          p_scope_type: Database["public"]["Enums"]["membership_scope"]
        }
        Returns: {
          created_at: string
          display_name: string
          membership_id: string
          role: Database["public"]["Enums"]["membership_role"]
          user_email: string
          user_id: string
        }[]
      }
      cmd_open_tracker_session: {
        Args: { p_device_info?: Json; p_game_id: string; p_role: string }
        Returns: {
          closed_at: string | null
          closure_reason: string | null
          device_info: Json
          game_id: string
          handed_off_to_session_id: string | null
          id: string
          last_acknowledged_sequence: number
          role: string
          scorer_id: string
          started_at: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "tracker_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_record_attendance: {
        Args: {
          p_note?: string
          p_program_id: string
          p_session_date: string
          p_status: string
          p_student_id: string
        }
        Returns: {
          id: string
          is_offline: boolean | null
          note: string | null
          program_id: string
          recorded_at: string
          recorded_by: string
          session_date: string
          status: string
          student_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "academy_attendance"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_record_event: {
        Args: {
          p_client_id: string
          p_clock_seconds: number
          p_event_type: string
          p_game_id: string
          p_local_seq: number
          p_operation_id: string
          p_payload?: Json
          p_period: number
          p_player_id: string
          p_team_season_id: string
          p_tracker_session_id: string
        }
        Returns: {
          client_id: string
          clock_seconds: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          event_type: string
          game_id: string
          id: string
          local_seq: number
          payload: Json
          period: number
          player_id: string | null
          superseded_by: string | null
          team_season_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "stat_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_record_payment: {
        Args: {
          p_amount_mnt: number
          p_enrollment_id?: string
          p_method: string
          p_notes?: string
          p_reference?: string
          p_student_id: string
          p_type: string
        }
        Returns: {
          amount_mnt: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          method: string | null
          notes: string | null
          reference: string | null
          status: string
          student_id: string
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "academy_payment_ledger"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_record_transfer: {
        Args: {
          p_effective_from: string
          p_from_team_season_id: string
          p_note?: string
          p_player_id: string
          p_to_team_season_id: string
          p_transfer_type: string
        }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          effective_from: string
          effective_until: string | null
          from_team_season_id: string | null
          id: string
          note: string | null
          player_id: string
          to_team_season_id: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_remove_role: { Args: { p_membership_id: string }; Returns: undefined }
      cmd_report_public_error: {
        Args: {
          p_contact: string
          p_game_id: string
          p_message: string
          p_player_id: string
          p_reporter_hash: string
        }
        Returns: {
          contact: string | null
          created_at: string | null
          game_id: string | null
          id: string
          message: string
          player_id: string | null
          reporter_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "public_error_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_review_correction: {
        Args: { p_approved: boolean; p_correction_id: string }
        Returns: {
          evidence_url: string | null
          game_id: string
          id: string
          proposed_change: Json
          reason: string
          requested_at: string
          requested_by: string
          resolved_at: string | null
          resolved_by: string | null
          resulting_revision_id: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "correction_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_set_placement: {
        Args: {
          p_competition_id: string
          p_ends_on: string
          p_slot: string
          p_sponsor_id: string
          p_starts_on: string
        }
        Returns: {
          competition_id: string
          created_at: string
          ends_on: string
          id: string
          slot: string
          sponsor_id: string
          starts_on: string
        }
        SetofOptions: {
          from: "*"
          to: "sponsor_placements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_snapshot_roster: {
        Args: { p_team_season_id: string }
        Returns: {
          captured_at: string
          created_at: string
          id: string
          jersey_number: number | null
          player_id: string
          position: string | null
          status: string
          team_season_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "roster_snapshots"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cmd_submit_source: {
        Args: {
          p_confidence: number
          p_evidence_url: string
          p_game_id: string
          p_idempotency_key: string
          p_normalized_payload: Json
          p_rights_confirmed: boolean
          p_source_type: string
        }
        Returns: {
          confidence: number | null
          evidence_url: string | null
          game_id: string
          id: string
          idempotency_key: string | null
          normalized_payload: Json
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rights_confirmed_at: string | null
          source_type: string
          status: string
          submitted_at: string
          submitted_by: string
        }
        SetofOptions: {
          from: "*"
          to: "source_submissions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_transition_game: {
        Args: {
          p_game_id: string
          p_to_status: Database["public"]["Enums"]["game_status"]
        }
        Returns: {
          away_score: number | null
          away_team_season_id: string
          competition_id: string
          created_at: string
          current_period: number
          current_revision_number: number
          home_score: number | null
          home_team_season_id: string
          id: string
          published_at: string | null
          ruleset_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["game_status"]
          venue_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "games"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_update_enrollment: {
        Args: { p_enrollment_id: string; p_notes?: string; p_status?: string }
        Returns: {
          created_at: string
          created_by: string | null
          end_date: string | null
          enrolled_at: string
          id: string
          notes: string | null
          program_id: string
          start_date: string | null
          status: string
          student_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "academy_enrollments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_update_organization: {
        Args: {
          p_contact_email?: string
          p_contact_phone?: string
          p_logo_url?: string
          p_name?: string
          p_org_id: string
          p_settings?: Json
          p_slug?: string
          p_social_links?: Json
          p_website?: string
        }
        Returns: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          social_links: Json
          type: string
          updated_at: string
          website: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_update_shop_product: {
        Args: {
          p_category?: string
          p_description?: string
          p_images?: Json
          p_is_available?: boolean
          p_name?: string
          p_name_en?: string
          p_price_mnt?: number
          p_product_id: string
          p_slug?: string
          p_variants?: Json
        }
        Returns: Json
      }
      cmd_update_student: {
        Args: {
          p_allergies?: string[]
          p_canonical_name?: string
          p_date_of_birth?: string
          p_emergency_contact_name?: string
          p_emergency_contact_phone?: string
          p_grade_level?: string
          p_medical_notes?: string
          p_name_latin?: string
          p_notes?: string
          p_photo_url?: string
          p_school_name?: string
          p_status?: string
          p_student_id: string
        }
        Returns: {
          academy_id: string
          allergies: string[] | null
          canonical_name: string
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          grade_level: string | null
          id: string
          medical_notes: string | null
          name_latin: string | null
          notes: string | null
          photo_url: string | null
          school_name: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "academy_students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_upsert_sponsor: {
        Args: {
          p_active?: boolean
          p_id?: string
          p_link_url?: string
          p_logo_url?: string
          p_name: string
        }
        Returns: {
          active: boolean
          created_at: string
          id: string
          link_url: string | null
          logo_url: string | null
          name: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sponsors"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cmd_void_event: {
        Args: { p_event_id: string; p_reason: string }
        Returns: {
          client_id: string
          clock_seconds: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          event_type: string
          game_id: string
          id: string
          local_seq: number
          payload: Json
          period: number
          player_id: string | null
          superseded_by: string | null
          team_season_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "stat_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      game_league_id: { Args: { p_game_id: string }; Returns: string }
      get_dashboard_metrics: { Args: { p_org_id: string }; Returns: Json }
      get_full_dashboard_data:
        | {
            Args: { p_branch_id?: string; p_org_id: string; p_period?: string }
            Returns: Json
          }
        | {
            Args: {
              p_branch_id?: string
              p_date_from?: string
              p_date_to?: string
              p_org_id: string
              p_period?: string
            }
            Returns: Json
          }
      is_game_scorekeeper: { Args: { p_game_id: string }; Returns: boolean }
      is_league_admin: { Args: { p_league_id: string }; Returns: boolean }
      refresh_season_player_stats: {
        Args: { p_competition_id: string }
        Returns: undefined
      }
      refresh_standings: {
        Args: { p_competition_id: string }
        Returns: undefined
      }
      resolve_username: {
        Args: { identifier: string }
        Returns: {
          user_email: string
          user_id: string
        }[]
      }
      validate_username: {
        Args: { username_to_check: string }
        Returns: undefined
      }
    }
    Enums: {
      competition_type: "regular" | "playoff" | "cup" | "friendly"
      game_status:
        | "scheduled"
        | "live_provisional"
        | "final_pending_review"
        | "league_verified"
        | "live"
        | "final"
        | "verified"
        | "official"
        | "cancelled"
        | "postponed"
      membership_role:
        | "owner"
        | "admin"
        | "manager"
        | "scorekeeper"
        | "finance"
        | "trainer"
        | "viewer"
        | "coordinator"
      membership_scope: "org" | "league" | "team"
      order_status: "pending" | "paid" | "shipped" | "cancelled"
      transfer_type: "permanent" | "loan" | "free_agent" | "youth_promotion"
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
      competition_type: ["regular", "playoff", "cup", "friendly"],
      game_status: [
        "scheduled",
        "live_provisional",
        "final_pending_review",
        "league_verified",
        "live",
        "final",
        "verified",
        "official",
        "cancelled",
        "postponed",
      ],
      membership_role: [
        "owner",
        "admin",
        "manager",
        "scorekeeper",
        "finance",
        "trainer",
        "viewer",
        "coordinator",
      ],
      membership_scope: ["org", "league", "team"],
      order_status: ["pending", "paid", "shipped", "cancelled"],
      transfer_type: ["permanent", "loan", "free_agent", "youth_promotion"],
    },
  },
} as const
