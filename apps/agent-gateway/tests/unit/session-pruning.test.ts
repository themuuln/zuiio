import { describe, expect, it } from "vitest";

/**
 * Session context window pruning tests.
 *
 * The pruning logic is in handleAgentMessage. We test the algorithm directly
 * by replicating the logic here.
 */

const CONTEXT_WINDOW_TOKENS = 12_000;

function estimateTokens(text: string): number {
	return Math.ceil((text?.length ?? 0) / 4);
}

interface TestMessage {
	role: "user" | "assistant" | "tool";
	content: string | null;
}

function pruneSession(
	messages: TestMessage[],
	newUserMsg: string,
	newAssistantMsg: string,
): TestMessage[] {
	const updated = [
		...messages,
		{ role: "user" as const, content: newUserMsg },
		{ role: "assistant" as const, content: newAssistantMsg },
	];

	// Trim by token budget
	let totalTokens = updated.reduce(
		(sum, m) => sum + estimateTokens(m.content ?? ""),
		0,
	);
	while (updated.length > 2 && totalTokens > CONTEXT_WINDOW_TOKENS) {
		const dropped = updated.shift()!;
		totalTokens -= estimateTokens(dropped.content ?? "");
	}

	return updated;
}

describe("session context window pruning", () => {
	it("keeps all messages when under token budget", () => {
		const messages: TestMessage[] = [
			{ role: "user", content: "Hello" },
			{ role: "assistant", content: "Hi there" },
		];
		const result = pruneSession(messages, "How are you?", "I'm good");
		expect(result.length).toBe(4);
	});

	it("prunes oldest messages when over token budget", () => {
		// Create messages that exceed 12k tokens (~48k chars)
		const bigMessage = "A".repeat(10_000);
		const messages: TestMessage[] = Array.from({ length: 10 }, (_, i) => ({
			role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
			content: bigMessage,
		}));
		const result = pruneSession(messages, "New question", "New answer");
		// Should have pruned some old messages
		expect(result.length).toBeLessThan(12);
		// Should keep at least 2 (user + assistant minimum)
		expect(result.length).toBeGreaterThanOrEqual(2);
		// Total tokens should be under budget
		const totalTokens = result.reduce(
			(sum, m) => sum + estimateTokens(m.content ?? ""),
			0,
		);
		expect(totalTokens).toBeLessThanOrEqual(CONTEXT_WINDOW_TOKENS);
	});

	it("keeps at least 2 messages (user + assistant)", () => {
		const hugeMessage = "A".repeat(100_000);
		const messages: TestMessage[] = [
			{ role: "user", content: hugeMessage },
			{ role: "assistant", content: hugeMessage },
			{ role: "user", content: hugeMessage },
		];
		const result = pruneSession(messages, hugeMessage, hugeMessage);
		expect(result.length).toBeGreaterThanOrEqual(2);
	});

	it("handles empty session", () => {
		const result = pruneSession([], "Hello", "Hi");
		expect(result.length).toBe(2);
		expect(result[0]!.role).toBe("user");
		expect(result[1]!.role).toBe("assistant");
	});

	it("handles null content gracefully", () => {
		const messages: TestMessage[] = [
			{ role: "user", content: null },
			{ role: "assistant", content: null },
		];
		const result = pruneSession(messages, "test", "response");
		expect(result.length).toBe(4);
	});
});
