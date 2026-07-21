export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          code: string;
          host_session_id: string;
          game_state: string;
          max_players: number;
          created_at: string;
          expires_at: string;
          current_game_id: string | null;
          vibe_tier: string;
        };
        Insert: {
          id?: string;
          code: string;
          host_session_id: string;
          game_state?: string;
          max_players?: number;
          created_at?: string;
          expires_at?: string;
          current_game_id?: string | null;
          vibe_tier?: string;
        };
        Update: {
          id?: string;
          code?: string;
          host_session_id?: string;
          game_state?: string;
          max_players?: number;
          created_at?: string;
          expires_at?: string;
          current_game_id?: string | null;
          vibe_tier?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          room_id: string;
          session_id: string;
          display_name: string;
          avatar_emoji: string;
          is_host: boolean;
          is_spectator: boolean;
          joined_at: string;
          disconnected_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          session_id: string;
          display_name: string;
          avatar_emoji: string;
          is_host?: boolean;
          is_spectator?: boolean;
          joined_at?: string;
          disconnected_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          session_id?: string;
          display_name?: string;
          avatar_emoji?: string;
          is_host?: boolean;
          is_spectator?: boolean;
          joined_at?: string;
          disconnected_at?: string | null;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: {
          id: string;
          room_id: string;
          game_type: string;
          status: string;
          current_turn_player_id: string | null;
          direction: number;
          turn_order: number[];
          round_number: number;
          config: Json;
          created_at: string;
          last_action_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          game_type: string;
          status?: string;
          current_turn_player_id?: string | null;
          direction?: number;
          turn_order?: number[];
          round_number?: number;
          config?: Json;
          created_at?: string;
          last_action_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          game_type?: string;
          status?: string;
          current_turn_player_id?: string | null;
          direction?: number;
          turn_order?: number[];
          round_number?: number;
          config?: Json;
          created_at?: string;
          last_action_at?: string;
        };
        Relationships: [];
      };
      player_hands: {
        Row: {
          id: string;
          game_session_id: string;
          player_id: string;
          cards: Json;
        };
        Insert: {
          id?: string;
          game_session_id: string;
          player_id: string;
          cards?: Json;
        };
        Update: {
          id?: string;
          game_session_id?: string;
          player_id?: string;
          cards?: Json;
        };
        Relationships: [];
      };
      game_moves: {
        Row: {
          id: string;
          game_session_id: string;
          player_id: string;
          move_type: string;
          card_played: Json | null;
          round_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_session_id: string;
          player_id: string;
          move_type: string;
          card_played?: Json | null;
          round_number: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_session_id?: string;
          player_id?: string;
          move_type?: string;
          card_played?: Json | null;
          round_number?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      game_content: {
        Row: {
          id: string;
          game_type: string;
          category: string;
          tier: string;
          text_en: string;
          text_mn: string | null;
          extra: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          game_type: string;
          category?: string;
          tier?: string;
          text_en: string;
          text_mn?: string | null;
          extra?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_type?: string;
          category?: string;
          tier?: string;
          text_en?: string;
          text_mn?: string | null;
          extra?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      scores: {
        Row: {
          id: string;
          game_session_id: string;
          player_id: string;
          round_number: number;
          points_scored: number;
          is_winner: boolean;
        };
        Insert: {
          id?: string;
          game_session_id: string;
          player_id: string;
          round_number: number;
          points_scored: number;
          is_winner?: boolean;
        };
        Update: {
          id?: string;
          game_session_id?: string;
          player_id?: string;
          round_number?: number;
          points_scored?: number;
          is_winner?: boolean;
        };
        Relationships: [];
      };
      game_picker_votes: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          game_type: string;
          vote: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          game_type: string;
          vote: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          game_type?: string;
          vote?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_picker_votes_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_picker_votes_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never> & {
      join_room: {
        Args: {
          p_code: string;
          p_session_id: string;
          p_display_name: string;
          p_avatar_emoji: string;
          p_is_host: boolean;
        };
        Returns: Json;
      };
      get_player_by_session: {
        Args: {
          p_code: string;
          p_session_id: string;
        };
        Returns: Json;
      };
      set_app_session_id: {
        Args: {
          session_id: string;
        };
        Returns: undefined;
      };
      upsert_vote: {
        Args: {
          p_room_id: string;
          p_player_id: string;
          p_game_type: string;
          p_vote: string;
        };
        Returns: Json;
      };
      clear_room_votes: {
        Args: {
          p_room_id: string;
        };
        Returns: undefined;
      };
      get_room_votes: {
        Args: {
          p_room_id: string;
        };
        Returns: Json;
      };
      create_game_session: {
        Args: {
          p_room_id: string;
          p_game_type: string;
          p_status?: string;
        };
        Returns: Json;
      };
      get_room_player_count: {
        Args: {
          p_room_id: string;
        };
        Returns: number;
      };
      start_game: {
        Args: {
          p_room_id: string;
          p_game_type?: string;
          p_config?: Json;
        };
        Returns: Json;
      };
      record_game_move: {
        Args: {
          p_game_session_id: string;
          p_player_id: string;
          p_move_type: string;
          p_card_played?: Json | null;
          p_round_number?: number;
        };
        Returns: Json;
      };
      record_round_score: {
        Args: {
          p_game_session_id: string;
          p_player_id: string;
          p_round_number: number;
          p_points_scored: number;
          p_is_winner?: boolean;
        };
        Returns: Json;
      };
      upsert_player_hand: {
        Args: {
          p_game_session_id: string;
          p_player_id: string;
          p_cards: Json;
        };
        Returns: Json;
      };
      update_game_session_state: {
        Args: {
          p_game_session_id: string;
          p_config: Json;
          p_status?: string;
          p_current_turn_player_id?: string | null;
          p_direction?: number;
          p_round_number?: number;
          p_last_action_at?: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
