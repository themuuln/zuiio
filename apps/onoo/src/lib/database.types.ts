export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null;
          id: string;
          instance_id: string | null;
          ip_address: string;
          payload: Json | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          instance_id?: string | null;
          ip_address?: string;
          payload?: Json | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          instance_id?: string | null;
          ip_address?: string;
          payload?: Json | null;
        };
        Relationships: [];
      };
      custom_oauth_providers: {
        Row: {
          acceptable_client_ids: string[];
          attribute_mapping: Json;
          authorization_params: Json;
          authorization_url: string | null;
          cached_discovery: Json | null;
          client_id: string;
          client_secret: string;
          created_at: string;
          custom_claims_allowlist: string[];
          discovery_cached_at: string | null;
          discovery_url: string | null;
          email_optional: boolean;
          enabled: boolean;
          id: string;
          identifier: string;
          issuer: string | null;
          jwks_uri: string | null;
          name: string;
          pkce_enabled: boolean;
          provider_type: string;
          scopes: string[];
          skip_nonce_check: boolean;
          token_url: string | null;
          updated_at: string;
          userinfo_url: string | null;
        };
        Insert: {
          acceptable_client_ids?: string[];
          attribute_mapping?: Json;
          authorization_params?: Json;
          authorization_url?: string | null;
          cached_discovery?: Json | null;
          client_id: string;
          client_secret: string;
          created_at?: string;
          custom_claims_allowlist?: string[];
          discovery_cached_at?: string | null;
          discovery_url?: string | null;
          email_optional?: boolean;
          enabled?: boolean;
          id?: string;
          identifier: string;
          issuer?: string | null;
          jwks_uri?: string | null;
          name: string;
          pkce_enabled?: boolean;
          provider_type: string;
          scopes?: string[];
          skip_nonce_check?: boolean;
          token_url?: string | null;
          updated_at?: string;
          userinfo_url?: string | null;
        };
        Update: {
          acceptable_client_ids?: string[];
          attribute_mapping?: Json;
          authorization_params?: Json;
          authorization_url?: string | null;
          cached_discovery?: Json | null;
          client_id?: string;
          client_secret?: string;
          created_at?: string;
          custom_claims_allowlist?: string[];
          discovery_cached_at?: string | null;
          discovery_url?: string | null;
          email_optional?: boolean;
          enabled?: boolean;
          id?: string;
          identifier?: string;
          issuer?: string | null;
          jwks_uri?: string | null;
          name?: string;
          pkce_enabled?: boolean;
          provider_type?: string;
          scopes?: string[];
          skip_nonce_check?: boolean;
          token_url?: string | null;
          updated_at?: string;
          userinfo_url?: string | null;
        };
        Relationships: [];
      };
      flow_state: {
        Row: {
          auth_code: string | null;
          auth_code_issued_at: string | null;
          authentication_method: string;
          code_challenge: string | null;
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null;
          created_at: string | null;
          email_optional: boolean;
          id: string;
          invite_token: string | null;
          linking_target_id: string | null;
          oauth_client_state_id: string | null;
          provider_access_token: string | null;
          provider_refresh_token: string | null;
          provider_type: string;
          referrer: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          auth_code?: string | null;
          auth_code_issued_at?: string | null;
          authentication_method: string;
          code_challenge?: string | null;
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null;
          created_at?: string | null;
          email_optional?: boolean;
          id: string;
          invite_token?: string | null;
          linking_target_id?: string | null;
          oauth_client_state_id?: string | null;
          provider_access_token?: string | null;
          provider_refresh_token?: string | null;
          provider_type: string;
          referrer?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          auth_code?: string | null;
          auth_code_issued_at?: string | null;
          authentication_method?: string;
          code_challenge?: string | null;
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null;
          created_at?: string | null;
          email_optional?: boolean;
          id?: string;
          invite_token?: string | null;
          linking_target_id?: string | null;
          oauth_client_state_id?: string | null;
          provider_access_token?: string | null;
          provider_refresh_token?: string | null;
          provider_type?: string;
          referrer?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      identities: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string;
          identity_data: Json;
          last_sign_in_at: string | null;
          provider: string;
          provider_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          identity_data: Json;
          last_sign_in_at?: string | null;
          provider: string;
          provider_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          identity_data?: Json;
          last_sign_in_at?: string | null;
          provider?: string;
          provider_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      instances: {
        Row: {
          created_at: string | null;
          id: string;
          raw_base_config: string | null;
          updated_at: string | null;
          uuid: string | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          raw_base_config?: string | null;
          updated_at?: string | null;
          uuid?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          raw_base_config?: string | null;
          updated_at?: string | null;
          uuid?: string | null;
        };
        Relationships: [];
      };
      mfa_amr_claims: {
        Row: {
          authentication_method: string;
          created_at: string;
          id: string;
          session_id: string;
          updated_at: string;
        };
        Insert: {
          authentication_method: string;
          created_at: string;
          id: string;
          session_id: string;
          updated_at: string;
        };
        Update: {
          authentication_method?: string;
          created_at?: string;
          id?: string;
          session_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      mfa_challenges: {
        Row: {
          created_at: string;
          factor_id: string;
          id: string;
          ip_address: unknown;
          otp_code: string | null;
          verified_at: string | null;
          web_authn_session_data: Json | null;
        };
        Insert: {
          created_at: string;
          factor_id: string;
          id: string;
          ip_address: unknown;
          otp_code?: string | null;
          verified_at?: string | null;
          web_authn_session_data?: Json | null;
        };
        Update: {
          created_at?: string;
          factor_id?: string;
          id?: string;
          ip_address?: unknown;
          otp_code?: string | null;
          verified_at?: string | null;
          web_authn_session_data?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey";
            columns: ["factor_id"];
            isOneToOne: false;
            referencedRelation: "mfa_factors";
            referencedColumns: ["id"];
          },
        ];
      };
      mfa_factors: {
        Row: {
          created_at: string;
          factor_type: Database["auth"]["Enums"]["factor_type"];
          friendly_name: string | null;
          id: string;
          last_challenged_at: string | null;
          last_webauthn_challenge_data: Json | null;
          phone: string | null;
          secret: string | null;
          status: Database["auth"]["Enums"]["factor_status"];
          updated_at: string;
          user_id: string;
          web_authn_aaguid: string | null;
          web_authn_credential: Json | null;
        };
        Insert: {
          created_at: string;
          factor_type: Database["auth"]["Enums"]["factor_type"];
          friendly_name?: string | null;
          id: string;
          last_challenged_at?: string | null;
          last_webauthn_challenge_data?: Json | null;
          phone?: string | null;
          secret?: string | null;
          status: Database["auth"]["Enums"]["factor_status"];
          updated_at: string;
          user_id: string;
          web_authn_aaguid?: string | null;
          web_authn_credential?: Json | null;
        };
        Update: {
          created_at?: string;
          factor_type?: Database["auth"]["Enums"]["factor_type"];
          friendly_name?: string | null;
          id?: string;
          last_challenged_at?: string | null;
          last_webauthn_challenge_data?: Json | null;
          phone?: string | null;
          secret?: string | null;
          status?: Database["auth"]["Enums"]["factor_status"];
          updated_at?: string;
          user_id?: string;
          web_authn_aaguid?: string | null;
          web_authn_credential?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      oauth_authorizations: {
        Row: {
          approved_at: string | null;
          authorization_code: string | null;
          authorization_id: string;
          client_id: string;
          code_challenge: string | null;
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null;
          created_at: string;
          expires_at: string;
          id: string;
          nonce: string | null;
          redirect_uri: string;
          resource: string | null;
          response_type: Database["auth"]["Enums"]["oauth_response_type"];
          scope: string;
          state: string | null;
          status: Database["auth"]["Enums"]["oauth_authorization_status"];
          user_id: string | null;
        };
        Insert: {
          approved_at?: string | null;
          authorization_code?: string | null;
          authorization_id: string;
          client_id: string;
          code_challenge?: string | null;
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null;
          created_at?: string;
          expires_at?: string;
          id: string;
          nonce?: string | null;
          redirect_uri: string;
          resource?: string | null;
          response_type?: Database["auth"]["Enums"]["oauth_response_type"];
          scope: string;
          state?: string | null;
          status?: Database["auth"]["Enums"]["oauth_authorization_status"];
          user_id?: string | null;
        };
        Update: {
          approved_at?: string | null;
          authorization_code?: string | null;
          authorization_id?: string;
          client_id?: string;
          code_challenge?: string | null;
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          nonce?: string | null;
          redirect_uri?: string;
          resource?: string | null;
          response_type?: Database["auth"]["Enums"]["oauth_response_type"];
          scope?: string;
          state?: string | null;
          status?: Database["auth"]["Enums"]["oauth_authorization_status"];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "oauth_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      oauth_client_states: {
        Row: {
          code_verifier: string | null;
          created_at: string;
          id: string;
          provider_type: string;
        };
        Insert: {
          code_verifier?: string | null;
          created_at: string;
          id: string;
          provider_type: string;
        };
        Update: {
          code_verifier?: string | null;
          created_at?: string;
          id?: string;
          provider_type?: string;
        };
        Relationships: [];
      };
      oauth_clients: {
        Row: {
          client_name: string | null;
          client_secret_hash: string | null;
          client_type: Database["auth"]["Enums"]["oauth_client_type"];
          client_uri: string | null;
          created_at: string;
          deleted_at: string | null;
          grant_types: string;
          id: string;
          logo_uri: string | null;
          redirect_uris: string;
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"];
          token_endpoint_auth_method: string;
          updated_at: string;
        };
        Insert: {
          client_name?: string | null;
          client_secret_hash?: string | null;
          client_type?: Database["auth"]["Enums"]["oauth_client_type"];
          client_uri?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          grant_types: string;
          id: string;
          logo_uri?: string | null;
          redirect_uris: string;
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"];
          token_endpoint_auth_method: string;
          updated_at?: string;
        };
        Update: {
          client_name?: string | null;
          client_secret_hash?: string | null;
          client_type?: Database["auth"]["Enums"]["oauth_client_type"];
          client_uri?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          grant_types?: string;
          id?: string;
          logo_uri?: string | null;
          redirect_uris?: string;
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"];
          token_endpoint_auth_method?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      oauth_consents: {
        Row: {
          client_id: string;
          granted_at: string;
          id: string;
          revoked_at: string | null;
          scopes: string;
          user_id: string;
        };
        Insert: {
          client_id: string;
          granted_at?: string;
          id: string;
          revoked_at?: string | null;
          scopes: string;
          user_id: string;
        };
        Update: {
          client_id?: string;
          granted_at?: string;
          id?: string;
          revoked_at?: string | null;
          scopes?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oauth_consents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "oauth_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oauth_consents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      one_time_tokens: {
        Row: {
          created_at: string;
          id: string;
          relates_to: string;
          token_hash: string;
          token_type: Database["auth"]["Enums"]["one_time_token_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          relates_to: string;
          token_hash: string;
          token_type: Database["auth"]["Enums"]["one_time_token_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          relates_to?: string;
          token_hash?: string;
          token_type?: Database["auth"]["Enums"]["one_time_token_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      refresh_tokens: {
        Row: {
          created_at: string | null;
          id: number;
          instance_id: string | null;
          parent: string | null;
          revoked: boolean | null;
          session_id: string | null;
          token: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          instance_id?: string | null;
          parent?: string | null;
          revoked?: boolean | null;
          session_id?: string | null;
          token?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          instance_id?: string | null;
          parent?: string | null;
          revoked?: boolean | null;
          session_id?: string | null;
          token?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      saml_providers: {
        Row: {
          attribute_mapping: Json | null;
          created_at: string | null;
          entity_id: string;
          id: string;
          metadata_url: string | null;
          metadata_xml: string;
          name_id_format: string | null;
          sso_provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          attribute_mapping?: Json | null;
          created_at?: string | null;
          entity_id: string;
          id: string;
          metadata_url?: string | null;
          metadata_xml: string;
          name_id_format?: string | null;
          sso_provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          attribute_mapping?: Json | null;
          created_at?: string | null;
          entity_id?: string;
          id?: string;
          metadata_url?: string | null;
          metadata_xml?: string;
          name_id_format?: string | null;
          sso_provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey";
            columns: ["sso_provider_id"];
            isOneToOne: false;
            referencedRelation: "sso_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      saml_relay_states: {
        Row: {
          created_at: string | null;
          flow_state_id: string | null;
          for_email: string | null;
          id: string;
          redirect_to: string | null;
          request_id: string;
          sso_provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          flow_state_id?: string | null;
          for_email?: string | null;
          id: string;
          redirect_to?: string | null;
          request_id: string;
          sso_provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          flow_state_id?: string | null;
          for_email?: string | null;
          id?: string;
          redirect_to?: string | null;
          request_id?: string;
          sso_provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey";
            columns: ["flow_state_id"];
            isOneToOne: false;
            referencedRelation: "flow_state";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey";
            columns: ["sso_provider_id"];
            isOneToOne: false;
            referencedRelation: "sso_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      schema_migrations: {
        Row: {
          version: string;
        };
        Insert: {
          version: string;
        };
        Update: {
          version?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null;
          created_at: string | null;
          factor_id: string | null;
          id: string;
          ip: unknown;
          not_after: string | null;
          oauth_client_id: string | null;
          refresh_token_counter: number | null;
          refresh_token_hmac_key: string | null;
          refreshed_at: string | null;
          scopes: string | null;
          tag: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null;
          created_at?: string | null;
          factor_id?: string | null;
          id: string;
          ip?: unknown;
          not_after?: string | null;
          oauth_client_id?: string | null;
          refresh_token_counter?: number | null;
          refresh_token_hmac_key?: string | null;
          refreshed_at?: string | null;
          scopes?: string | null;
          tag?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null;
          created_at?: string | null;
          factor_id?: string | null;
          id?: string;
          ip?: unknown;
          not_after?: string | null;
          oauth_client_id?: string | null;
          refresh_token_counter?: number | null;
          refresh_token_hmac_key?: string | null;
          refreshed_at?: string | null;
          scopes?: string | null;
          tag?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_oauth_client_id_fkey";
            columns: ["oauth_client_id"];
            isOneToOne: false;
            referencedRelation: "oauth_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sso_domains: {
        Row: {
          created_at: string | null;
          domain: string;
          id: string;
          sso_provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          domain: string;
          id: string;
          sso_provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          domain?: string;
          id?: string;
          sso_provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey";
            columns: ["sso_provider_id"];
            isOneToOne: false;
            referencedRelation: "sso_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      sso_providers: {
        Row: {
          created_at: string | null;
          disabled: boolean | null;
          id: string;
          resource_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          disabled?: boolean | null;
          id: string;
          resource_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          disabled?: boolean | null;
          id?: string;
          resource_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          aud: string | null;
          banned_until: string | null;
          confirmation_sent_at: string | null;
          confirmation_token: string | null;
          confirmed_at: string | null;
          created_at: string | null;
          deleted_at: string | null;
          email: string | null;
          email_change: string | null;
          email_change_confirm_status: number | null;
          email_change_sent_at: string | null;
          email_change_token_current: string | null;
          email_change_token_new: string | null;
          email_confirmed_at: string | null;
          encrypted_password: string | null;
          id: string;
          instance_id: string | null;
          invited_at: string | null;
          is_anonymous: boolean;
          is_sso_user: boolean;
          is_super_admin: boolean | null;
          last_sign_in_at: string | null;
          phone: string | null;
          phone_change: string | null;
          phone_change_sent_at: string | null;
          phone_change_token: string | null;
          phone_confirmed_at: string | null;
          raw_app_meta_data: Json | null;
          raw_user_meta_data: Json | null;
          reauthentication_sent_at: string | null;
          reauthentication_token: string | null;
          recovery_sent_at: string | null;
          recovery_token: string | null;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          aud?: string | null;
          banned_until?: string | null;
          confirmation_sent_at?: string | null;
          confirmation_token?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          email_change?: string | null;
          email_change_confirm_status?: number | null;
          email_change_sent_at?: string | null;
          email_change_token_current?: string | null;
          email_change_token_new?: string | null;
          email_confirmed_at?: string | null;
          encrypted_password?: string | null;
          id: string;
          instance_id?: string | null;
          invited_at?: string | null;
          is_anonymous?: boolean;
          is_sso_user?: boolean;
          is_super_admin?: boolean | null;
          last_sign_in_at?: string | null;
          phone?: string | null;
          phone_change?: string | null;
          phone_change_sent_at?: string | null;
          phone_change_token?: string | null;
          phone_confirmed_at?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
          reauthentication_sent_at?: string | null;
          reauthentication_token?: string | null;
          recovery_sent_at?: string | null;
          recovery_token?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          aud?: string | null;
          banned_until?: string | null;
          confirmation_sent_at?: string | null;
          confirmation_token?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          email_change?: string | null;
          email_change_confirm_status?: number | null;
          email_change_sent_at?: string | null;
          email_change_token_current?: string | null;
          email_change_token_new?: string | null;
          email_confirmed_at?: string | null;
          encrypted_password?: string | null;
          id?: string;
          instance_id?: string | null;
          invited_at?: string | null;
          is_anonymous?: boolean;
          is_sso_user?: boolean;
          is_super_admin?: boolean | null;
          last_sign_in_at?: string | null;
          phone?: string | null;
          phone_change?: string | null;
          phone_change_sent_at?: string | null;
          phone_change_token?: string | null;
          phone_confirmed_at?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
          reauthentication_sent_at?: string | null;
          reauthentication_token?: string | null;
          recovery_sent_at?: string | null;
          recovery_token?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      webauthn_challenges: {
        Row: {
          challenge_type: string;
          created_at: string;
          expires_at: string;
          id: string;
          session_data: Json;
          user_id: string | null;
        };
        Insert: {
          challenge_type: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          session_data: Json;
          user_id?: string | null;
        };
        Update: {
          challenge_type?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          session_data?: Json;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "webauthn_challenges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      webauthn_credentials: {
        Row: {
          aaguid: string | null;
          attestation_type: string;
          backed_up: boolean;
          backup_eligible: boolean;
          created_at: string;
          credential_id: string;
          friendly_name: string;
          id: string;
          last_used_at: string | null;
          public_key: string;
          sign_count: number;
          transports: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          aaguid?: string | null;
          attestation_type?: string;
          backed_up?: boolean;
          backup_eligible?: boolean;
          created_at?: string;
          credential_id: string;
          friendly_name?: string;
          id?: string;
          last_used_at?: string | null;
          public_key: string;
          sign_count?: number;
          transports?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          aaguid?: string | null;
          attestation_type?: string;
          backed_up?: boolean;
          backup_eligible?: boolean;
          created_at?: string;
          credential_id?: string;
          friendly_name?: string;
          id?: string;
          last_used_at?: string | null;
          public_key?: string;
          sign_count?: number;
          transports?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webauthn_credentials_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      email: { Args: never; Returns: string };
      jwt: { Args: never; Returns: Json };
      role: { Args: never; Returns: string };
      uid: { Args: never; Returns: string };
    };
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3";
      code_challenge_method: "s256" | "plain";
      factor_status: "unverified" | "verified";
      factor_type: "totp" | "webauthn" | "phone";
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired";
      oauth_client_type: "public" | "confidential";
      oauth_registration_type: "dynamic" | "manual";
      oauth_response_type: "code";
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      academy_attendance: {
        Row: {
          id: string;
          is_offline: boolean | null;
          note: string | null;
          program_id: string;
          recorded_at: string;
          recorded_by: string;
          session_date: string;
          status: string;
          student_id: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          is_offline?: boolean | null;
          note?: string | null;
          program_id: string;
          recorded_at?: string;
          recorded_by: string;
          session_date: string;
          status: string;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_offline?: boolean | null;
          note?: string | null;
          program_id?: string;
          recorded_at?: string;
          recorded_by?: string;
          session_date?: string;
          status?: string;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "academy_attendance_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "academy_programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "academy_attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "academy_students";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_consent_records: {
        Row: {
          expires_at: string | null;
          guardian_id: string | null;
          id: string;
          ip_address: string | null;
          is_withdrawn: boolean | null;
          signed_at: string;
          signed_text: string;
          student_id: string;
          template_id: string;
          withdrawn_at: string | null;
        };
        Insert: {
          expires_at?: string | null;
          guardian_id?: string | null;
          id?: string;
          ip_address?: string | null;
          is_withdrawn?: boolean | null;
          signed_at?: string;
          signed_text: string;
          student_id: string;
          template_id: string;
          withdrawn_at?: string | null;
        };
        Update: {
          expires_at?: string | null;
          guardian_id?: string | null;
          id?: string;
          ip_address?: string | null;
          is_withdrawn?: boolean | null;
          signed_at?: string;
          signed_text?: string;
          student_id?: string;
          template_id?: string;
          withdrawn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "academy_consent_records_guardian_id_fkey";
            columns: ["guardian_id"];
            isOneToOne: false;
            referencedRelation: "academy_guardians";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "academy_consent_records_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "academy_students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "academy_consent_records_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "academy_consent_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_consent_templates: {
        Row: {
          academy_id: string;
          body: string;
          created_at: string;
          id: string;
          is_active: boolean | null;
          scope: string;
          title: string;
          version: number;
        };
        Insert: {
          academy_id: string;
          body: string;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          scope: string;
          title: string;
          version?: number;
        };
        Update: {
          academy_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          scope?: string;
          title?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "academy_consent_templates_academy_id_fkey";
            columns: ["academy_id"];
            isOneToOne: false;
            referencedRelation: "academy_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_enrollments: {
        Row: {
          created_at: string;
          created_by: string | null;
          end_date: string | null;
          enrolled_at: string;
          id: string;
          notes: string | null;
          program_id: string;
          start_date: string | null;
          status: string;
          student_id: string;
          updated_at: string;
          waitlist_position: number | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          end_date?: string | null;
          enrolled_at?: string;
          id?: string;
          notes?: string | null;
          program_id: string;
          start_date?: string | null;
          status?: string;
          student_id: string;
          updated_at?: string;
          waitlist_position?: number | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          end_date?: string | null;
          enrolled_at?: string;
          id?: string;
          notes?: string | null;
          program_id?: string;
          start_date?: string | null;
          status?: string;
          student_id?: string;
          updated_at?: string;
          waitlist_position?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "academy_enrollments_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "academy_programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "academy_enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "academy_students";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_guardians: {
        Row: {
          academy_id: string;
          created_at: string;
          email: string | null;
          id: string;
          is_primary: boolean;
          name: string;
          otp_secret: string | null;
          otp_verified: boolean | null;
          phone: string | null;
          relationship: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          academy_id: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_primary?: boolean;
          name: string;
          otp_secret?: string | null;
          otp_verified?: boolean | null;
          phone?: string | null;
          relationship: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          academy_id?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_primary?: boolean;
          name?: string;
          otp_secret?: string | null;
          otp_verified?: boolean | null;
          phone?: string | null;
          relationship?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "academy_guardians_academy_id_fkey";
            columns: ["academy_id"];
            isOneToOne: false;
            referencedRelation: "academy_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_locations: {
        Row: {
          academy_id: string;
          address: string | null;
          city: string | null;
          created_at: string | null;
          hours: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
        };
        Insert: {
          academy_id: string;
          address?: string | null;
          city?: string | null;
          created_at?: string | null;
          hours?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
        };
        Update: {
          academy_id?: string;
          address?: string | null;
          city?: string | null;
          created_at?: string | null;
          hours?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "academy_locations_academy_id_fkey";
            columns: ["academy_id"];
            isOneToOne: false;
            referencedRelation: "academy_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_profiles: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          organization_id: string;
          settings: Json | null;
          timezone: string | null;
          updated_at: string | null;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          organization_id: string;
          settings?: Json | null;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Update: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          organization_id?: string;
          settings?: Json | null;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "academy_profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_programs: {
        Row: {
          academy_id: string;
          age_group: string | null;
          created_at: string | null;
          description: string | null;
          duration_weeks: number | null;
          id: string;
          is_active: boolean | null;
          location_id: string | null;
          name: string;
          price_mnt: number | null;
        };
        Insert: {
          academy_id: string;
          age_group?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_weeks?: number | null;
          id?: string;
          is_active?: boolean | null;
          location_id?: string | null;
          name: string;
          price_mnt?: number | null;
        };
        Update: {
          academy_id?: string;
          age_group?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_weeks?: number | null;
          id?: string;
          is_active?: boolean | null;
          location_id?: string | null;
          name?: string;
          price_mnt?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "academy_programs_academy_id_fkey";
            columns: ["academy_id"];
            isOneToOne: false;
            referencedRelation: "academy_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "academy_programs_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "academy_locations";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_registration_intents: {
        Row: {
          academy_id: string;
          created_at: string;
          date_of_birth: string | null;
          expires_at: string;
          guardian_name: string | null;
          guardian_phone: string | null;
          id: string;
          notes: string | null;
          program_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          student_name: string;
        };
        Insert: {
          academy_id: string;
          created_at?: string;
          date_of_birth?: string | null;
          expires_at?: string;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          notes?: string | null;
          program_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          student_name: string;
        };
        Update: {
          academy_id?: string;
          created_at?: string;
          date_of_birth?: string | null;
          expires_at?: string;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          notes?: string | null;
          program_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          student_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "academy_registration_intents_academy_id_fkey";
            columns: ["academy_id"];
            isOneToOne: false;
            referencedRelation: "academy_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "academy_registration_intents_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "academy_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_student_guardians: {
        Row: {
          authority_status: string;
          created_at: string;
          granted_at: string;
          guardian_id: string;
          id: string;
          revoked_at: string | null;
          revoked_by: string | null;
          student_id: string;
          verified_at: string | null;
          verified_by: string | null;
          verified_phone: string | null;
        };
        Insert: {
          authority_status?: string;
          created_at?: string;
          granted_at?: string;
          guardian_id: string;
          id?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          student_id: string;
          verified_at?: string | null;
          verified_by?: string | null;
          verified_phone?: string | null;
        };
        Update: {
          authority_status?: string;
          created_at?: string;
          granted_at?: string;
          guardian_id?: string;
          id?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          student_id?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          verified_phone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "academy_student_guardians_guardian_id_fkey";
            columns: ["guardian_id"];
            isOneToOne: false;
            referencedRelation: "academy_guardians";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "academy_student_guardians_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "academy_students";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_students: {
        Row: {
          academy_id: string;
          allergies: string[] | null;
          canonical_identity_id: string | null;
          canonical_name: string;
          created_at: string;
          date_of_birth: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          grade_level: string | null;
          id: string;
          medical_notes: string | null;
          name_latin: string | null;
          notes: string | null;
          photo_url: string | null;
          school_name: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          academy_id: string;
          allergies?: string[] | null;
          canonical_identity_id?: string | null;
          canonical_name: string;
          created_at?: string;
          date_of_birth?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          grade_level?: string | null;
          id?: string;
          medical_notes?: string | null;
          name_latin?: string | null;
          notes?: string | null;
          photo_url?: string | null;
          school_name?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          academy_id?: string;
          allergies?: string[] | null;
          canonical_identity_id?: string | null;
          canonical_name?: string;
          created_at?: string;
          date_of_birth?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          grade_level?: string | null;
          id?: string;
          medical_notes?: string | null;
          name_latin?: string | null;
          notes?: string | null;
          photo_url?: string | null;
          school_name?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "academy_students_academy_id_fkey";
            columns: ["academy_id"];
            isOneToOne: false;
            referencedRelation: "academy_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "academy_students_canonical_identity_id_fkey";
            columns: ["canonical_identity_id"];
            isOneToOne: false;
            referencedRelation: "canonical_identities";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_trainers: {
        Row: {
          academy_id: string;
          bio: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          photo_url: string | null;
          specialties: string[] | null;
        };
        Insert: {
          academy_id: string;
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          photo_url?: string | null;
          specialties?: string[] | null;
        };
        Update: {
          academy_id?: string;
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          photo_url?: string | null;
          specialties?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "academy_trainers_academy_id_fkey";
            columns: ["academy_id"];
            isOneToOne: false;
            referencedRelation: "academy_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          academy_id: string;
          body: string;
          created_at: string;
          created_by: string;
          id: string;
          program_ids: string[] | null;
          published_at: string | null;
          target_audience: string;
          title: string;
        };
        Insert: {
          academy_id: string;
          body: string;
          created_at?: string;
          created_by: string;
          id?: string;
          program_ids?: string[] | null;
          published_at?: string | null;
          target_audience: string;
          title: string;
        };
        Update: {
          academy_id?: string;
          body?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          program_ids?: string[] | null;
          published_at?: string | null;
          target_audience?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_academy_id_fkey";
            columns: ["academy_id"];
            isOneToOne: false;
            referencedRelation: "academy_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          payload: Json;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          payload?: Json;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          payload?: Json;
          user_id?: string | null;
        };
        Relationships: [];
      };
      awards: {
        Row: {
          award_type: string;
          competition_id: string;
          granted_at: string | null;
          granted_by: string;
          id: string;
          note: string | null;
          period_end: string | null;
          period_start: string | null;
          player_id: string;
        };
        Insert: {
          award_type: string;
          competition_id: string;
          granted_at?: string | null;
          granted_by: string;
          id?: string;
          note?: string | null;
          period_end?: string | null;
          period_start?: string | null;
          player_id: string;
        };
        Update: {
          award_type?: string;
          competition_id?: string;
          granted_at?: string | null;
          granted_by?: string;
          id?: string;
          note?: string | null;
          period_end?: string | null;
          period_start?: string | null;
          player_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "awards_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "awards_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "awards_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "awards_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "awards_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "awards_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "awards_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "awards_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "awards_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "awards_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
        ];
      };
      basketball_rulesets: {
        Row: {
          created_at: string;
          created_by: string | null;
          effective_from: string;
          id: string;
          league_id: string;
          name: string;
          retired_at: string | null;
          rules: Json;
          version: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          effective_from: string;
          id?: string;
          league_id: string;
          name: string;
          retired_at?: string | null;
          rules: Json;
          version: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          effective_from?: string;
          id?: string;
          league_id?: string;
          name?: string;
          retired_at?: string | null;
          rules?: Json;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_leaders";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "basketball_rulesets_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_standings";
            referencedColumns: ["league_id"];
          },
        ];
      };
      break_glass_access: {
        Row: {
          created_at: string | null;
          expires_at: string;
          granted_by: string | null;
          granted_to: string;
          id: string;
          is_expired: boolean | null;
          organization_id: string;
          reason: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at: string;
          granted_by?: string | null;
          granted_to: string;
          id?: string;
          is_expired?: boolean | null;
          organization_id: string;
          reason: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string;
          granted_by?: string | null;
          granted_to?: string;
          id?: string;
          is_expired?: boolean | null;
          organization_id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "break_glass_access_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      bundle_items: {
        Row: {
          bundle_id: string;
          created_at: string;
          id: string;
          product_id: string;
        };
        Insert: {
          bundle_id: string;
          created_at?: string;
          id?: string;
          product_id: string;
        };
        Update: {
          bundle_id?: string;
          created_at?: string;
          id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey";
            columns: ["bundle_id"];
            isOneToOne: false;
            referencedRelation: "product_bundles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bundle_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bundle_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shop_products";
            referencedColumns: ["id"];
          },
        ];
      };
      canonical_identities: {
        Row: {
          created_at: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
        };
        Relationships: [];
      };
      competitions: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          season_id: string;
          social_links: Json;
          tiebreaker_rules: Json;
          type: Database["public"]["Enums"]["competition_type"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          season_id: string;
          social_links?: Json;
          tiebreaker_rules?: Json;
          type?: Database["public"]["Enums"]["competition_type"];
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          season_id?: string;
          social_links?: Json;
          tiebreaker_rules?: Json;
          type?: Database["public"]["Enums"]["competition_type"];
        };
        Relationships: [
          {
            foreignKeyName: "competitions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competitions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["season_id"];
          },
          {
            foreignKeyName: "competitions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_leaders";
            referencedColumns: ["season_id"];
          },
          {
            foreignKeyName: "competitions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["season_id"];
          },
          {
            foreignKeyName: "competitions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["season_id"];
          },
          {
            foreignKeyName: "competitions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_standings";
            referencedColumns: ["season_id"];
          },
        ];
      };
      consent_policies: {
        Row: {
          created_at: string | null;
          data_categories: string[] | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          organization_id: string;
          retention_days: number;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          data_categories?: string[] | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          organization_id: string;
          retention_days?: number;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          data_categories?: string[] | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          organization_id?: string;
          retention_days?: number;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consent_policies_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      correction_records: {
        Row: {
          evidence_url: string | null;
          game_id: string;
          id: string;
          proposed_change: Json;
          reason: string;
          requested_at: string;
          requested_by: string;
          resolved_at: string | null;
          resolved_by: string | null;
          resulting_revision_id: string | null;
          status: string;
        };
        Insert: {
          evidence_url?: string | null;
          game_id: string;
          id?: string;
          proposed_change: Json;
          reason: string;
          requested_at?: string;
          requested_by: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resulting_revision_id?: string | null;
          status?: string;
        };
        Update: {
          evidence_url?: string | null;
          game_id?: string;
          id?: string;
          proposed_change?: Json;
          reason?: string;
          requested_at?: string;
          requested_by?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resulting_revision_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "correction_records_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "correction_records_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "correction_records_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "correction_records_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
          {
            foreignKeyName: "correction_records_resulting_revision_id_fkey";
            columns: ["resulting_revision_id"];
            isOneToOne: false;
            referencedRelation: "game_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "correction_records_resulting_revision_id_fkey";
            columns: ["resulting_revision_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["revision_id"];
          },
        ];
      };
      csv_import_log: {
        Row: {
          created_at: string;
          entity_type: string;
          errors: Json | null;
          filename: string;
          id: string;
          imported_by: string | null;
          rows_failed: number;
          rows_imported: number;
        };
        Insert: {
          created_at?: string;
          entity_type: string;
          errors?: Json | null;
          filename: string;
          id?: string;
          imported_by?: string | null;
          rows_failed?: number;
          rows_imported?: number;
        };
        Update: {
          created_at?: string;
          entity_type?: string;
          errors?: Json | null;
          filename?: string;
          id?: string;
          imported_by?: string | null;
          rows_failed?: number;
          rows_imported?: number;
        };
        Relationships: [];
      };
      daily_page_views: {
        Row: {
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          updated_at: string;
          view_count: number;
          view_date: string;
        };
        Insert: {
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          updated_at?: string;
          view_count?: number;
          view_date?: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          updated_at?: string;
          view_count?: number;
          view_date?: string;
        };
        Relationships: [];
      };
      game_assignments: {
        Row: {
          assigned_by: string | null;
          created_at: string;
          game_id: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          assigned_by?: string | null;
          created_at?: string;
          game_id: string;
          id?: string;
          role: string;
          user_id: string;
        };
        Update: {
          assigned_by?: string | null;
          created_at?: string;
          game_id?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_assignments_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_assignments_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_assignments_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_assignments_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
        ];
      };
      game_player_stats: {
        Row: {
          ast: number;
          blk: number;
          dreb: number;
          fga: number;
          fgm: number;
          fta: number;
          ftm: number;
          game_id: string;
          oreb: number;
          pf: number;
          player_id: string;
          pts: number;
          revision_id: string;
          seconds_played: number | null;
          stl: number;
          team_season_id: string;
          tov: number;
          tpa: number;
          tpm: number;
        };
        Insert: {
          ast?: number;
          blk?: number;
          dreb?: number;
          fga?: number;
          fgm?: number;
          fta?: number;
          ftm?: number;
          game_id: string;
          oreb?: number;
          pf?: number;
          player_id: string;
          pts?: number;
          revision_id: string;
          seconds_played?: number | null;
          stl?: number;
          team_season_id: string;
          tov?: number;
          tpa?: number;
          tpm?: number;
        };
        Update: {
          ast?: number;
          blk?: number;
          dreb?: number;
          fga?: number;
          fgm?: number;
          fta?: number;
          ftm?: number;
          game_id?: string;
          oreb?: number;
          pf?: number;
          player_id?: string;
          pts?: number;
          revision_id?: string;
          seconds_played?: number | null;
          stl?: number;
          team_season_id?: string;
          tov?: number;
          tpa?: number;
          tpm?: number;
        };
        Relationships: [
          {
            foreignKeyName: "game_player_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_player_stats_revision_id_fkey";
            columns: ["revision_id"];
            isOneToOne: false;
            referencedRelation: "game_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_revision_id_fkey";
            columns: ["revision_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["revision_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      game_revisions: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string;
          game_id: string;
          id: string;
          journal: Json;
          parent_revision_id: string | null;
          projection: Json;
          revision_number: number;
          source_submission_id: string;
          state: string;
          validation_warnings: Json;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          created_by: string;
          game_id: string;
          id?: string;
          journal: Json;
          parent_revision_id?: string | null;
          projection: Json;
          revision_number: number;
          source_submission_id: string;
          state?: string;
          validation_warnings?: Json;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          created_by?: string;
          game_id?: string;
          id?: string;
          journal?: Json;
          parent_revision_id?: string | null;
          projection?: Json;
          revision_number?: number;
          source_submission_id?: string;
          state?: string;
          validation_warnings?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "game_revisions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_revisions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_revisions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_revisions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
          {
            foreignKeyName: "game_revisions_parent_revision_id_fkey";
            columns: ["parent_revision_id"];
            isOneToOne: false;
            referencedRelation: "game_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_revisions_parent_revision_id_fkey";
            columns: ["parent_revision_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["revision_id"];
          },
          {
            foreignKeyName: "game_revisions_source_submission_id_fkey";
            columns: ["source_submission_id"];
            isOneToOne: false;
            referencedRelation: "source_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_revisions_source_submission_id_fkey";
            columns: ["source_submission_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["source_submission_id"];
          },
        ];
      };
      game_rosters: {
        Row: {
          dnp_reason: string | null;
          game_id: string;
          id: string;
          is_starter: boolean;
          player_id: string;
          team_season_id: string;
        };
        Insert: {
          dnp_reason?: string | null;
          game_id: string;
          id?: string;
          is_starter?: boolean;
          player_id: string;
          team_season_id: string;
        };
        Update: {
          dnp_reason?: string | null;
          game_id?: string;
          id?: string;
          is_starter?: boolean;
          player_id?: string;
          team_season_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_rosters_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_rosters_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_rosters_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_rosters_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_rosters_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "game_rosters_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      game_team_stats: {
        Row: {
          ast: number;
          blk: number;
          dreb: number;
          fga: number;
          fgm: number;
          fta: number;
          ftm: number;
          game_id: string;
          oreb: number;
          pf: number;
          pts: number;
          revision_id: string;
          stl: number;
          team_reb: number;
          team_season_id: string;
          tov: number;
          tpa: number;
          tpm: number;
        };
        Insert: {
          ast?: number;
          blk?: number;
          dreb?: number;
          fga?: number;
          fgm?: number;
          fta?: number;
          ftm?: number;
          game_id: string;
          oreb?: number;
          pf?: number;
          pts?: number;
          revision_id: string;
          stl?: number;
          team_reb?: number;
          team_season_id: string;
          tov?: number;
          tpa?: number;
          tpm?: number;
        };
        Update: {
          ast?: number;
          blk?: number;
          dreb?: number;
          fga?: number;
          fgm?: number;
          fta?: number;
          ftm?: number;
          game_id?: string;
          oreb?: number;
          pf?: number;
          pts?: number;
          revision_id?: string;
          stl?: number;
          team_reb?: number;
          team_season_id?: string;
          tov?: number;
          tpa?: number;
          tpm?: number;
        };
        Relationships: [
          {
            foreignKeyName: "game_team_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_team_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_team_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_team_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
          {
            foreignKeyName: "game_team_stats_revision_id_fkey";
            columns: ["revision_id"];
            isOneToOne: false;
            referencedRelation: "game_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_team_stats_revision_id_fkey";
            columns: ["revision_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["revision_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      games: {
        Row: {
          away_score: number | null;
          away_team_season_id: string;
          competition_id: string;
          created_at: string;
          current_period: number;
          current_revision_number: number;
          home_score: number | null;
          home_team_season_id: string;
          id: string;
          published_at: string | null;
          ruleset_id: string;
          scheduled_at: string;
          status: Database["public"]["Enums"]["game_status"];
          venue_id: string | null;
        };
        Insert: {
          away_score?: number | null;
          away_team_season_id: string;
          competition_id: string;
          created_at?: string;
          current_period?: number;
          current_revision_number?: number;
          home_score?: number | null;
          home_team_season_id: string;
          id?: string;
          published_at?: string | null;
          ruleset_id: string;
          scheduled_at: string;
          status?: Database["public"]["Enums"]["game_status"];
          venue_id?: string | null;
        };
        Update: {
          away_score?: number | null;
          away_team_season_id?: string;
          competition_id?: string;
          created_at?: string;
          current_period?: number;
          current_revision_number?: number;
          home_score?: number | null;
          home_team_season_id?: string;
          id?: string;
          published_at?: string | null;
          ruleset_id?: string;
          scheduled_at?: string;
          status?: Database["public"]["Enums"]["game_status"];
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "games_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "games_ruleset_id_fkey";
            columns: ["ruleset_id"];
            isOneToOne: false;
            referencedRelation: "basketball_rulesets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      guardian_authority_events: {
        Row: {
          action: string;
          actor_id: string;
          created_at: string;
          details: Json | null;
          id: string;
          student_guardian_id: string;
        };
        Insert: {
          action: string;
          actor_id: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          student_guardian_id: string;
        };
        Update: {
          action?: string;
          actor_id?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          student_guardian_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guardian_authority_events_student_guardian_id_fkey";
            columns: ["student_guardian_id"];
            isOneToOne: false;
            referencedRelation: "academy_student_guardians";
            referencedColumns: ["id"];
          },
        ];
      };
      identity_disputes: {
        Row: {
          competition_id: string | null;
          description: string;
          dispute_reason: Database["public"]["Enums"]["dispute_reason"];
          evidence_notes: string | null;
          id: string;
          player_id: string;
          resolution_notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database["public"]["Enums"]["dispute_status"];
          submitted_at: string;
          submitted_by: string | null;
          updated_at: string;
        };
        Insert: {
          competition_id?: string | null;
          description: string;
          dispute_reason: Database["public"]["Enums"]["dispute_reason"];
          evidence_notes?: string | null;
          id?: string;
          player_id: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["dispute_status"];
          submitted_at?: string;
          submitted_by?: string | null;
          updated_at?: string;
        };
        Update: {
          competition_id?: string | null;
          description?: string;
          dispute_reason?: Database["public"]["Enums"]["dispute_reason"];
          evidence_notes?: string | null;
          id?: string;
          player_id?: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["dispute_status"];
          submitted_at?: string;
          submitted_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "identity_disputes_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "identity_disputes_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "identity_disputes_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "identity_disputes_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "identity_disputes_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "identity_disputes_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "identity_disputes_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "identity_disputes_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "identity_disputes_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
        ];
      };
      leagues: {
        Row: {
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          organization_id: string;
          slug: string;
          sport_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          organization_id: string;
          slug: string;
          sport_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          organization_id?: string;
          slug?: string;
          sport_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leagues_sport_id_fkey";
            columns: ["sport_id"];
            isOneToOne: false;
            referencedRelation: "sports";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["membership_role"];
          scope_id: string;
          scope_type: Database["public"]["Enums"]["membership_scope"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["membership_role"];
          scope_id: string;
          scope_type: Database["public"]["Enums"]["membership_scope"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["membership_role"];
          scope_id?: string;
          scope_type?: Database["public"]["Enums"]["membership_scope"];
          user_id?: string;
        };
        Relationships: [];
      };
      offline_attendance_queue: {
        Row: {
          created_at: string;
          device_id: string;
          id: string;
          local_sequence: number;
          note: string | null;
          program_id: string;
          session_date: string;
          status: string;
          student_id: string;
          synced_at: string | null;
        };
        Insert: {
          created_at?: string;
          device_id: string;
          id?: string;
          local_sequence: number;
          note?: string | null;
          program_id: string;
          session_date: string;
          status: string;
          student_id: string;
          synced_at?: string | null;
        };
        Update: {
          created_at?: string;
          device_id?: string;
          id?: string;
          local_sequence?: number;
          note?: string | null;
          program_id?: string;
          session_date?: string;
          status?: string;
          student_id?: string;
          synced_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "offline_attendance_queue_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "academy_programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offline_attendance_queue_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "academy_students";
            referencedColumns: ["id"];
          },
        ];
      };
      opponent_notes: {
        Row: {
          created_at: string;
          created_by: string;
          game_plan: string | null;
          id: string;
          notes: string | null;
          opponent_team_season_id: string;
          strengths: string[] | null;
          team_season_id: string;
          updated_at: string;
          weaknesses: string[] | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          game_plan?: string | null;
          id?: string;
          notes?: string | null;
          opponent_team_season_id: string;
          strengths?: string[] | null;
          team_season_id: string;
          updated_at?: string;
          weaknesses?: string[] | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          game_plan?: string | null;
          id?: string;
          notes?: string | null;
          opponent_team_season_id?: string;
          strengths?: string[] | null;
          team_season_id?: string;
          updated_at?: string;
          weaknesses?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey";
            columns: ["opponent_team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey";
            columns: ["opponent_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey";
            columns: ["opponent_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey";
            columns: ["opponent_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey";
            columns: ["opponent_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey";
            columns: ["opponent_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_opponent_team_season_id_fkey";
            columns: ["opponent_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "opponent_notes_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string;
          customer_name: string;
          id: string;
          items: Json;
          phone: string;
          qpay_invoice_id: string | null;
          qpay_qr_image: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_mnt: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_name: string;
          id?: string;
          items: Json;
          phone: string;
          qpay_invoice_id?: string | null;
          qpay_qr_image?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_mnt: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_name?: string;
          id?: string;
          items?: Json;
          phone?: string;
          qpay_invoice_id?: string | null;
          qpay_qr_image?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_mnt?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_storage_buckets: {
        Row: {
          bucket_id: string;
          bucket_name: string;
          created_at: string | null;
          id: string;
          is_tenant_isolation: boolean | null;
          organization_id: string;
        };
        Insert: {
          bucket_id: string;
          bucket_name: string;
          created_at?: string | null;
          id?: string;
          is_tenant_isolation?: boolean | null;
          organization_id: string;
        };
        Update: {
          bucket_id?: string;
          bucket_name?: string;
          created_at?: string | null;
          id?: string;
          is_tenant_isolation?: boolean | null;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_storage_buckets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          settings: Json | null;
          slug: string;
          social_links: Json;
          type: string;
          website: string | null;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          settings?: Json | null;
          slug: string;
          social_links?: Json;
          type?: string;
          website?: string | null;
        };
        Update: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          settings?: Json | null;
          slug?: string;
          social_links?: Json;
          type?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      player_aliases: {
        Row: {
          alias: string;
          created_at: string;
          created_by: string | null;
          id: string;
          normalized_alias: string;
          player_id: string;
          source_submission_id: string | null;
        };
        Insert: {
          alias: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          normalized_alias: string;
          player_id: string;
          source_submission_id?: string | null;
        };
        Update: {
          alias?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          normalized_alias?: string;
          player_id?: string;
          source_submission_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "player_aliases_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_aliases_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_aliases_source_submission_id_fkey";
            columns: ["source_submission_id"];
            isOneToOne: false;
            referencedRelation: "source_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_aliases_source_submission_id_fkey";
            columns: ["source_submission_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["source_submission_id"];
          },
        ];
      };
      player_merge_history: {
        Row: {
          created_at: string;
          id: string;
          kept_player_id: string;
          merged_by: string;
          merged_player_id: string;
          reason: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kept_player_id: string;
          merged_by: string;
          merged_player_id: string;
          reason: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kept_player_id?: string;
          merged_by?: string;
          merged_player_id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey";
            columns: ["kept_player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey";
            columns: ["kept_player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey";
            columns: ["kept_player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey";
            columns: ["kept_player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey";
            columns: ["kept_player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey";
            columns: ["kept_player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_merge_history_kept_player_id_fkey";
            columns: ["kept_player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey";
            columns: ["merged_player_id"];
            isOneToOne: true;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey";
            columns: ["merged_player_id"];
            isOneToOne: true;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey";
            columns: ["merged_player_id"];
            isOneToOne: true;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey";
            columns: ["merged_player_id"];
            isOneToOne: true;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey";
            columns: ["merged_player_id"];
            isOneToOne: true;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey";
            columns: ["merged_player_id"];
            isOneToOne: true;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "player_merge_history_merged_player_id_fkey";
            columns: ["merged_player_id"];
            isOneToOne: true;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
        ];
      };
      players: {
        Row: {
          canonical_identity_id: string | null;
          canonical_name: string;
          consent_note: string | null;
          consent_recorded_at: string | null;
          created_at: string;
          dob: string | null;
          height_cm: number | null;
          id: string;
          name_latin: string | null;
          nationality: string;
          photo_url: string | null;
          position: string | null;
          social_links: Json;
          user_id: string | null;
          visibility: string;
          weight_kg: number | null;
        };
        Insert: {
          canonical_identity_id?: string | null;
          canonical_name: string;
          consent_note?: string | null;
          consent_recorded_at?: string | null;
          created_at?: string;
          dob?: string | null;
          height_cm?: number | null;
          id?: string;
          name_latin?: string | null;
          nationality?: string;
          photo_url?: string | null;
          position?: string | null;
          social_links?: Json;
          user_id?: string | null;
          visibility?: string;
          weight_kg?: number | null;
        };
        Update: {
          canonical_identity_id?: string | null;
          canonical_name?: string;
          consent_note?: string | null;
          consent_recorded_at?: string | null;
          created_at?: string;
          dob?: string | null;
          height_cm?: number | null;
          id?: string;
          name_latin?: string | null;
          nationality?: string;
          photo_url?: string | null;
          position?: string | null;
          social_links?: Json;
          user_id?: string | null;
          visibility?: string;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "players_canonical_identity_id_fkey";
            columns: ["canonical_identity_id"];
            isOneToOne: false;
            referencedRelation: "canonical_identities";
            referencedColumns: ["id"];
          },
        ];
      };
      product_bundles: {
        Row: {
          created_at: string;
          description: string | null;
          discount_percent: number;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          discount_percent: number;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          discount_percent?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_reviews: {
        Row: {
          author_name: string;
          content: string;
          created_at: string;
          id: string;
          is_approved: boolean;
          product_id: string;
          rating: number;
        };
        Insert: {
          author_name: string;
          content: string;
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          product_id: string;
          rating: number;
        };
        Update: {
          author_name?: string;
          content?: string;
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          product_id?: string;
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shop_products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          images: Json;
          is_available: boolean;
          name: string;
          name_en: string | null;
          price_mnt: number;
          slug: string;
          team_id: string | null;
          updated_at: string;
          variants: Json;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: Json;
          is_available?: boolean;
          name: string;
          name_en?: string | null;
          price_mnt: number;
          slug: string;
          team_id?: string | null;
          updated_at?: string;
          variants?: Json;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: Json;
          is_available?: boolean;
          name?: string;
          name_en?: string | null;
          price_mnt?: number;
          slug?: string;
          team_id?: string | null;
          updated_at?: string;
          variants?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_id"];
          },
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      public_error_reports: {
        Row: {
          contact: string | null;
          created_at: string | null;
          game_id: string | null;
          id: string;
          message: string;
          player_id: string | null;
          reporter_hash: string;
          status: string;
        };
        Insert: {
          contact?: string | null;
          created_at?: string | null;
          game_id?: string | null;
          id?: string;
          message: string;
          player_id?: string | null;
          reporter_hash: string;
          status?: string;
        };
        Update: {
          contact?: string | null;
          created_at?: string | null;
          game_id?: string | null;
          id?: string;
          message?: string;
          player_id?: string | null;
          reporter_hash?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_error_reports_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_error_reports_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_error_reports_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_error_reports_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "public_error_reports_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
        ];
      };
      qpay_invoices: {
        Row: {
          amount_mnt: number;
          created_at: string;
          expires_at: string | null;
          id: string;
          invoice_id: string;
          paid_at: string | null;
          qr_image: string | null;
          qr_text: string | null;
          status: string;
          updated_at: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          amount_mnt: number;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          invoice_id: string;
          paid_at?: string | null;
          qr_image?: string | null;
          qr_text?: string | null;
          status?: string;
          updated_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          amount_mnt?: number;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          invoice_id?: string;
          paid_at?: string | null;
          qr_image?: string | null;
          qr_text?: string | null;
          status?: string;
          updated_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [];
      };
      report_snapshots: {
        Row: {
          academy_id: string;
          data: Json;
          generated_at: string;
          id: string;
          period_end: string;
          period_start: string;
          report_type: string;
        };
        Insert: {
          academy_id: string;
          data?: Json;
          generated_at?: string;
          id?: string;
          period_end: string;
          period_start: string;
          report_type: string;
        };
        Update: {
          academy_id?: string;
          data?: Json;
          generated_at?: string;
          id?: string;
          period_end?: string;
          period_start?: string;
          report_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_snapshots_academy_id_fkey";
            columns: ["academy_id"];
            isOneToOne: false;
            referencedRelation: "academy_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      roster_availability: {
        Row: {
          created_at: string;
          game_date: string;
          id: string;
          note: string | null;
          player_id: string;
          status: string;
          team_season_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          game_date: string;
          id?: string;
          note?: string | null;
          player_id: string;
          status: string;
          team_season_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          game_date?: string;
          id?: string;
          note?: string | null;
          player_id?: string;
          status?: string;
          team_season_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roster_availability_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_availability_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "roster_availability_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      roster_entries: {
        Row: {
          created_at: string;
          id: string;
          jersey_number: number | null;
          joined_at: string;
          left_at: string | null;
          player_id: string;
          position: string | null;
          team_season_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          jersey_number?: number | null;
          joined_at?: string;
          left_at?: string | null;
          player_id: string;
          position?: string | null;
          team_season_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          jersey_number?: number | null;
          joined_at?: string;
          left_at?: string | null;
          player_id?: string;
          position?: string | null;
          team_season_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roster_entries_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_entries_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "roster_entries_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      roster_snapshots: {
        Row: {
          captured_at: string;
          created_at: string;
          id: string;
          jersey_number: number | null;
          player_id: string;
          position: string | null;
          status: string;
          team_season_id: string;
        };
        Insert: {
          captured_at?: string;
          created_at?: string;
          id?: string;
          jersey_number?: number | null;
          player_id: string;
          position?: string | null;
          status?: string;
          team_season_id: string;
        };
        Update: {
          captured_at?: string;
          created_at?: string;
          id?: string;
          jersey_number?: number | null;
          player_id?: string;
          position?: string | null;
          status?: string;
          team_season_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roster_snapshots_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_snapshots_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "roster_snapshots_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      season_player_stats: {
        Row: {
          ast: number | null;
          blk: number | null;
          competition_id: string;
          dreb: number | null;
          fga: number | null;
          fgm: number | null;
          fta: number | null;
          ftm: number | null;
          ftp: number | null;
          gp: number;
          mpg: number | null;
          oreb: number | null;
          pf: number | null;
          player_id: string;
          pts: number | null;
          seconds_played: number | null;
          stl: number | null;
          team_season_id: string;
          tov: number | null;
          tpa: number | null;
          tpm: number | null;
        };
        Insert: {
          ast?: number | null;
          blk?: number | null;
          competition_id: string;
          dreb?: number | null;
          fga?: number | null;
          fgm?: number | null;
          fta?: number | null;
          ftm?: number | null;
          ftp?: number | null;
          gp?: number;
          mpg?: number | null;
          oreb?: number | null;
          pf?: number | null;
          player_id: string;
          pts?: number | null;
          seconds_played?: number | null;
          stl?: number | null;
          team_season_id: string;
          tov?: number | null;
          tpa?: number | null;
          tpm?: number | null;
        };
        Update: {
          ast?: number | null;
          blk?: number | null;
          competition_id?: string;
          dreb?: number | null;
          fga?: number | null;
          fgm?: number | null;
          fta?: number | null;
          ftm?: number | null;
          ftp?: number | null;
          gp?: number;
          mpg?: number | null;
          oreb?: number | null;
          pf?: number | null;
          player_id?: string;
          pts?: number | null;
          seconds_played?: number | null;
          stl?: number | null;
          team_season_id?: string;
          tov?: number | null;
          tpa?: number | null;
          tpm?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "season_player_stats_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_player_stats_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      seasons: {
        Row: {
          created_at: string;
          ends_on: string | null;
          id: string;
          league_id: string;
          name: string;
          starts_on: string | null;
        };
        Insert: {
          created_at?: string;
          ends_on?: string | null;
          id?: string;
          league_id: string;
          name: string;
          starts_on?: string | null;
        };
        Update: {
          created_at?: string;
          ends_on?: string | null;
          id?: string;
          league_id?: string;
          name?: string;
          starts_on?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "seasons_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seasons_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "seasons_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_leaders";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "seasons_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "seasons_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "seasons_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_standings";
            referencedColumns: ["league_id"];
          },
        ];
      };
      source_submissions: {
        Row: {
          confidence: number | null;
          evidence_url: string | null;
          game_id: string;
          id: string;
          idempotency_key: string | null;
          normalized_payload: Json;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rights_confirmed_at: string | null;
          source_type: string;
          status: string;
          submitted_at: string;
          submitted_by: string;
        };
        Insert: {
          confidence?: number | null;
          evidence_url?: string | null;
          game_id: string;
          id?: string;
          idempotency_key?: string | null;
          normalized_payload: Json;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rights_confirmed_at?: string | null;
          source_type: string;
          status?: string;
          submitted_at?: string;
          submitted_by: string;
        };
        Update: {
          confidence?: number | null;
          evidence_url?: string | null;
          game_id?: string;
          id?: string;
          idempotency_key?: string | null;
          normalized_payload?: Json;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rights_confirmed_at?: string | null;
          source_type?: string;
          status?: string;
          submitted_at?: string;
          submitted_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_submissions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_submissions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_submissions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_submissions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
        ];
      };
      sponsor_placements: {
        Row: {
          competition_id: string;
          created_at: string;
          ends_on: string;
          id: string;
          slot: string;
          sponsor_id: string;
          starts_on: string;
        };
        Insert: {
          competition_id: string;
          created_at?: string;
          ends_on: string;
          id?: string;
          slot: string;
          sponsor_id: string;
          starts_on: string;
        };
        Update: {
          competition_id?: string;
          created_at?: string;
          ends_on?: string;
          id?: string;
          slot?: string;
          sponsor_id?: string;
          starts_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sponsor_placements_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sponsor_placements_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "sponsor_placements_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sponsor_placements_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "v_public_sponsor_slots";
            referencedColumns: ["sponsor_id"];
          },
        ];
      };
      sponsors: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          link_url: string | null;
          logo_url: string | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          link_url?: string | null;
          logo_url?: string | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          link_url?: string | null;
          logo_url?: string | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sports: {
        Row: {
          config: Json;
          created_at: string;
          id: string;
          key: string;
          name_en: string;
          name_mn: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          id?: string;
          key: string;
          name_en: string;
          name_mn: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          id?: string;
          key?: string;
          name_en?: string;
          name_mn?: string;
        };
        Relationships: [];
      };
      standings: {
        Row: {
          competition_id: string;
          gb: number | null;
          l: number | null;
          last10: string | null;
          losses: number;
          points_against: number | null;
          points_for: number | null;
          streak: string | null;
          team_season_id: string;
          w: number | null;
          win_pct: number;
          wins: number;
        };
        Insert: {
          competition_id: string;
          gb?: number | null;
          l?: number | null;
          last10?: string | null;
          losses?: number;
          points_against?: number | null;
          points_for?: number | null;
          streak?: string | null;
          team_season_id: string;
          w?: number | null;
          win_pct?: number;
          wins?: number;
        };
        Update: {
          competition_id?: string;
          gb?: number | null;
          l?: number | null;
          last10?: string | null;
          losses?: number;
          points_against?: number | null;
          points_for?: number | null;
          streak?: string | null;
          team_season_id?: string;
          w?: number | null;
          win_pct?: number;
          wins?: number;
        };
        Relationships: [
          {
            foreignKeyName: "standings_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      stat_event_types: {
        Row: {
          category: string;
          key: string;
          requires_player: boolean;
          sport_key: string;
        };
        Insert: {
          category: string;
          key: string;
          requires_player?: boolean;
          sport_key: string;
        };
        Update: {
          category?: string;
          key?: string;
          requires_player?: boolean;
          sport_key?: string;
        };
        Relationships: [];
      };
      stat_events: {
        Row: {
          client_id: string;
          clock_seconds: number;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          event_type: string;
          game_id: string;
          id: string;
          local_seq: number;
          operation_id: string;
          payload: Json;
          period: number;
          player_id: string | null;
          superseded_by: string | null;
          team_season_id: string | null;
          tracker_session_id: string;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          client_id: string;
          clock_seconds: number;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          event_type: string;
          game_id: string;
          id?: string;
          local_seq: number;
          operation_id: string;
          payload?: Json;
          period: number;
          player_id?: string | null;
          superseded_by?: string | null;
          team_season_id?: string | null;
          tracker_session_id: string;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          client_id?: string;
          clock_seconds?: number;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          event_type?: string;
          game_id?: string;
          id?: string;
          local_seq?: number;
          operation_id?: string;
          payload?: Json;
          period?: number;
          player_id?: string | null;
          superseded_by?: string | null;
          team_season_id?: string | null;
          tracker_session_id?: string;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stat_events_event_type_fkey";
            columns: ["event_type"];
            isOneToOne: false;
            referencedRelation: "stat_event_types";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "stat_events_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "stat_events_superseded_by_fkey";
            columns: ["superseded_by"];
            isOneToOne: false;
            referencedRelation: "stat_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_superseded_by_fkey";
            columns: ["superseded_by"];
            isOneToOne: false;
            referencedRelation: "v_public_play_by_play";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "stat_events_tracker_session_id_fkey";
            columns: ["tracker_session_id"];
            isOneToOne: false;
            referencedRelation: "tracker_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      student_payments: {
        Row: {
          amount_mnt: number;
          created_at: string;
          enrollment_id: string | null;
          id: string;
          notes: string | null;
          paid_at: string | null;
          payment_method: string | null;
          qpay_invoice_id: string | null;
          recorded_by: string | null;
          student_id: string;
        };
        Insert: {
          amount_mnt: number;
          created_at?: string;
          enrollment_id?: string | null;
          id?: string;
          notes?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          qpay_invoice_id?: string | null;
          recorded_by?: string | null;
          student_id: string;
        };
        Update: {
          amount_mnt?: number;
          created_at?: string;
          enrollment_id?: string | null;
          id?: string;
          notes?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          qpay_invoice_id?: string | null;
          recorded_by?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_payments_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "academy_enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_payments_qpay_invoice_id_fkey";
            columns: ["qpay_invoice_id"];
            isOneToOne: false;
            referencedRelation: "qpay_invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "academy_students";
            referencedColumns: ["id"];
          },
        ];
      };
      team_seasons: {
        Row: {
          competition_id: string;
          created_at: string;
          id: string;
          team_id: string;
        };
        Insert: {
          competition_id: string;
          created_at?: string;
          id?: string;
          team_id: string;
        };
        Update: {
          competition_id?: string;
          created_at?: string;
          id?: string;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_seasons_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_seasons_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_id"];
          },
        ];
      };
      team_staff: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean | null;
          role: string;
          team_season_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          role: string;
          team_season_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          role?: string;
          team_season_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_staff_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "team_staff_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      team_transactions: {
        Row: {
          amount_mnt: number;
          created_at: string;
          created_by: string;
          description: string;
          due_date: string | null;
          id: string;
          paid_at: string | null;
          paid_by: string | null;
          team_season_id: string;
          type: string;
        };
        Insert: {
          amount_mnt: number;
          created_at?: string;
          created_by: string;
          description: string;
          due_date?: string | null;
          id?: string;
          paid_at?: string | null;
          paid_by?: string | null;
          team_season_id: string;
          type: string;
        };
        Update: {
          amount_mnt?: number;
          created_at?: string;
          created_by?: string;
          description?: string;
          due_date?: string | null;
          id?: string;
          paid_at?: string | null;
          paid_by?: string | null;
          team_season_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_transactions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "team_transactions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          id: string;
          league_id: string;
          logo_url: string | null;
          name: string;
          primary_color: string | null;
          short_code: string;
          slug: string;
          social_links: Json;
        };
        Insert: {
          created_at?: string;
          id?: string;
          league_id: string;
          logo_url?: string | null;
          name: string;
          primary_color?: string | null;
          short_code: string;
          slug: string;
          social_links?: Json;
        };
        Update: {
          created_at?: string;
          id?: string;
          league_id?: string;
          logo_url?: string | null;
          name?: string;
          primary_color?: string | null;
          short_code?: string;
          slug?: string;
          social_links?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "teams_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_leaders";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "teams_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "teams_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["league_id"];
          },
          {
            foreignKeyName: "teams_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "v_public_standings";
            referencedColumns: ["league_id"];
          },
        ];
      };
      tracker_sessions: {
        Row: {
          closed_at: string | null;
          closure_reason: string | null;
          device_info: Json;
          game_id: string;
          handed_off_to_session_id: string | null;
          id: string;
          last_acknowledged_sequence: number;
          role: string;
          scorer_id: string;
          started_at: string;
          status: string;
        };
        Insert: {
          closed_at?: string | null;
          closure_reason?: string | null;
          device_info?: Json;
          game_id: string;
          handed_off_to_session_id?: string | null;
          id?: string;
          last_acknowledged_sequence?: number;
          role: string;
          scorer_id: string;
          started_at?: string;
          status?: string;
        };
        Update: {
          closed_at?: string | null;
          closure_reason?: string | null;
          device_info?: Json;
          game_id?: string;
          handed_off_to_session_id?: string | null;
          id?: string;
          last_acknowledged_sequence?: number;
          role?: string;
          scorer_id?: string;
          started_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracker_sessions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracker_sessions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracker_sessions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracker_sessions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
          {
            foreignKeyName: "tracker_sessions_handed_off_to_session_id_fkey";
            columns: ["handed_off_to_session_id"];
            isOneToOne: false;
            referencedRelation: "tracker_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      training_sessions: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          is_cancelled: boolean | null;
          location: string | null;
          scheduled_at: string;
          team_season_id: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_cancelled?: boolean | null;
          location?: string | null;
          scheduled_at: string;
          team_season_id: string;
          title: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_cancelled?: boolean | null;
          location?: string | null;
          scheduled_at?: string;
          team_season_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_sessions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "training_sessions_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      transfers: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string;
          effective_from: string;
          effective_until: string | null;
          from_team_season_id: string | null;
          id: string;
          note: string | null;
          player_id: string;
          to_team_season_id: string;
          transfer_type: Database["public"]["Enums"]["transfer_type"];
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          created_by: string;
          effective_from: string;
          effective_until?: string | null;
          from_team_season_id?: string | null;
          id?: string;
          note?: string | null;
          player_id: string;
          to_team_season_id: string;
          transfer_type?: Database["public"]["Enums"]["transfer_type"];
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          created_by?: string;
          effective_from?: string;
          effective_until?: string | null;
          from_team_season_id?: string | null;
          id?: string;
          note?: string | null;
          player_id?: string;
          to_team_season_id?: string;
          transfer_type?: Database["public"]["Enums"]["transfer_type"];
        };
        Relationships: [
          {
            foreignKeyName: "transfers_from_team_season_id_fkey";
            columns: ["from_team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey";
            columns: ["from_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey";
            columns: ["from_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey";
            columns: ["from_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey";
            columns: ["from_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey";
            columns: ["from_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "transfers_from_team_season_id_fkey";
            columns: ["from_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "transfers_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transfers_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "transfers_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "transfers_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "transfers_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transfers_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "transfers_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey";
            columns: ["to_team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey";
            columns: ["to_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey";
            columns: ["to_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey";
            columns: ["to_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey";
            columns: ["to_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey";
            columns: ["to_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "transfers_to_team_season_id_fkey";
            columns: ["to_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      venues: {
        Row: {
          capacity: number | null;
          city: string | null;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          capacity?: number | null;
          city?: string | null;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          capacity?: number | null;
          city?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      waitlist_history: {
        Row: {
          created_at: string;
          id: string;
          position: number;
          program_id: string;
          promoted_at: string | null;
          student_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          position: number;
          program_id: string;
          promoted_at?: string | null;
          student_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          position?: number;
          program_id?: string;
          promoted_at?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "waitlist_history_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "academy_programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "waitlist_history_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "academy_students";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_athlete_timeline: {
        Row: {
          assists: number | null;
          away_score: number | null;
          competition_name: string | null;
          entity_id: string | null;
          event_date: string | null;
          event_id: string | null;
          event_label: string | null;
          event_type: string | null;
          home_score: number | null;
          opponent_name: string | null;
          player_team_name: string | null;
          program_name: string | null;
          pts: number | null;
          total_rebounds: number | null;
        };
        Relationships: [];
      };
      v_public_awards: {
        Row: {
          award_type: string | null;
          competition_id: string | null;
          competition_name: string | null;
          granted_at: string | null;
          id: string | null;
          note: string | null;
          period_end: string | null;
          period_start: string | null;
          player_id: string | null;
          player_name: string | null;
        };
        Relationships: [];
      };
      v_public_box_score: {
        Row: {
          ast: number | null;
          blk: number | null;
          dreb: number | null;
          evidence_url: string | null;
          fga: number | null;
          fgm: number | null;
          fta: number | null;
          ftm: number | null;
          game_id: string | null;
          jersey_number: number | null;
          oreb: number | null;
          pf: number | null;
          player_id: string | null;
          player_name: string | null;
          player_name_latin: string | null;
          player_position: string | null;
          pts: number | null;
          revision_approved_at: string | null;
          revision_id: string | null;
          revision_number: number | null;
          seconds_played: number | null;
          source_reviewed_at: string | null;
          source_type: string | null;
          stl: number | null;
          team_id: string | null;
          team_name: string | null;
          team_season_id: string | null;
          tov: number | null;
          tpa: number | null;
          tpm: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_player_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "game_player_stats_revision_id_fkey";
            columns: ["revision_id"];
            isOneToOne: false;
            referencedRelation: "game_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_revision_id_fkey";
            columns: ["revision_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["revision_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "game_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_id"];
          },
        ];
      };
      v_public_games: {
        Row: {
          away_score: number | null;
          away_team_id: string | null;
          away_team_logo_url: string | null;
          away_team_name: string | null;
          away_team_primary_color: string | null;
          away_team_season_id: string | null;
          away_team_short_code: string | null;
          away_team_slug: string | null;
          competition_id: string | null;
          competition_name: string | null;
          current_period: number | null;
          current_revision_number: number | null;
          evidence_url: string | null;
          home_score: number | null;
          home_team_id: string | null;
          home_team_logo_url: string | null;
          home_team_name: string | null;
          home_team_primary_color: string | null;
          home_team_season_id: string | null;
          home_team_short_code: string | null;
          home_team_slug: string | null;
          id: string | null;
          is_provisional: boolean | null;
          league_id: string | null;
          league_name: string | null;
          league_slug: string | null;
          published_at: string | null;
          revision_approved_at: string | null;
          revision_id: string | null;
          revision_number: number | null;
          scheduled_at: string | null;
          season_id: string | null;
          season_name: string | null;
          source_reviewed_at: string | null;
          source_reviewer_id: string | null;
          source_submission_id: string | null;
          source_type: string | null;
          status: Database["public"]["Enums"]["game_status"] | null;
          venue_id: string | null;
          venue_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "games_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      v_public_leaders: {
        Row: {
          ast: number | null;
          blk: number | null;
          competition_id: string | null;
          competition_name: string | null;
          dreb: number | null;
          fga: number | null;
          fgm: number | null;
          fta: number | null;
          ftm: number | null;
          gp: number | null;
          league_id: string | null;
          league_name: string | null;
          league_slug: string | null;
          mpg: number | null;
          oreb: number | null;
          pf: number | null;
          player_id: string | null;
          player_name: string | null;
          player_name_latin: string | null;
          player_photo_url: string | null;
          player_position: string | null;
          pts: number | null;
          qualified: boolean | null;
          season_id: string | null;
          season_name: string | null;
          stl: number | null;
          team_games_played: number | null;
          team_id: string | null;
          team_logo_url: string | null;
          team_name: string | null;
          team_primary_color: string | null;
          team_season_id: string | null;
          team_short_code: string | null;
          team_slug: string | null;
          tov: number | null;
          tpa: number | null;
          tpm: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "season_player_stats_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_player_stats_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "season_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "season_player_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_id"];
          },
        ];
      };
      v_public_live_games: {
        Row: {
          away_score: number | null;
          away_team_id: string | null;
          away_team_logo_url: string | null;
          away_team_name: string | null;
          away_team_primary_color: string | null;
          away_team_season_id: string | null;
          away_team_short_code: string | null;
          away_team_slug: string | null;
          competition_id: string | null;
          competition_name: string | null;
          current_period: number | null;
          current_revision_number: number | null;
          evidence_url: string | null;
          home_score: number | null;
          home_team_id: string | null;
          home_team_logo_url: string | null;
          home_team_name: string | null;
          home_team_primary_color: string | null;
          home_team_season_id: string | null;
          home_team_short_code: string | null;
          home_team_slug: string | null;
          id: string | null;
          is_provisional: boolean | null;
          league_id: string | null;
          league_name: string | null;
          league_slug: string | null;
          published_at: string | null;
          revision_approved_at: string | null;
          revision_id: string | null;
          revision_number: number | null;
          scheduled_at: string | null;
          season_id: string | null;
          season_name: string | null;
          source_reviewed_at: string | null;
          source_reviewer_id: string | null;
          source_submission_id: string | null;
          source_type: string | null;
          status: Database["public"]["Enums"]["game_status"] | null;
          venue_id: string | null;
          venue_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "games_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      v_public_play_by_play: {
        Row: {
          clock_seconds: number | null;
          created_at: string | null;
          event_id: string | null;
          event_type: string | null;
          game_id: string | null;
          jersey_number: number | null;
          local_seq: number | null;
          operation_id: string | null;
          payload: Json | null;
          period: number | null;
          player_id: string | null;
          player_name: string | null;
          player_name_latin: string | null;
          team_name: string | null;
          team_season_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stat_events_event_type_fkey";
            columns: ["event_type"];
            isOneToOne: false;
            referencedRelation: "stat_event_types";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "stat_events_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_game_stats";
            referencedColumns: ["game_id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_directory";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_shot_zones";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "stat_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      v_public_player_directory: {
        Row: {
          assists_per_game: number | null;
          games_played: number | null;
          photo_url: string | null;
          player_id: string | null;
          player_name: string | null;
          player_name_latin: string | null;
          player_position: string | null;
          points_per_game: number | null;
          rebounds_per_game: number | null;
          team_logo_url: string | null;
          team_name: string | null;
          team_primary_color: string | null;
          team_short_code: string | null;
          team_slug: string | null;
        };
        Relationships: [];
      };
      v_public_player_profiles: {
        Row: {
          ast_per_game: number | null;
          blk_per_game: number | null;
          competition_id: string | null;
          competition_name: string | null;
          dob: string | null;
          dreb_per_game: number | null;
          fga_per_game: number | null;
          fgm_per_game: number | null;
          fta_per_game: number | null;
          ftm_per_game: number | null;
          games_played: number | null;
          height_cm: number | null;
          jersey_number: number | null;
          league_id: string | null;
          league_name: string | null;
          league_slug: string | null;
          minutes_per_game: number | null;
          nationality: string | null;
          oreb_per_game: number | null;
          pf_per_game: number | null;
          photo_url: string | null;
          player_id: string | null;
          player_name: string | null;
          player_name_latin: string | null;
          player_position: string | null;
          points_per_game: number | null;
          season_id: string | null;
          season_name: string | null;
          social_links: Json | null;
          stl_per_game: number | null;
          team_id: string | null;
          team_logo_url: string | null;
          team_name: string | null;
          team_primary_color: string | null;
          team_season_id: string | null;
          team_short_code: string | null;
          team_slug: string | null;
          tov_per_game: number | null;
          tpa_per_game: number | null;
          tpm_per_game: number | null;
          weight_kg: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_seasons_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_seasons_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_id"];
          },
        ];
      };
      v_public_players: {
        Row: {
          canonical_name: string | null;
          id: string | null;
          name_latin: string | null;
          photo_url: string | null;
          short_code: string | null;
          team_name: string | null;
          team_slug: string | null;
        };
        Relationships: [];
      };
      v_public_shop_products: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string | null;
          images: Json | null;
          is_available: boolean | null;
          name: string | null;
          name_en: string | null;
          price_mnt: number | null;
          slug: string | null;
          team_id: string | null;
          team_name: string | null;
          team_primary_color: string | null;
          team_short_code: string | null;
          team_slug: string | null;
          updated_at: string | null;
          variants: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_id"];
          },
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_id"];
          },
        ];
      };
      v_public_shot_zones: {
        Row: {
          attempted: number | null;
          competition_id: string | null;
          made: number | null;
          player_id: string | null;
          team_season_id: string | null;
          zone_key: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "stat_events_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "team_seasons_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_seasons_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
        ];
      };
      v_public_sponsor_slots: {
        Row: {
          competition_id: string | null;
          ends_on: string | null;
          link_url: string | null;
          logo_url: string | null;
          placement_id: string | null;
          slot: string | null;
          sponsor_id: string | null;
          sponsor_name: string | null;
          starts_on: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sponsor_placements_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sponsor_placements_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
        ];
      };
      v_public_standings: {
        Row: {
          competition_id: string | null;
          competition_name: string | null;
          gb: number | null;
          last10: string | null;
          league_id: string | null;
          league_slug: string | null;
          losses: number | null;
          points_against: number | null;
          points_for: number | null;
          season_id: string | null;
          season_name: string | null;
          streak: string | null;
          team_id: string | null;
          team_logo_url: string | null;
          team_name: string | null;
          team_primary_color: string | null;
          team_season_id: string | null;
          team_short_code: string | null;
          team_slug: string | null;
          win_pct: number | null;
          wins: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "standings_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "standings_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_id"];
          },
        ];
      };
      v_public_team_game_stats: {
        Row: {
          away_score: number | null;
          away_team_season_id: string | null;
          game_id: string | null;
          home_away: string | null;
          home_score: number | null;
          home_team_season_id: string | null;
          opp_ast: number | null;
          opp_blk: number | null;
          opp_dreb: number | null;
          opp_fga: number | null;
          opp_fgm: number | null;
          opp_fta: number | null;
          opp_ftm: number | null;
          opp_oreb: number | null;
          opp_pf: number | null;
          opp_pts: number | null;
          opp_stl: number | null;
          opp_team_logo_url: string | null;
          opp_team_name: string | null;
          opp_team_season_id: string | null;
          opp_team_short_code: string | null;
          opp_team_slug: string | null;
          opp_tov: number | null;
          opp_tpa: number | null;
          opp_tpm: number | null;
          scheduled_at: string | null;
          status: Database["public"]["Enums"]["game_status"] | null;
          team_ast: number | null;
          team_blk: number | null;
          team_dreb: number | null;
          team_fga: number | null;
          team_fgm: number | null;
          team_fta: number | null;
          team_ftm: number | null;
          team_oreb: number | null;
          team_pf: number | null;
          team_pts: number | null;
          team_season_id: string | null;
          team_stl: number | null;
          team_tov: number | null;
          team_tpa: number | null;
          team_tpm: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["opp_team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["opp_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["opp_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["opp_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["opp_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["opp_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["opp_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "game_team_stats_team_season_id_fkey";
            columns: ["team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "games_away_team_season_id_fkey";
            columns: ["away_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "team_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_player_profiles";
            referencedColumns: ["team_season_id"];
          },
          {
            foreignKeyName: "games_home_team_season_id_fkey";
            columns: ["home_team_season_id"];
            isOneToOne: false;
            referencedRelation: "v_public_team_roster";
            referencedColumns: ["team_season_id"];
          },
        ];
      };
      v_public_team_roster: {
        Row: {
          competition_id: string | null;
          jersey_number: number | null;
          photo_url: string | null;
          player_id: string | null;
          player_name: string | null;
          player_name_latin: string | null;
          player_position: string | null;
          roster_entry_id: string | null;
          roster_position: string | null;
          team_id: string | null;
          team_logo_url: string | null;
          team_name: string | null;
          team_primary_color: string | null;
          team_season_id: string | null;
          team_short_code: string | null;
          team_slug: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_seasons_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_seasons_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "v_public_awards";
            referencedColumns: ["competition_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_games";
            referencedColumns: ["home_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["away_team_id"];
          },
          {
            foreignKeyName: "team_seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "v_public_live_games";
            referencedColumns: ["home_team_id"];
          },
        ];
      };
    };
    Functions: {
      apply_derived_stats: {
        Args: {
          p_away_score: number;
          p_game_id: string;
          p_home_score: number;
          p_player_stats: Json;
          p_status: Database["public"]["Enums"]["game_status"];
          p_team_stats: Json;
        };
        Returns: undefined;
      };
      cmd_apply_correction: {
        Args: {
          p_correction_id: string;
          p_journal: Json;
          p_projection: Json;
          p_validation_warnings?: Json;
        };
        Returns: {
          evidence_url: string | null;
          game_id: string;
          id: string;
          proposed_change: Json;
          reason: string;
          requested_at: string;
          requested_by: string;
          resolved_at: string | null;
          resolved_by: string | null;
          resulting_revision_id: string | null;
          status: string;
        };
        SetofOptions: {
          from: "*";
          to: "correction_records";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_approve_registration: {
        Args: { p_intent_id: string };
        Returns: Json;
      };
      cmd_approve_revision: {
        Args: { p_approved: boolean; p_revision_id: string };
        Returns: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string;
          game_id: string;
          id: string;
          journal: Json;
          parent_revision_id: string | null;
          projection: Json;
          revision_number: number;
          source_submission_id: string;
          state: string;
          validation_warnings: Json;
        };
        SetofOptions: {
          from: "*";
          to: "game_revisions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_approve_source: {
        Args: { p_approved: boolean; p_note?: string; p_submission_id: string };
        Returns: {
          confidence: number | null;
          evidence_url: string | null;
          game_id: string;
          id: string;
          idempotency_key: string | null;
          normalized_payload: Json;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rights_confirmed_at: string | null;
          source_type: string;
          status: string;
          submitted_at: string;
          submitted_by: string;
        };
        SetofOptions: {
          from: "*";
          to: "source_submissions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_assign_role: {
        Args: {
          p_role: Database["public"]["Enums"]["membership_role"];
          p_scope_id: string;
          p_scope_type: Database["public"]["Enums"]["membership_scope"];
          p_user_id: string;
        };
        Returns: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["membership_role"];
          scope_id: string;
          scope_type: Database["public"]["Enums"]["membership_scope"];
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "memberships";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_assign_scorer: {
        Args: { p_game_id: string; p_role: string; p_user_id: string };
        Returns: {
          assigned_by: string | null;
          created_at: string;
          game_id: string;
          id: string;
          role: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "game_assignments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_attach_shop_invoice: {
        Args: {
          p_order_id: string;
          p_qpay_invoice_id: string;
          p_qpay_qr_image: string;
        };
        Returns: {
          created_at: string;
          customer_name: string;
          id: string;
          items: Json;
          phone: string;
          qpay_invoice_id: string | null;
          qpay_qr_image: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_mnt: number;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_cancel_shop_order: {
        Args: { p_order_id: string };
        Returns: {
          created_at: string;
          customer_name: string;
          id: string;
          items: Json;
          phone: string;
          qpay_invoice_id: string | null;
          qpay_qr_image: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_mnt: number;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_check_eligibility: {
        Args: { p_competition_id: string; p_player_id: string };
        Returns: {
          eligible: boolean;
          reason: string;
          team_name: string;
        }[];
      };
      cmd_confirm_shop_payment: {
        Args: { p_qpay_invoice_id: string };
        Returns: {
          created_at: string;
          customer_name: string;
          id: string;
          items: Json;
          phone: string;
          qpay_invoice_id: string | null;
          qpay_qr_image: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_mnt: number;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_create_canonical_link: {
        Args: { p_entity_id: string; p_entity_type: string };
        Returns: string;
      };
      cmd_create_correction: {
        Args: {
          p_evidence_url?: string;
          p_game_id: string;
          p_proposed_change?: Json;
          p_reason: string;
        };
        Returns: {
          evidence_url: string | null;
          game_id: string;
          id: string;
          proposed_change: Json;
          reason: string;
          requested_at: string;
          requested_by: string;
          resolved_at: string | null;
          resolved_by: string | null;
          resulting_revision_id: string | null;
          status: string;
        };
        SetofOptions: {
          from: "*";
          to: "correction_records";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_create_enrollment: {
        Args: {
          p_end_date?: string;
          p_notes?: string;
          p_program_id: string;
          p_start_date?: string;
          p_student_id: string;
        };
        Returns: {
          created_at: string;
          created_by: string | null;
          end_date: string | null;
          enrolled_at: string;
          id: string;
          notes: string | null;
          program_id: string;
          start_date: string | null;
          status: string;
          student_id: string;
          updated_at: string;
          waitlist_position: number | null;
        };
        SetofOptions: {
          from: "*";
          to: "academy_enrollments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_create_revision: {
        Args: {
          p_journal: Json;
          p_projection: Json;
          p_submission_id: string;
          p_validation_warnings?: Json;
        };
        Returns: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string;
          game_id: string;
          id: string;
          journal: Json;
          parent_revision_id: string | null;
          projection: Json;
          revision_number: number;
          source_submission_id: string;
          state: string;
          validation_warnings: Json;
        };
        SetofOptions: {
          from: "*";
          to: "game_revisions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_create_shop_order: {
        Args: {
          p_customer_name: string;
          p_phone: string;
          p_product_id: string;
          p_variant_index: number;
        };
        Returns: {
          created_at: string;
          customer_name: string;
          id: string;
          items: Json;
          phone: string;
          qpay_invoice_id: string | null;
          qpay_qr_image: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_mnt: number;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_create_student: {
        Args: {
          p_academy_id: string;
          p_allergies?: string[];
          p_canonical_name: string;
          p_date_of_birth?: string;
          p_emergency_contact_name?: string;
          p_emergency_contact_phone?: string;
          p_grade_level?: string;
          p_medical_notes?: string;
          p_name_latin?: string;
          p_notes?: string;
          p_photo_url?: string;
          p_school_name?: string;
        };
        Returns: {
          academy_id: string;
          allergies: string[] | null;
          canonical_identity_id: string | null;
          canonical_name: string;
          created_at: string;
          date_of_birth: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          grade_level: string | null;
          id: string;
          medical_notes: string | null;
          name_latin: string | null;
          notes: string | null;
          photo_url: string | null;
          school_name: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "academy_students";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_decline_registration: {
        Args: { p_intent_id: string };
        Returns: Json;
      };
      cmd_get_athlete_affiliations: {
        Args: { p_canonical_identity_id: string };
        Returns: Json;
      };
      cmd_grant_award: {
        Args: {
          p_award_type: string;
          p_competition_id: string;
          p_note?: string;
          p_period_end?: string;
          p_period_start?: string;
          p_player_id: string;
        };
        Returns: Json;
      };
      cmd_handoff_session: {
        Args: { p_reason: string; p_session_id: string; p_to_user_id: string };
        Returns: {
          closed_at: string | null;
          closure_reason: string | null;
          device_info: Json;
          game_id: string;
          handed_off_to_session_id: string | null;
          id: string;
          last_acknowledged_sequence: number;
          role: string;
          scorer_id: string;
          started_at: string;
          status: string;
        };
        SetofOptions: {
          from: "*";
          to: "tracker_sessions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_increment_page_view: {
        Args: { p_entity_id: string; p_entity_type: string };
        Returns: undefined;
      };
      cmd_invite_guardian: {
        Args: {
          p_academy_id: string;
          p_guardian_email?: string;
          p_guardian_name: string;
          p_guardian_phone?: string;
          p_is_primary?: boolean;
          p_relationship?: string;
          p_student_id: string;
        };
        Returns: Json;
      };
      cmd_link_guardian_account: {
        Args: { p_guardian_id: string; p_user_id?: string };
        Returns: Json;
      };
      cmd_link_student_to_user: {
        Args: { p_student_id: string; p_user_id: string };
        Returns: undefined;
      };
      cmd_list_members: {
        Args: {
          p_scope_id: string;
          p_scope_type: Database["public"]["Enums"]["membership_scope"];
        };
        Returns: {
          created_at: string;
          display_name: string;
          membership_id: string;
          role: Database["public"]["Enums"]["membership_role"];
          user_email: string;
          user_id: string;
        }[];
      };
      cmd_list_my_children: {
        Args: { p_academy_id?: string };
        Returns: {
          authority_status: string;
          date_of_birth: string;
          enrollment_id: string;
          enrollment_status: string;
          grade_level: string;
          link_id: string;
          photo_url: string;
          program_id: string;
          program_name: string;
          school_name: string;
          student_id: string;
          student_name: string;
          student_name_latin: string;
        }[];
      };
      cmd_mark_shop_order_shipped: {
        Args: { p_order_id: string };
        Returns: {
          created_at: string;
          customer_name: string;
          id: string;
          items: Json;
          phone: string;
          qpay_invoice_id: string | null;
          qpay_qr_image: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_mnt: number;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_merge_canonical_identities: {
        Args: { p_source_canonical_id: string; p_target_canonical_id: string };
        Returns: undefined;
      };
      cmd_open_tracker_session: {
        Args: { p_device_info?: Json; p_game_id: string; p_role: string };
        Returns: {
          closed_at: string | null;
          closure_reason: string | null;
          device_info: Json;
          game_id: string;
          handed_off_to_session_id: string | null;
          id: string;
          last_acknowledged_sequence: number;
          role: string;
          scorer_id: string;
          started_at: string;
          status: string;
        };
        SetofOptions: {
          from: "*";
          to: "tracker_sessions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_public_enroll: {
        Args: {
          p_academy_id: string;
          p_date_of_birth?: string;
          p_guardian_name?: string;
          p_guardian_phone?: string;
          p_notes?: string;
          p_program_id: string;
          p_student_name: string;
        };
        Returns: Json;
      };
      cmd_rebuild_projection: {
        Args: { p_game_id: string };
        Returns: {
          away_score: number | null;
          away_team_season_id: string;
          competition_id: string;
          created_at: string;
          current_period: number;
          current_revision_number: number;
          home_score: number | null;
          home_team_season_id: string;
          id: string;
          published_at: string | null;
          ruleset_id: string;
          scheduled_at: string;
          status: Database["public"]["Enums"]["game_status"];
          venue_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "games";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_record_event: {
        Args: {
          p_client_id: string;
          p_clock_seconds: number;
          p_event_type: string;
          p_game_id: string;
          p_local_seq: number;
          p_operation_id: string;
          p_payload?: Json;
          p_period: number;
          p_player_id: string;
          p_team_season_id: string;
          p_tracker_session_id: string;
        };
        Returns: {
          client_id: string;
          clock_seconds: number;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          event_type: string;
          game_id: string;
          id: string;
          local_seq: number;
          operation_id: string;
          payload: Json;
          period: number;
          player_id: string | null;
          superseded_by: string | null;
          team_season_id: string | null;
          tracker_session_id: string;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "stat_events";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_record_transfer: {
        Args: {
          p_effective_from: string;
          p_from_team_season_id: string;
          p_note?: string;
          p_player_id: string;
          p_to_team_season_id: string;
          p_transfer_type: string;
        };
        Returns: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string;
          effective_from: string;
          effective_until: string | null;
          from_team_season_id: string | null;
          id: string;
          note: string | null;
          player_id: string;
          to_team_season_id: string;
          transfer_type: Database["public"]["Enums"]["transfer_type"];
        };
        SetofOptions: {
          from: "*";
          to: "transfers";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_remove_role: {
        Args: { p_membership_id: string };
        Returns: undefined;
      };
      cmd_report_public_error: {
        Args: {
          p_contact: string;
          p_game_id: string;
          p_message: string;
          p_player_id: string;
          p_reporter_hash: string;
        };
        Returns: {
          contact: string | null;
          created_at: string | null;
          game_id: string | null;
          id: string;
          message: string;
          player_id: string | null;
          reporter_hash: string;
          status: string;
        };
        SetofOptions: {
          from: "*";
          to: "public_error_reports";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_review_correction: {
        Args: { p_approved: boolean; p_correction_id: string };
        Returns: {
          evidence_url: string | null;
          game_id: string;
          id: string;
          proposed_change: Json;
          reason: string;
          requested_at: string;
          requested_by: string;
          resolved_at: string | null;
          resolved_by: string | null;
          resulting_revision_id: string | null;
          status: string;
        };
        SetofOptions: {
          from: "*";
          to: "correction_records";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_revoke_guardian: { Args: { p_link_id: string }; Returns: Json };
      cmd_set_placement: {
        Args: {
          p_competition_id: string;
          p_ends_on: string;
          p_slot: string;
          p_sponsor_id: string;
          p_starts_on: string;
        };
        Returns: {
          competition_id: string;
          created_at: string;
          ends_on: string;
          id: string;
          slot: string;
          sponsor_id: string;
          starts_on: string;
        };
        SetofOptions: {
          from: "*";
          to: "sponsor_placements";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_set_shop_product_availability: {
        Args: { p_is_available: boolean; p_product_id: string };
        Returns: {
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          images: Json;
          is_available: boolean;
          name: string;
          name_en: string | null;
          price_mnt: number;
          slug: string;
          team_id: string | null;
          updated_at: string;
          variants: Json;
        };
        SetofOptions: {
          from: "*";
          to: "products";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_sign_consent: {
        Args: {
          p_signed_text?: string;
          p_student_id: string;
          p_template_id: string;
        };
        Returns: Json;
      };
      cmd_snapshot_roster: {
        Args: { p_team_season_id: string };
        Returns: {
          captured_at: string;
          created_at: string;
          id: string;
          jersey_number: number | null;
          player_id: string;
          position: string | null;
          status: string;
          team_season_id: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "roster_snapshots";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      cmd_submit_historical_stats: {
        Args: {
          p_competition_id: string;
          p_player_stats: Json;
          p_season_id: string;
        };
        Returns: Json;
      };
      cmd_submit_official_stats: {
        Args: {
          p_away_score: number;
          p_evidence_url: string;
          p_game_id: string;
          p_home_score: number;
          p_normalized_payload: Json;
          p_player_stats: Json;
          p_team_stats: Json;
        };
        Returns: Json;
      };
      cmd_submit_registration: {
        Args: {
          p_academy_id: string;
          p_date_of_birth?: string;
          p_guardian_name?: string;
          p_guardian_phone?: string;
          p_notes?: string;
          p_program_id: string;
          p_student_name: string;
        };
        Returns: Json;
      };
      cmd_submit_source: {
        Args: {
          p_confidence: number;
          p_evidence_url: string;
          p_game_id: string;
          p_idempotency_key: string;
          p_normalized_payload: Json;
          p_rights_confirmed: boolean;
          p_source_type: string;
        };
        Returns: {
          confidence: number | null;
          evidence_url: string | null;
          game_id: string;
          id: string;
          idempotency_key: string | null;
          normalized_payload: Json;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rights_confirmed_at: string | null;
          source_type: string;
          status: string;
          submitted_at: string;
          submitted_by: string;
        };
        SetofOptions: {
          from: "*";
          to: "source_submissions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_transition_game: {
        Args: {
          p_game_id: string;
          p_to_status: Database["public"]["Enums"]["game_status"];
        };
        Returns: {
          away_score: number | null;
          away_team_season_id: string;
          competition_id: string;
          created_at: string;
          current_period: number;
          current_revision_number: number;
          home_score: number | null;
          home_team_season_id: string;
          id: string;
          published_at: string | null;
          ruleset_id: string;
          scheduled_at: string;
          status: Database["public"]["Enums"]["game_status"];
          venue_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "games";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_update_enrollment: {
        Args: { p_enrollment_id: string; p_notes?: string; p_status?: string };
        Returns: {
          created_at: string;
          created_by: string | null;
          end_date: string | null;
          enrolled_at: string;
          id: string;
          notes: string | null;
          program_id: string;
          start_date: string | null;
          status: string;
          student_id: string;
          updated_at: string;
          waitlist_position: number | null;
        };
        SetofOptions: {
          from: "*";
          to: "academy_enrollments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_update_organization: {
        Args: {
          p_contact_email?: string;
          p_contact_phone?: string;
          p_logo_url?: string;
          p_name?: string;
          p_org_id: string;
          p_settings?: Json;
          p_slug?: string;
          p_social_links?: Json;
          p_website?: string;
        };
        Returns: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          settings: Json | null;
          slug: string;
          social_links: Json;
          type: string;
          website: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "organizations";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_update_shop_product: {
        Args: {
          p_category?: string;
          p_description?: string;
          p_images?: Json;
          p_name?: string;
          p_name_en?: string;
          p_price_mnt?: number;
          p_product_id: string;
          p_slug?: string;
        };
        Returns: {
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          images: Json;
          is_available: boolean;
          name: string;
          name_en: string | null;
          price_mnt: number;
          slug: string;
          team_id: string | null;
          updated_at: string;
          variants: Json;
        };
        SetofOptions: {
          from: "*";
          to: "products";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_update_shop_product_variants: {
        Args: { p_product_id: string; p_variants: Json };
        Returns: {
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          images: Json;
          is_available: boolean;
          name: string;
          name_en: string | null;
          price_mnt: number;
          slug: string;
          team_id: string | null;
          updated_at: string;
          variants: Json;
        };
        SetofOptions: {
          from: "*";
          to: "products";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_update_student: {
        Args: {
          p_allergies?: string[];
          p_canonical_name?: string;
          p_date_of_birth?: string;
          p_emergency_contact_name?: string;
          p_emergency_contact_phone?: string;
          p_grade_level?: string;
          p_medical_notes?: string;
          p_name_latin?: string;
          p_notes?: string;
          p_photo_url?: string;
          p_school_name?: string;
          p_status?: string;
          p_student_id: string;
        };
        Returns: {
          academy_id: string;
          allergies: string[] | null;
          canonical_identity_id: string | null;
          canonical_name: string;
          created_at: string;
          date_of_birth: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          grade_level: string | null;
          id: string;
          medical_notes: string | null;
          name_latin: string | null;
          notes: string | null;
          photo_url: string | null;
          school_name: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "academy_students";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_upsert_sponsor: {
        Args: {
          p_active?: boolean;
          p_id?: string;
          p_link_url?: string;
          p_logo_url?: string;
          p_name: string;
        };
        Returns: {
          active: boolean;
          created_at: string;
          id: string;
          link_url: string | null;
          logo_url: string | null;
          name: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "sponsors";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_verify_guardian: { Args: { p_link_id: string }; Returns: Json };
      cmd_void_event: {
        Args: { p_event_id: string; p_reason: string };
        Returns: {
          client_id: string;
          clock_seconds: number;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          event_type: string;
          game_id: string;
          id: string;
          local_seq: number;
          operation_id: string;
          payload: Json;
          period: number;
          player_id: string | null;
          superseded_by: string | null;
          team_season_id: string | null;
          tracker_session_id: string;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "stat_events";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cmd_withdraw_consent: { Args: { p_record_id: string }; Returns: Json };
      is_league_admin: { Args: { p_league_id: string }; Returns: boolean };
      refresh_season_player_stats: {
        Args: { p_competition_id: string };
        Returns: undefined;
      };
      refresh_standings: {
        Args: { p_competition_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      competition_type: "regular" | "playoff" | "cup" | "friendly";
      dispute_reason:
        | "wrong_player"
        | "wrong_team"
        | "wrong_position"
        | "wrong_jersey"
        | "eligibility_error"
        | "duplicate_record"
        | "stat_error"
        | "other";
      dispute_status: "open" | "under_review" | "resolved" | "dismissed";
      game_status:
        | "scheduled"
        | "live_provisional"
        | "final_pending_review"
        | "league_verified"
        | "official"
        | "cancelled"
        | "postponed";
      membership_role:
        | "owner"
        | "admin"
        | "manager"
        | "scorekeeper"
        | "coordinator"
        | "finance"
        | "trainer"
        | "viewer";
      membership_scope: "org" | "league" | "team";
      order_status: "pending" | "paid" | "shipped" | "cancelled";
      transfer_type: "permanent" | "loan" | "free_agent" | "youth_promotion";
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
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      oauth_authorization_status: ["pending", "approved", "denied", "expired"],
      oauth_client_type: ["public", "confidential"],
      oauth_registration_type: ["dynamic", "manual"],
      oauth_response_type: ["code"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
  public: {
    Enums: {
      competition_type: ["regular", "playoff", "cup", "friendly"],
      dispute_reason: [
        "wrong_player",
        "wrong_team",
        "wrong_position",
        "wrong_jersey",
        "eligibility_error",
        "duplicate_record",
        "stat_error",
        "other",
      ],
      dispute_status: ["open", "under_review", "resolved", "dismissed"],
      game_status: [
        "scheduled",
        "live_provisional",
        "final_pending_review",
        "league_verified",
        "official",
        "cancelled",
        "postponed",
      ],
      membership_role: [
        "owner",
        "admin",
        "manager",
        "scorekeeper",
        "coordinator",
        "finance",
        "trainer",
        "viewer",
      ],
      membership_scope: ["org", "league", "team"],
      order_status: ["pending", "paid", "shipped", "cancelled"],
      transfer_type: ["permanent", "loan", "free_agent", "youth_promotion"],
    },
  },
} as const;
