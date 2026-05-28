import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrgTheme } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: org, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", id)
    .single();

  if (error || !org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  const settings = org.settings as Record<string, unknown> | null;
  const theme = (settings?.theme as OrgTheme) ?? null;

  return NextResponse.json({
    theme: theme ?? {
      primaryColor: "oklch(0.205 0 0)",
      accentColor: "oklch(0.97 0 0)",
      radius: "0px",
      fontFamily: "Inter, sans-serif",
    },
    isDefault: !theme,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const body = await request.json();
  const { primaryColor, accentColor, radius, fontFamily } = body;

  // Validate oklch format for colors
  const oklchRegex = /^oklch\([\d.]+ [\d.]+ [\d.]+\)$/;
  if (primaryColor && !oklchRegex.test(primaryColor)) {
    return NextResponse.json(
      { error: "Invalid primaryColor format. Use oklch(L C H)" },
      { status: 400 },
    );
  }
  if (accentColor && !oklchRegex.test(accentColor)) {
    return NextResponse.json(
      { error: "Invalid accentColor format. Use oklch(L C H)" },
      { status: 400 },
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
      settings: { theme },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update theme" },
      { status: 500 },
    );
  }

  return NextResponse.json({ theme });
}
