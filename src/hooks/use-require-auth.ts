"use client";

import { useEffect, useRef } from "react";
import { redirectToLogin } from "@/lib/auth-redirect";

/**
 * Verifies the session is valid by checking /api/profile.
 * Proxy middleware handles auth at the edge — this is a safety net.
 * Uses a lightweight HEAD-style check to avoid full profile fetch.
 * Caches the verification result for 60s to avoid redundant calls on mount cascades.
 */
export function useRequireAuth(): void {
  const lastCheckedRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    // Skip if we already checked within the last 60 seconds
    if (now - lastCheckedRef.current < 60_000) {
      return;
    }

    const abort = new AbortController();

    fetch("/api/profile", { method: "HEAD", signal: abort.signal })
      .then((res) => {
        if (
          !abort.signal.aborted &&
          res.status === 401 &&
          res.headers.get("X-Auth-Required") === "true"
        ) {
          redirectToLogin();
        } else {
          lastCheckedRef.current = Date.now();
        }
      })
      .catch(() => {});

    return () => {
      abort.abort();
    };
  }, []);
}
