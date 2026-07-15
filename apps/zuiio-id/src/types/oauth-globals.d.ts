/**
 * Type declarations for Google Identity Services (GIS) and
 * Apple Sign In JS SDK — loaded via <Script> tags at runtime.
 */

declare global {
  interface GooglePromptNotification {
    getMomentType(): "display" | "dismissed" | "skipped";
  }

  interface GoogleAccountsIdInitializeConfig {
    client_id: string;
    callback: (response: { credential: string }) => void;
    nonce?: string;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }

  interface GoogleAccountsId {
    initialize(config: GoogleAccountsIdInitializeConfig): void;
    prompt(callback?: (notification: GooglePromptNotification) => void): void;
    renderButton(parent: HTMLElement, config: Record<string, unknown>): void;
    revoke(hint: string, callback?: () => void): void;
  }

  interface TokenResponse {
    access_token: string;
    id_token?: string;
    scope: string;
    expires_in: number;
    token_type: string;
    error?: string;
    error_description?: string;
    error_uri?: string;
  }

  interface InitTokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    hint?: string;
    state?: string;
    enable_serial_consent?: boolean;
    include_granted_scopes?: boolean;
    login_hint?: string;
    prompt?: string;
    error_callback?: (error: { type: string; message: string }) => void;
  }

  interface TokenClient {
    requestAccessToken(overrideConfig?: {
      hint?: string;
      state?: string;
      prompt?: string;
      login_hint?: string;
    }): void;
  }

  interface GoogleAccountsOauth2 {
    initTokenClient(config: InitTokenClientConfig): TokenClient;
  }

  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
        oauth2: GoogleAccountsOauth2;
      };
    };
    AppleID?: {
      auth: {
        init(config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          state?: string;
          usePopup: boolean;
        }): void;
        signIn(): Promise<{
          authorization: {
            code: string;
            id_token: string;
            state: string;
          };
          user?: {
            email: string;
            name?: {
              firstName: string;
              lastName: string;
            };
          };
        }>;
      };
    };
  }
}

export {};
