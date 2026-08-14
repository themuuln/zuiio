"use client";

import { SettingsProvider } from "./settings-context";
import { SettingsFooter } from "./settings-footer";

export function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <div className="flex flex-1 flex-col gap-8">{children}</div>
      <SettingsFooter />
    </SettingsProvider>
  );
}
