#!/usr/bin/env node
/**
 * Automated screenshot capture for the TOLOM guide (Гарын авлага).
 *
 * Logs in, navigates to each defined page, and saves full-page screenshots
 * to docs/public/images/ for use in VitePress Markdown.
 *
 * Usage:
 *   node scripts/screenshots/capture.mjs              # capture all pages
 *   node scripts/screenshots/capture.mjs --only dashboard,work-orders  # specific pages
 *   node scripts/screenshots/capture.mjs --locale en   # English screenshots
 *   node scripts/screenshots/capture.mjs --width 1440 --height 900  # custom viewport
 */

import { chromium } from "@playwright/test";
import { mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = process.env.PORT ?? 3000;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_EMAIL = process.env.E2E_EMAIL ?? "themuuln4@gmail.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "Tolom!11";
const TEST_PIN = process.env.E2E_PIN ?? "1234";

const OUTPUT_DIR = resolve(import.meta.dirname, "../../docs/public/images");

/** Pages to capture — name becomes the filename, route is the path after base. */
const PAGES = [
  // Core dashboard
  { name: "dashboard", route: "/mn/dashboard", wait: "networkidle" },

  // Work orders
  {
    name: "work-orders-list",
    route: "/mn/dashboard/work-orders",
    wait: "networkidle",
  },
  {
    name: "work-orders-create",
    route: "/mn/dashboard/work-orders/new",
    wait: "networkidle",
  },
  // NOTE: detail page needs a work order ID — captured separately if needed
  // { name: "work-order-detail", route: "/mn/dashboard/work-orders/{id}", wait: "networkidle" },

  // Customers & vehicles
  { name: "customers", route: "/mn/dashboard/customers", wait: "networkidle" },
  { name: "vehicles", route: "/mn/dashboard/vehicles", wait: "networkidle" },

  // Inventory
  { name: "inventory", route: "/mn/dashboard/inventory", wait: "networkidle" },
  {
    name: "inventory-parts",
    route: "/mn/dashboard/inventory",
    wait: "networkidle",
  },
  {
    name: "inventory-suppliers",
    route: "/mn/dashboard/inventory/suppliers",
    wait: "networkidle",
  },

  // Finance & reports
  { name: "finance", route: "/mn/dashboard/finance", wait: "networkidle" },
  { name: "reports", route: "/mn/dashboard/reports", wait: "networkidle" },
  { name: "expenses", route: "/mn/dashboard/expenses", wait: "networkidle" },

  // Bay view
  { name: "bay-view", route: "/mn/dashboard/bay-view", wait: "networkidle" },
  {
    name: "bay-view-v2",
    route: "/mn/dashboard/bay-view-v2",
    wait: "networkidle",
  },

  // Other modules
  { name: "services", route: "/mn/dashboard/services", wait: "networkidle" },
  {
    name: "appointments",
    route: "/mn/dashboard/appointments",
    wait: "networkidle",
  },
  {
    name: "service-reminders",
    route: "/mn/dashboard/service-reminders",
    wait: "networkidle",
  },
  { name: "mechanic", route: "/mn/dashboard/mechanic", wait: "networkidle" },
  {
    name: "mechanic-performance",
    route: "/mn/dashboard/mechanic-performance",
    wait: "networkidle",
  },
  { name: "eod-close", route: "/mn/dashboard/eod-close", wait: "networkidle" },

  // Settings & org
  { name: "settings", route: "/mn/dashboard/settings", wait: "networkidle" },
  {
    name: "organization",
    route: "/mn/dashboard/organization",
    wait: "networkidle",
  },

  // Estimates
  { name: "estimates", route: "/mn/dashboard/estimates", wait: "networkidle" },

  // Portal (customer-facing — no auth needed, but captures in same flow)
  // { name: "portal-dashboard", route: "/mn/portal", wait: "networkidle" },
];

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function getArg(flag, defaultVal) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const onlyFilter = getArg("--only", null);
const locale = getArg("--locale", "mn");
const viewportWidth = Number(getArg("--width", "1440"));
const viewportHeight = Number(getArg("--height", "900"));
const fullPage = !args.includes("--no-fullpage");

// Filter pages if --only is provided
const pagesToCapture = onlyFilter
  ? PAGES.filter((p) => onlyFilter.split(",").includes(p.name))
  : PAGES;

// ---------------------------------------------------------------------------
// Auth helper (same logic as e2e/global-setup.ts)
// ---------------------------------------------------------------------------

async function waitForUrlNotMatching(page, patterns, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = page.url();
    if (!patterns.some((p) => current.includes(p))) return;
    await page.waitForTimeout(200);
  }
  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for URL to leave [${patterns.join(", ")}]. Current: ${page.url()}`,
  );
}

async function login(page) {
  const loginLocale = locale === "en" ? "en" : "mn";
  await page.goto(`/${loginLocale}/auth/login`);
  await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
  await page.getByRole("textbox", { name: "Password *" }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await waitForUrlNotMatching(page, ["/auth/login"]);

  if (page.url().includes("/auth/select-organization")) {
    const pinInput = page.getByRole("textbox", { name: /pin/i });
    await pinInput.waitFor({ state: "visible", timeout: 10_000 });
    await pinInput.fill(TEST_PIN);
    await page.getByRole("button", { name: /verify|continue/i }).click();
    await waitForUrlNotMatching(page, ["/auth/select-organization"]);
  }
}

// ---------------------------------------------------------------------------
// Screenshot capture
// ---------------------------------------------------------------------------

async function capturePage(page, { name, route, wait }) {
  const url = route.replace(/^\/mn\//, `/${locale}/`);
  console.log(`  📸 ${name} → ${url}`);

  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: wait, timeout: 30_000 });
  } catch (err) {
    console.log(`  ⚠️  Navigation timeout for ${name}, capturing anyway...`);
  }

  // Extra settle time for animations, lazy-loaded content
  await page.waitForTimeout(1_500);

  // Close any open toasts or popups that might obscure the page
  try {
    const toastClose = page.locator(
      "[data-sonner-toaster] button[aria-label='Close']",
    );
    if (await toastClose.isVisible({ timeout: 500 })) {
      await toastClose.click();
      await page.waitForTimeout(300);
    }
  } catch {
    // No toast — that's fine
  }

  const filepath = join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage });
  console.log(`  ✅ Saved: ${filepath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n🖼️  TOLOM Guide Screenshot Capture`);
  console.log(
    `   Locale: ${locale} | Viewport: ${viewportWidth}×${viewportHeight} | Full page: ${fullPage}`,
  );
  console.log(`   Pages: ${pagesToCapture.length} | Output: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: viewportWidth, height: viewportHeight },
    deviceScaleFactor: 2, // Retina-quality screenshots
  });
  const page = await context.newPage();

  // Login once
  console.log("🔐 Logging in...");
  await login(page);
  console.log("✅ Authenticated\n");

  // Capture each page
  let captured = 0;
  let failed = 0;

  for (const pageDef of pagesToCapture) {
    try {
      await capturePage(page, pageDef);
      captured++;
    } catch (err) {
      console.log(`  ❌ Failed: ${pageDef.name} — ${err.message}`);
      failed++;
    }
  }

  await browser.close();

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Captured: ${captured}/${pagesToCapture.length}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`\nUse in Markdown: ![Description](/images/<name>.png)\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
