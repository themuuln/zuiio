import { describe, expect, it } from "vitest";

/**
 * SSE streaming parser tests.
 *
 * The SSE parsing logic is in GptMiniProvider. We test the parsing algorithm
 * directly by replicating the logic here.
 */

interface StreamChunk {
	content?: string;
	tool_calls?: Array<{
		index: number;
		id?: string;
		function?: { name?: string; arguments?: string };
	}>;
}

function parseSSEChunk(line: string): StreamChunk | null {
	if (!line.startsWith("data: ")) return null;
	const data = line.slice(6).trim();
	if (data === "[DONE]") return null;
	const parsed = JSON.parse(data) as Record<string, unknown>;
	const choices = parsed.choices as Array<Record<string, unknown>> | undefined;
	const delta = choices?.[0]?.delta as Record<string, unknown> | undefined;
	if (!delta) return null;
	return {
		content: typeof delta.content === "string" ? delta.content : undefined,
		tool_calls: delta.tool_calls as StreamChunk["tool_calls"],
	};
}

function simulateStreaming(sseLines: string[]): {
	content: string;
	toolCalls: Map<string, { id: string; name: string; arguments: string }>;
} {
	let content = "";
	const toolCallsById = new Map<string, { id: string; name: string; arguments: string }>();

	for (const line of sseLines) {
		const chunk = parseSSEChunk(line);
		if (!chunk) continue;

		if (chunk.content) {
			content += chunk.content;
		}

		if (chunk.tool_calls) {
			for (const tc of chunk.tool_calls) {
				const idx = String(tc.index);
				const existing = toolCallsById.get(idx);
				if (existing) {
					existing.arguments += tc.function?.arguments ?? "";
				} else if (tc.function) {
					toolCallsById.set(idx, {
						id: tc.id ?? `call_${idx}`,
						name: tc.function.name ?? "",
						arguments: tc.function.arguments ?? "",
					});
				}
			}
		}
	}

	return { content, toolCalls: toolCallsById };
}

describe("SSE streaming parser", () => {
	it("parses content tokens", () => {
		const lines = [
			'data: {"choices":[{"delta":{"content":"Hello"}}]}',
			'data: {"choices":[{"delta":{"content":" world"}}]}',
			'data: {"choices":[{"delta":{"content":"!"}}]}',
			"data: [DONE]",
		];
		const result = simulateStreaming(lines);
		expect(result.content).toBe("Hello world!");
	});

	it("handles empty content tokens", () => {
		const lines = [
			'data: {"choices":[{"delta":{}}]}',
			'data: {"choices":[{"delta":{"content":"Hi"}}]}',
			"data: [DONE]",
		];
		const result = simulateStreaming(lines);
		expect(result.content).toBe("Hi");
	});

	it("parses tool call deltas", () => {
		const lines = [
			'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"getSales","arguments":""}}]}}]}',
			'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"da"}}]}}]}',
			'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"ys\\":7}"}}]}}]}',
			"data: [DONE]",
		];
		const result = simulateStreaming(lines);
		expect(result.toolCalls.size).toBe(1);
		const tc = result.toolCalls.get("0")!;
		expect(tc.name).toBe("getSales");
		expect(tc.arguments).toBe('{"days":7}');
	});

	it("handles multiple tool calls", () => {
		const lines = [
			'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"tool1","arguments":""}},{"index":1,"id":"call_2","function":{"name":"tool2","arguments":""}}]}}]}',
			'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"arg1"}}]}}]}',
			'data: {"choices":[{"delta":{"tool_calls":[{"index":1,"function":{"arguments":"arg2"}}]}}]}',
			"data: [DONE]",
		];
		const result = simulateStreaming(lines);
		expect(result.toolCalls.size).toBe(2);
		expect(result.toolCalls.get("0")!.name).toBe("tool1");
		expect(result.toolCalls.get("1")!.name).toBe("tool2");
	});

	it("ignores non-data lines", () => {
		const lines = [
			"",
			": heartbeat",
			'data: {"choices":[{"delta":{"content":"Hi"}}]}',
			"",
			"data: [DONE]",
		];
		const result = simulateStreaming(lines);
		expect(result.content).toBe("Hi");
	});

	it("returns null for [DONE]", () => {
		expect(parseSSEChunk("data: [DONE]")).toBeNull();
	});

	it("returns null for non-data lines", () => {
		expect(parseSSEChunk("event: message")).toBeNull();
		expect(parseSSEChunk("")).toBeNull();
	});
});
