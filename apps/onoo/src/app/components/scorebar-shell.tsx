"use client";

/**
 * Wraps the score ticker. Currently a pass-through — no scroll-based
 * compact state. Kept as a shell so toggling logic can be re-added
 * later without changing callers.
 */
export function ScorebarShell({ children }: { children: React.ReactNode }) {
  return <div className="group/scorebar">{children}</div>;
}
