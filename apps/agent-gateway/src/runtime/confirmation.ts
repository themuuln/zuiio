import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import { createServiceClient } from "@/lib/supabase";
import type { ToolContext } from "@/providers/types";

export interface StagedAction {
	nonce: string;
	toolName: string;
	args: Record<string, unknown>;
	channel: string;
	channelChatId: string;
	channelUserId: string;
	summary: string;
	pageId?: string;
	pageAccessToken?: string;
	/** Original tool execute — only present for legacy in-memory actions. */
	execute?: (args: Record<string, unknown>) => Promise<unknown>;
	/** Durable actions are replayed by their tool name after webhook failover. */
	persistent?: boolean;
	organizationId?: string;
	userId?: string;
	productType?: string;
}

const stagedActions = new Map<string, StagedAction>();
const nonceTimeoutMs = 5 * 60 * 1000;

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

/** Legacy in-memory staging for existing internal tools. */
export function stageAction(
	toolName: string,
	args: Record<string, unknown>,
	channel: string,
	channelChatId: string,
	channelUserId: string,
	summary: string,
	pageId?: string,
	pageAccessToken?: string,
	execute?: (args: Record<string, unknown>) => Promise<unknown>,
): {
	nonce: string;
	buttons: Array<Array<{ text: string; callbackData: string }>>;
} {
	const nonce = crypto.randomUUID();
	stagedActions.set(nonce, {
		nonce,
		toolName,
		args,
		channel,
		channelChatId,
		channelUserId,
		summary,
		pageId,
		pageAccessToken,
		execute,
	});
	setTimeout(() => stagedActions.delete(nonce), nonceTimeoutMs);
	return { nonce, buttons: confirmButtons(nonce) };
}

/** Durable staging for customer checkout actions. */
export async function stagePersistentAction(
	toolName: string,
	args: Record<string, unknown>,
	summary: string,
	context: ToolContext,
): Promise<{
	nonce: string;
	buttons: Array<Array<{ text: string; callbackData: string }>>;
}> {
	const nonce = crypto.randomUUID();
	const service: SupabaseClient = createServiceClient();
	const { error } = await service.from("agent_pending_actions").insert({
		nonce,
		organization_id: context.orgId,
		user_id: context.userId,
		product_type: context.productType ?? "zer",
		tool_name: toolName,
		args: JSON.parse(JSON.stringify(args)),
		summary,
		channel: context.channel,
		channel_chat_id: context.channelChatId,
		channel_user_id: context.channelUserId,
		expires_at: new Date(Date.now() + nonceTimeoutMs).toISOString(),
	});
	if (error) {
		capture(error, { context: "confirmation: persist action" });
		throw new Error("Баталгаажуулах төлөв хадгалагдсангүй.");
	}
	return { nonce, buttons: confirmButtons(nonce) };
}

export function confirmAction(
	nonce: string,
	channelChatId: string,
	channelUserId: string,
): StagedAction | null {
	const action = stagedActions.get(nonce);
	if (!action) return null;
	if (
		action.channelChatId !== channelChatId ||
		action.channelUserId !== channelUserId
	) {
		return null;
	}
	stagedActions.delete(nonce);
	return action;
}

/** Atomically consume either an in-memory or durable confirmation. */
export async function confirmStoredAction(
	nonce: string,
	organizationId: string,
	channelChatId: string,
	channelUserId: string,
): Promise<StagedAction | null> {
	const inMemory = confirmAction(nonce, channelChatId, channelUserId);
	if (inMemory) return inMemory;

	const service: SupabaseClient = createServiceClient();
	const { data, error } = await service
		.from("agent_pending_actions")
		.delete()
		.eq("nonce", nonce)
		.eq("organization_id", organizationId)
		.eq("channel_chat_id", channelChatId)
		.eq("channel_user_id", channelUserId)
		.gt("expires_at", new Date().toISOString())
		.select(
			"nonce, organization_id, user_id, product_type, tool_name, args, summary, channel, channel_chat_id, channel_user_id",
		)
		.maybeSingle();
	if (error) {
		capture(error, { context: "confirmation: consume action" });
		return null;
	}
	if (!data) return null;

	const row = data as {
		nonce: string;
		organization_id: string;
		user_id: string;
		product_type: string;
		tool_name: string;
		args: Record<string, unknown>;
		summary: string;
		channel: string;
		channel_chat_id: string;
		channel_user_id: string;
	};
	return {
		nonce: row.nonce,
		toolName: row.tool_name,
		args: row.args,
		channel: row.channel,
		channelChatId: row.channel_chat_id,
		channelUserId: row.channel_user_id,
		summary: row.summary,
		persistent: true,
		organizationId: row.organization_id,
		userId: row.user_id,
		productType: row.product_type,
	};
}

export function rejectAction(nonce: string): void {
	stagedActions.delete(nonce);
}

export async function rejectStoredAction(nonce: string): Promise<void> {
	rejectAction(nonce);
	const service: SupabaseClient = createServiceClient();
	const { error } = await service
		.from("agent_pending_actions")
		.delete()
		.eq("nonce", nonce);
	if (error) capture(error, { context: "confirmation: reject action" });
}
