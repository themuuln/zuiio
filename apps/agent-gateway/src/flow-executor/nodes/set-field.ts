import type { FlowContext, NodeResult } from "../types";

/**
 * Set Field node — sets a field value (static or interpolated from other fields).
 * No message sent to user; just updates internal state.
 */
export async function handleSetField(
	_ctx: FlowContext,
	node: {
		data: {
			field: string;
			value: string;
		};
	},
): Promise<NodeResult> {
	const { field, value } = node.data;

	// Interpolate: "{{otherField}}" → value of otherField
	const interpolated = value.replace(
		/\{\{(\w+)\}\}/g,
		(_, key) => _ctx.run.fields[key] ?? `{{${key}}}`,
	);

	return {
		action: { type: "next" },
		messages: [],
		fieldUpdates: { [field]: interpolated },
	};
}
