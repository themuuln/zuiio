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
		globalThis.fetch = async (
			url: string | URL | Request,
			init?: RequestInit,
		) => {
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

describe("TelegramChannel response streaming API", () => {
	it("sends native drafts with an integer draft ID", async () => {
		const channel = new TelegramChannel("test-token");
		const originalFetch = globalThis.fetch;
		let capturedUrl = "";
		let capturedBody = "";
		globalThis.fetch = async (
			url: string | URL | Request,
			init?: RequestInit,
		) => {
			if (typeof url === "string") capturedUrl = url;
			if (init?.body) capturedBody = init.body as string;
			return new Response(JSON.stringify({ ok: true }), { status: 200 });
		};

		try {
			await expect(channel.sendMessageDraft(12345, 7, "Partial")).resolves.toBe(
				true,
			);
			expect(capturedUrl).toContain("/sendMessageDraft");
			expect(JSON.parse(capturedBody)).toEqual({
				chat_id: 12345,
				draft_id: 7,
				text: "Partial",
			});
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("creates a fallback message and edits it", async () => {
		const channel = new TelegramChannel("test-token");
		const originalFetch = globalThis.fetch;
		const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
		globalThis.fetch = async (
			url: string | URL | Request,
			init?: RequestInit,
		) => {
			calls.push({
				url: String(url),
				body: JSON.parse(String(init?.body)),
			});
			return new Response(
				JSON.stringify(
					calls.length === 1
						? { ok: true, result: { message_id: 12 } }
						: { ok: true },
				),
				{ status: 200 },
			);
		};

		try {
			const messageId = await channel.sendStreamingPlaceholder(12345);
			if (messageId === null)
				throw new Error("Expected placeholder message ID");
			const edited = await channel.editStreamingMessage(
				12345,
				messageId,
				"Updated",
			);
			expect(messageId).toBe(12);
			expect(edited).toBe(true);
			expect(calls[0]?.url).toContain("/sendMessage");
			expect(calls[1]?.url).toContain("/editMessageText");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
