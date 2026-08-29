import { beforeEach, describe, expect, it, vi } from "vitest";
import { appendToSession, summarizeIfNeeded } from "@/state/session";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/redis", () => ({ getRedis: vi.fn(() => null) }));

const mockChatCompletion = vi.fn();
vi.mock("@zuiio/ai-agent", () => ({
	chatCompletion: (...a: unknown[]) => mockChatCompletion(...a),
}));

vi.mock("@/lib/env", () => ({
	openCodeGoConfig: vi.fn(() => ({
		apiKey: "k",
		baseUrl: "http://localhost",
		model: "m",
	})),
}));

vi.mock("@/lib/debug", () => ({ debug: vi.fn() }));

const mockLoad = vi.fn();
const mockSave = vi.fn();
vi.mock("@/lib/cache", () => ({
	getCachedSession: (...a: unknown[]) => mockLoad(...a),
	setCachedSession: (...a: unknown[]) => mockSave(...a),
	SESSION_CACHE_TTL_SECONDS: 86400,
}));

function makeSupabase() {
	const chain = {
		select: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		single: vi.fn(() => Promise.resolve({ data: null, error: null })),
		upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
	};
	return { from: vi.fn(() => chain), ...chain } as never;
}

beforeEach(() => {
	vi.clearAllMocks();
	mockLoad.mockResolvedValue(null);
	mockSave.mockResolvedValue(undefined);
});

describe("appendToSession", () => {
	it("appends user + assistant messages and saves", async () => {
		const sb = makeSupabase();
		await appendToSession(sb, "org-1", "c", "u", "hi", "hello", 10, "telegram");

		const upsertCall = (sb as { upsert: ReturnType<typeof vi.fn> }).upsert.mock
			.calls[0]?.[0] as Record<string, unknown>;
		expect(upsertCall.messages).toEqual([
			{ role: "user", content: "hi" },
			{ role: "assistant", content: "hello" },
		]);
		expect(upsertCall.token_count).toBe(10);
	});
});

describe("summarizeIfNeeded", () => {
	const messages = Array.from({ length: 25 }, (_, i) => ({
		role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
		content: `message number ${i} with enough content to summarize meaningfully here`,
	}));

	it("returns null below the threshold", async () => {
		const result = await summarizeIfNeeded(messages.slice(0, 10));
		expect(result).toBeNull();
		expect(mockChatCompletion).not.toHaveBeenCalled();
	});

	it("replaces old messages with a summary and keeps the verbatim window", async () => {
		mockChatCompletion.mockResolvedValue("Товч хураангуй...");
		const result = await summarizeIfNeeded(messages);
		expect(result).not.toBeNull();
		expect(result?.[0]?.role).toBe("system");
		expect(result?.[0]?.content).toContain("Ярианы товч");
		// 1 summary + 10 verbatim
		expect(result?.length).toBe(11);
	});

	it("falls back to the recent window when summarization fails", async () => {
		mockChatCompletion.mockRejectedValue(new Error("LLM down"));
		const result = await summarizeIfNeeded(messages);
		expect(result).toHaveLength(10);
		expect(result?.[0]?.role).not.toBe("system");
	});

	it("returns null when old content is too short", async () => {
		const short = Array.from({ length: 25 }, (_, i) => ({
			role: "user" as const,
			content: `x${i}`,
		}));
		const result = await summarizeIfNeeded(short);
		expect(result).toBeNull();
	});
});
