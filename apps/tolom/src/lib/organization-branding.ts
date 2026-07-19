import {
  type BrandConfig,
  DEFAULT_BRAND_CONFIG,
  resolveBrandConfig,
} from "@zuiio/branding";
import type { Json } from "@/lib/types";

/**
 * Legacy theme shape stored in `settings.theme` (primaryColor, accentColor, radius, fontFamily).
 */
interface LegacyTheme {
  primaryColor?: string;
  accentColor?: string;
  radius?: string;
  fontFamily?: string;
}

/**
 * Read a `BrandConfig` from organization settings.
 *
 * Priority:
 *  1. `settings.branding` (new canonical shape)
 *  2. Convert legacy `settings.theme` (old theme shape) to BrandConfig
 *  3. Convert legacy `settings.brand_color` (hex string) to BrandConfig
 *  4. Fallback to DEFAULT_BRAND_CONFIG (zuiio preset)
 */
export function readOrganizationBrandConfig(
  settings: Json | null | undefined,
): BrandConfig {
  const s = settings as Record<string, unknown> | null | undefined;

  // 1. New canonical branding key
  if (s?.branding && typeof s.branding === "object") {
    return resolveBrandConfig(s.branding as Partial<BrandConfig>);
  }

  // 2. Legacy theme shape
  const legacy = s?.theme as LegacyTheme | undefined;
  if (legacy && typeof legacy === "object") {
    const config: Partial<BrandConfig> = { theme: "zuiio" };

    // Convert pixel radius string → rem number
    if (legacy.radius != null) {
      const px = parseFloat(String(legacy.radius));
      if (!Number.isNaN(px)) {
        config.radius = Math.min(2, Math.max(0, Math.round((px / 16) * 8) / 8));
      }
    }

    const custom: BrandConfig["custom_colors"] = {};
    if (legacy.primaryColor) custom.primary = legacy.primaryColor;
    if (legacy.accentColor) custom.accent = legacy.accentColor;
    if (Object.keys(custom).length > 0) config.custom_colors = custom;

    return resolveBrandConfig(config);
  }

  // 3. Legacy brand_color (hex)
  const brandColor = s?.brand_color;
  if (typeof brandColor === "string" && brandColor) {
    return resolveBrandConfig({
      theme: "zuiio",
      custom_colors: { primary: brandColor },
    });
  }

  // 4. Fallback
  return resolveBrandConfig(null);
}

/**
 * Merge a new BrandConfig into existing settings, preserving unrelated keys.
 * Removes migrated legacy keys (`theme`, `brand_color`).
 */
export function writeOrganizationBrandConfig(
  settings: Json | null | undefined,
  config: BrandConfig,
): Record<string, unknown> {
  const s = (settings as Record<string, unknown> | null | undefined) ?? {};
  const next: Record<string, unknown> = { ...s };

  next.branding = config;

  // Remove migrated legacy keys
  delete next.theme;
  delete next.brand_color;

  return next;
}
