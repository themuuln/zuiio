import type { FlowContext, NodeResult } from "../types";

/**
 * Delay node — pauses the flow for a specified duration.
 * The run status becomes "delayed" and a WaitState is created
 * with a scheduled resume time.
 */
export async function handleDelay(
	_ctx: FlowContext,
	node: {
		data: {
			duration: number;
			unit: "seconds" | "minutes" | "hours";
		};
	},
): Promise<NodeResult> {
const { duration, unit } = node.data;
const durationMs = duration * (unit === "seconds" ? 1_000 : unit === "hours" ? 3_600_000 : 60_000);
	const scheduledAt = new Date(Date.now() + durationMs).toISOString();

	return {
		action: {
			type: "wait",
			waitType: "delay",
			scheduledAt,
		},
		messages: [],
	};
}


/**
 * Calculate delay in milliseconds from node data.
 * Exported for the cron scheduler.
 */
export function calculateDelayMs(
	duration: number,
	unit: "seconds" | "minutes" | "hours",
): number {
	return duration * (unit === "seconds" ? 1_000 : unit === "hours" ? 3_600_000 : 60_000);
}
