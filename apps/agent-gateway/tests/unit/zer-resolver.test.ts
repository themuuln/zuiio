import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveZerBaseUrl } from "@/lib/zer-resolver";

function mockSupabase(domain: string | null, verified: boolean) {
	const maybeSingle = vi.fn().mockResolvedValue({
		data:
			domain !== null
				? { custom_domain: domain, domain_verified: verified }
				: null,
		error: null,
	});
	const eq = vi.fn(() => ({ maybeSingle }));
	const select = vi.fn(() => ({ eq }));
	const from = vi.fn(() => ({ select }));
	return { from } as unknown as SupabaseClient;
}

describe("resolveZerBaseUrl", () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("ZER_APP_URL", "https://zer.example.com");
		vi.stubEnv("ZER_ORG_URLS", "");
	});

	it("prefers verified custom_domain over global fallback", async () => {
		const supabase = mockSupabase("bujin.mn", true);
		const url = await resolveZerBaseUrl(
			"11111111-1111-4111-8111-111111111111",
			supabase,
		);
		expect(url).toBe("https://bujin.mn");
		expect(supabase.from).toHaveBeenCalledWith("organization_public_profiles");
	});

	it("normalizes custom_domain with scheme and trailing slash", async () => {
		const supabase = mockSupabase("https://bujin.mn/", true);
		const url = await resolveZerBaseUrl("org-1", supabase);
		expect(url).toBe("https://bujin.mn");
	});

	it("falls back to ZER_APP_URL when custom_domain not verified", async () => {
		const supabase = mockSupabase("bujin.mn", false);
		const url = await resolveZerBaseUrl("org-1", supabase);
		expect(url).toBe("https://zer.example.com");
	});

	it("falls back to ZER_APP_URL when no custom_domain row", async () => {
		const supabase = mockSupabase(null, false);
		const url = await resolveZerBaseUrl("org-1", supabase);
		expect(url).toBe("https://zer.example.com");
	});

	it("uses ZER_ORG_URLS when custom_domain unverified", async () => {
		vi.stubEnv(
			"ZER_ORG_URLS",
			JSON.stringify({ "org-1": "https://custom.bujin.mn/" }),
		);
		vi.stubEnv("ZER_APP_URL", "https://zer.example.com");
		const supabase = mockSupabase("bujin.mn", false);
		const url = await resolveZerBaseUrl("org-1", supabase);
		expect(url).toBe("https://custom.bujin.mn");
	});

	it("prefers verified custom_domain over ZER_ORG_URLS", async () => {
		vi.stubEnv(
			"ZER_ORG_URLS",
			JSON.stringify({ "org-1": "https://override.example.com" }),
		);
		const supabase = mockSupabase("bujin.mn", true);
		const url = await resolveZerBaseUrl("org-1", supabase);
		expect(url).toBe("https://bujin.mn");
	});

	it("returns null when no domain and no fallback configured", async () => {
		vi.stubEnv("ZER_APP_URL", "");
		vi.stubEnv("ZER_ORG_URLS", "");
		const badSupabase = {
			from: vi.fn(() => {
				throw new Error("table not found");
			}),
		} as unknown as SupabaseClient;
		const url = await resolveZerBaseUrl("org-1", badSupabase);
		expect(url).toBe(null);
	});

	it("handles ZER_ORG_URLS with bare host without scheme", async () => {
		vi.stubEnv("ZER_ORG_URLS", JSON.stringify({ "org-1": "bujin.mn" }));
		const supabase = mockSupabase(null, false);
		const url = await resolveZerBaseUrl("org-1", supabase);
		expect(url).toBe("https://bujin.mn");
	});
});
