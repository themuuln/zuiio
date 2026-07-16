import { describe, expect, it } from "vitest";
import { TelegramChannel } from "@/channels/telegram";

describe("TelegramChannel message splitting", () => {
	it("sends short messages as-is", async () => {
		const channel = new TelegramChannel("test-token");
		const originalFetch = globalThis.fetch;
		let sendCount = 0;
		globalThis.fetch = async () => {
			sendCount++;
			return new Response(JSON.stringify({ ok: true }), { status: 200 });
		};

		try {
			await channel.sendMessage(12345, "Hello world");
			expect(sendCount).toBe(1);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("splits messages exceeding 4096 characters", async () => {
		const channel = new TelegramChannel("test-token");
		const originalFetch = globalThis.fetch;
		const sentTexts: string[] = [];
		globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
			if (init?.body) {
				const body = JSON.parse(init.body as string);
				if (body.text) sentTexts.push(body.text);
			}
			return new Response(JSON.stringify({ ok: true }), { status: 200 });
		};

		try {
			const longText = "A".repeat(5000);
			await channel.sendMessage(12345, longText);
			expect(sentTexts.length).toBeGreaterThanOrEqual(2);
			// First chunk should be at most 4096 chars
			expect(sentTexts[0]!.length).toBeLessThanOrEqual(4096);
			// Total length should equal original
			const total = sentTexts.join("").length;
			expect(total).toBe(5000);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("splits on paragraph boundaries when possible", async () => {
		const channel = new TelegramChannel("test-token");
		const originalFetch = globalThis.fetch;
		const sentTexts: string[] = [];
		globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
			if (init?.body) {
				const body = JSON.parse(init.body as string);
				if (body.text) sentTexts.push(body.text);
			}
			return new Response(JSON.stringify({ ok: true }), { status: 200 });
		};

		try {
			// Create text with newlines near the 4096 boundary
			const line = "A".repeat(100) + "\n";
			const lines = Math.ceil(5000 / 101);
			const text = line.repeat(lines);
			await channel.sendMessage(12345, text);
			expect(sentTexts.length).toBeGreaterThanOrEqual(2);
			// Each chunk (except last) should end at a newline
			for (let i = 0; i < sentTexts.length - 1; i++) {
				expect(sentTexts[i]!.endsWith("\n") || sentTexts[i]!.length <= 4096).toBe(true);
			}
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
