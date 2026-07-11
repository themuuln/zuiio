// Runtime configuration — preview, local, or cloud mode
// Ported from Flutter's runtime_config.dart

export type RuntimeMode = "preview" | "local" | "cloud";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface RuntimeConfig {
  mode: RuntimeMode;
  supabase: SupabaseConfig | null;
}

export function getRuntimeConfig(): RuntimeConfig {
  const mode = (process.env.EXPO_PUBLIC_RUNTIME_MODE as RuntimeMode) ?? "preview";

  if (mode === "preview") {
    return { mode: "preview", supabase: null };
  }

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn("Supabase credentials missing — falling back to preview mode");
    return { mode: "preview", supabase: null };
  }

  return {
    mode,
    supabase: { url, anonKey },
  };
}

export const isPreview = (config: RuntimeConfig) => config.mode === "preview";
