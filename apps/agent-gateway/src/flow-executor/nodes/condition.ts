import type { FlowContext, NodeResult } from "../types";

/**
 * Condition node — evaluates a condition against collected fields
 * and routes to the appropriate branch (true/false edge).
 */
export async function handleCondition(
	ctx: FlowContext,
	node: {
		data: {
			field: string;
			operator: "equals" | "contains" | "gt" | "lt" | "exists";
			value: string;
		};
	},
): Promise<NodeResult> {
	const { field, operator, value } = node.data;
	const fieldValue = ctx.run.fields[field] ?? "";

	const result = evaluateCondition(fieldValue, operator, value);

	return {
		action: { type: "branch", edgeLabel: result ? "true" : "false" },
		messages: [],
	};
}

function evaluateCondition(
	fieldValue: string,
	operator: string,
	expectedValue: string,
): boolean {
	switch (operator) {
		case "equals":
			return fieldValue.toLowerCase() === expectedValue.toLowerCase();
		case "contains":
			return fieldValue.toLowerCase().includes(expectedValue.toLowerCase());
		case "gt":
			return Number.parseFloat(fieldValue) > Number.parseFloat(expectedValue);
		case "lt":
			return Number.parseFloat(fieldValue) < Number.parseFloat(expectedValue);
		case "exists":
			return fieldValue.length > 0;
		default:
			return false;
	}
}
