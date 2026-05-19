"use client";

import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import { orgKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Organization } from "@/lib/types";

/**
 * Given a hex color, return a near-black or near-white oklch color
 * that provides sufficient contrast when used as --primary-foreground.
 */
function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // sRGB → linear
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // WCAG AA threshold
  return luminance > 0.5 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)";
}

function applyBrandTheme(settings: Record<string, unknown> | null | undefined) {
  if (!settings) return;
  const root = document.documentElement;

  const brandColor = settings.brand_color as string | undefined;
  if (brandColor && /^#[0-9a-fA-F]{6}$/.test(brandColor)) {
    root.style.setProperty("--primary", brandColor);
    root.style.setProperty(
      "--primary-foreground",
      getContrastColor(brandColor),
    );
  } else {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-foreground");
  }

}

/**
 * Reads brand_color from the current org settings
 * and applies it as a CSS custom property on <html>.
 * Works alongside next-themes (dark/light class-based theme).
 */
export default function BrandThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId;

  const { data: organization } = useQuery({
    queryKey: orgKeys.detail(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as Organization;
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  useEffect(() => {
    applyBrandTheme(
      organization?.settings as Record<string, unknown> | null | undefined,
    );
  }, [organization?.settings]);

  return <>{children}</>;
}

/**
 * Apply brand theme from a partial settings object (used for live preview).
 * Call this from the settings form when the user modifies fields without saving.
 */
export function applyBrandThemePreview(
  settings: Partial<Record<string, unknown>>,
) {
  applyBrandTheme(settings as Record<string, unknown>);
}
