import { execSync, readFileSync, statSync } from "node:fs";
import type { FullConfig } from "@playwright/test";
import { chromium } from "@playwright/test";

const PORT = process.env.PORT ?? 3000;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_EMAIL = process.env.E2E_EMAIL ?? "admin@onoo.mn";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "admin123";

/**
 * Load env vars from .env.local (Playwright runs outside Next.js).
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
    // .env.local doesn't exist
  }
}

/**
 * Global setup — creates an authenticated session via Supabase Auth REST API.
 * Skips if existing auth state is fresh (< 24 hours old).
 */
export default async function globalSetup(_config: FullConfig) {
  loadEnvLocal();

  // Skip login if auth state exists and is fresh
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    process.stdout.write(
      "⚠️ No Supabase credentials found. Tests will use mocked APIs only.\n",
    );
    return;
  }

  // Sign in via Supabase Auth REST API
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
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    },
  );

  if (!signInRes.ok) {
    const err = await signInRes.text();
    process.stdout.write(
      `⚠️ Sign-in failed (${signInRes.status}): ${err}. Using mocked APIs only.\n`,
    );
    return;
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

  const page = await context.newPage();
  await page.goto("/admin");
  await page.waitForURL("**/admin**", { timeout: 15_000 });

  await context.storageState({ path: authFile });
  await browser.close();

  process.stdout.write("✓ Auth state saved via Supabase API\n");
}
