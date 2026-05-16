"use client";

import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import { orgKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Organization } from "@/lib/types";

const RADIUS_MAP: Record<string, string> = {
  none: "0rem",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.625rem",
  xl: "1rem",
};

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

const SIZE_MAP: Record<string, { btn: string; input: string; card: string }> = {
  sm: { btn: "2rem", input: "2.25rem", card: "0.75rem" },
  md: { btn: "2.25rem", input: "2.5rem", card: "1rem" },
  lg: { btn: "2.75rem", input: "3rem", card: "1.25rem" },
};

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

  const radiusKey = (settings.border_radius as string) || "lg";
  const radiusValue = RADIUS_MAP[radiusKey] ?? RADIUS_MAP.lg;
  root.style.setProperty("--radius", radiusValue);

  const uiSize = (settings.ui_size as string) || "md";
  root.setAttribute("data-ui-size", uiSize);
  const sizes = SIZE_MAP[uiSize] ?? SIZE_MAP.md;
  root.style.setProperty("--ui-btn-h", sizes.btn);
  root.style.setProperty("--ui-input-h", sizes.input);
  root.style.setProperty("--ui-card-p", sizes.card);
}

/**
 * Reads brand_color and border_radius from the current org settings
 * and applies them as CSS custom properties on <html>.
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
