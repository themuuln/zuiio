"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
  const { data: themeData } = useQuery({
    queryKey: ["organizations", orgId, "theme"],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await fetch(`/api/organizations/${orgId}/theme`);
      const data = await res.json();
      return data.theme ?? null;
    },
    enabled: !!orgId,
  });

  useEffect(() => {
    if (themeData) {
      setThemeState(themeData);
    }
  }, [themeData]);

  const saveTheme = useMutation({
    mutationFn: async (newTheme: OrgTheme) => {
      if (!orgId) return;
      const res = await fetch(`/api/organizations/${orgId}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTheme),
      });
      if (!res.ok) throw new Error("Failed to save theme");
    },
  });

  const setTheme = (newTheme: OrgTheme) => {
    setThemeState(newTheme);
    if (orgId) {
      saveTheme.mutate(newTheme);
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
