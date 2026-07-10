import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

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
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const username = "mechanic4";
  console.log(`Checking database rows for username: ${username}...`);

  // Find profile
  const { data: profile, error: profileErr } = await serviceRole
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (profileErr) {
    console.error("Profile query error:", profileErr);
    return;
  }

  if (!profile) {
    console.log("No profile found with username:", username);
    return;
  }

  console.log("Profile details:", profile);

  // Find org linkages
  const { data: orgUsers, error: orgUsersErr } = await serviceRole
    .from("organization_users")
    .select("*, organizations(name)")
    .eq("user_id", profile.id);

  if (orgUsersErr) {
    console.error("Org users query error:", orgUsersErr);
  } else {
    console.log("Organization users details:", orgUsers);
  }
}

main().catch(console.error);
