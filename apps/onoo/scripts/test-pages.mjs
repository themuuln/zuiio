import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "http://127.0.0.1:54325";
const SUPABASE_ANON_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const BASE = "http://localhost:3000";

const pages = [
  "/admin",
  "/admin/org",
  "/admin/org/members",
  "/admin/org/storage",
  "/admin/org/consent",
  "/admin/org/break-glass",
  "/admin/org/transfers",
  "/admin/org/identity-disputes",
  "/admin/leagues",
  "/admin/competitions",
  "/admin/awards",
  "/admin/teams",
  "/admin/players",
  "/admin/teams/roster",
  "/admin/games",
  "/admin/venues",
  "/admin/ops",
  "/admin/products",
  "/admin/orders",
  "/admin/academy",
  "/admin/academy/programs",
  "/admin/academy/trainers",
  "/admin/academy/locations",
  "/admin/academy/payments",
  // Academy sub-pages (not in sidebar but exist)
  "/admin/academy/announcements",
  "/admin/academy/attendance",
  "/admin/academy/consent",
  "/admin/academy/enrollments",
  "/admin/academy/students",
  "/admin/academy/waitlists",
  "/admin/academy/payments-ledger",
];

async function main() {
  // Login
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "admin@onoo.mn",
    password: "onoo2026",
  });
  if (error) {
    console.error("Login failed:", error);
    process.exit(1);
  }
  console.log("Logged in successfully\n");

  const { access_token, refresh_token } = data.session;

  // Build cookie as @supabase/ssr expects it
  const cookieValue = JSON.stringify({
    access_token,
    refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: "bearer",
  });
  const cookie = `sb-localhost-auth-token=${encodeURIComponent(cookieValue)}`;

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const path of pages) {
    const url = `${BASE}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const resp = await fetch(url, {
        headers: { Cookie: cookie },
        redirect: "manual",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const status = resp.status;
      const location = resp.headers.get("location") || "";

      if (status === 200) {
        console.log(`  ✅ ${path}`);
        passed++;
        results.push({ path, status: "OK" });
      } else if (status === 500) {
        const text = await resp.text().catch(() => "");
        const snippet = text.substring(0, 120).replace(/\n/g, " ").trim();
        console.log(`  ❌ ${path} — 500: ${snippet.substring(0, 100)}`);
        failed++;
        results.push({
          path,
          status: "500",
          detail: snippet.substring(0, 100),
        });
      } else if (status === 303 || status === 302) {
        console.log(`  ⚠️  ${path} — ${status} → ${location}`);
        if (location.includes("login")) {
          console.log(`     ↑ Redirected to login — auth cookie may not work`);
          failed++;
          results.push({
            path,
            status: `REDIRECT-${status}`,
            detail: location,
          });
        } else {
          passed++;
          results.push({ path, status: `REDIRECT(${status})→${location}` });
        }
      } else {
        console.log(`  ❓ ${path} — ${status}`);
        passed++;
        results.push({ path, status: `${status}` });
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        console.log(`  ⏰ ${path} — TIMEOUT`);
        failed++;
        results.push({ path, status: "TIMEOUT" });
      } else {
        console.log(`  ❌ ${path} — ${err.message}`);
        failed++;
        results.push({ path, status: "ERROR", detail: err.message });
      }
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  return { passed, failed, results };
}

main().then((r) => process.exit(r.failed > 0 ? 1 : 0));
