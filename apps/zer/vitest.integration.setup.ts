import { config } from "dotenv";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

// Try loading .env.local — may not exist, that's fine
config({ path: resolve(__dirname, ".env.local") });

// Parse supabase status to extract API keys
try {
  const output = execSync("supabase status", {
    cwd: resolve(__dirname, ".."),
    encoding: "utf-8",
    timeout: 10_000,
  });
  for (const line of output.split("\n")) {
    if (line.includes("Publishable") && line.includes("sb_publishable_")) {
      const m = line.match(/sb_publishable_\S+/);
      if (m) process.env.SUPABASE_ANON_KEY ??= m[0];
    }
    if (line.includes("Secret") && line.includes("sb_secret_")) {
      const m = line.match(/sb_secret_\S+/);
      if (m) process.env.SUPABASE_SERVICE_ROLE_KEY ??= m[0];
    }
    if (line.includes("Project URL")) {
      const m = line.match(/http\S+/);
      if (m) process.env.SUPABASE_URL ??= m[0];
    }
  }
} catch {
  // supabase not running or not installed
}

// Fallback defaults
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = "http://127.0.0.1:54321";
}
if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error(
    "SUPABASE_ANON_KEY not set and supabase status didn't provide one. " +
      "Start supabase: supabase start",
  );
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY not set and supabase status didn't provide one. " +
      "Start supabase: supabase start",
  );
}
