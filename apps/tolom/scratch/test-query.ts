import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing supabase env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Sign in
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: "Mtuya1355@gmail.com",
      password: "TolomAdmin2025!",
    });

  if (authError) {
    console.error("Auth error:", authError);
    return;
  }

  console.log("Logged in user:", authData.user?.email);

  // Run query
  const { data, error } = await supabase
    .from("global_parts_catalog")
    .select("id, name, name_mn, category, description, part_number, unit")
    .eq("is_active", true)
    .order("category")
    .order("name");

  if (error) {
    console.error("Query error:", error);
    return;
  }

  console.log("Query returned items:", data.length);
  if (data.length > 0) {
    console.log("First item:", data[0]);
  }
}

run();
