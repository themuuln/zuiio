/**
 * Product branding for shared gateway pages — the white-label contract:
 * OAuth pages must read as the initiating product, never as the gateway.
 */
import { describe, expect, it } from "vitest";
import {
	DEFAULT_PRODUCT_NAME,
	PRODUCT_NAMES,
	productDisplayName,
	productPageTitle,
} from "@/lib/product-branding";

describe("productDisplayName", () => {
	it("maps known product types to their display names", () => {
		expect(productDisplayName("zer")).toBe("Zer");
		expect(productDisplayName("tolom")).toBe("Tolom");
		expect(productDisplayName("zatly")).toBe("Zatly");
	});

	it("falls back to the parent brand for unknown product types", () => {
		expect(productDisplayName("tumurch")).toBe(DEFAULT_PRODUCT_NAME);
		expect(productDisplayName("unknown")).toBe(DEFAULT_PRODUCT_NAME);
	});

	it("falls back for null/undefined product types", () => {
		expect(productDisplayName(null)).toBe(DEFAULT_PRODUCT_NAME);
		expect(productDisplayName(undefined)).toBe(DEFAULT_PRODUCT_NAME);
		expect(productDisplayName("")).toBe(DEFAULT_PRODUCT_NAME);
	});
});

describe("productPageTitle", () => {
	it("builds the product-branded browser title", () => {
		expect(productPageTitle("zer")).toBe("Zer — Facebook холболт");
		expect(productPageTitle("tolom")).toBe("Tolom — Facebook холболт");
	});

	it("never leaks the gateway name", () => {
		for (const type of ["zer", "tolom", "zatly", null, undefined, "x"]) {
			const title = productPageTitle(type);
			expect(title.toLowerCase()).not.toContain("gateway");
			expect(title.toLowerCase()).not.toContain("agent");
		}
	});
});

describe("PRODUCT_NAMES", () => {
	it("is the single source of truth — every product type has a display name", () => {
		for (const type of Object.keys(PRODUCT_NAMES)) {
			expect(productDisplayName(type)).toBe(PRODUCT_NAMES[type]);
		}
	});
});
