export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      aftercare_journal: {
        Row: {
          couple_id: string | null;
          created_at: string | null;
          entry_a: string | null;
          entry_b: string | null;
          entry_date: string;
          id: string;
        };
        Insert: {
          couple_id?: string | null;
          created_at?: string | null;
          entry_a?: string | null;
          entry_b?: string | null;
          entry_date: string;
          id?: string;
        };
        Update: {
          couple_id?: string | null;
          created_at?: string | null;
          entry_a?: string | null;
          entry_b?: string | null;
          entry_date?: string;
          id?: string;
        };
      };
      calendar_events: {
        Row: {
          couple_id: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          event_date: string;
          event_type: string | null;
          id: string;
          is_recurring: boolean | null;
          recurring_pattern: string | null;
          title: string;
        };
        Insert: {
          couple_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          event_date: string;
          event_type?: string | null;
          id?: string;
          is_recurring?: boolean | null;
          recurring_pattern?: string | null;
          title: string;
        };
        Update: {
          couple_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          event_date?: string;
          event_type?: string | null;
          id?: string;
          is_recurring?: boolean | null;
          recurring_pattern?: string | null;
          title?: string;
        };
      };
      couples: {
        Row: {
          created_at: string | null;
          id: string;
          invite_code: string;
          relationship_stage: string | null;
          start_date: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          invite_code: string;
          relationship_stage?: string | null;
          start_date?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          invite_code?: string;
          relationship_stage?: string | null;
          start_date?: string | null;
        };
      };
      game_moves: {
        Row: {
          created_at: string | null;
          game_session_id: string | null;
          id: string;
          is_correct: boolean | null;
          player_id: string | null;
          question_id: string | null;
          selected_answer: string | null;
          text_answer: string | null;
        };
        Insert: {
          created_at?: string | null;
          game_session_id?: string | null;
          id?: string;
          is_correct?: boolean | null;
          player_id?: string | null;
          question_id?: string | null;
          selected_answer?: string | null;
          text_answer?: string | null;
        };
        Update: {
          created_at?: string | null;
          game_session_id?: string | null;
          id?: string;
          is_correct?: boolean | null;
          player_id?: string | null;
          question_id?: string | null;
          selected_answer?: string | null;
          text_answer?: string | null;
        };
      };
      game_sessions: {
        Row: {
          couple_id: string | null;
          created_at: string | null;
          current_turn: string | null;
          game_type: string;
          id: string;
          score_a: number | null;
          score_b: number | null;
          status: string | null;
        };
        Insert: {
          couple_id?: string | null;
          created_at?: string | null;
          current_turn?: string | null;
          game_type: string;
          id?: string;
          score_a?: number | null;
          score_b?: number | null;
          status?: string | null;
        };
        Update: {
          couple_id?: string | null;
          created_at?: string | null;
          current_turn?: string | null;
          game_type?: string;
          id?: string;
          score_a?: number | null;
          score_b?: number | null;
          status?: string | null;
        };
      };
      intimacy_interests: {
        Row: {
          category: string;
          couple_id: string | null;
          created_at: string | null;
          id: string;
          interest_text: string;
          is_interested_a: boolean | null;
          is_interested_b: boolean | null;
          is_matched: boolean | null;
        };
        Insert: {
          category: string;
          couple_id?: string | null;
          created_at?: string | null;
          id?: string;
          interest_text: string;
          is_interested_a?: boolean | null;
          is_interested_b?: boolean | null;
        };
        Update: {
          category?: string;
          couple_id?: string | null;
          created_at?: string | null;
          id?: string;
          interest_text?: string;
          is_interested_a?: boolean | null;
          is_interested_b?: boolean | null;
        };
      };
      intimacy_moods: {
        Row: {
          couple_id: string | null;
          id: string;
          mood_light: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          couple_id?: string | null;
          id?: string;
          mood_light?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          couple_id?: string | null;
          id?: string;
          mood_light?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
      };
      intimacy_progress: {
        Row: {
          both_opted_in: boolean | null;
          couple_id: string | null;
          desire_match_unlocked: boolean | null;
          id: string;
          intimacy_dare_level: number | null;
          intimacy_packs_unlocked: number | null;
          streak_required_met: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          both_opted_in?: boolean | null;
          couple_id?: string | null;
          desire_match_unlocked?: boolean | null;
          id?: string;
          intimacy_dare_level?: number | null;
          intimacy_packs_unlocked?: number | null;
          streak_required_met?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          both_opted_in?: boolean | null;
          couple_id?: string | null;
          desire_match_unlocked?: boolean | null;
          id?: string;
          intimacy_dare_level?: number | null;
          intimacy_packs_unlocked?: number | null;
          streak_required_met?: boolean | null;
          updated_at?: string | null;
        };
      };
      intimate_wishlist: {
        Row: {
          added_by: string | null;
          couple_id: string | null;
          created_at: string | null;
          explored_at: string | null;
          id: string;
          is_explored: boolean | null;
          partner_wants: boolean | null;
          wish_text: string;
        };
        Insert: {
          added_by?: string | null;
          couple_id?: string | null;
          created_at?: string | null;
          explored_at?: string | null;
          id?: string;
          is_explored?: boolean | null;
          partner_wants?: boolean | null;
          wish_text: string;
        };
        Update: {
          added_by?: string | null;
          couple_id?: string | null;
          created_at?: string | null;
          explored_at?: string | null;
          id?: string;
          is_explored?: boolean | null;
          partner_wants?: boolean | null;
          wish_text?: string;
        };
      };
      memories: {
        Row: {
          couple_id: string | null;
          created_at: string | null;
          created_by: string | null;
          date: string | null;
          description: string | null;
          id: string;
          memory_type: string | null;
          photo_url: string | null;
          title: string | null;
        };
        Insert: {
          couple_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date?: string | null;
          description?: string | null;
          id?: string;
          memory_type?: string | null;
          photo_url?: string | null;
          title?: string | null;
        };
        Update: {
          couple_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date?: string | null;
          description?: string | null;
          id?: string;
          memory_type?: string | null;
          photo_url?: string | null;
          title?: string | null;
        };
      };
      messages: {
        Row: {
          content: string;
          couple_id: string | null;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          media_url: string | null;
          message_type: string | null;
          sender_id: string | null;
        };
        Insert: {
          content: string;
          couple_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          media_url?: string | null;
          message_type?: string | null;
          sender_id?: string | null;
        };
        Update: {
          content?: string;
          couple_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          media_url?: string | null;
          message_type?: string | null;
          sender_id?: string | null;
        };
      };
      moods: {
        Row: {
          couple_id: string | null;
          created_at: string | null;
          date: string;
          id: string;
          mood: string;
          note: string | null;
          user_id: string | null;
        };
        Insert: {
          couple_id?: string | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          mood: string;
          note?: string | null;
          user_id?: string | null;
        };
        Update: {
          couple_id?: string | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          mood?: string;
          note?: string | null;
          user_id?: string | null;
        };
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          couple_id: string | null;
          created_at: string | null;
          id: string;
          name: string;
          onboarding_complete: boolean | null;
          partner_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          couple_id?: string | null;
          created_at?: string | null;
          id: string;
          name: string;
          onboarding_complete?: boolean | null;
          partner_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          couple_id?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          onboarding_complete?: boolean | null;
          partner_id?: string | null;
        };
      };
      questions: {
        Row: {
          category: string | null;
          couple_id: string | null;
          created_at: string | null;
          id: string;
          is_answered_by_partner_a: boolean | null;
          is_answered_by_partner_b: boolean | null;
          pack_id: string | null;
          question_text: string;
          revealed: boolean | null;
          scheduled_date: string | null;
          source: string | null;
        };
        Insert: {
          category?: string | null;
          couple_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_answered_by_partner_a?: boolean | null;
          is_answered_by_partner_b?: boolean | null;
          pack_id?: string | null;
          question_text: string;
          revealed?: boolean | null;
          scheduled_date?: string | null;
          source?: string | null;
        };
        Update: {
          category?: string | null;
          couple_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_answered_by_partner_a?: boolean | null;
          is_answered_by_partner_b?: boolean | null;
          pack_id?: string | null;
          question_text?: string;
          revealed?: boolean | null;
          scheduled_date?: string | null;
          source?: string | null;
        };
      };
      replies: {
        Row: {
          author_id: string | null;
          content: string;
          created_at: string | null;
          id: string;
          response_id: string | null;
        };
        Insert: {
          author_id?: string | null;
          content: string;
          created_at?: string | null;
          id?: string;
          response_id?: string | null;
        };
        Update: {
          author_id?: string | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          response_id?: string | null;
        };
      };
      responses: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          mood_emoji: string | null;
          question_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          mood_emoji?: string | null;
          question_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          mood_emoji?: string | null;
          question_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
      };
      shared_lists: {
        Row: {
          completed_by: string | null;
          couple_id: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_completed: boolean | null;
          list_type: string;
          title: string;
        };
        Insert: {
          completed_by?: string | null;
          couple_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_completed?: boolean | null;
          list_type: string;
          title: string;
        };
        Update: {
          completed_by?: string | null;
          couple_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_completed?: boolean | null;
          list_type?: string;
          title?: string;
        };
      };
      streaks: {
        Row: {
          couple_id: string | null;
          created_at: string | null;
          current_streak: number | null;
          id: string;
          last_activity_date: string | null;
          longest_streak: number | null;
          streak_freezes: number | null;
        };
        Insert: {
          couple_id?: string | null;
          created_at?: string | null;
          current_streak?: number | null;
          id?: string;
          last_activity_date?: string | null;
          longest_streak?: number | null;
          streak_freezes?: number | null;
        };
        Update: {
          couple_id?: string | null;
          created_at?: string | null;
          current_streak?: number | null;
          id?: string;
          last_activity_date?: string | null;
          longest_streak?: number | null;
          streak_freezes?: number | null;
        };
      };
    };
    Functions: {
      get_user_couple_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
};
