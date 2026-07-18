import type { FlowContext, NodeResult, SideEffect } from "../types";

/**
 * Action node — triggers side effects (tags, webhooks, notifications).
 * No message sent to user; just fires side effects and advances.
 */
export async function handleAction(
	_ctx: FlowContext,
	node: {
		data: {
			actionType: "tag" | "subscribe" | "unsubscribe" | "notify" | "webhook";
			value: string;
		};
	},
): Promise<NodeResult> {
	const { actionType, value } = node.data;
	const sideEffects: SideEffect[] = [];

	switch (actionType) {
		case "tag":
			sideEffects.push({ type: "tag", tag: value });
			break;
		case "notify":
			sideEffects.push({ type: "notify", message: value });
			break;
		case "webhook":
			sideEffects.push({
				type: "webhook",
				url: value,
				payload: {
					runId: _ctx.run.id,
					orgId: _ctx.run.orgId,
					fields: _ctx.run.fields,
				},
			});
			break;
		case "subscribe":
		case "unsubscribe":
			// Handled by the persistence layer (contact management)
			sideEffects.push({
				type: "setField",
				field: `_action_${actionType}`,
				value,
			});
			break;
	}

	return {
		action: { type: "next" },
		messages: [],
		sideEffects,
	};
}
