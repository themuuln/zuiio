"use client";

/**
 * Wraps the score ticker with NBA-style edge fade gradients that hint
 * at horizontal scrollability. The gradients seamlessly blend from the
 * sidebar background so they don't look like a separate overlay.
 */
export function ScorebarShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="group/scorebar relative">
      {/* Edge fade — scroll affordance, NBA scorestrip style */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-sidebar to-transparent max-sm:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-sidebar to-transparent max-sm:hidden" />
      {children}
    </div>
  );
}
