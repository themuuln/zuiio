"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Shows a one-time toast notification when the user has multiple
 * linked identities (e.g., signed in via Google but also has password).
 *
 * Reads the `linked_identities_count` cookie set by the auth callback
 * and shows a notification if count > 1.
 */
export function LinkedAccountsNotification() {
  useEffect(() => {
    // Check for linked identities cookie
    const cookies = document.cookie.split(";");
    const countCookie = cookies.find((c) =>
      c.trim().startsWith("linked_identities_count="),
    );

    if (countCookie) {
      const count = parseInt(countCookie.split("=")[1] ?? "0", 10);

      if (count > 1) {
        toast.info("Холбогдсон нэвтрэх аргууд", {
          description: `Таны бүртгэл ${count} нэвтрэх аргатай холбогдсон байна.`,
          duration: 5000,
        });
      }

      // Clear the cookie after showing notification
      // biome-ignore lint/suspicious/noDocumentCookie: intentional — clearing a notification cookie, not setting auth state
      document.cookie =
        "linked_identities_count=; path=/; max-age=0; sameSite=lax";
    }
  }, []);

  return null;
}
