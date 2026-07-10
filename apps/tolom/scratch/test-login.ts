import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Manually parse .env.local
const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const serviceRole = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const identifier = "mechanic4";
  const lookupColumn = "username";
  const lookupValue = identifier;

  console.log(`Running login lookup: select id from profiles where ${lookupColumn} = '${lookupValue}'`);

  const { data: profile, error } = await serviceRole
    .from("profiles")
    .select("id")
    .eq(lookupColumn, lookupValue)
    .maybeSingle();

  if (error) {
    console.error("Query Error:", error);
    return;
  }

  console.log("Found profile:", profile);

  if (!profile) {
    console.log("No profile found.");
    return;
  }

  // Get the user's email from auth.users via service role
  const { data: authUser, error: authUserError } = await serviceRole.auth.admin.getUserById(
    profile.id,
  );
  if (authUserError) {
    console.error("Auth User Error:", authUserError);
    return;
  }
  console.log("Auth User Email:", authUser?.user?.email);
}

main().catch(console.error);
