"use client";

import { useEffect, useRef } from "react";
import { logout } from "./actions";

/**
 * Logout form that auto-submits on mount (JS-enabled) and also provides
 * a manual submit fallback for no-JS environments.
 *
 * Renders as "Гарч байна…" while the Server Action processes the sign-out
 * and redirect. The form never shows an interactive button in the happy
 * path — the user sees a brief loading state, then lands on the login page.
 */
export function LogoutForm({ next }: { next?: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Auto-submit after mount so the Server Action handles sign-out
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={logout}>
      {next && <input type="hidden" name="next" value={next} />}
      <button
        type="submit"
        className="h-11 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        Гарч байна…
      </button>
    </form>
  );
}
