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

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log("Fetching auth user for ed2593db-797d-4561-bbe8-95f1c3c46bd9...");
  const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById("ed2593db-797d-4561-bbe8-95f1c3c46bd9");
  if (authUserError) {
    console.error("Error fetching user by ID:", authUserError);
    return;
  }
  console.log("Auth user:", authUser);
}

main().catch(console.error);
