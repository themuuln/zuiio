import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for runtime/confirmation.ts — confirmation gate for write tools.
 *
 * The module uses crypto.randomUUID and setTimeout internally.
 * We test the core logic by controlling the nonce via crypto mock.
 */

// Mock crypto.randomUUID to return deterministic nonce
const mockNonce = "mock-nonce-1234-5678";
vi.stubGlobal("crypto", {
	randomUUID: vi.fn(() => mockNonce),
});

// We import * to get access to the module's internal state via the exported functions
type StagedAction = {
	nonce: string;
	toolName: string;
	args: Record<string, unknown>;
	channel: string;
	channelChatId: string;
	channelUserId: string;
	summary: string;
	pageId?: string;
	pageAccessToken?: string;
};

describe("stageAction", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("stages an action and returns nonce with confirmation buttons", async () => {
		vi.useFakeTimers();
		const { stageAction } = await import("@/runtime/confirmation");

		const result = stageAction(
			"writeData",
			{ dataset: "customers", operation: "update" },
			"telegram",
			"chat-123",
			"user-456",
			"Update customer John Doe",
		);

		expect(result.nonce).toBe(mockNonce);
		expect(result.buttons).toHaveLength(1);
		expect(result.buttons[0]).toHaveLength(2);
		expect(result.buttons[0][0].text).toContain("Тийм");
		expect(result.buttons[0][0].callbackData).toBe(`confirm:${mockNonce}`);
		expect(result.buttons[0][1].text).toContain("Үгүй");
		expect(result.buttons[0][1].callbackData).toBe(`reject:${mockNonce}`);
	});

	it("includes optional pageId and pageAccessToken in stored action", async () => {
		vi.useFakeTimers();
		const { stageAction, confirmAction } = await import(
			"@/runtime/confirmation"
		);

		stageAction(
			"writeData",
			{ dataset: "customers" },
			"messenger",
			"chat-789",
			"user-012",
			"Create customer",
			"page-001",
			"token-abc",
		);

		const action = confirmAction(mockNonce, "chat-789", "user-012");
		expect(action).not.toBeNull();
		expect(action?.pageId).toBe("page-001");
		expect(action?.pageAccessToken).toBe("token-abc");
	});
});

describe("confirmAction", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the staged action when credentials match", async () => {
		vi.useFakeTimers();
		const { stageAction, confirmAction } = await import(
			"@/runtime/confirmation"
		);

		stageAction(
			"writeData",
			{ dataset: "products" },
			"telegram",
			"chat-123",
			"user-456",
			"Delete product XYZ",
		);

		const action = confirmAction(mockNonce, "chat-123", "user-456");
		expect(action).not.toBeNull();
		expect(action?.toolName).toBe("writeData");
		expect(action?.args).toEqual({ dataset: "products" });
		expect(action?.channel).toBe("telegram");
		expect(action?.channelChatId).toBe("chat-123");
		expect(action?.channelUserId).toBe("user-456");
		expect(action?.summary).toBe("Delete product XYZ");
	});

	it("returns null when nonce does not exist", async () => {
		const { confirmAction } = await import("@/runtime/confirmation");
		const action = confirmAction("nonexistent-nonce", "chat-123", "user-456");
		expect(action).toBeNull();
	});

	it("returns null when channelChatId does not match", async () => {
		vi.useFakeTimers();
		const { stageAction, confirmAction } = await import(
			"@/runtime/confirmation"
		);

		stageAction(
			"writeData",
			{},
			"telegram",
			"chat-123",
			"user-456",
			"Test action",
		);

		const action = confirmAction(mockNonce, "wrong-chat", "user-456");
		expect(action).toBeNull();
	});

	it("returns null when channelUserId does not match", async () => {
		vi.useFakeTimers();
		const { stageAction, confirmAction } = await import(
			"@/runtime/confirmation"
		);

		stageAction(
			"writeData",
			{},
			"telegram",
			"chat-123",
			"user-456",
			"Test action",
		);

		const action = confirmAction(mockNonce, "chat-123", "wrong-user");
		expect(action).toBeNull();
	});

	it("consumes the action on successful confirmation (cannot confirm twice)", async () => {
		vi.useFakeTimers();
		const { stageAction, confirmAction } = await import(
			"@/runtime/confirmation"
		);

		stageAction(
			"writeData",
			{},
			"telegram",
			"chat-123",
			"user-456",
			"One-time action",
		);

		const first = confirmAction(mockNonce, "chat-123", "user-456");
		expect(first).not.toBeNull();

		const second = confirmAction(mockNonce, "chat-123", "user-456");
		expect(second).toBeNull();
	});
});

describe("rejectAction", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("removes the staged action so it cannot be confirmed", async () => {
		vi.useFakeTimers();
		const { stageAction, rejectAction, confirmAction } = await import(
			"@/runtime/confirmation"
		);

		stageAction(
			"writeData",
			{},
			"telegram",
			"chat-123",
			"user-456",
			"Action to reject",
		);

		rejectAction(mockNonce);

		const action = confirmAction(mockNonce, "chat-123", "user-456");
		expect(action).toBeNull();
	});

	it("does not throw when rejecting a nonexistent nonce", async () => {
		const { rejectAction } = await import("@/runtime/confirmation");
		expect(() => rejectAction("nonexistent")).not.toThrow();
	});
});
