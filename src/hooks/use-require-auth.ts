"use client";

import { useEffect } from "react";
import { redirectToLogin } from "@/lib/auth-redirect";

/**
 * Checks whether the current session is valid by fetching /api/profile.
 * If the server responds with 401 (X-Auth-Required header), the user is
 * redirected to /auth/login.
 *
 * Call this once in a root layout or page that requires authentication.
 */
export function useRequireAuth(): void {
  useEffect(() => {
    let ignore = false;

    fetch("/api/profile")
      .then((res) => {
        if (
          !ignore &&
          res.status === 401 &&
          res.headers.get("X-Auth-Required") === "true"
        ) {
          redirectToLogin();
        }
      })
      .catch(() => {
        // Network errors are handled silently — the page will stay
        // in whatever state it is (loading / error) so the user can retry.
      });

    return () => {
      ignore = true;
    };
  }, []);
}
