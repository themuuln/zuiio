"use client";

import { useEffect } from "react";

/**
 * Google OAuth callback page for popup-based sign-in.
 *
 * Google redirects here after the user authorizes. The ID token is
 * in the URL hash fragment (#id_token=...). We extract it, send it
 * to the opener window via postMessage, and close this popup.
 */
export default function GoogleCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // strip leading #
    const idToken = params.get("id_token");

    if (idToken && window.opener) {
      window.opener.postMessage(
        { type: "google-oauth-callback", idToken },
        window.location.origin,
      );
      window.close();
    } else {
      // No token or no opener — redirect to login with error
      window.location.href = "/login?error=google_oauth_failed";
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">
        Google нэвтрэлт боловсруулж байна…
      </p>
    </div>
  );
}
