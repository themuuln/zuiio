"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/erp";
import {
  BrandConfig,
  DEFAULT_BRAND_CONFIG,
  getTheme,
  getFont,
  isValidColorValue,
} from "@/lib/branding";

export type BrandingState = {
  error?: string;
  success?: boolean;
};

export async function updateBrandConfig(
  _prevState: BrandingState | undefined,
  formData: FormData,
): Promise<BrandingState> {
  const { supabase, organizationId } = await requireAppContext();

  const theme = formData.get("theme")?.toString();
  const radiusStr = formData.get("radius")?.toString();
  const removeLogo = formData.get("remove_logo") === "true";

  if (!theme) {
    return { error: "Сэдвийн нэр шаардлагатай." };
  }

  if (!getTheme(theme)) {
    return { error: "Сонгосон сэдэв буруу байна." };
  }

  const radius = radiusStr
    ? Number.parseFloat(radiusStr)
    : DEFAULT_BRAND_CONFIG.radius;
  if (Number.isNaN(radius) || radius < 0 || radius > 2) {
    return { error: "Булангийн радиус 0-2 хооронд байна." };
  }

  // Parse custom color overrides — accepts any CSS color value (hex, oklch, hsl, rgb, etc.)
  const custom_colors: BrandConfig["custom_colors"] = {};
  for (const key of ["primary", "secondary", "accent"] as const) {
    const val = formData.get(`custom_${key}`)?.toString().trim();
    if (val) {
      if (!isValidColorValue(val)) {
        return { error: `"${key}" өнгөний утга буруу байна.` };
      }
      custom_colors[key] = val;
    }
  }

  // Parse font selections
  const font_body = formData.get("font_body")?.toString().trim() || undefined;
  const font_heading =
    formData.get("font_heading")?.toString().trim() || undefined;

  // Validate font values if provided
  if (font_body && !getFont(font_body)) {
    return { error: "Сонгосон фонт буруу байна." };
  }
  if (font_heading && !getFont(font_heading)) {
    return { error: "Сонгосон гарчиг фонт буруу байна." };
  }

  // Fetch current config to preserve logo unless remove was requested
  let logoUrl: string | null = null;
  if (!removeLogo) {
    const { data: org } = await supabase
      .from("organizations")
      .select("brand_config")
      .eq("id", organizationId)
      .single();

    logoUrl = (org?.brand_config as BrandConfig | null)?.logo_url ?? null;

    // Check if a new logo was uploaded
    const uploadedLogo = formData.get("logo_url")?.toString();
    if (uploadedLogo) {
      logoUrl = uploadedLogo;
    }
  }

  const config: BrandConfig = {
    theme,
    radius,
    logo_url: logoUrl,
    custom_colors:
      Object.keys(custom_colors).length > 0 ? custom_colors : undefined,
    font_body: font_body || undefined,
    font_heading: font_heading || undefined,
  };

  const { error } = await supabase
    .from("organizations")
    .update({ brand_config: config })
    .eq("id", organizationId);

  if (error) {
    return { error: `Хадгалахад алдаа гарлаа: ${error.message}` };
  }

  revalidatePath("/settings/branding");
  revalidatePath("/");
  return { success: true };
}
