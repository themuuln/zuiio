import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

// Try loading .env.local — may not exist, that's fine
config({ path: resolve(__dirname, ".env.local") });

// Parse supabase status to extract API keys when the runner did not provide
// an explicit integration target.
if (
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_ANON_KEY ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  try {
    const output = execSync("supabase status", {
      cwd: __dirname,
      encoding: "utf-8",
      timeout: 10_000,
    });
    // CLI 2.111+ prints the status as a single JSON object; older CLIs printed
    // `key: value` lines. Handle both.
    const jsonMatch = output.match(/^\s*\{.*\}\s*$/m);
    if (jsonMatch) {
      const status = JSON.parse(jsonMatch[0]) as Record<string, string>;
      process.env.SUPABASE_URL ??= status.API_URL;
      process.env.SUPABASE_ANON_KEY ??= status.ANON_KEY;
      process.env.SUPABASE_SERVICE_ROLE_KEY ??= status.SERVICE_ROLE_KEY;
      const dbPortMatch = status.DB_URL?.match(/@[^:]+:(\d+)/);
      if (dbPortMatch) process.env.SUPABASE_DB_PORT ??= dbPortMatch[1];
    } else {
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
        if (line.includes("DB URL")) {
          const m = line.match(/@[^:]+:(\d+)/);
          if (m) process.env.SUPABASE_DB_PORT ??= m[1];
        }
      }
    }
  } catch {
    // supabase not running or not installed
  }
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
