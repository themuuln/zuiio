/**
 * Product-facing branding for shared (gateway-hosted) pages.
 *
 * The gateway is invisible to end users: OAuth pages must read as the
 * product they initiated from (Zer, Tolom, Zatly, …), never as
 * "agent-gateway". This is the single source of truth for product names —
 * extend the map when a new product gets page connect.
 */

/** User-facing product names, keyed by `product_type` (channel_connections). */
export const PRODUCT_NAMES: Record<string, string> = {
	zer: "Zer",
	tolom: "Tolom",
	zatly: "Zatly",
};

/** Fallback used for unknown/unset product types. */
export const DEFAULT_PRODUCT_NAME = "Zuiio";

/** Display name for a product type, falling back to the parent brand. */
export function productDisplayName(
	productType: string | null | undefined,
): string {
	if (!productType) return DEFAULT_PRODUCT_NAME;
	return PRODUCT_NAMES[productType] ?? DEFAULT_PRODUCT_NAME;
}

/** Browser-tab title for the Facebook page-connect flow. */
export function productPageTitle(
	productType: string | null | undefined,
): string {
	return `${productDisplayName(productType)} — Facebook холболт`;
}
