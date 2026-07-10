"use client";

import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import { orgKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";
import type { Organization } from "@/lib/types";

/**
 * Given an oklch color string, return a hex approximation.
 * In production, use a library like culori for accurate conversion.
 */
function oklchToHex(oklch: string): string | null {
  try {
    const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
    if (!match) return null;
    const [, lStr, cStr, hStr] = match;
    const l = parseFloat(lStr);
    const c = parseFloat(cStr);
    const h = parseFloat(hStr);

    // Very basic conversion (not accurate, but works for contrast calculation)
    if (c < 0.01) {
      const gray = Math.round(l * 255);
      return `#${gray.toString(16).padStart(2, "0").repeat(3)}`;
    }

    // Approximate conversion via hue
    const r = Math.round(128 + 127 * Math.cos((h * Math.PI) / 180) * c * 2);
    const g = Math.round(
      128 + 127 * Math.cos(((h - 120) * Math.PI) / 180) * c * 2,
    );
    const b = Math.round(
      128 + 127 * Math.cos(((h - 240) * Math.PI) / 180) * c * 2,
    );
    return `#${Math.max(0, Math.min(255, r)).toString(16).padStart(2, "0")}${Math.max(0, Math.min(255, g)).toString(16).padStart(2, "0")}${Math.max(0, Math.min(255, b)).toString(16).padStart(2, "0")}`;
  } catch (error) {
    reportServerError("Unexpected error", error);
    return null;
  }
}

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

  // New theme system (oklch format)
  const theme = settings.theme as
    | {
        primaryColor?: string;
        accentColor?: string;
        radius?: string;
        fontFamily?: string;
      }
    | undefined;

  if (theme) {
    if (theme.primaryColor) {
      root.style.setProperty("--primary", theme.primaryColor);
      // Auto-derive primary-foreground for contrast
      const hex = oklchToHex(theme.primaryColor);
      if (hex) {
        root.style.setProperty("--primary-foreground", getContrastColor(hex));
      }
    }
    if (theme.accentColor) {
      root.style.setProperty("--accent", theme.accentColor);
    }
    if (theme.radius) {
      root.style.setProperty("--radius", theme.radius);
    }
    if (theme.fontFamily) {
      root.style.setProperty("--font-sans", theme.fontFamily);
    }
    return;
  }

  // Legacy brand_color (hex format)
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
