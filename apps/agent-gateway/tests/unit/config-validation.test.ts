import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateConfig } from "@/lib/env";

describe("validateConfig", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("passes when all required vars are set", () => {
		process.env.SUPABASE_URL = "https://test.supabase.co";
		process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
		process.env.OPENCODE_API_KEY = "test-key";
		process.env.TELEGRAM_BOT_TOKEN = "test-token";
		process.env.TELEGRAM_WEBHOOK_SECRET = "test-secret";
		expect(() => validateConfig()).not.toThrow();
	});

	it("throws when SUPABASE_URL is missing", () => {
		delete process.env.SUPABASE_URL;
		process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
		process.env.OPENCODE_API_KEY = "test-key";
		process.env.TELEGRAM_BOT_TOKEN = "test-token";
		process.env.TELEGRAM_WEBHOOK_SECRET = "test-secret";
		expect(() => validateConfig()).toThrow("SUPABASE_URL");
	});

	it("throws when OPENCODE_API_KEY is missing", () => {
		process.env.SUPABASE_URL = "https://test.supabase.co";
		process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
		delete process.env.OPENCODE_API_KEY;
		process.env.TELEGRAM_BOT_TOKEN = "test-token";
		process.env.TELEGRAM_WEBHOOK_SECRET = "test-secret";
		expect(() => validateConfig()).toThrow("OPENCODE_API_KEY");
	});

	it("throws listing all missing vars", () => {
		delete process.env.SUPABASE_URL;
		delete process.env.SUPABASE_SERVICE_ROLE_KEY;
		delete process.env.OPENCODE_API_KEY;
		delete process.env.TELEGRAM_BOT_TOKEN;
		delete process.env.TELEGRAM_WEBHOOK_SECRET;
		expect(() => validateConfig()).toThrow(
			"SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENCODE_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET",
		);
	});

	it("warns on missing optional vars", () => {
		process.env.SUPABASE_URL = "https://test.supabase.co";
		process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
		process.env.OPENCODE_API_KEY = "test-key";
		process.env.TELEGRAM_BOT_TOKEN = "test-token";
		process.env.TELEGRAM_WEBHOOK_SECRET = "test-secret";
		delete process.env.OPENAI_API_KEY;
		delete process.env.SENTRY_DSN;
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		validateConfig();
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("OPENAI_API_KEY"),
		);
		warnSpy.mockRestore();
	});
});
