import type { FlowContext, NodeResult, OutboundMessage } from "../types";

/**
 * A/B Test node — assigns a random variant based on weights,
 * then sends the variant's message.
 *
 * Assignment is sticky per contact: once a variant is assigned,
 * the same contact always sees the same variant.
 * Uses hash(contactId, experimentId) for deterministic assignment.
 */
export async function handleAbTest(
	ctx: FlowContext,
	node: {
		id: string;
		data: {
			variants: Array<{
				id: string;
				weight: number;
				message: string;
			}>;
		};
	},
): Promise<NodeResult> {
	const { variants } = node.data;

	if (variants.length === 0) {
		return {
			action: { type: "next" },
			messages: [{ text: "" }],
		};
	}

	// Check if this contact already has an assignment
	const experimentId = node.id;
	const existingAssignment = ctx.run.assignments[experimentId];

	let selectedVariant;
	if (existingAssignment) {
		selectedVariant = variants.find((v) => v.id === existingAssignment);
	}

	if (!selectedVariant) {
		// Deterministic assignment: hash(contactId + experimentId) → weight bucket
		selectedVariant = assignVariant(
			variants,
			ctx.run.channelUserId,
			experimentId,
		);
	}

	const messages: OutboundMessage[] = [
		{ text: selectedVariant.message },
	];

	return {
		action: { type: "next" },
		messages,
		assignment: {
			experimentId,
			variantId: selectedVariant.id,
		},
	};
}

/**
 * Deterministic variant assignment using a simple hash.
 * Same (contactId, experimentId) always produces the same variant.
 */
function assignVariant(
	variants: Array<{ id: string; weight: number; message: string }>,
	contactId: string,
	experimentId: string,
): { id: string; weight: number; message: string } {
	const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
	const hash = simpleHash(`${contactId}:${experimentId}`);
	const bucket = hash % totalWeight;

	let cumulative = 0;
	for (const variant of variants) {
		cumulative += variant.weight;
		if (bucket < cumulative) {
			return variant;
		}
	}

	// Fallback to first variant
	return variants[0]!;
}

/** Simple deterministic hash (djb2). Returns a non-negative integer. */
function simpleHash(str: string): number {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}
