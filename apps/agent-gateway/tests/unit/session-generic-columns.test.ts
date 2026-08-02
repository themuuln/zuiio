import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	loadSession,
	MAX_SESSION_MESSAGES,
	saveSession,
} from "@/state/session";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/redis", () => ({ getRedis: vi.fn(() => null) }));
vi.mock("@/lib/cache", () => ({
	getCachedSession: vi.fn(() => Promise.resolve(null)),
	setCachedSession: vi.fn(() => Promise.resolve()),
	SESSION_CACHE_TTL_SECONDS: 86400,
}));
vi.mock("@/lib/debug", () => ({ debug: vi.fn() }));
vi.mock("@/state/budget", () => ({
	recordUsageAtomic: vi.fn(() => Promise.resolve()),
}));

function makeSupabaseMock() {
	const chain = {
		select: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		single: vi.fn(() => Promise.resolve({ data: null, error: null })),
		maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
		upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
	};
	return {
		from: vi.fn(() => chain),
		...chain,
	} as never;
}

describe("session persistence — generic channel columns", () => {
	it("loadSession queries by (org, channel, channel_chat_id, channel_user_id)", async () => {
		const sb = makeSupabaseMock();

		await loadSession(sb, "org-1", "chat-9", "user-9", "whatsapp");

		const eqCalls = (sb as { eq: ReturnType<typeof vi.fn> }).eq.mock
			.calls as Array<[string, unknown]>;
		expect(eqCalls).toContainEqual(["organization_id", "org-1"]);
		expect(eqCalls).toContainEqual(["channel", "whatsapp"]);
		expect(eqCalls).toContainEqual(["channel_chat_id", "chat-9"]);
		expect(eqCalls).toContainEqual(["channel_user_id", "user-9"]);
	});

	it("saveSession upserts with the post-007 constraint and generic columns", async () => {
		const sb = makeSupabaseMock();

		await saveSession(
			sb,
			"org-1",
			"chat-9",
			"user-9",
			[{ role: "user", content: "hello" }],
			5,
			"messenger",
		);

		const upsertCalls = (sb as { upsert: ReturnType<typeof vi.fn> }).upsert.mock
			.calls;
		expect(upsertCalls).toHaveLength(1);
		const [payload, opts] = upsertCalls[0] as [
			Record<string, unknown>,
			{ onConflict: string },
		];
		expect(opts.onConflict).toBe(
			"organization_id,channel,channel_chat_id,channel_user_id",
		);
		expect(payload).toMatchObject({
			organization_id: "org-1",
			channel: "messenger",
			channel_chat_id: "chat-9",
			channel_user_id: "user-9",
		});
	});

	it("saveSession trims messages over the cap keeping the newest", async () => {
		const sb = makeSupabaseMock();
		const messages = Array.from(
			{ length: MAX_SESSION_MESSAGES + 10 },
			(_, i) => ({
				role: "user" as const,
				content: `msg-${i}`,
			}),
		);

		await saveSession(sb, "org-1", "c", "u", messages, 100, "telegram");

		const [payload] = (sb as { upsert: ReturnType<typeof vi.fn> }).upsert.mock
			.calls[0] as [Record<string, unknown>];
		const saved = payload.messages as Array<{ content: string }>;
		expect(saved).toHaveLength(MAX_SESSION_MESSAGES);
		expect(saved[0]?.content).toBe("msg-10");
	});
});
