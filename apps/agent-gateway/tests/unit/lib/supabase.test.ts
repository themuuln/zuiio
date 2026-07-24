import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Supabase client creation", () => {
	const originalEnv: Record<string, string | undefined> = {};

	beforeEach(() => {
		vi.resetModules();
		// Save env vars
		originalEnv.SUPABASE_URL = process.env.SUPABASE_URL;
		originalEnv.SUPABASE_SERVICE_ROLE_KEY =
			process.env.SUPABASE_SERVICE_ROLE_KEY;
		originalEnv.TOLOM_SUPABASE_URL = process.env.TOLOM_SUPABASE_URL;
		originalEnv.TOLOM_SUPABASE_SERVICE_ROLE_KEY =
			process.env.TOLOM_SUPABASE_SERVICE_ROLE_KEY;
		originalEnv.AGENT_READER_PASSWORD = process.env.AGENT_READER_PASSWORD;
	});

	afterEach(() => {
		// Restore env vars
		process.env.SUPABASE_URL = originalEnv.SUPABASE_URL;
		process.env.SUPABASE_SERVICE_ROLE_KEY =
			originalEnv.SUPABASE_SERVICE_ROLE_KEY;
		process.env.TOLOM_SUPABASE_URL = originalEnv.TOLOM_SUPABASE_URL;
		process.env.TOLOM_SUPABASE_SERVICE_ROLE_KEY =
			originalEnv.TOLOM_SUPABASE_SERVICE_ROLE_KEY;
		process.env.AGENT_READER_PASSWORD = originalEnv.AGENT_READER_PASSWORD;
	});

	describe("createServiceClient", () => {
		it("creates a service client when env vars are set", async () => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

			const { createServiceClient } = await import("@/lib/supabase");

			const client = createServiceClient();
			expect(client).toBeDefined();
			expect(typeof client.from).toBe("function");
		});

		it("throws when SUPABASE_URL is missing", async () => {
			delete process.env.SUPABASE_URL;
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

			const { createServiceClient } = await import("@/lib/supabase");

			expect(() => createServiceClient()).toThrow("SUPABASE_URL");
		});

		it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			delete process.env.SUPABASE_SERVICE_ROLE_KEY;

			const { createServiceClient } = await import("@/lib/supabase");

			expect(() => createServiceClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
		});
	});

	describe("getSupabaseForProduct", () => {
		it("returns default service client for zer product", async () => {
			process.env.SUPABASE_URL = "https://zer.supabase.co";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "zer-key";
			process.env.TOLOM_SUPABASE_URL = "https://tolom.supabase.co";
			process.env.TOLOM_SUPABASE_SERVICE_ROLE_KEY = "tolom-key";

			const { getSupabaseForProduct } = await import("@/lib/supabase");

			const client = getSupabaseForProduct("zer");
			expect(client).toBeDefined();
		});

		it("returns tolom client for tolom product", async () => {
			process.env.TOLOM_SUPABASE_URL = "https://tolom.supabase.co";
			process.env.TOLOM_SUPABASE_SERVICE_ROLE_KEY = "tolom-key";

			const { getSupabaseForProduct } = await import("@/lib/supabase");

			const client = getSupabaseForProduct("tolom");
			expect(client).toBeDefined();
		});

		it("caches the tolom client on second call", async () => {
			process.env.TOLOM_SUPABASE_URL = "https://tolom.supabase.co";
			process.env.TOLOM_SUPABASE_SERVICE_ROLE_KEY = "tolom-key";

			const { getSupabaseForProduct } = await import("@/lib/supabase");

			const client1 = getSupabaseForProduct("tolom");
			const client2 = getSupabaseForProduct("tolom");
			// Should be the same instance (cached)
			expect(client1).toBe(client2);
		});
	});
});
