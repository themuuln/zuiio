import { describe, expect, it, vi } from "vitest";
import { systemPromptFor } from "@/gateway/webhook-helpers";

// Mock Redis (getRedis may fail — we test the DB fallback path)
vi.mock("@/lib/redis", () => ({
	getRedis: vi.fn(() => null),
}));

// Mock Supabase service client
vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => ({
		from: vi.fn(() => ({
			select: vi.fn(() => ({
				eq: vi.fn(() => ({
					single: vi.fn(() =>
						Promise.resolve({ data: null, error: null }),
					),
				})),
			})),
		})),
	})),
}));

describe("systemPromptFor — Tolom", () => {
	it("English Tolom prompt contains HTML-only format rule", async () => {
		const prompt = await systemPromptFor("tolom", "org-1", "private", "en");
		expect(prompt).toContain("HTML only");
		expect(prompt).toContain("<b>");
		expect(prompt).toContain("1-2 sentences");
	});

	it("English Tolom prompt forbids 'I don't have that data'", async () => {
		const prompt = await systemPromptFor("tolom", "org-1", "private", "en");
		expect(prompt).toContain('Never say "I don\'t have that data"');
	});

	it("Mongolian Tolom prompt requires Mongolian language", async () => {
		const prompt = await systemPromptFor("tolom", "org-1", "private", "mn");
		expect(prompt).toContain("ЗӨВХӨН Монгол хэлээр");
	});

	it("Mongolian Tolom prompt contains format rule", async () => {
		const prompt = await systemPromptFor("tolom", "org-1", "private", "mn");
		expect(prompt).toContain("HTML");
		expect(prompt).toContain("Markdown ашиглахгүй");
	});

	it("Mongolian Tolom prompt contains tool usage rule", async () => {
		const prompt = await systemPromptFor("tolom", "org-1", "private", "mn");
		expect(prompt).toContain("бүх өгөгдлийг хэрэгслээр асууна");
	});

	it("Includes organization ID in the prompt", async () => {
		const prompt = await systemPromptFor("tolom", "org-abc", "private", "mn");
		expect(prompt).toContain("org-abc");
	});

	it("Includes group warning for non-private chats", async () => {
		const prompt = await systemPromptFor("tolom", "org-1", "group", "mn");
		expect(prompt).toContain("group чат");
	});

	it("Omits group warning for private chats", async () => {
		const prompt = await systemPromptFor("tolom", "org-1", "private", "mn");
		expect(prompt).not.toContain("group чат");
	});
});

describe("systemPromptFor — Zer", () => {
	it("English Zer prompt contains HTML-only format rule", async () => {
		const prompt = await systemPromptFor("zer", "org-1", "private", "en");
		expect(prompt).toContain("HTML only");
		expect(prompt).toContain("1-2 sentences");
	});

	it("Mongolian Zer prompt requires Mongolian language", async () => {
		const prompt = await systemPromptFor("zer", "org-1", "private", "mn");
		expect(prompt).toContain("ЗӨВХӨН Монгол хэлээр");
		expect(prompt).toContain("Ерөнхий асуулт");
	});
});

describe("systemPromptFor — unknown product", () => {
	it("falls back to Zer prompt for unrecognized product type", async () => {
		// No explicit fallback — the function returns Zer prompt for unknown types
		const prompt = await systemPromptFor(
			"unknown",
			"org-1",
			"private",
			"en",
		);
		// Falls through to Zer prompt (last return)
		expect(prompt).toContain("proactive Zer");
	});

	it("falls back with Mongolian lang for unknown product", async () => {
		const prompt = await systemPromptFor(
			"unknown",
			"org-1",
			"private",
			"mn",
		);
		// Falls through to Mongolian Zer prompt
		expect(prompt).toContain("найрсаг");
	});
});
