import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("startTypingLoop", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("sends initial typing action immediately", async () => {
		const { startTypingLoop } = await import("@/channels/typing-loop");

		const sendChatAction = vi.fn().mockResolvedValue(undefined);
		const tg = { sendChatAction };

		const stop = startTypingLoop(tg as never, 12345);

		expect(sendChatAction).toHaveBeenCalledWith(12345, "typing");

		stop();
	});

	it("sends typing indicator every 4 seconds", async () => {
		const { startTypingLoop } = await import("@/channels/typing-loop");

		const sendChatAction = vi.fn().mockResolvedValue(undefined);
		const tg = { sendChatAction };

		const stop = startTypingLoop(tg as never, "chat-789");

		// Initial call
		expect(sendChatAction).toHaveBeenCalledTimes(1);

		// After 4 seconds
		await vi.advanceTimersByTimeAsync(4000);
		expect(sendChatAction).toHaveBeenCalledTimes(2);

		// After 8 seconds
		await vi.advanceTimersByTimeAsync(4000);
		expect(sendChatAction).toHaveBeenCalledTimes(3);

		stop();
	});

	it("stops the interval when stop function is called", async () => {
		const { startTypingLoop } = await import("@/channels/typing-loop");

		const sendChatAction = vi.fn().mockResolvedValue(undefined);
		const tg = { sendChatAction };

		const stop = startTypingLoop(tg as never, 12345);

		// Stop immediately
		stop();

		// Advance time — no more calls
		await vi.advanceTimersByTimeAsync(20000);
		expect(sendChatAction).toHaveBeenCalledTimes(1);
	});

	it("handles sendChatAction rejection gracefully", async () => {
		const { startTypingLoop } = await import("@/channels/typing-loop");

		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const sendChatAction = vi
			.fn()
			.mockRejectedValue(new Error("Network error"));
		const tg = { sendChatAction };

		const stop = startTypingLoop(tg as never, 12345);

		// Should not throw despite rejection
		await vi.advanceTimersByTimeAsync(4000);
		expect(sendChatAction).toHaveBeenCalledTimes(2);

		stop();
		consoleSpy.mockRestore();
	});
});
