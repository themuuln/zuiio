/**
 * Flow interpreter tests: graph walking, branch fallback (P1 fix),
 * wait/end/error actions, field updates, assignments, safety limits.
 * executeNode is mocked per node id so the interpreter logic is exercised
 * in isolation.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { interpretFlow, resumeFlow } from "@/flow-executor/interpreter";
import type {
	ConversationRun,
	FlowContext,
	FlowNode,
} from "@/flow-executor/types";

vi.mock("@/flow-executor/nodes", () => ({
	executeNode: (...a: unknown[]) => mockExecuteNode(...a),
}));

const mockExecuteNode = vi.fn();

function node(id: string, type: FlowNode["type"]): FlowNode {
	return { id, type, data: {} as never };
}

function makeFlow(
	nodes: FlowNode[],
	edges: Array<{ source: string; target: string; label?: string }>,
) {
	return {
		id: "flow-1",
		orgId: "org-1",
		productType: "zer",
		nodes,
		edges: edges.map((e, i) => ({ id: `e${i}`, ...e })),
	};
}

function makeContext(overrides: Partial<FlowContext> = {}): FlowContext {
	const run: ConversationRun = {
		id: "run-1",
		flowVersionId: "flow-1",
		orgId: "org-1",
		channel: "telegram",
		channelChatId: "123",
		channelUserId: "456",
		status: "active",
		currentNodeId: "start-1",
		fields: {},
		assignments: {},
		startedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		expiresAt: new Date().toISOString(),
	};
	return {
		flow: makeFlow([], []),
		run,
		userMessage: "hi",
		channel: { sendMessage: vi.fn(async () => {}) },
		supabase: {} as never,
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	mockExecuteNode.mockImplementation((_ctx: FlowContext, _n: FlowNode) => ({
		action: { type: "next" },
		messages: [],
	}));
});

describe("interpretFlow", () => {
	it("skips the start node and follows the default edge", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[node("start-1", "start"), node("msg-1", "sendMessage")],
				[{ source: "start-1", target: "msg-1" }],
			),
		});
		mockExecuteNode.mockImplementation((_c, n) => {
			expect(n.id).toBe("msg-1"); // start never dispatched
			return { action: { type: "end" }, messages: [] };
		});
		const { run } = await interpretFlow(ctx);
		expect(run.status).toBe("completed");
		expect(mockExecuteNode).toHaveBeenCalledTimes(1);
	});

	it("walks a chain and completes", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[
					node("start-1", "start"),
					node("msg-1", "sendMessage"),
					node("msg-2", "sendMessage"),
				],
				[
					{ source: "start-1", target: "msg-1" },
					{ source: "msg-1", target: "msg-2" },
				],
			),
		});
		mockExecuteNode.mockImplementation((_c, n) => {
			if (n.id === "msg-1") {
				return {
					action: { type: "next" },
					messages: [{ text: "first" }],
					fieldUpdates: { name: "Баяр" },
				};
			}
			return { action: { type: "end" }, messages: [{ text: "last" }] };
		});
		const { run } = await interpretFlow(ctx);
		expect(run.status).toBe("completed");
		expect(run.fields).toEqual({ name: "Баяр" });
		expect(ctx.channel.sendMessage).toHaveBeenCalledTimes(2);
		expect(ctx.channel.sendMessage).toHaveBeenCalledWith("123", "first", {
			quickReplies: undefined,
		});
	});

	it("follows the labeled branch edge when present", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[
					node("start-1", "start"),
					node("cond-1", "condition"),
					node("yes-1", "sendMessage"),
					node("no-1", "sendMessage"),
				],
				[
					{ source: "start-1", target: "cond-1" },
					{ source: "cond-1", target: "yes-1", label: "true" },
					{ source: "cond-1", target: "no-1", label: "false" },
				],
			),
		});
		mockExecuteNode.mockImplementation((_c, n) => {
			if (n.id === "cond-1") {
				return { action: { type: "branch", edgeLabel: "true" }, messages: [] };
			}
			if (n.id === "yes-1") {
				return { action: { type: "end" }, messages: [{ text: "Тийм" }] };
			}
			return { action: { type: "end" }, messages: [] };
		});
		const { run } = await interpretFlow(ctx);
		expect(run.status).toBe("completed");
		const sent = (
			ctx.channel.sendMessage as ReturnType<typeof vi.fn>
		).mock.calls.map((c: unknown[]) => c[1]);
		expect(sent).toContain("Тийм");
		// "no-1" was never executed
		expect(
			mockExecuteNode.mock.calls.map((c: unknown[]) => (c[1] as FlowNode).id),
		).not.toContain("no-1");
	});

	it("falls back to the default edge when the branch label is missing", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[
					node("start-1", "start"),
					node("cond-1", "condition"),
					node("next-1", "sendMessage"),
				],
				[
					{ source: "start-1", target: "cond-1" },
					{ source: "cond-1", target: "next-1" }, // default edge, no label
				],
			),
		});
		mockExecuteNode.mockImplementation((_c, n) => {
			if (n.id === "cond-1") {
				return { action: { type: "branch", edgeLabel: "true" }, messages: [] };
			}
			return { action: { type: "end" }, messages: [{ text: "Дууслаа" }] };
		});
		const { run } = await interpretFlow(ctx);
		expect(run.status).toBe("completed");
		expect(
			mockExecuteNode.mock.calls.map((c: unknown[]) => (c[1] as FlowNode).id),
		).toContain("next-1");
	});

	it("ends gracefully when no branch and no default edge exist", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[node("start-1", "start"), node("cond-1", "condition")],
				[{ source: "start-1", target: "cond-1" }],
			),
		});
		mockExecuteNode.mockImplementation((_c, n) => {
			if (n.id === "cond-1") {
				return {
					action: { type: "branch", edgeLabel: "missing" },
					messages: [],
				};
			}
			return { action: { type: "next" }, messages: [] };
		});
		const { run } = await interpretFlow(ctx);
		expect(run.status).toBe("completed");
	});

	it("returns a wait state for question waits", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[node("start-1", "start"), node("ask-1", "askQuestion")],
				[{ source: "start-1", target: "ask-1" }],
			),
		});
		mockExecuteNode.mockImplementation((_c, n) =>
			n.id === "ask-1"
				? {
						action: { type: "wait", waitType: "question_response" },
						messages: [{ text: "Нэрээ бичнэ үү" }],
					}
				: { action: { type: "next" }, messages: [] },
		);
		const { run, waitState } = await interpretFlow(ctx);
		expect(run.status).toBe("waiting");
		expect(run.currentNodeId).toBe("ask-1");
		expect(waitState).toBeDefined();
		expect(waitState?.waitType).toBe("question_response");
		expect(waitState?.runId).toBe("run-1");
	});

	it("marks runs delayed for delay waits with a scheduled time", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[node("start-1", "start"), node("delay-1", "delay")],
				[{ source: "start-1", target: "delay-1" }],
			),
		});
		const scheduledAt = new Date(Date.now() + 60_000).toISOString();
		mockExecuteNode.mockImplementation((_c, n) =>
			n.id === "delay-1"
				? {
						action: { type: "wait", waitType: "delay", scheduledAt },
						messages: [],
					}
				: { action: { type: "next" }, messages: [] },
		);
		const { run, waitState } = await interpretFlow(ctx);
		expect(run.status).toBe("delayed");
		expect(waitState?.scheduledAt).toBe(scheduledAt);
	});

	it("marks the run failed on node errors", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[node("start-1", "start"), node("bad-1", "action")],
				[{ source: "start-1", target: "bad-1" }],
			),
		});
		mockExecuteNode.mockImplementation((_c, n) =>
			n.id === "bad-1"
				? { action: { type: "error", reason: "webhook failed" }, messages: [] }
				: { action: { type: "next" }, messages: [] },
		);
		const { run } = await interpretFlow(ctx);
		expect(run.status).toBe("failed");
		expect(run.currentNodeId).toBe("bad-1");
	});

	it("fails when the current node is missing from the graph", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[node("start-1", "start")],
				[{ source: "start-1", target: "ghost-1" }],
			),
		});
		const { run } = await interpretFlow(ctx);
		expect(run.status).toBe("failed");
		expect(mockExecuteNode).not.toHaveBeenCalled();
	});

	it("persists A/B assignments", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[node("start-1", "start"), node("ab-1", "abTest")],
				[{ source: "start-1", target: "ab-1" }],
			),
		});
		mockExecuteNode.mockImplementation((_c, n) =>
			n.id === "ab-1"
				? {
						action: { type: "next" },
						messages: [],
						assignment: { experimentId: "exp-1", variantId: "var-b" },
					}
				: { action: { type: "next" }, messages: [] },
		);
		const { run } = await interpretFlow(ctx);
		expect(run.assignments).toEqual({ "exp-1": "var-b" });
	});

	it("stops after MAX_STEPS on cyclic graphs", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[node("start-1", "start"), node("loop-1", "sendMessage")],
				[
					{ source: "start-1", target: "loop-1" },
					{ source: "loop-1", target: "loop-1" }, // self-loop
				],
			),
		});
		const { run } = await interpretFlow(ctx);
		expect(run.status).toBe("failed");
		// 1 start-skip step + 99 executed loop iterations = MAX_STEPS(100)
		expect(mockExecuteNode).toHaveBeenCalledTimes(99);
	});

	it("fires webhook side effects fire-and-forget", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[node("start-1", "start"), node("hook-1", "action")],
				[{ source: "start-1", target: "hook-1" }],
			),
		});
		const mockFetch = vi.fn(async () => ({ ok: true }));
		vi.stubGlobal("fetch", mockFetch);
		mockExecuteNode.mockImplementation((_c, n) =>
			n.id === "hook-1"
				? {
						action: { type: "end" },
						messages: [],
						sideEffects: [
							{
								type: "webhook",
								url: "https://example.com/hook",
								payload: { a: 1 },
							},
						],
					}
				: { action: { type: "next" }, messages: [] },
		);
		const { run } = await interpretFlow(ctx);
		expect(run.status).toBe("completed");
		await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
		const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("https://example.com/hook");
		expect((init.body as string).includes('"a":1')).toBe(true);
		vi.unstubAllGlobals();
	});

	it("resumeFlow delegates to interpretFlow", async () => {
		const ctx = makeContext({
			flow: makeFlow(
				[node("start-1", "start"), node("msg-1", "sendMessage")],
				[{ source: "start-1", target: "msg-1" }],
			),
		});
		mockExecuteNode.mockImplementation((_c, n) => {
			if (n.id === "msg-1") return { action: { type: "end" }, messages: [] };
			return { action: { type: "next" }, messages: [] };
		});
		const { run } = await resumeFlow(ctx);
		expect(run.status).toBe("completed");
	});
});
