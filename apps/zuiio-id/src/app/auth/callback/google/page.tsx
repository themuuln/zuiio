"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { signInWithGoogle } from "@/app/(auth)/login/actions";

/**
 * Google OAuth callback page for same-page redirect sign-in.
 *
 * Google redirects here after the user authorizes. The ID token is
 * in the URL hash fragment (#id_token=...). We extract it, read the
 * raw nonce from sessionStorage, call the server action, and
 * redirect to the destination.
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const processedRef = useRef(false);

  useEffect(() => {
    // Guard against double-execution in StrictMode
    if (processedRef.current) return;
    processedRef.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // strip leading #
    const idToken = params.get("id_token");

    if (!idToken) {
      window.location.href = "/login?error=google_oauth_failed";
      return;
    }

    const rawNonce = sessionStorage.getItem("google_nonce");
    const redirectTo = sessionStorage.getItem("google_redirectTo") ?? undefined;

    // Clean up sessionStorage
    sessionStorage.removeItem("google_nonce");
    sessionStorage.removeItem("google_redirectTo");

    (async () => {
      const result = await signInWithGoogle(idToken, rawNonce ?? "", redirectTo);
      if (result?.redirectTo) {
        router.push(result.redirectTo);
      } else {
        window.location.href = "/login?error=google_oauth_failed";
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">
        Google нэвтрэлт боловсруулж байна…
      </p>
    </div>
  );
}
