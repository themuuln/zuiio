/**
 * SmartCar.mn vehicle lookup via Playwright.
 *
 * Uses a shared browser instance (lazy singleton) to avoid spawning
 * a new Chromium per request. Scrapes the DOM after the SPA renders.
 *
 * Optimizations:
 *  - Pre-warms browser on module load (no cold-start penalty)
 *  - Navigates directly to /vehicle/{plate} (skips home page fill+click)
 *  - Reuses pages via a pool (avoids page creation overhead per request)
 *  - Uses waitForSelector instead of fixed sleep
 *
 * Dependencies: playwright (npm install -D playwright)
 */

import type { Browser, Page } from "playwright-core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SmartCarVehicle = {
  plateNumber: string;
  make: string;
  model: string;
  year: number | null;
  vin: string;
  category: string;
  engineCc: number | null;
  transmission: string;
  fuelType: string;
  steering: string;
  seats: number | null;
  bodyType: string;
  country: string;
  color: string;
  height: string;
  width: string;
  length: string;
  weight: string;
  importDate: string;
};

export type SmartCarLookupResult =
  | { ok: true; data: SmartCarVehicle }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Browser singleton + eager pre-warm
// ---------------------------------------------------------------------------

let _browser: Browser | null = null;
let _launching: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser?.isConnected()) return _browser;
  if (_launching) return _launching;

  _launching = (async () => {
    const { chromium } = await import("playwright-core");
    const browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
    _browser = browser;
    _launching = null;

    browser.on("disconnected", () => {
      _browser = null;
      _pagePool = [];
    });

    return browser;
  })();

  return _launching;
}

// Pre-warm browser on module load so the first request has no cold start
void getBrowser();

// ---------------------------------------------------------------------------
// Page pool — reuse pages to avoid creation overhead per request
// ---------------------------------------------------------------------------

const PAGE_POOL_MAX = 3;
let _pagePool: Page[] = [];

async function acquirePage(): Promise<Page> {
  // Reuse an idle page from the pool
  while (_pagePool.length > 0) {
    const page = _pagePool.pop()!;
    if (page.isClosed()) continue;
    // Clear stale routes from previous request before reuse
    await page.unrouteAll();
    return page;
  }
  // Pool empty — create a new page
  const browser = await getBrowser();
  return browser.newPage();
}

// Patterns to block on every page (heavy resources, trackers)
const BLOCKED_PATTERNS = [
  "**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf}",
  "**/analytics**",
  "**/gtag**",
  "**/facebook**",
  "**/socket**",
];

async function applyBlockRoutes(page: Page) {
  for (const pattern of BLOCKED_PATTERNS) {
    await page.route(pattern, (route: { abort: () => Promise<unknown> }) =>
      route.abort(),
    );
  }
}

function releasePage(page: Page) {
  if (page.isClosed()) return;
  if (_pagePool.length >= PAGE_POOL_MAX) {
    // Pool full — close the oldest page
    const oldest = _pagePool.shift();
    oldest?.close().catch(() => {});
  }
  _pagePool.push(page);
}

// ---------------------------------------------------------------------------
// DOM scraping
// ---------------------------------------------------------------------------

async function parseVehicleFromDOM(page: Page): Promise<SmartCarVehicle> {
  // The sidebar card always shows plate, make+model, year
  const plate =
    (await page
      .locator(".vehicleComponentInfoCard__value")
      .first()
      .textContent()) ?? "";
  const makeModel =
    (await page
      .locator(".vehicleComponentInfoCard__value")
      .nth(1)
      .textContent()) ?? "";
  const yearRaw =
    (await page
      .locator(".vehicleComponentInfoCard__value")
      .nth(2)
      .textContent()) ?? "";

  // Split "HONDA Insight" → make + model
  const parts = makeModel.trim().split(/\s+/);
  const make = parts[0] ?? "";
  const model = parts.slice(1).join(" ");

  // Certificate section: label→value pairs inside vehicleGeneral__row
  const rows = page.locator(".vehicleGeneral__row");
  const count = await rows.count();
  const fields: Record<string, string> = {};

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const label =
      (await row.locator(".vehicleGeneral__label").textContent())?.trim() ?? "";
    // Value is the text node after the label, not inside a child
    const fullText = (await row.textContent()) ?? "";
    const value = fullText.replace(label, "").trim();
    if (label) fields[label] = value;
  }

  // Also grab the dimension values from the blue card
  const dimItems = page.locator(".vehicleGeneral__item");
  const dimCount = await dimItems.count();
  for (let i = 0; i < dimCount; i++) {
    const item = dimItems.nth(i);
    const label =
      (await item.locator(".vehicleGeneral__label").textContent())?.trim() ??
      "";
    const value =
      (await item.locator(".vehicleGeneral__value").textContent())?.trim() ??
      "";
    if (label) fields[label] = value;
  }

  const yearNum = parseInt(yearRaw.trim(), 10);
  const engineRaw = fields["Хөдөлгүүрийн багтаамж"] ?? "";
  const engineNum = parseInt(engineRaw, 10);
  const seatsRaw = fields["Суудлын тоо"] ?? "";
  const seatsNum = parseInt(seatsRaw, 10);

  return {
    plateNumber: plate.trim(),
    make,
    model,
    year: Number.isFinite(yearNum) ? yearNum : null,
    vin: fields["Арлын дугааp"] ?? fields["Арлын дугаар"] ?? "",
    category: fields["Ангилал"] ?? "",
    engineCc: Number.isFinite(engineNum) ? engineNum : null,
    transmission: fields["Араа"] ?? "",
    fuelType: fields["Шатахууны төрөл"] ?? "",
    steering: fields["Жолооны хүрд"] ?? "",
    seats: Number.isFinite(seatsNum) ? seatsNum : null,
    bodyType: fields["Төрөл"] ?? "",
    country: fields["Үйлдвэрлэсэн улс"] ?? "",
    color: fields["Өнгө"] ?? "",
    height: fields["Өндөр"] ?? "",
    width: fields["Өргөн"] ?? "",
    length: fields["Урт"] ?? "",
    weight: fields["Жин"] ?? "",
    importDate: fields["Импортлогдсон огноо"] ?? "",
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 15_000;
const SELECTOR_TIMEOUT = 10_000;

export async function lookupPlate(
  plateNumber: string,
): Promise<SmartCarLookupResult> {
  const normalized = plateNumber.replace(/\s+/g, "").toUpperCase();

  let page: Page | null = null;

  try {
    page = await acquirePage();

    // Block heavy resources to speed up load
    await applyBlockRoutes(page);

    // Navigate directly to the vehicle page (skips home → fill → click)
    await page.goto(`https://smartcar.mn/vehicle/${normalized}`, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT_MS,
    });

    // Wait for vehicle data to render (poll instead of fixed sleep)
    // The SPA fetches data after mount — wait for the first info card value
    await page
      .locator(".vehicleComponentInfoCard__value")
      .first()
      .waitFor({ state: "visible", timeout: SELECTOR_TIMEOUT });

    // Short settle for remaining fields to populate
    await page.waitForTimeout(300);

    const data = await parseVehicleFromDOM(page);

    // Validate we got something meaningful
    if (!data.make && !data.model) {
      return {
        ok: false,
        error: `No vehicle found for plate "${normalized}"`,
      };
    }

    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  } finally {
    // Return page to pool for reuse (don't close it)
    if (page && !page.isClosed()) {
      releasePage(page);
    }
  }
}
