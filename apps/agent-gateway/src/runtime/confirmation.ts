import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import type {
	ProductAdapter,
	ProductToolExecution,
	ToolContext,
	ToolDescriptor,
} from "@zuiio/gateway-core";
import { validateToolArguments } from "@zuiio/gateway-core";
import { sha256Hex } from "@/lib/service-signature";

const ACTION_TTL_MS = 5 * 60 * 1_000;

export interface PendingActionRecord {
	id: string;
	conversationId: string;
	toolName: string;
	arguments: Record<string, unknown>;
	idempotencyKey: string;
	status:
		| "pending"
		| "executing"
		| "completed"
		| "rejected"
		| "expired"
		| "failed";
	expiresAt: string;
}

export interface PendingActionRepository {
	stage(input: {
		conversationId: string;
		toolName: string;
		arguments: Record<string, unknown>;
		idempotencyKey: string;
		nonceDigest: string;
		expiresAt: string;
		confirmationPayload: Record<string, unknown>;
		traceId: string;
	}): Promise<PendingActionRecord>;
	claim(input: {
		conversationId: string;
		nonceDigest: string;
	}): Promise<PendingActionRecord | null>;
	reject(input: {
		conversationId: string;
		nonceDigest: string;
		payload: Record<string, unknown>;
		traceId: string;
		status?: "rejected" | "expired" | "failed";
	}): Promise<boolean>;
	complete(input: {
		actionId: string;
		conversationId: string;
		status: "completed" | "failed";
		result: unknown;
		errorCode: string | null;
		payload: Record<string, unknown>;
		traceId: string;
	}): Promise<void>;
}

export interface StagedPendingAction {
	actionId: string;
	nonce: string;
}

export function confirmButtons(
	nonce: string,
): Array<Array<{ text: string; callbackData: string }>> {
	return [
		[
			{ text: "✅ Тийм", callbackData: `confirm:${nonce}` },
			{ text: "❌ Үгүй", callbackData: `reject:${nonce}` },
		],
	];
}

export async function stagePendingAction(input: {
	repository: PendingActionRepository;
	context: ToolContext;
	tool: ToolDescriptor;
	arguments: Record<string, unknown>;
	summary: string;
}): Promise<StagedPendingAction> {
	if (input.tool.effect !== "write" || input.tool.approval !== "required") {
		throw new Error("PENDING_ACTION_DESCRIPTOR_INVALID");
	}
	const validation = validateToolArguments(
		input.tool.parameters,
		input.arguments,
	);
	if (!validation.ok) throw new Error("PENDING_ACTION_ARGUMENTS_INVALID");
	const nonce = randomBytes(32).toString("base64url");
	const action = await input.repository.stage({
		conversationId: input.context.conversationId,
		toolName: input.tool.name,
		arguments: input.arguments,
		idempotencyKey: randomUUID(),
		nonceDigest: sha256Hex(nonce),
		expiresAt: new Date(Date.now() + ACTION_TTL_MS).toISOString(),
		confirmationPayload: {
			kind: "quick_replies",
			text: `⚡ Баталгаажуулах үйлдэл: ${input.summary}`,
			quickReplies: confirmButtons(nonce).flat(),
		},
		traceId: input.context.traceId,
	});
	return { actionId: action.id, nonce };
}

interface ParsedPostback {
	action: "confirm" | "reject";
	nonce: string;
}

function parsePostback(payload: string): ParsedPostback | null {
	const [action, nonce, extra] = payload.split(":");
	if (
		extra !== undefined ||
		(action !== "confirm" && action !== "reject") ||
		!nonce
	) {
		return null;
	}
	return { action, nonce };
}

export async function handlePendingActionPostback(input: {
	payload: string;
	context: ToolContext;
	repository: PendingActionRepository;
	productAdapter: ProductAdapter;
}): Promise<"completed" | "rejected" | "invalid" | "failed"> {
	const postback = parsePostback(input.payload);
	if (!postback) return "invalid";
	if (postback.action === "reject") {
		const rejected = await input.repository.reject({
			conversationId: input.context.conversationId,
			nonceDigest: sha256Hex(postback.nonce),
			payload: { kind: "text", text: "❌ Үйлдлийг цуцаллаа." },
			traceId: input.context.traceId,
		});
		return rejected ? "rejected" : "invalid";
	}
	const action = await input.repository.claim({
		conversationId: input.context.conversationId,
		nonceDigest: sha256Hex(postback.nonce),
	});
	if (!action) return "invalid";
	try {
		const manifest = await input.productAdapter.getManifest(input.context);
		const descriptor = manifest.tools.find(
			(tool) => tool.name === action.toolName,
		);
		if (
			!descriptor ||
			descriptor.effect !== "write" ||
			descriptor.approval !== "required"
		) {
			throw new Error("PENDING_ACTION_TOOL_NOT_ALLOWED");
		}
		const validation = validateToolArguments(
			descriptor.parameters,
			action.arguments,
		);
		if (!validation.ok) throw new Error("PENDING_ACTION_ARGUMENTS_INVALID");
		const execution: ProductToolExecution = {
			context: input.context,
			toolName: action.toolName,
			args: action.arguments,
			idempotencyKey: action.idempotencyKey,
		};
		const result = await input.productAdapter.executeTool(execution);
		await input.repository.complete({
			actionId: action.id,
			conversationId: input.context.conversationId,
			status: "completed",
			result,
			errorCode: null,
			payload: {
				kind: "text",
				text: "✅ Үйлдэл амжилттай баталгаажлаа.",
			},
			traceId: input.context.traceId,
		});
		return "completed";
	} catch {
		await input.repository.complete({
			actionId: action.id,
			conversationId: input.context.conversationId,
			status: "failed",
			result: null,
			errorCode: "PENDING_ACTION_EXECUTION_FAILED",
			payload: {
				kind: "text",
				text: "Үйлдлийг гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.",
			},
			traceId: input.context.traceId,
		});
		return "failed";
	}
}

/**
 * Legacy-channel postback resolver (`confirm:<nonce>` / `reject:<nonce>`).
 * The tool registry stays with the calling webhook; this module owns the
 * durable claim/complete lifecycle only.
 */
export async function resolveDurablePostback(input: {
	payload: string;
	conversationId: string;
	traceId: string;
	repository: PendingActionRepository;
	executeTool: (
		toolName: string,
		args: Record<string, unknown>,
		idempotencyKey: string,
	) => Promise<unknown>;
}): Promise<{ handled: boolean; reply: string }> {
	const [action, nonce, extra] = input.payload.split(":");
	if (extra !== undefined || !nonce) return { handled: false, reply: "" };
	if (action === "reject") {
		const rejected = await input.repository.reject({
			conversationId: input.conversationId,
			nonceDigest: sha256Hex(nonce),
			payload: { kind: "text", text: "❌ Үйлдлийг цуцаллаа." },
			traceId: input.traceId,
		});
		return { handled: rejected, reply: rejected ? "❌ Цуцаллаа." : "" };
	}
	if (action !== "confirm") return { handled: false, reply: "" };
	const claimed = await input.repository.claim({
		conversationId: input.conversationId,
		nonceDigest: sha256Hex(nonce),
	});
	if (!claimed) {
		return {
			handled: true,
			reply: "Баталгаажуулах хүсэлт олдсонгүй эсвэл хугацаа нь дууссан.",
		};
	}
	try {
		const result = await input.executeTool(
			claimed.toolName,
			claimed.arguments,
			claimed.idempotencyKey,
		);
		await input.repository.complete({
			actionId: claimed.id,
			conversationId: input.conversationId,
			status: "completed",
			result,
			errorCode: null,
			payload: { kind: "text", text: "✅ Үйлдэл амжилттай баталгаажлаа." },
			traceId: input.traceId,
		});
		return { handled: true, reply: "✅ Амжилттай." };
	} catch {
		await input.repository.complete({
			actionId: claimed.id,
			conversationId: input.conversationId,
			status: "failed",
			result: null,
			errorCode: "PENDING_ACTION_EXECUTION_FAILED",
			payload: {
				kind: "text",
				text: "Үйлдлийг гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.",
			},
			traceId: input.traceId,
		});
		return { handled: true, reply: "Үйлдлийг гүйцэтгэхэд алдаа гарлаа." };
	}
}
