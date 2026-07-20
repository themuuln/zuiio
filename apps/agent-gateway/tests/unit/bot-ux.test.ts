import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("bot-ux", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
		process.env.TELEGRAM_BOT_TOKEN = "123456:test-bot-token-for-ux";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("setupBotProfile", () => {
		it("calls Telegram API with bot name, description, and commands", async () => {
			const { setupBotProfile } = await import("@/bot-ux");
			await setupBotProfile();

			const calls = vi.mocked(fetch).mock.calls;
			expect(calls.length).toBeGreaterThanOrEqual(4);

			// First call should be setMyName
			expect(calls[0][0]).toContain("setMyName");
			const firstOpts = calls[0][1] as RequestInit;
			const firstBody = JSON.parse(firstOpts.body as string) as Record<
				string,
				unknown
			>;
			expect(firstBody.name).toBe("Zuiio AI");

			// setMyCommands should be called
			const commandsCall = calls.find((c) =>
				(c[0] as string).includes("setMyCommands"),
			);
			expect(commandsCall).toBeDefined();

			// setMyDescription should be called
			const descriptionCall = calls.find((c) =>
				(c[0] as string).includes("setMyDescription"),
			);
			expect(descriptionCall).toBeDefined();
		});

		it("throws when TELEGRAM_BOT_TOKEN is missing", async () => {
			delete process.env.TELEGRAM_BOT_TOKEN;

			const { setupBotProfile } = await import("@/bot-ux");
			await expect(setupBotProfile()).rejects.toThrow("TELEGRAM_BOT_TOKEN");
		});
	});

	describe("onUserLinked", () => {
		it("sets full commands and menu button for linked user", async () => {
			const { onUserLinked } = await import("@/bot-ux");
			await onUserLinked(12345);

			const calls = vi.mocked(fetch).mock.calls;

			const commandsCall = calls.find((c) =>
				(c[0] as string).includes("setMyCommands"),
			);
			expect(commandsCall).toBeDefined();

			const menuButtonCall = calls.find((c) =>
				(c[0] as string).includes("setChatMenuButton"),
			);
			expect(menuButtonCall).toBeDefined();
		});
	});

	describe("onWelcome", () => {
		it("calls Telegram API for unlinked user welcome", async () => {
			const { onWelcome } = await import("@/bot-ux");
			await onWelcome(67890);

			expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThanOrEqual(1);
		});
	});
});
