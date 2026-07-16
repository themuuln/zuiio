import { describe, expect, it } from "vitest";
import { TelegramChannel } from "@/channels/telegram";

describe("TelegramChannel message reactions", () => {
	it("has correct reaction emoji constants", () => {
		expect(TelegramChannel.REACTIONS.received).toBe("👁️");
		expect(TelegramChannel.REACTIONS.processing).toBe("⏳");
		expect(TelegramChannel.REACTIONS.done).toBe("✅");
		expect(TelegramChannel.REACTIONS.error).toBe("❌");
	});

	it("setReaction calls setMessageReaction API", async () => {
		const channel = new TelegramChannel("test-token");
		// Mock fetch globally
		const originalFetch = globalThis.fetch;
		let capturedUrl = "";
		let capturedBody = "";
		globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
			if (typeof url === "string") capturedUrl = url;
			if (init?.body) capturedBody = init.body as string;
			return new Response(JSON.stringify({ ok: true }), { status: 200 });
		};

		try {
			await channel.setReaction(12345, 42, "👁️");
			expect(capturedUrl).toContain("/setMessageReaction");
			const body = JSON.parse(capturedBody);
			expect(body.chat_id).toBe(12345);
			expect(body.message_id).toBe(42);
			expect(body.reaction).toEqual([{ type: "emoji", emoji: "👁️" }]);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("setReaction silently ignores errors", async () => {
		const channel = new TelegramChannel("test-token");
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () => {
			return new Response("error", { status: 500 });
		};

		try {
			// Should not throw
			await channel.setReaction(12345, 42, "❌");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
