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

	// If this is a button callback, persist the selected option as the answer
	// so downstream nodes (conditions, setField) can read it from the run fields.
	if (ctx.callbackData) {
		const callbackValue = buttonValueFromCallback(ctx.callbackData);
		return {
			action: { type: "next" },
			messages: [],
			fieldUpdates: { [saveToField]: callbackValue, _awaitingField: "" },
		};
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
 * Extract the button value from a flow callback payload.
 * Payload shape: "flow:{runId}:{value}" — Telegram strips the "flow:" prefix
 * and runId before calling handleFlowCallback, so the value may arrive bare.
 */
export function buttonValueFromCallback(callbackData: string): string {
	return callbackData.split(":").pop() ?? callbackData;
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
