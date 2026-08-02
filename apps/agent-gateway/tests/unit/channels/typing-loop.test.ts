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
describe("createTelegramResponseStream", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("uses native drafts in private chats and finalizes the response", async () => {
		const { createTelegramResponseStream } = await import(
			"@/channels/typing-loop"
		);
		const sendMessageDraft = vi.fn().mockResolvedValue(true);
		const sendMessage = vi.fn().mockResolvedValue(undefined);
		const onFirstToken = vi.fn();
		const stream = createTelegramResponseStream(
			{
				sendChatAction: vi.fn().mockResolvedValue(undefined),
				sendMessage,
				sendMessageDraft,
				sendStreamingPlaceholder: vi.fn(),
				editStreamingMessage: vi.fn(),
			},
			12345,
			"private",
			{ onFirstToken, updateIntervalMs: 100 },
		);

		stream.onToken("Hello");
		expect(onFirstToken).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(100);
		await stream.finish("Hello");

		expect(sendMessageDraft).toHaveBeenCalledTimes(1);
		expect(sendMessageDraft.mock.calls[0]?.[0]).toBe(12345);
		expect(typeof sendMessageDraft.mock.calls[0]?.[1]).toBe("number");
		expect(sendMessageDraft.mock.calls[0]?.[1]).toBeGreaterThan(0);
		expect(sendMessageDraft.mock.calls[0]?.[2]).toBe("Hello");
		expect(sendMessage).toHaveBeenCalledWith(12345, "Hello");
	});

	it("uses edit-in-place streaming for group chats", async () => {
		const { createTelegramResponseStream } = await import(
			"@/channels/typing-loop"
		);
		const sendMessageDraft = vi.fn();
		const sendMessage = vi.fn().mockResolvedValue(undefined);
		const sendStreamingPlaceholder = vi.fn().mockResolvedValue(42);
		const editStreamingMessage = vi.fn().mockResolvedValue(true);
		const stream = createTelegramResponseStream(
			{
				sendChatAction: vi.fn().mockResolvedValue(undefined),
				sendMessage,
				sendMessageDraft,
				sendStreamingPlaceholder,
				editStreamingMessage,
			},
			-12345,
			"supergroup",
			{ updateIntervalMs: 100 },
		);

		stream.onToken("Hello group");
		await vi.advanceTimersByTimeAsync(100);
		await stream.finish("Hello group");

		expect(sendMessageDraft).not.toHaveBeenCalled();
		expect(sendStreamingPlaceholder).toHaveBeenCalledWith(-12345);
		expect(editStreamingMessage).toHaveBeenCalledWith(
			-12345,
			42,
			"Hello group",
		);
		expect(sendMessage).toHaveBeenCalledWith(-12345, "Hello group");
	});

	it("coalesces rapid tokens into throttled previews", async () => {
		const { createTelegramResponseStream } = await import(
			"@/channels/typing-loop"
		);
		const sendMessageDraft = vi.fn().mockResolvedValue(true);
		const stream = createTelegramResponseStream(
			{
				sendChatAction: vi.fn().mockResolvedValue(undefined),
				sendMessage: vi.fn().mockResolvedValue(undefined),
				sendMessageDraft,
				sendStreamingPlaceholder: vi.fn(),
				editStreamingMessage: vi.fn(),
			},
			12345,
			"private",
			{ updateIntervalMs: 100 },
		);
		stream.onToken("A");
		await Promise.resolve();
		stream.onToken("B");
		stream.onToken("C");
		expect(sendMessageDraft).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(100);
		await stream.finish("ABC");

		expect(sendMessageDraft).toHaveBeenCalledTimes(2);
		expect(sendMessageDraft.mock.calls[1]?.[2]).toBe("ABC");
	});

	it("falls back when native drafts are unavailable", async () => {
		const { createTelegramResponseStream } = await import(
			"@/channels/typing-loop"
		);
		const sendMessageDraft = vi.fn().mockResolvedValue(false);
		const sendStreamingPlaceholder = vi.fn().mockResolvedValue(7);
		const editStreamingMessage = vi.fn().mockResolvedValue(true);
		const stream = createTelegramResponseStream(
			{
				sendChatAction: vi.fn().mockResolvedValue(undefined),
				sendMessage: vi.fn().mockResolvedValue(undefined),
				sendMessageDraft,
				sendStreamingPlaceholder,
				editStreamingMessage,
			},
			12345,
			"private",
			{ updateIntervalMs: 100 },
		);

		stream.onToken("Fallback");
		await vi.advanceTimersByTimeAsync(100);
		await stream.finish("Fallback");

		expect(sendMessageDraft).toHaveBeenCalledTimes(1);
		expect(sendStreamingPlaceholder).toHaveBeenCalledTimes(1);
		expect(editStreamingMessage).toHaveBeenCalledWith(12345, 7, "Fallback");
	});
});
