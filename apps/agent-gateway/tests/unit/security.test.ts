import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("securityAudit", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		// Start with clean env — only set safe defaults
		process.env = { ...originalEnv };
		process.env.NODE_ENV = "production";
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("returns empty warnings when all env vars are properly configured", async () => {
		process.env.OPENCODE_API_KEY = "sk-real-opencode-key-12345";
		process.env.OPENAI_API_KEY = "sk-real-openai-key-12345";
		process.env.GROQ_API_KEY = "gsk-real-groq-key";
		process.env.TOKEN_SIGNING_SECRET =
			"a-real-32-char-secret-for-production";
		process.env.TELEGRAM_WEBHOOK_SECRET = "a-real-webhook-secret-2026";
		process.env.SUPABASE_URL = "https://real-project.supabase.co";

		// Dynamically import to get fresh module state
		const { securityAudit } = await import("@/state/security");
		const warnings = securityAudit();
		expect(warnings).toHaveLength(0);
	});

	it("warns when OPENCODE_API_KEY is a placeholder", async () => {
		process.env.OPENCODE_API_KEY = "sk-...";
		process.env.OPENAI_API_KEY = "sk-real-key";
		process.env.TOKEN_SIGNING_SECRET =
			"a-real-32-char-secret-for-production";
		process.env.TELEGRAM_WEBHOOK_SECRET = "a-real-webhook-secret";

		const { securityAudit } = await import("@/state/security");
		const warnings = securityAudit();
		expect(warnings.some((w) => w.includes("OPENCODE_API_KEY"))).toBe(true);
	});

	it("warns when TOKEN_SIGNING_SECRET is too short", async () => {
		process.env.OPENCODE_API_KEY = "sk-real-opencode-key-12345";
		process.env.OPENAI_API_KEY = "sk-real-key";
		process.env.TOKEN_SIGNING_SECRET = "short";
		process.env.TELEGRAM_WEBHOOK_SECRET = "a-real-webhook-secret";

		const { securityAudit } = await import("@/state/security");
		const warnings = securityAudit();
		expect(warnings.some((w) => w.includes("TOKEN_SIGNING_SECRET"))).toBe(
			true,
		);
	});

	it("warns when TOKEN_SIGNING_SECRET is the dev default", async () => {
		process.env.OPENCODE_API_KEY = "sk-real-opencode-key-12345";
		process.env.OPENAI_API_KEY = "sk-real-key";
		process.env.TOKEN_SIGNING_SECRET = "zuiio-gateway-dev-secret-2026";
		process.env.TELEGRAM_WEBHOOK_SECRET = "a-real-webhook-secret";

		const { securityAudit } = await import("@/state/security");
		const warnings = securityAudit();
		expect(
			warnings.some((w) => w.includes("dev default")),
		).toBe(true);
	});

	it("warns when SUPABASE_URL is a placeholder", async () => {
		process.env.OPENCODE_API_KEY = "sk-real-opencode-key-12345";
		process.env.OPENAI_API_KEY = "sk-real-key";
		process.env.TOKEN_SIGNING_SECRET =
			"a-real-32-char-secret-for-production";
		process.env.TELEGRAM_WEBHOOK_SECRET = "a-real-webhook-secret";
		process.env.SUPABASE_URL = "https://your-project.supabase.co";

		const { securityAudit } = await import("@/state/security");
		const warnings = securityAudit();
		expect(warnings.some((w) => w.includes("SUPABASE_URL"))).toBe(true);
	});

	it("warns when GROQ_API_KEY is missing", async () => {
		process.env.OPENCODE_API_KEY = "sk-real-opencode-key-12345";
		process.env.OPENAI_API_KEY = "sk-real-key";
		process.env.TOKEN_SIGNING_SECRET =
			"a-real-32-char-secret-for-production";
		process.env.TELEGRAM_WEBHOOK_SECRET = "a-real-webhook-secret";
		delete process.env.GROQ_API_KEY;

		const { securityAudit } = await import("@/state/security");
		const warnings = securityAudit();
		expect(warnings.some((w) => w.includes("GROQ_API_KEY"))).toBe(true);
	});
});
