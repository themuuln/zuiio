import type {
	ConversationRun,
	FlowContext,
	FlowEdge,
	FlowNode,
	FlowVersion,
	NodeResult,
	OutboundMessage,
	WaitState,
} from "./types";
import { executeNode } from "./nodes";

const MAX_STEPS = 100; // Safety limit to prevent infinite loops

/**
 * Core flow interpreter — walks the graph deterministically.
 *
 * For each node:
 *   1. Execute the node handler
 *   2. Send any messages via the channel
 *   3. Apply field updates and assignments
 *   4. Fire side effects
 *   5. Determine next action (next node, branch, wait, end)
 *
 * This function is pure with respect to the flow graph — all state
 * mutations go through the run object and are persisted by the caller.
 */
export async function interpretFlow(
	ctx: FlowContext,
): Promise<{ run: ConversationRun; waitState?: WaitState }> {
	const { flow, run } = ctx;
	let currentNodeId = run.currentNodeId;
	let steps = 0;

	while (currentNodeId && steps < MAX_STEPS) {
		steps++;

		const node = flow.nodes.find((n) => n.id === currentNodeId);
		if (!node) {
			console.error(`[flow-executor] Node ${currentNodeId} not found in flow ${flow.id}`);
			run.status = "failed";
			break;
		}

		// Skip start node — it's just an entry point
		if (node.type === "start") {
			currentNodeId = findNextNode(flow, currentNodeId) ?? "";
			continue;
		}

		// Execute the node
		const result = await executeNode(ctx, node);

		// Send messages
		for (const msg of result.messages) {
			await sendMessage(ctx, msg);
		}

		// Apply field updates
		if (result.fieldUpdates) {
			Object.assign(run.fields, result.fieldUpdates);
		}

		// Apply A/B assignment
		if (result.assignment) {
			run.assignments[result.assignment.experimentId] = result.assignment.variantId;
		}

		// Execute side effects (fire-and-forget)
		for (const effect of result.sideEffects ?? []) {
			executeSideEffect(effect).catch((err) =>
				console.error("[flow-executor] Side effect failed:", err),
			);
		}

		// Determine next step
		switch (result.action.type) {
			case "next":
			currentNodeId = findNextNode(flow, currentNodeId) ?? "";
				break;

			case "branch":
			currentNodeId = findBranchNode(flow, currentNodeId, result.action.edgeLabel) ?? "";
				if (!currentNodeId) {
					// No matching branch — try fallback to default next
				currentNodeId = findNextNode(flow, currentNodeId) ?? "";
				}
				break;

			case "wait":
				run.status = result.action.waitType === "delay" ? "delayed" : "waiting";
				run.currentNodeId = currentNodeId;
				run.updatedAt = new Date().toISOString();

				const waitState: WaitState = {
					id: crypto.randomUUID(),
					runId: run.id,
					waitType: result.action.waitType,
					scheduledAt: result.action.scheduledAt,
					createdAt: new Date().toISOString(),
				};

				return { run, waitState };

			case "end":
				run.status = "completed";
				run.currentNodeId = currentNodeId;
				run.updatedAt = new Date().toISOString();
				return { run };

			case "error":
				console.error(`[flow-executor] Node ${node.id} error: ${result.action.reason}`);
				run.status = "failed";
				run.currentNodeId = currentNodeId;
				run.updatedAt = new Date().toISOString();
				return { run };
		}
	}

	// Safety limit reached or no more nodes
	if (steps >= MAX_STEPS) {
		console.error(`[flow-executor] Max steps (${MAX_STEPS}) reached for run ${run.id}`);
		run.status = "failed";
	}

	if (!currentNodeId) {
		run.status = "completed";
	}

	run.currentNodeId = currentNodeId ?? run.currentNodeId;
	run.updatedAt = new Date().toISOString();
	return { run };
}

/**
 * Resume a flow from a wait state (after delay or user response).
 */
export async function resumeFlow(
	ctx: FlowContext,
): Promise<{ run: ConversationRun; waitState?: WaitState }> {
	return interpretFlow(ctx);
}

// ─── Graph Navigation ─────────────────────────────────────────────────────────

/** Find the next node by following the default edge. */
function findNextNode(flow: FlowVersion, currentNodeId: string): string | null {
	const edge = flow.edges.find(
		(e) => e.source === currentNodeId && !e.label,
	);
	return edge?.target ?? null;
}

/** Find the branch node by following an edge with a specific label. */
function findBranchNode(
	flow: FlowVersion,
	currentNodeId: string,
	label: string,
): string | null {
	const edge = flow.edges.find(
		(e) => e.source === currentNodeId && e.label === label,
	);
	return edge?.target ?? null;
}

// ─── Message Sending ──────────────────────────────────────────────────────────

async function sendMessage(
	ctx: FlowContext,
	msg: OutboundMessage,
): Promise<void> {
	if (!msg.text && !msg.cards?.length) return;

	try {
		await ctx.channel.sendMessage(ctx.run.channelChatId, msg.text, {
			quickReplies: msg.buttons,
		});
	} catch (error) {
		console.error("[flow-executor] Failed to send message:", error);
	}
}

// ─── Side Effects ─────────────────────────────────────────────────────────────

async function executeSideEffect(
	effect: { type: string; [key: string]: unknown },
): Promise<void> {
	switch (effect.type) {
		case "webhook":
			// Fire webhook (fire-and-forget)
			if (typeof effect.url === "string") {
				await fetch(effect.url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(effect.payload),
				});
			}
			break;
		case "tag":
		case "notify":
		case "setField":
			// These are handled by the persistence layer
			break;
	}
}
