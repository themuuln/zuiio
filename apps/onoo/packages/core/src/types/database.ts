// Database types — generated from schema (normally via supabase gen types)
// Manual creation due to missing Docker for local Supabase stack

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface DatabaseTable<Row, Insert, Update = Partial<Insert>> {
  Row: Row;
  Insert: Insert;
  Update: Update;
}

export type GameStatus =
  | "scheduled"
  | "live_provisional"
  | "final_pending_review"
  | "league_verified"
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
          ruleset_id: string;
          home_team_season_id: string;
          away_team_season_id: string;
          venue_id: string | null;
          scheduled_at: string;
          status: GameStatus;
          current_period: number;
          home_score: number | null;
          away_score: number | null;
          current_revision_number: number;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          ruleset_id: string;
          home_team_season_id: string;
          away_team_season_id: string;
          venue_id?: string | null;
          scheduled_at: string;
          status?: GameStatus;
          current_period?: number;
          home_score?: number | null;
          away_score?: number | null;
          current_revision_number?: number;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          ruleset_id?: string;
          home_team_season_id?: string;
          away_team_season_id?: string;
          venue_id?: string | null;
          scheduled_at?: string;
          status?: GameStatus;
          current_period?: number;
          home_score?: number | null;
          away_score?: number | null;
          current_revision_number?: number;
          published_at?: string | null;
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
          tracker_session_id: string;
          operation_id: string;
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
          voided_at: string | null;
          voided_by: string | null;
          void_reason: string | null;
          /** Legacy fixture compatibility; V2 runtime uses voided_at. */
          deleted_at?: string | null;
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
          tracker_session_id: string;
          operation_id: string;
          created_by: string;
          created_at?: string;
          voided_at?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string;
          client_id?: string;
          local_seq?: number;
          event_type?: string;
          period?: number;
          tracker_session_id?: string;
          operation_id?: string;
          clock_seconds?: number;
          team_season_id?: string | null;
          player_id?: string | null;
          payload?: Json;
          created_by?: string;
          created_at?: string;
          voided_at?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
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
      basketball_rulesets: DatabaseTable<
        { id: string; league_id: string; version: string; name: string; rules: Json; effective_from: string; retired_at: string | null; created_by: string | null; created_at: string },
        { id?: string; league_id: string; version: string; name: string; rules: Json; effective_from: string; retired_at?: string | null; created_by?: string | null; created_at?: string }
      >;
      tracker_sessions: DatabaseTable<
        { id: string; game_id: string; scorer_id: string; role: "lead_scorer" | "backup_scorer"; device_info: Json; status: "active" | "transferred" | "closed" | "revoked"; last_acknowledged_sequence: number; handed_off_to_session_id: string | null; closure_reason: string | null; started_at: string; closed_at: string | null },
        { id?: string; game_id: string; scorer_id: string; role: "lead_scorer" | "backup_scorer"; device_info?: Json; status?: "active" | "transferred" | "closed" | "revoked"; last_acknowledged_sequence?: number; handed_off_to_session_id?: string | null; closure_reason?: string | null; started_at?: string; closed_at?: string | null }
      >;
      source_submissions: DatabaseTable<
        { id: string; game_id: string; source_type: "tracker_journal" | "official_score_sheet" | "manual_box_score" | "import"; evidence_url: string | null; rights_confirmed_at: string | null; submitted_by: string; submitted_at: string; normalized_payload: Json; confidence: number | null; status: "pending" | "approved" | "rejected" | "superseded"; reviewed_by: string | null; reviewed_at: string | null; review_note: string | null; idempotency_key: string | null },
        { id?: string; game_id: string; source_type: "tracker_journal" | "official_score_sheet" | "manual_box_score" | "import"; evidence_url?: string | null; rights_confirmed_at?: string | null; submitted_by: string; submitted_at?: string; normalized_payload: Json; confidence?: number | null; status?: "pending" | "approved" | "rejected" | "superseded"; reviewed_by?: string | null; reviewed_at?: string | null; review_note?: string | null; idempotency_key?: string | null }
      >;
      game_revisions: DatabaseTable<
        { id: string; game_id: string; revision_number: number; source_submission_id: string; parent_revision_id: string | null; state: "pending" | "approved" | "rejected" | "superseded"; journal: Json; projection: Json; validation_warnings: Json; created_by: string; created_at: string; approved_by: string | null; approved_at: string | null },
        { id?: string; game_id: string; revision_number: number; source_submission_id: string; parent_revision_id?: string | null; state?: "pending" | "approved" | "rejected" | "superseded"; journal: Json; projection: Json; validation_warnings?: Json; created_by: string; created_at?: string; approved_by?: string | null; approved_at?: string | null }
      >;
      correction_records: DatabaseTable<
        { id: string; game_id: string; requested_by: string; requested_at: string; reason: string; evidence_url: string | null; proposed_change: Json; status: "pending" | "approved" | "rejected" | "applied"; resolved_by: string | null; resolved_at: string | null; resulting_revision_id: string | null },
        { id?: string; game_id: string; requested_by: string; requested_at?: string; reason: string; evidence_url?: string | null; proposed_change: Json; status?: "pending" | "approved" | "rejected" | "applied"; resolved_by?: string | null; resolved_at?: string | null; resulting_revision_id?: string | null }
      >;
      player_aliases: DatabaseTable<
        { id: string; player_id: string; alias: string; normalized_alias: string; source_submission_id: string | null; created_by: string | null; created_at: string },
        { id?: string; player_id: string; alias: string; normalized_alias: string; source_submission_id?: string | null; created_by?: string | null; created_at?: string }
      >;
      player_merge_history: DatabaseTable<
        { id: string; kept_player_id: string; merged_player_id: string; merged_by: string; reason: string; created_at: string },
        { id?: string; kept_player_id: string; merged_player_id: string; merged_by: string; reason: string; created_at?: string }
      >;
    };
    Views: {
      v_public_games: {
        Row: {
          id: string; competition_id: string; scheduled_at: string; status: GameStatus;
          current_period: number; home_score: number | null; away_score: number | null;
          current_revision_number: number; published_at: string | null; venue_id: string | null;
          venue_name: string | null; competition_name: string; season_id: string; season_name: string;
          league_id: string; league_name: string; league_slug: string;
          home_team_season_id: string; home_team_id: string; home_team_name: string;
          home_team_slug: string; home_team_short_code: string; home_team_logo_url: string | null;
          away_team_season_id: string; away_team_id: string; away_team_name: string;
          away_team_slug: string; away_team_short_code: string; away_team_logo_url: string | null;
          revision_id: string; revision_number: number; revision_approved_at: string | null;
          source_submission_id: string; source_type: string; evidence_url: string | null;
          source_reviewer_id: string | null; source_reviewed_at: string | null;
        };
      };
      v_public_box_score: {
        Row: {
          game_id: string; revision_id: string; revision_number: number; revision_approved_at: string | null;
          player_id: string; player_name: string; player_name_latin: string | null; player_position: string | null;
          team_season_id: string; team_id: string; team_name: string; jersey_number: number | null;
          seconds_played: number | null; pts: number; fgm: number; fga: number; tpm: number; tpa: number;
          ftm: number; fta: number; oreb: number; dreb: number; ast: number; stl: number;
          blk: number; tov: number; pf: number;
          source_type: string; evidence_url: string | null; source_reviewed_at: string | null;
        };
      };
      v_public_standings: {
        Row: {
          competition_id: string; team_season_id: string; team_id: string; team_name: string;
          team_slug: string; team_short_code: string; wins: number; losses: number;
          win_pct: number; gb: number | null; streak: string | null; last10: string | null;
          points_for: number | null; points_against: number | null;
        };
      };
      v_public_leaders: {
        Row: {
          competition_id: string; player_id: string; player_name: string; player_name_latin: string | null;
          team_season_id: string; team_name: string; gp: number; mpg: number | null;
          pts: number | null; fgm: number | null; fga: number | null; tpm: number | null;
          tpa: number | null; ftm: number | null; fta: number | null;
          oreb: number | null; dreb: number | null; ast: number | null;
          stl: number | null; blk: number | null; tov: number | null; pf: number | null;
        };
      };
      v_public_team_roster: {
        Row: {
          team_season_id: string; team_id: string; team_name: string; team_short_code: string;
          player_id: string; player_name: string; player_name_latin: string | null;
          jersey_number: number | null; position: string | null;
        };
      };
    };
    Functions: {
      cmd_record_event: { Args: Record<string, Json | string | number | null>; Returns: Database["public"]["Tables"]["stat_events"]["Row"] };
      cmd_void_event: { Args: { p_event_id: string; p_reason: string }; Returns: Database["public"]["Tables"]["stat_events"]["Row"] };
      cmd_transition_game: { Args: { p_game_id: string; p_to_status: GameStatus }; Returns: Database["public"]["Tables"]["games"]["Row"] };
      cmd_submit_source: { Args: Record<string, Json | string | number | boolean | null>; Returns: Database["public"]["Tables"]["source_submissions"]["Row"] };
      cmd_approve_source: { Args: { p_submission_id: string; p_approved: boolean; p_note?: string | null }; Returns: Database["public"]["Tables"]["source_submissions"]["Row"] };
      cmd_create_revision: { Args: Record<string, Json | string | number | null>; Returns: Database["public"]["Tables"]["game_revisions"]["Row"] };
      cmd_approve_revision: { Args: { p_revision_id: string; p_approved: boolean }; Returns: Database["public"]["Tables"]["game_revisions"]["Row"] };
      cmd_assign_scorer: { Args: { p_game_id: string; p_user_id: string; p_role: string }; Returns: Database["public"]["Tables"]["game_assignments"]["Row"] };
      cmd_handoff_session: { Args: { p_session_id: string; p_to_user_id: string; p_reason: string }; Returns: Database["public"]["Tables"]["tracker_sessions"]["Row"] };
      cmd_open_tracker_session: { Args: { p_game_id: string; p_role: string; p_device_info?: Json }; Returns: Database["public"]["Tables"]["tracker_sessions"]["Row"] };
    };
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
