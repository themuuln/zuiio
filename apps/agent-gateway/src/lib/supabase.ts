import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with service_role privileges.
 * Used by curated tools for direct DB access.
 * Bypasses RLS — tools MUST filter by orgId.
 */
export function createServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Creates a Supabase client with agent_reader privileges.
 * Used by the runSQL tool only.
 * RLS is enforced. Cannot write.
 */
export function createReaderClient() {
  const url = process.env.SUPABASE_URL;
  const password = process.env.AGENT_READER_PASSWORD;

  if (!url || !password) {
    throw new Error("SUPABASE_URL and AGENT_READER_PASSWORD are required");
  }

  // Connect as agent_reader role via connection string
  const parsedUrl = new URL(url);
  parsedUrl.username = "agent_reader";
  parsedUrl.password = encodeURIComponent(password);

  return createClient(parsedUrl.toString(), "", {
    auth: { persistSession: false },
  });
}
