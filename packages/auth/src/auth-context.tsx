"use client";

import {
  createContext,
  use,
  useEffect,
  useState,
  useCallback,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { ZuiioSsoResult } from "./sso";
import { startZuiioSso } from "./sso";

// ── Types ──────────────────────────────────────────────────────

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; session: Session }
  | { status: "unauthenticated" };

export interface AuthActions {
  signInWithZuiio: (
    redirectTo: string,
    skipBrowserRedirect?: boolean,
  ) => Promise<ZuiioSsoResult>;
  signOut: () => Promise<void>;
}

export interface AuthContextValue {
  state: AuthState;
  actions: AuthActions;
}

// ── Context ────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────

export interface SupabaseAuthProviderProps extends PropsWithChildren {
  supabase: SupabaseClient;
  /** Called after successful sign out (e.g., navigation redirect) */
  onSignOut?: () => void;
  /** Optional loading indicator while initializing */
  loadingFallback?: ReactNode;
}

/**
 * Provides authentication state and actions for any React app
 * (React Native or web) backed by Supabase auth.
 *
 * @example
 * ```tsx
 * <SupabaseAuthProvider supabase={supabase}>
 *   <App />
 * </SupabaseAuthProvider>
 * ```
 */
export function SupabaseAuthProvider({
  supabase,
  onSignOut,
  loadingFallback,
  children,
}: SupabaseAuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(
        session
          ? { status: "authenticated", session }
          : { status: "unauthenticated" },
      );
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(
        session
          ? { status: "authenticated", session }
          : { status: "unauthenticated" },
      );
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signInWithZuiio = useCallback(
    async (
      redirectTo: string,
      skipBrowserRedirect?: boolean,
    ): Promise<ZuiioSsoResult> => {
      return startZuiioSso(supabase, { redirectTo, skipBrowserRedirect });
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    onSignOut?.();
  }, [supabase, onSignOut]);

  const value: AuthContextValue = {
    state,
    actions: { signInWithZuiio, signOut },
  };

  if (state.status === "loading" && loadingFallback) {
    return (
      <AuthContext.Provider value={value}>
        {loadingFallback}
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────

/**
 * Access the current auth state and actions.
 * Must be used within a `SupabaseAuthProvider`.
 */
export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within a <SupabaseAuthProvider>");
  }
  return value;
}

/**
 * Like useAuth but only returns when authenticated.
 * Returns `null` while loading or unauthenticated.
 */
export function useSession(): Session | null {
  const { state } = useAuth();
  if (state.status !== "authenticated") return null;
  return state.session;
}
