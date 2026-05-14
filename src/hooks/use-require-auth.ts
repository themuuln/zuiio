"use client";

import { useEffect } from "react";
import { redirectToLogin } from "@/lib/auth-redirect";

/**
 * Verifies the session is valid by checking /api/profile.
 * Proxy middleware handles auth at the edge — this is a safety net.
 * Uses a lightweight HEAD-style check to avoid full profile fetch.
 */
export function useRequireAuth(): void {
  useEffect(() => {
    let ignore = false;

    fetch("/api/profile", { method: "HEAD" })
      .then((res) => {
        if (
          !ignore &&
          res.status === 401 &&
          res.headers.get("X-Auth-Required") === "true"
        ) {
          redirectToLogin();
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);
}
