// Database types — generated from schema (normally via supabase gen types)
// Manual creation due to missing Docker for local Supabase stack

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GameStatus =
  | "scheduled"
  | "live"
  | "final"
  | "verified"
  | "official"
  | "cancelled"
  | "postponed";

export type MembershipRole = "owner" | "admin" | "manager" | "scorekeeper";

export type MembershipScope = "org" | "league" | "team";

export type CompetitionType = "regular" | "playoff" | "cup" | "friendly";

export interface Database {
  public: {
    Tables: {
      sports: {
        Row: {
          id: string;
          key: string;
          name_mn: string;
          name_en: string;
          config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name_mn: string;
          name_en: string;
          config?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name_mn?: string;
          name_en?: string;
          config?: Json;
          created_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          created_at?: string;
        };
      };
      leagues: {
        Row: {
          id: string;
          organization_id: string;
          sport_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          sport_id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          sport_id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      seasons: {
        Row: {
          id: string;
          league_id: string;
          name: string;
          starts_on: string | null;
          ends_on: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          name: string;
          starts_on?: string | null;
          ends_on?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          name?: string;
          starts_on?: string | null;
          ends_on?: string | null;
          created_at?: string;
        };
      };
      competitions: {
        Row: {
          id: string;
          season_id: string;
          name: string;
          type: CompetitionType;
          tiebreaker_rules: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          name: string;
          type?: CompetitionType;
          tiebreaker_rules?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          name?: string;
          type?: CompetitionType;
          tiebreaker_rules?: Json;
          created_at?: string;
        };
      };
      venues: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          capacity: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city?: string | null;
          capacity?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string | null;
          capacity?: number | null;
          created_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          league_id: string;
          name: string;
          short_code: string;
          slug: string;
          primary_color: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          name: string;
          short_code: string;
          slug: string;
          primary_color?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          name?: string;
          short_code?: string;
          slug?: string;
          primary_color?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      team_seasons: {
        Row: {
          id: string;
          team_id: string;
          competition_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          competition_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          competition_id?: string;
          created_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          canonical_name: string;
          name_latin: string | null;
          dob: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          position: string | null;
          nationality: string | null;
          photo_url: string | null;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          canonical_name: string;
          name_latin?: string | null;
          dob?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          position?: string | null;
          nationality?: string | null;
          photo_url?: string | null;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          canonical_name?: string;
          name_latin?: string | null;
          dob?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          position?: string | null;
          nationality?: string | null;
          photo_url?: string | null;
          user_id?: string | null;
          created_at?: string;
        };
      };
      roster_entries: {
        Row: {
          id: string;
          team_season_id: string;
          player_id: string;
          jersey_number: number | null;
          position: string | null;
          joined_at: string;
          left_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_season_id: string;
          player_id: string;
          jersey_number?: number | null;
          position?: string | null;
          joined_at?: string;
          left_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_season_id?: string;
          player_id?: string;
          jersey_number?: number | null;
          position?: string | null;
          joined_at?: string;
          left_at?: string | null;
          created_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          competition_id: string;
          home_team_season_id: string;
          away_team_season_id: string;
          venue_id: string | null;
          scheduled_at: string;
          status: GameStatus;
          current_period: number;
          home_score: number | null;
          away_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          home_team_season_id: string;
          away_team_season_id: string;
          venue_id?: string | null;
          scheduled_at: string;
          status?: GameStatus;
          current_period?: number;
          home_score?: number | null;
          away_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          home_team_season_id?: string;
          away_team_season_id?: string;
          venue_id?: string | null;
          scheduled_at?: string;
          status?: GameStatus;
          current_period?: number;
          home_score?: number | null;
          away_score?: number | null;
          created_at?: string;
        };
      };
      game_rosters: {
        Row: {
          id: string;
          game_id: string;
          team_season_id: string;
          player_id: string;
          is_starter: boolean;
          dnp_reason: string | null;
        };
        Insert: {
          id?: string;
          game_id: string;
          team_season_id: string;
          player_id: string;
          is_starter?: boolean;
          dnp_reason?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string;
          team_season_id?: string;
          player_id?: string;
          is_starter?: boolean;
          dnp_reason?: string | null;
        };
      };
      game_assignments: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          role: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          role?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          role?: string;
        };
      };
      stat_event_types: {
        Row: {
          key: string;
          sport_key: string;
          category: string;
          requires_player: boolean;
        };
        Insert: {
          key: string;
          sport_key: string;
          category: string;
          requires_player?: boolean;
        };
        Update: {
          key?: string;
          sport_key?: string;
          category?: string;
          requires_player?: boolean;
        };
      };
      stat_events: {
        Row: {
          id: string;
          game_id: string;
          client_id: string;
          local_seq: number;
          event_type: string;
          period: number;
          clock_seconds: number;
          team_season_id: string | null;
          player_id: string | null;
          payload: Json;
          created_by: string | null;
          created_at: string;
          deleted_at: string | null;
          superseded_by: string | null;
        };
        Insert: {
          id?: string;
          game_id: string;
          client_id: string;
          local_seq: number;
          event_type: string;
          period: number;
          clock_seconds: number;
          team_season_id?: string | null;
          player_id?: string | null;
          payload?: Json;
          created_by?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          superseded_by?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string;
          client_id?: string;
          local_seq?: number;
          event_type?: string;
          period?: number;
          clock_seconds?: number;
          team_season_id?: string | null;
          player_id?: string | null;
          payload?: Json;
          created_by?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          superseded_by?: string | null;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          scope_type: MembershipScope;
          scope_id: string;
          role: MembershipRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scope_type: MembershipScope;
          scope_id: string;
          role: MembershipRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scope_type?: MembershipScope;
          scope_id?: string;
          role?: MembershipRole;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
        };
      };
      game_player_stats: {
        Row: {
          game_id: string;
          player_id: string;
          team_season_id: string;
          seconds_played: number | null;
          pts: number;
          fgm: number;
          fga: number;
          tpm: number;
          tpa: number;
          ftm: number;
          fta: number;
          oreb: number;
          dreb: number;
          ast: number;
          stl: number;
          blk: number;
          tov: number;
          pf: number;
        };
        Insert: {
          game_id: string;
          player_id: string;
          team_season_id: string;
          seconds_played?: number | null;
          pts?: number;
          fgm?: number;
          fga?: number;
          tpm?: number;
          tpa?: number;
          ftm?: number;
          fta?: number;
          oreb?: number;
          dreb?: number;
          ast?: number;
          stl?: number;
          blk?: number;
          tov?: number;
          pf?: number;
        };
        Update: {
          game_id?: string;
          player_id?: string;
          team_season_id?: string;
          seconds_played?: number | null;
          pts?: number;
          fgm?: number;
          fga?: number;
          tpm?: number;
          tpa?: number;
          ftm?: number;
          fta?: number;
          oreb?: number;
          dreb?: number;
          ast?: number;
          stl?: number;
          blk?: number;
          tov?: number;
          pf?: number;
        };
      };
      game_team_stats: {
        Row: {
          game_id: string;
          team_season_id: string;
          pts: number;
          fgm: number;
          fga: number;
          tpm: number;
          tpa: number;
          ftm: number;
          fta: number;
          oreb: number;
          dreb: number;
          team_reb: number;
          ast: number;
          stl: number;
          blk: number;
          tov: number;
          pf: number;
        };
        Insert: {
          game_id: string;
          team_season_id: string;
          pts?: number;
          fgm?: number;
          fga?: number;
          tpm?: number;
          tpa?: number;
          ftm?: number;
          fta?: number;
          oreb?: number;
          dreb?: number;
          team_reb?: number;
          ast?: number;
          stl?: number;
          blk?: number;
          tov?: number;
          pf?: number;
        };
        Update: {
          game_id?: string;
          team_season_id?: string;
          pts?: number;
          fgm?: number;
          fga?: number;
          tpm?: number;
          tpa?: number;
          ftm?: number;
          fta?: number;
          oreb?: number;
          dreb?: number;
          team_reb?: number;
          ast?: number;
          stl?: number;
          blk?: number;
          tov?: number;
          pf?: number;
        };
      };
      season_player_stats: {
        Row: {
          competition_id: string;
          player_id: string;
          team_season_id: string;
          gp: number;
          seconds_played: number | null;
          pts: number;
          fgm: number;
          fga: number;
          tpm: number;
          tpa: number;
          ftm: number;
          fta: number;
          oreb: number;
          dreb: number;
          ast: number;
          stl: number;
          blk: number;
          tov: number;
          pf: number;
        };
        Insert: {
          competition_id: string;
          player_id: string;
          team_season_id: string;
          gp?: number;
          seconds_played?: number | null;
          pts?: number;
          fgm?: number;
          fga?: number;
          tpm?: number;
          tpa?: number;
          ftm?: number;
          fta?: number;
          oreb?: number;
          dreb?: number;
          ast?: number;
          stl?: number;
          blk?: number;
          tov?: number;
          pf?: number;
        };
        Update: {
          competition_id?: string;
          player_id?: string;
          team_season_id?: string;
          gp?: number;
          seconds_played?: number | null;
          pts?: number;
          fgm?: number;
          fga?: number;
          tpm?: number;
          tpa?: number;
          ftm?: number;
          fta?: number;
          oreb?: number;
          dreb?: number;
          ast?: number;
          stl?: number;
          blk?: number;
          tov?: number;
          pf?: number;
        };
      };
      standings: {
        Row: {
          competition_id: string;
          team_season_id: string;
          w: number;
          l: number;
          points_for: number;
          points_against: number;
        };
        Insert: {
          competition_id: string;
          team_season_id: string;
          w?: number;
          l?: number;
          points_for?: number;
          points_against?: number;
        };
        Update: {
          competition_id?: string;
          team_season_id?: string;
          w?: number;
          l?: number;
          points_for?: number;
          points_against?: number;
        };
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          detail: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          detail?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          detail?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      game_status: GameStatus;
      membership_role: MembershipRole;
      membership_scope: MembershipScope;
      competition_type: CompetitionType;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
