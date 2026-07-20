import { afterEach, describe, expect, it, vi } from "vitest";

describe("env module", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("env", () => {
		it("returns the value when env var exists", async () => {
			process.env.TEST_VAR = "hello";
			const { env } = await import("@/lib/env");
			expect(env("TEST_VAR")).toBe("hello");
		});

		it("returns undefined when env var is missing and not required", async () => {
			delete process.env.MISSING_VAR;
			const { env } = await import("@/lib/env");
			expect(env("MISSING_VAR")).toBeUndefined();
		});

		it("throws when env var is missing and required", async () => {
			delete process.env.REQUIRED_VAR;
			const { env } = await import("@/lib/env");
			expect(() => env("REQUIRED_VAR", { required: true })).toThrow(
				"Missing required environment variable",
			);
		});
	});

	describe("envOrThrow", () => {
		it("returns the value when env var exists", async () => {
			process.env.TEST_REQUIRED = "exists";
			const { envOrThrow } = await import("@/lib/env");
			expect(envOrThrow("TEST_REQUIRED")).toBe("exists");
		});

		it("throws when env var is missing", async () => {
			delete process.env.DEFINITELY_MISSING;
			const { envOrThrow } = await import("@/lib/env");
			expect(() => envOrThrow("DEFINITELY_MISSING")).toThrow(
				"Missing required environment variable",
			);
		});
	});

	describe("openCodeGoConfig", () => {
		it("returns config with env var values", async () => {
			process.env.OPENCODE_API_KEY = "oc-key-123";
			process.env.OPENCODE_BASE_URL = "https://custom.api.com/v1";
			process.env.OPENCODE_MODEL = "custom-model";

			const { openCodeGoConfig } = await import("@/lib/env");
			const config = openCodeGoConfig();

			expect(config.apiKey).toBe("oc-key-123");
			expect(config.baseUrl).toBe("https://custom.api.com/v1");
			expect(config.model).toBe("custom-model");
		});

		it("uses defaults for optional config", async () => {
			process.env.OPENCODE_API_KEY = "key";
			delete process.env.OPENCODE_BASE_URL;
			delete process.env.OPENCODE_MODEL;

			const { openCodeGoConfig } = await import("@/lib/env");
			const config = openCodeGoConfig();

			expect(config.apiKey).toBe("key");
			expect(config.baseUrl).toBe("https://opencode.ai/zen/go/v1");
			expect(config.model).toBe("deepseek-v4-flash");
		});

		it("throws when API key is missing", async () => {
			delete process.env.OPENCODE_API_KEY;

			const { openCodeGoConfig } = await import("@/lib/env");
			expect(() => openCodeGoConfig()).toThrow(
				"Missing required environment variable",
			);
		});
	});

	describe("openAiConfig", () => {
		it("returns config when API key is set", async () => {
			process.env.OPENAI_API_KEY = "oa-key";
			process.env.OPENAI_BASE_URL = "https://custom.openai.com";

			const { openAiConfig } = await import("@/lib/env");
			const config = openAiConfig();

			expect(config).not.toBeNull();
			expect(config?.apiKey).toBe("oa-key");
			expect(config?.baseUrl).toBe("https://custom.openai.com");
		});

		it("returns null when no API key is set", async () => {
			delete process.env.OPENAI_API_KEY;

			const { openAiConfig } = await import("@/lib/env");
			expect(openAiConfig()).toBeNull();
		});
	});

	describe("validateConfig", () => {
		it("does not throw when all required env vars are set", async () => {
			process.env.SUPABASE_URL = "https://test.co";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "key";
			process.env.OPENCODE_API_KEY = "key";
			process.env.TELEGRAM_BOT_TOKEN = "token";
			process.env.TELEGRAM_WEBHOOK_SECRET = "secret";

			const { validateConfig } = await import("@/lib/env");
			expect(() => validateConfig()).not.toThrow();
		});

		it("throws when required env vars are missing", async () => {
			delete process.env.SUPABASE_URL;
			delete process.env.SUPABASE_SERVICE_ROLE_KEY;
			delete process.env.OPENCODE_API_KEY;
			delete process.env.TELEGRAM_BOT_TOKEN;
			delete process.env.TELEGRAM_WEBHOOK_SECRET;

			const { validateConfig } = await import("@/lib/env");
			expect(() => validateConfig()).toThrow(
				"Missing required environment variables",
			);
		});
	});

	describe("redisConfig", () => {
		it("returns config when redis env vars are set", async () => {
			process.env.UPSTASH_REDIS_REST_URL = "https://redis.test.upstash.io";
			process.env.UPSTASH_REDIS_REST_TOKEN = "redis-token";

			const { redisConfig } = await import("@/lib/env");
			const config = redisConfig();

			expect(config).not.toBeNull();
			expect(config?.url).toBe("https://redis.test.upstash.io");
			expect(config?.token).toBe("redis-token");
		});

		it("returns null when redis env vars are missing", async () => {
			delete process.env.UPSTASH_REDIS_REST_URL;
			delete process.env.UPSTASH_REDIS_REST_TOKEN;

			const { redisConfig } = await import("@/lib/env");
			expect(redisConfig()).toBeNull();
		});
	});
});
