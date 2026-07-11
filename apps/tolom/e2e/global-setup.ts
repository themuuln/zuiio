import { execSync, readFileSync, statSync } from "node:fs";
import type { FullConfig } from "@playwright/test";
import { chromium } from "@playwright/test";

const PORT = process.env.PORT ?? 3000;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_EMAIL = process.env.E2E_EMAIL ?? "themuuln4@gmail.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "Tolom!11";

/**
 * Load env vars from .env.local (Playwright runs outside Next.js, so
 * .env.local isn't automatically loaded).
 */
function loadEnvLocal() {
  try {
    const content = readFileSync(".env.local", "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local doesn't exist — rely on process.env
  }
}

/**
 * Global setup — seeds data and logs in once.
 * In CI, Supabase starts fresh and the CI step runs seed.
 * Locally, we seed here to guarantee deterministic state.
 *
 * Uses Supabase Auth REST API directly to create a session,
 * bypassing the Turnstile validation in the login server action.
 */
export default async function globalSetup(_config: FullConfig) {
  loadEnvLocal();

  // Skip login if auth state already exists and is fresh (< 24 hours old)
  const authFile = "e2e/.auth/user.json";
  try {
    const stat = statSync(authFile);
    const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    if (ageHours < 24) {
      process.stdout.write(
        `✓ Auth state is fresh (${ageHours.toFixed(1)}h old), skipping login\n`,
      );
      return;
    }
  } catch {
    // Auth file doesn't exist — need to login
  }

  // Skip seeding for remote Supabase — only seed local instances
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").toLowerCase();
  const isLocalSupabase =
    supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1");
  if (!process.env.CI && isLocalSupabase) {
    process.stdout.write("🌱 Seeding E2E test data (local Supabase)...\n");
    execSync("bun supabase/seed-e2e.ts", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
  } else if (!process.env.CI) {
    process.stdout.write("⏭️  Skipping seed — using remote Supabase\n");
  }

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or anon key in .env.local for global setup",
    );
  }

  // Sign in via Supabase Auth REST API directly (bypasses Turnstile)
  const body = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
  process.stdout.write(`🔑 Signing in as ${TEST_EMAIL}...\n`);

  const signInRes = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body,
    },
  );

  if (!signInRes.ok) {
    const err = await signInRes.text();
    throw new Error(`Supabase sign-in failed (${signInRes.status}): ${err}`);
  }

  const { access_token, refresh_token } = (await signInRes.json()) as {
    access_token: string;
    refresh_token: string;
  };

  // Launch browser, set auth cookies, verify, and save state
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL });

  await context.addCookies([
    {
      name: "sb-access-token",
      value: access_token,
      domain: "localhost",
      path: "/",
    },
    {
      name: "sb-refresh-token",
      value: refresh_token,
      domain: "localhost",
      path: "/",
    },
  ]);

  // Verify auth works by navigating to dashboard
  const page = await context.newPage();
  await page.goto("/dashboard");
  await page.waitForURL("**/dashboard**", { timeout: 15_000 });

  await context.storageState({ path: authFile });
  await browser.close();

  process.stdout.write("✓ Auth state saved via Supabase API\n");
}
