import type * as React from "react";

/**
 * Minimal layout for onboarding pages (create org, etc.)
 * No sidebar, no organization check — just a centered shell.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      {children}
    </div>
  );
}
