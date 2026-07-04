"use client";

import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { useAuth, type AuthContextValue } from "./auth-context";

export interface RequireAuthResult {
  /** Current auth status */
  status: AuthContextValue["state"]["status"];
  /** The session when authenticated, null otherwise */
  session: Session | null;
  /** Full auth context (available even when unauthenticated) */
  auth: AuthContextValue;
}

/**
 * Guard hook that forces authentication before rendering children.
 *
 * While loading or unauthenticated:
 * - `status` reflects the current auth state
 * - `session` is `null`
 * - `auth` is still available for actions (e.g., redirect to login)
 *
 * When authenticated:
 * - `status` is `"authenticated"`
 * - `session` contains the session object
 * - `auth` is the full auth context
 *
 * @param opts.redirectTo - Path to redirect to when unauthenticated
 *                          (default: "/login"). Pass `null` to skip redirect.
 * @param opts.onUnauthenticated - Callback fired when user is unauthenticated.
 *                                 Use for custom redirect logic (e.g., React Native navigation).
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { status, session } = useRequireAuth();
 *   if (status !== "authenticated") return <LoadingSkeleton />;
 *   return <div>Welcome, {session.user.email}</div>;
 * }
 * ```
 *
 * @example
 * // React Native navigation
 * function AppNavigator() {
 *   useRequireAuth({
 *     redirectTo: null,
 *     onUnauthenticated: () => router.replace("/login"),
 *   });
 *   return <MainNavigator />;
 * }
 * ```
 */
export function useRequireAuth(opts?: {
  redirectTo?: string | null;
  onUnauthenticated?: () => void;
}): RequireAuthResult {
  const auth = useAuth();
  const { state } = auth;

  useEffect(() => {
    if (state.status === "unauthenticated") {
      if (opts?.onUnauthenticated) {
        opts.onUnauthenticated();
      } else if (opts?.redirectTo !== null) {
        const target = opts?.redirectTo ?? "/login";
        if (typeof window !== "undefined") {
          window.location.href = target;
        }
      }
    }
  }, [state.status, opts?.redirectTo, opts?.onUnauthenticated]);

  if (state.status === "authenticated") {
    return {
      status: "authenticated",
      session: state.session,
      auth,
    };
  }

  return {
    status: state.status,
    session: null,
    auth,
  };
}
