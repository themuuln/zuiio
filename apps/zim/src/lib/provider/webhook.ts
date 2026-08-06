import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  ProviderEsimStatus,
  ProviderWebhookEvent,
  ProvisionedEsim,
} from "./types";

// ─── HMAC Verification ──────────────────────────────────────────────

/**
 * Constant-time HMAC signature verification.
 * Accepts optional algorithm override (default sha256).
 * Strips common prefixes like `sha256=` or `sha512=` before comparing.
 */
export function verifyWebhookSignature(
  secret: string,
  payload: string,
  signature: string,
  algorithm: "sha256" | "sha512" = "sha256",
): boolean {
  try {
    const expected = createHmac(algorithm, secret)
      .update(payload)
      .digest("hex");
    const cleaned = signature.replace(/^sha256=|^sha512=/i, "").trim();
    if (expected.length !== cleaned.length) return false;
    return timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(cleaned, "utf8"),
    );
  } catch {
    return false;
  }
}

// ─── Normalize Options ──────────────────────────────────────────────

export interface WebhookNormalizeOptions {
  /** Whether the incoming HMAC signature was verified. */
  verified?: boolean;
}

// ─── Firsty ─────────────────────────────────────────────────────────

interface FirstyWebhookPayload {
  event: "esim.activated" | "esim.suspended" | "esim.terminated";
  data: {
    profileReference: string;
    esimReference?: string;
    iccid?: string;
    status?: string;
  };
  timestamp?: string;
}

const FIRSTY_EVENT_MAP: Record<string, ProviderWebhookEvent["type"]> = {
  "esim.activated": "esim.delivered",
  "esim.suspended": "esim.status_changed",
  "esim.terminated": "esim.failed",
};

const FIRSTY_STATUS_MAP: Record<string, ProviderEsimStatus["status"]> = {
  "esim.suspended": "expired",
  "esim.terminated": "failed",
};

function normalizeFirstyWebhook(
  payload: unknown,
  options?: WebhookNormalizeOptions,
): ProviderWebhookEvent {
  const body = payload as FirstyWebhookPayload;
  if (!body?.event || !body?.data?.profileReference) {
    throw new Error("firsty webhook: missing event or data.profileReference");
  }

  if (options?.verified === false) {
    console.warn(
      "[webhook:firsty] HMAC signature missing or invalid — processing anyway",
    );
  }

  const eventType = FIRSTY_EVENT_MAP[body.event];
  if (!eventType) {
    throw new Error(`firsty webhook: unknown event "${body.event}"`);
  }

  return {
    provider: "firsty",
    eventId: `${body.data.profileReference}:${body.event}:${body.timestamp ?? Date.now()}`,
    type: eventType,
    providerEsimId: body.data.esimReference,
    status: FIRSTY_STATUS_MAP[body.event],
    raw: payload,
  };
}

// ─── Citrus Mobile ──────────────────────────────────────────────────

interface CitrusWebhookPayload {
  event: "esim.active" | "esim.suspended" | "esim.terminated";
  iccid?: string;
}

const CITRUS_EVENT_MAP: Record<string, ProviderWebhookEvent["type"]> = {
  "esim.active": "esim.delivered",
  "esim.suspended": "esim.status_changed",
  "esim.terminated": "esim.failed",
};

const CITRUS_STATUS_MAP: Record<string, ProviderEsimStatus["status"]> = {
  "esim.suspended": "expired",
  "esim.terminated": "failed",
};

function normalizeCitrusWebhook(
  payload: unknown,
  options?: WebhookNormalizeOptions,
): ProviderWebhookEvent {
  const body = payload as CitrusWebhookPayload;
  if (!body?.event) {
    throw new Error("citrus-mobile webhook: missing event");
  }

  if (options?.verified === false) {
    console.warn(
      "[webhook:citrus-mobile] HMAC signature missing or invalid — processing anyway",
    );
  }

  const eventType = CITRUS_EVENT_MAP[body.event];
  if (!eventType) {
    throw new Error(`citrus-mobile webhook: unknown event "${body.event}"`);
  }

  return {
    provider: "citrus-mobile",
    eventId: `${body.iccid ?? "unknown"}:${body.event}`,
    type: eventType,
    status: CITRUS_STATUS_MAP[body.event],
    raw: payload,
  };
}

// ─── Roamic (passthrough — HMAC docs unavailable) ───────────────────

const ROAMIC_STATUS_MAP: Record<string, ProviderWebhookEvent["type"]> = {
  delivered: "esim.delivered",
  activated: "esim.delivered",
  active: "esim.delivered",
  failed: "esim.failed",
  expired: "esim.status_changed",
  suspended: "esim.status_changed",
};

function normalizeRoamicWebhook(
  payload: unknown,
  _options?: WebhookNormalizeOptions,
): ProviderWebhookEvent {
  const body = payload as Record<string, unknown>;
  const esimStatus =
    typeof body?.esimStatus === "string" && body.esimStatus.length > 0
      ? body.esimStatus
      : undefined;
  const eventType: ProviderWebhookEvent["type"] =
    (esimStatus != null && ROAMIC_STATUS_MAP[esimStatus]) ||
    "esim.status_changed";

  // Construct a stable eventId from whatever identifier fields exist
  const idKeys = ["id", "eventId", "event_id", "orderId", "order_id"];
  const foundKey = idKeys.find(
    (k) => typeof body?.[k] === "string" && (body[k] as string).length > 0,
  );
  const eventId = foundKey ? String(body[foundKey]) : `roamic:${Date.now()}`;

  return {
    provider: "roamic",
    eventId,
    type: eventType,
    raw: payload,
  };
}

// ─── Bappy (HMAC docs unavailable) ─────────────────────────────────

interface BappyWebhookPayload {
  event: "sim.activated" | "sim.expired";
  data: {
    id?: string;
    iccid?: string;
    status?: string;
  };
}

const BAPPY_EVENT_MAP: Record<string, ProviderWebhookEvent["type"]> = {
  "sim.activated": "esim.delivered",
  "sim.expired": "esim.status_changed",
};

const BAPPY_STATUS_MAP: Record<string, ProviderEsimStatus["status"]> = {
  "sim.expired": "expired",
};

function normalizeBappyWebhook(
  payload: unknown,
  _options?: WebhookNormalizeOptions,
): ProviderWebhookEvent {
  const body = payload as BappyWebhookPayload;
  if (!body?.event) {
    throw new Error("bappy webhook: missing event");
  }

  const eventType = BAPPY_EVENT_MAP[body.event];
  if (!eventType) {
    throw new Error(`bappy webhook: unknown event "${body.event}"`);
  }

  return {
    provider: "bappy",
    eventId: body.data?.id ?? `${body.data?.iccid ?? "unknown"}:${body.event}`,
    type: eventType,
    status: BAPPY_STATUS_MAP[body.event],
    raw: payload,
  };
}

// ─── Mock (legacy) ──────────────────────────────────────────────────

interface MockWebhookPayload {
  event_id: string;
  type: "esim.delivered" | "esim.failed";
  provider_order_id: string;
  esims?: ProvisionedEsim[];
  error?: string;
}

function normalizeMockWebhook(payload: unknown): ProviderWebhookEvent {
  const body = payload as MockWebhookPayload;
  if (!body?.event_id || !body?.type || !body?.provider_order_id) {
    throw new Error("mock webhook: missing event_id/type/provider_order_id");
  }
  return {
    provider: "mock",
    eventId: body.event_id,
    type: body.type,
    providerOrderId: body.provider_order_id,
    esims: body.esims,
    raw: payload,
  };
}

// ─── Dispatcher ─────────────────────────────────────────────────────

/**
 * Normalizes a raw provider webhook payload into ProviderWebhookEvent.
 * Each real provider gets its own branch here.
 */
export function normalizeWebhook(
  provider: string,
  payload: unknown,
  options?: WebhookNormalizeOptions,
): ProviderWebhookEvent {
  switch (provider) {
    case "mock":
      return normalizeMockWebhook(payload);
    case "firsty":
      return normalizeFirstyWebhook(payload, options);
    case "citrus-mobile":
      return normalizeCitrusWebhook(payload, options);
    case "roamic":
      return normalizeRoamicWebhook(payload, options);
    case "bappy":
      return normalizeBappyWebhook(payload, options);
    default:
      throw new Error(`Unknown webhook provider: ${provider}`);
  }
}
