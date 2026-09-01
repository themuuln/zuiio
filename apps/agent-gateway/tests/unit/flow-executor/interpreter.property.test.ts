import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";

import { interpretFlow } from "@/flow-executor/interpreter";
import type {
	ConversationRun,
	FlowContext,
	FlowNode,
	FlowVersion,
} from "@/flow-executor/types";

vi.mock("@/flow-executor/nodes", () => ({
	executeNode: (...args: unknown[]) => mockExecuteNode(...args),
}));

const mockExecuteNode = vi.fn();

function makeNode(id: string): FlowNode {
	return { id, type: "sendMessage", data: {} as never };
}

function makeLinearFlow(length: number): FlowVersion {
	const nodeIds = ["start-1", ...Array.from({ length }, (_, i) => `msg-${i}`)];
	return {
		id: "flow-1",
		orgId: "org-1",
		productType: "zer",
		nodes: [
			{ id: "start-1", type: "start", data: {} as never },
			...nodeIds.slice(1).map((id) => makeNode(id)),
		],
		edges: nodeIds.slice(0, -1).map((source, index) => ({
			id: `edge-${index}`,
			source,
			target: nodeIds[index + 1],
		})),
	};
}

function makeContext(flow: FlowVersion): FlowContext {
	const now = new Date().toISOString();
	const run: ConversationRun = {
		id: "run-1",
		flowVersionId: flow.id,
		orgId: flow.orgId,
		channel: "telegram",
		channelChatId: "chat-1",
		channelUserId: "user-1",
		status: "active",
		currentNodeId: "start-1",
		fields: {},
		assignments: {},
		startedAt: now,
		updatedAt: now,
		expiresAt: now,
	};
	return {
		flow,
		run,
		userMessage: "hello",
		channel: { sendMessage: vi.fn(async () => {}) },
		supabase: {} as never,
	};
}

describe("interpretFlow properties", () => {
	it("completes every bounded linear flow without skipping a node", async () => {
		await fc.assert(
			fc.asyncProperty(fc.integer({ min: 1, max: 30 }), async (length) => {
				const flow = makeLinearFlow(length);
				const context = makeContext(flow);
				const nodeIds = flow.nodes.slice(1).map((node) => node.id);
				const executed: string[] = [];

				mockExecuteNode.mockImplementation(
					(_ctx: FlowContext, node: FlowNode) => {
						executed.push(node.id);
						return {
							action: {
								type: node.id === nodeIds.at(-1) ? "end" : "next",
							},
							messages: [{ text: node.id }],
						};
					},
				);

				const { run } = await interpretFlow(context);
				expect(run.status).toBe("completed");
				expect(executed).toEqual(nodeIds);
				expect(context.channel.sendMessage).toHaveBeenCalledTimes(length);
			}),
			{ numRuns: 50 },
		);
	});
});
