import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import type { OrgTheme } from "@/lib/types";
export const GET = createRouteHandler(async ({ params, supabase }) => {
  const { id } = params;
  const { data: org, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", id)
    .single();

  if (error || !org) {
    return apiError("NOT_FOUND", "Organization not found", 404);
  }

  const settings = org.settings as Record<string, unknown> | null;
  const theme = (settings?.theme as OrgTheme) ?? null;

  return ok({
    theme: theme ?? {
      primaryColor: "oklch(0.205 0 0)",
      accentColor: "oklch(0.97 0 0)",
      radius: "0px",
      fontFamily: "Inter, sans-serif",
    },
    isDefault: !theme,
  });
});
export const PUT = createRouteHandler(async ({ request, params, supabase }) => {
  const { id } = params;
  const body = await request.json();
  const { primaryColor, accentColor, radius, fontFamily } = body;

  // Validate oklch format for colors
  const oklchRegex = /^oklch\([\d.]+ [\d.]+ [\d.]+\)$/;
  if (primaryColor && !oklchRegex.test(primaryColor)) {
    return apiError(
      "VALIDATION",
      "Invalid primaryColor format. Use oklch(L C H)",
      400,
    );
  }
  if (accentColor && !oklchRegex.test(accentColor)) {
    return apiError(
      "VALIDATION",
      "Invalid accentColor format. Use oklch(L C H)",
      400,
    );
  }

  // Build theme object (merge with existing)
  const theme: OrgTheme = {
    primaryColor: primaryColor ?? "oklch(0.205 0 0)",
    accentColor: accentColor ?? "oklch(0.97 0 0)",
    radius: radius ?? "0px",
    fontFamily: fontFamily ?? "Inter, sans-serif",
  };

  // Update organization settings with theme
  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      settings: { theme } as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return apiError("INTERNAL", "Failed to update theme", 500);
  }

  return ok({ theme });
});
