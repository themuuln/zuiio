/**
 * SmartCar.mn vehicle lookup via Playwright.
 *
 * Uses a shared browser instance (lazy singleton) to avoid spawning
 * a new Chromium per request. Scrapes the DOM after the SPA renders.
 *
 * Dependencies: playwright (npm install -D playwright)
 */

import type { Browser, Page } from "playwright";

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
// Browser singleton
// ---------------------------------------------------------------------------

let _browser: Browser | null = null;
let _launching: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser?.isConnected()) return _browser;
  if (_launching) return _launching;

  _launching = (async () => {
    const { chromium } = await import("playwright");
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
    });

    return browser;
  })();

  return _launching;
}

// ---------------------------------------------------------------------------
// DOM scraping
// ---------------------------------------------------------------------------

function parseVehicleFromDOM(page: Page): SmartCarVehicle {
  // The sidebar card always shows plate, make+model, year
  const plate =
    page.locator(".vehicleComponentInfoCard__value").first().textContent() ?? "";
  const makeModel =
    page.locator(".vehicleComponentInfoCard__value").nth(1).textContent() ?? "";
  const yearRaw =
    page.locator(".vehicleComponentInfoCard__value").nth(2).textContent() ?? "";

  // Split "HONDA Insight" → make + model
  const parts = makeModel.trim().split(/\s+/);
  const make = parts[0] ?? "";
  const model = parts.slice(1).join(" ");

  // Certificate section: label→value pairs inside vehicleGeneral__row
  const rows = page.locator(".vehicleGeneral__row");
  const count = rows.count();
  const fields: Record<string, string> = {};

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const label =
      row.locator(".vehicleGeneral__label").textContent()?.trim() ?? "";
    // Value is the text node after the label, not inside a child
    const fullText = row.textContent() ?? "";
    const value = fullText.replace(label, "").trim();
    if (label) fields[label] = value;
  }

  // Also grab the dimension values from the blue card
  const dimItems = page.locator(".vehicleGeneral__item");
  const dimCount = dimItems.count();
  for (let i = 0; i < dimCount; i++) {
    const item = dimItems.nth(i);
    const label =
      item.locator(".vehicleGeneral__label").textContent()?.trim() ?? "";
    const value =
      item.locator(".vehicleGeneral__value").textContent()?.trim() ?? "";
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
    const browser = await getBrowser();
    page = await browser.newPage();

    // Block heavy resources to speed up load
    await page.route("**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf}", (route: { abort: () => Promise<unknown> }) =>
      route.abort(),
    );
    await page.route("**/analytics**", (route: { abort: () => Promise<unknown> }) => route.abort());
    await page.route("**/gtag**", (route: { abort: () => Promise<unknown> }) => route.abort());
    await page.route("**/facebook**", (route: { abort: () => Promise<unknown> }) => route.abort());
    await page.route("**/socket**", (route: { abort: () => Promise<unknown> }) => route.abort());

    // Navigate to home
    await page.goto("https://smartcar.mn/home", {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT_MS,
    });

    // Fill plate number and search
    const input = page.getByRole("textbox", { name: "ААА" });
    await input.fill(normalized, { timeout: SELECTOR_TIMEOUT });
    await page
      .getByRole("button", { name: "search" })
      .click({ timeout: SELECTOR_TIMEOUT });

    // Wait for vehicle data to render
    await page
      .locator(".vehicleComponentInfoCard__value")
      .first()
      .waitFor({ state: "visible", timeout: SELECTOR_TIMEOUT });

    // Extra settle time for SPA data fetch
    await page.waitForTimeout(1500);

    const data = parseVehicleFromDOM(page);

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
    await page?.close();
  }
}
