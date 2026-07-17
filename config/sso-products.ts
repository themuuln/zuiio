/**
 * SSO products manifest.
 *
 * Source of truth: config/sso-products.json
 * This module re-exports the JSON as typed constants for use by
 * provisioning scripts (scripts/sso/) and legacy type references.
 *
 * The Zuiio ID app itself reads from the product_catalog DB table
 * at runtime via @/lib/products/catalog — not from this file.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, "sso-products.json"), "utf-8");
const productsJson = JSON.parse(raw) as SsoProductManifestEntry[];

// ─── Types ──────────────────────────────────────────────────────────

export type ProductId = string;

export type ProductAuthMode = "sso" | "none";

interface SsoProductManifestEntry {
  id: string;
  displayName: string;
  authMode: ProductAuthMode;
  appRoots: string[];
  callbackPath: string;
  ssoStartPath: string;
  logoUrl?: string;
  mobileCallbackUrl?: string;
  mobileStartUrl?: string;
}

export interface SsoProduct extends SsoProductManifestEntry {
  appRoots: readonly string[];
}

// ─── Exports ────────────────────────────────────────────────────────

export const SSO_PRODUCTS: readonly SsoProduct[] = productsJson.map((p) => ({
  ...p,
  appRoots: Object.freeze([...p.appRoots]),
}));

export function getSsoProduct(id: string): SsoProduct | undefined {
  return SSO_PRODUCTS.find((candidate) => candidate.id === id);
}
