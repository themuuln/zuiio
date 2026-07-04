import type { ReactNode } from "react";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      {children}
    </div>
  );
}
