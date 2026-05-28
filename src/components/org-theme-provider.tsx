"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { OrgTheme } from "@/lib/types";

interface OrgThemeContextType {
  theme: OrgTheme | null;
  setTheme: (theme: OrgTheme) => void;
}

const OrgThemeContext = createContext<OrgThemeContextType>({
  theme: null,
  setTheme: () => {},
});

export function useOrgTheme() {
  return useContext(OrgThemeContext);
}

export function OrgThemeProvider({
  orgId,
  initialTheme,
  children,
}: {
  orgId: string | null;
  initialTheme?: OrgTheme | null;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<OrgTheme | null>(
    initialTheme ?? null,
  );

  // Fetch theme on mount / org change
  useEffect(() => {
    if (!orgId) {
      setThemeState(null);
      return;
    }

    fetch(`/api/organizations/${orgId}/theme`)
      .then((res) => res.json())
      .then((data) => {
        if (data.theme) {
          setThemeState(data.theme);
        }
      })
      .catch(console.error);
  }, [orgId]);

  const setTheme = (newTheme: OrgTheme) => {
    setThemeState(newTheme);

    // Persist to API
    if (orgId) {
      fetch(`/api/organizations/${orgId}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTheme),
      }).catch(console.error);
    }
  };

  // Inject CSS variables
  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primaryColor);
    root.style.setProperty("--accent", theme.accentColor);
    root.style.setProperty("--radius", theme.radius);

    // Also set sidebar primary to match
    root.style.setProperty("--sidebar-primary", theme.primaryColor);

    // Set font
    if (theme.fontFamily) {
      root.style.setProperty("--font-sans", theme.fontFamily);
    }
  }, [theme]);

  return (
    <OrgThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </OrgThemeContext.Provider>
  );
}
