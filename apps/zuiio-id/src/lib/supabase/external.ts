import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Known Zuiio ecosystem projects.
 * Maps project ref -> { url, anonKey }
 *
 * These are PUBLIC keys (anon/publishable) — safe to embed in code.
 * The consent page needs these to call the originating project's OAuth Server API.
 */
const KNOWN_PROJECTS: Record<
  string,
  { url: string; anonKey: string }
> = {
  fhzuolncswccxkcqzclg: {
    // Tolom
    url: "https://fhzuolncswccxkcqzclg.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoenVvbG5jc3djY3hrY3F6Y2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODg1OTUsImV4cCI6MjA5NDA2NDU5NX0.Q46bU2b-EHgAGx4L96zIRwiHnhHwJ9exUliedbsFTRg",
  },
  krrkhozadforrydffegg: {
    // Zer
    url: "https://krrkhozadforrydffegg.supabase.co",
    anonKey:
      "sb_publishable__JFIi4L1E8AWA_CDtiw_NA_bcqbuhPD",
  },
} as const;

export type ProjectRef = keyof typeof KNOWN_PROJECTS;

/**
 * Create a Supabase client for a specific Zuiio ecosystem project.
 * Used by the OAuth consent flow to call the originating project's OAuth Server API.
 *
 * @param projectRef - The Supabase project ref (e.g. "fhzuolncswccxkcqzclg")
 * @returns Supabase client configured for the specified project, or null if unknown
 */
export async function createProjectClient(
  projectRef: string,
): Promise<ReturnType<typeof createServerClient> | null> {
  const project = KNOWN_PROJECTS[projectRef];
  if (!project) return null;

  const cookieStore = await cookies();

  return createServerClient(project.url, project.anonKey, {
    cookies: {
      getAll() {
        try {
          return cookieStore.getAll();
        } catch {
          return [];
        }
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from Server Component — ignore
        }
      },
    },
  });
}
