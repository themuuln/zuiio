import type { FlowContext, NodeResult, OutboundMessage } from "../types";

/**
 * Send Message node — sends a text message (with optional buttons) to the user.
 * The simplest node: just deliver content and advance.
 */
export async function handleSendMessage(
	ctx: FlowContext,
	node: { data: { message: string; buttons?: Array<{ id: string; text: string; actionType?: string; actionValue?: string }> } },
): Promise<NodeResult> {
	const { message, buttons } = node.data;

	// Interpolate field values: {{fieldName}} → field value
	const interpolated = interpolateFields(message, ctx.run.fields);

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
		action: { type: "next" },
		messages,
	};
}

/** Replace {{field}} placeholders with actual field values. */
function interpolateFields(
	text: string,
	fields: Record<string, string>,
): string {
	return text.replace(/\{\{(\w+)\}\}/g, (_, key) => fields[key] ?? `{{${key}}}`);
}
