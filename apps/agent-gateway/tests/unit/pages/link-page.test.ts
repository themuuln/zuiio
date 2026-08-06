/**
 * Shared gateway pages must carry neutral/product-facing titles — the
 * gateway name never reaches end users.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("link page branding", () => {
	it("exports a neutral title instead of the gateway name", async () => {
		const { metadata } = await import("@/app/link/page");
		expect(metadata.title).toBe("Холболт");
		expect(String(metadata.title).toLowerCase()).not.toContain("gateway");
	});

	it("select page exposes a default export (page component)", async () => {
		const mod = await import("@/app/link/select/page");
		expect(typeof mod.default).toBe("function");
	});
});
