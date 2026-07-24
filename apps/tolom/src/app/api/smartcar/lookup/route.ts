import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { lookupPlate, type SmartCarVehicle } from "@/lib/smartcar/browser";

// ---------------------------------------------------------------------------
// In-memory cache (survives across requests in the same server process).
// For production, swap with Redis or Upstash.
// ---------------------------------------------------------------------------

type CacheEntry = { data: SmartCarVehicle; ts: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCached(plate: string): SmartCarVehicle | null {
  const entry = cache.get(plate);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(plate);
    return null;
  }
  return entry.data;
}

function setCache(plate: string, data: SmartCarVehicle) {
  // Cap cache size at 5000 entries
  if (cache.size > 5000) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(plate, { data, ts: Date.now() });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const PLATE_RE = /^\d{4}[А-ЯӨҮЁ]{3}$/i;

function normalizePlate(raw: string): string | null {
  const cleaned = raw.replace(/[\s-]/g, "").toUpperCase();
  if (!PLATE_RE.test(cleaned)) return null;
  return cleaned;
}

// ---------------------------------------------------------------------------
// Rate limiting (simple per-IP)
// ---------------------------------------------------------------------------

const rateMap = new Map<string, { count: number; ts: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT = 10; // max 10 lookups per minute per IP

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.ts > RATE_WINDOW_MS) {
    rateMap.set(ip, { count: 1, ts: now });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// ---------------------------------------------------------------------------
// GET /api/smartcar/lookup?plate=4222УНА
// ---------------------------------------------------------------------------

export const GET = createSimpleRouteHandler(
  async ({ request }) => {
    const plate = request.nextUrl.searchParams.get("plate");
    if (!plate) {
      return apiError("MISSING_PARAM", "Missing ?plate= parameter", 400);
    }

    const normalized = normalizePlate(plate);
    if (!normalized) {
      return apiError(
        "INVALID_FORMAT",
        "Invalid plate format. Expected 4 digits + 3 Cyrillic letters (e.g. 4222УНА)",
        400,
      );
    }

    // Rate limit
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    if (!checkRate(ip)) {
      return apiError(
        "RATE_LIMITED",
        "Rate limit exceeded. Max 10 lookups per minute.",
        429,
      );
    }

    // Check cache
    const cached = getCached(normalized);
    if (cached) {
      return ok({ vehicle: cached, cached: true });
    }

    // Scrape SmartCar
    const result = await lookupPlate(normalized);

    if (!result.ok) {
      return apiError("NOT_FOUND", result.error, 404);
    }

    setCache(normalized, result.data);

    return ok({ vehicle: result.data, cached: false });
  },
  { requireAuth: false },
);
