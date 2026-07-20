import type { FlowContext, NodeResult, OutboundMessage } from "../types";

/**
 * Ask Question node — sends a question and waits for user response.
 * Stores the response in a field (saveToField).
 *
 * Flow pauses here until the user replies.
 */
export async function handleAskQuestion(
	ctx: FlowContext,
	node: {
		data: {
			question: string;
			saveToField: string;
			buttons?: Array<{ id: string; text: string; actionValue?: string }>;
		};
	},
): Promise<NodeResult> {
	const { question, saveToField, buttons } = node.data;

	// If we already have a response for this field, skip the question
	// (e.g., the user already provided this info via button callback)
	if (ctx.run.fields[saveToField]) {
		return { action: { type: "next" }, messages: [] };
	}

	const interpolated = question.replace(
		/\{\{(\w+)\}\}/g,
		(_, key) => ctx.run.fields[key] ?? `{{${key}}}`,
	);

	const messages: OutboundMessage[] = [
		{
			text: interpolated,
			buttons: buttons?.map((b) => ({
				text: b.text,
				callbackData: `flow:${ctx.run.id}:${b.actionValue ?? b.id}`,
			})),
		},
	];

	return {
		action: {
			type: "wait",
			waitType: "question_response",
		},
		messages,
		fieldUpdates: { _awaitingField: saveToField },
	};
}

/**
 * Process a user's response to an Ask Question node.
 * Called when the flow is in waiting state and a message arrives.
 */
export function processQuestionResponse(
	_runFields: Record<string, string>,
	userMessage: string,
	saveToField: string,
): { fieldUpdates: Record<string, string>; completed: boolean } {
	return {
		fieldUpdates: { [saveToField]: userMessage, _awaitingField: "" },
		completed: true,
	};
}
