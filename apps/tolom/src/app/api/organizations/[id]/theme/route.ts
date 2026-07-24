import {
  type BrandConfig,
  DEFAULT_BRAND_CONFIG,
  getFont,
  getTheme,
  isValidColorValue,
  resolveBrandConfig,
} from "@zuiio/branding";
import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import {
  readOrganizationBrandConfig,
  writeOrganizationBrandConfig,
} from "@/lib/organization-branding";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const { data: org, error } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();

    if (error || !org) {
      return apiError("NOT_FOUND", "Organization not found", 404);
    }

    const branding = readOrganizationBrandConfig(org.settings);
    const isDefault =
      JSON.stringify(branding) === JSON.stringify(DEFAULT_BRAND_CONFIG);

    return ok({ branding, isDefault });
  },
  {
    requiredPermission: { resource: "settings", action: "read" },
  },
);

export const PUT = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return apiError("VALIDATION", "Invalid JSON body", 400);
    }

    // --- Validate inputs ---
    const preset = body.theme;
    if (preset != null && typeof preset === "string" && !getTheme(preset)) {
      return apiError("VALIDATION", `Unknown theme preset: ${preset}`, 400);
    }

    const colors = body.custom_colors as
      | Record<string, unknown>
      | null
      | undefined;
    if (colors) {
      for (const [key, val] of Object.entries(colors)) {
        if (val != null && typeof val === "string" && !isValidColorValue(val)) {
          return apiError(
            "VALIDATION",
            `Invalid color value for ${key}: ${val}`,
            400,
          );
        }
      }
    }

    const radius = body.radius;
    if (radius != null) {
      if (typeof radius !== "number" || radius < 0 || radius > 2) {
        return apiError(
          "VALIDATION",
          "Radius must be a number between 0 and 2",
          400,
        );
      }
    }

    const fontBody = body.font_body;
    if (fontBody != null && typeof fontBody === "string" && !getFont(fontBody)) {
      return apiError("VALIDATION", `Unknown body font: ${fontBody}`, 400);
    }

    const fontHeading = body.font_heading;
    if (
      fontHeading != null &&
      typeof fontHeading === "string" &&
      !getFont(fontHeading)
    ) {
      return apiError("VALIDATION", `Unknown heading font: ${fontHeading}`, 400);
    }

    // --- Read current settings (preserve unrelated keys) ---
    const { data: org, error: readError } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();

    if (readError || !org) {
      return apiError("NOT_FOUND", "Organization not found", 404);
    }

    // Build BrandConfig from validated input (ignore logo_url — Tolom uses OrgLogoUpload)
    const config: BrandConfig = resolveBrandConfig({
      theme:
        preset != null && typeof preset === "string" ? preset : undefined,
      radius: typeof radius === "number" ? radius : undefined,
      custom_colors:
        colors && typeof colors === "object"
          ? (colors as BrandConfig["custom_colors"])
          : undefined,
      font_body: typeof fontBody === "string" ? fontBody : undefined,
      font_heading: typeof fontHeading === "string" ? fontHeading : undefined,
      logo_url: undefined, // Tolom manages logo via OrgLogoUpload → organizations.logo_url
    });

    const nextSettings = writeOrganizationBrandConfig(org.settings, config);

    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        settings: nextSettings as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId);

    if (updateError) {
      return apiError("INTERNAL", "Failed to update theme", 500);
    }

    return ok({ branding: config });
  },
  {
    requiredPermission: { resource: "settings", action: "update" },
    rateLimit: true,
  },
);
