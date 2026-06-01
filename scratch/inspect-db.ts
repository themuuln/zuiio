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
  console.log("Fetching all profiles...");
  const { data: profiles, error } = await serviceRole
    .from("profiles")
    .select("*");

  if (error) {
    console.error("Profiles error:", error);
    return;
  }

  console.log("Profiles list:");
  for (const p of profiles || []) {
    const { data: u } = await serviceRole.auth.admin.getUserById(p.id);
    console.log({
      id: p.id,
      username: p.username,
      phone: p.phone,
      full_name: p.full_name,
      auth_email: u?.user?.email,
    });
  }
}

main().catch(console.error);
