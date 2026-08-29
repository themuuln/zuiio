import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { FacebookChannel } from "@/channels/facebook";
import { TelegramChannel } from "@/channels/telegram";
import { WhatsAppChannel } from "@/channels/whatsapp";
import { handleAgentMessage } from "@/gateway/agent-handler";
import type { GatewayContext } from "@/gateway/types";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { decryptSecret } from "@/lib/crypto";
import { createServiceClient, type ServiceClient } from "@/lib/supabase";
import { claimJobs, completeJob, type JobPayload } from "@/state/job-queue";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/process-jobs
 *
 * Drains the durable agent_async_jobs queue: claims up to 5 pending jobs,
 * runs the agent, and delivers the reply via the originating channel.
 */
export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sb = createServiceClient();

	try {
		const jobs = await claimJobs(sb, 5);

		let processed = 0;
		let failed = 0;

		for (const job of jobs) {
			const rawPayload = job.payload as unknown;
			try {
				if (isBroadcastPayload(rawPayload)) {
					await deliverBroadcast(sb, rawPayload, job.organization_id);
				} else {
					const payload = rawPayload as JobPayload & { qpayImage?: string };
					const response = await handleAgentMessage(
						payload.ctx,
						payload.text,
						payload.chatType,
						{
							getSystemPrompt: systemPromptFor,
							getTools: (toolCtx) =>
								getProductTools(payload.productType, toolCtx),
						},
					);
					await deliverReply(payload.ctx, response, payload.qpayImage);
				}
				await completeJob(sb, job.id);
				processed++;
			} catch (err) {
				failed++;
				capture(err, { context: "agent-gateway: process async job" });
				await completeJob(
					sb,
					job.id,
					err instanceof Error ? err.message : "Unknown job failure",
				);
			}
		}

		return NextResponse.json({ status: "ok", processed, failed });
	} catch (err) {
		capture(err, { context: "agent-gateway: process-jobs cron" });
		return NextResponse.json(
			{
				status: "error",
				error: err instanceof Error ? err.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

/** Deliver a completed agent reply via the channel that originated the job. */
async function deliverReply(
	ctx: GatewayContext,
	reply: string,
	qpayImage?: string | null,
): Promise<void> {
	switch (ctx.channel) {
		case "whatsapp":
			await new WhatsAppChannel().sendMessage(ctx.channelChatId, reply);
			if (qpayImage) {
				try {
					await new WhatsAppChannel().sendImage(ctx.channelChatId, qpayImage);
				} catch {}
			}
			return;
		case "messenger":
		case "instagram": {
			const pageId =
				(ctx as unknown as { pageId?: string }).pageId ?? ctx.channelChatId;
			const pageAccessToken =
				(ctx as unknown as { pageAccessToken?: string }).pageAccessToken ?? "";
			const channel = new FacebookChannel({ pageId, pageAccessToken });
			await channel.sendMessage(ctx.channelChatId, reply);
			if (qpayImage) {
				try {
					await channel.sendImage(ctx.channelChatId, qpayImage);
				} catch {}
			}
			return;
		}
		default:
			await new TelegramChannel().sendMessage(ctx.chatId, reply);
			if (qpayImage) {
				try {
					await new TelegramChannel().sendImage(
						ctx.chatId as unknown as number,
						qpayImage,
					);
				} catch {}
			}
	}
}

type BroadcastPayload = {
	kind: "broadcast";
	channel: string;
	channelUserId: string;
	pageId: string | null;
	message: string;
	messaging_type?: "RESPONSE" | "UPDATE" | "MESSAGE_TAG";
	broadcastId?: string;
};

function isBroadcastPayload(payload: unknown): payload is BroadcastPayload {
	return (
		typeof payload === "object" &&
		payload !== null &&
		"kind" in payload &&
		(payload as Record<string, unknown>).kind === "broadcast"
	);
}

async function deliverBroadcast(
	sb: ServiceClient,
	payload: BroadcastPayload,
	orgId: string,
) {
	const channel = payload.channel;
	if (channel === "telegram") {
		const sent = await new TelegramChannel().sendMessage(
			payload.channelUserId,
			payload.message,
		);
		if (!sent) throw new Error("Telegram broadcast delivery failed");
		return;
	}
	if (channel === "whatsapp") {
		const sent = await new WhatsAppChannel().sendMessage(
			payload.channelUserId,
			payload.message,
		);
		if (!sent) throw new Error("WhatsApp broadcast delivery failed");
		return;
	}
	let query = sb
		.from("channel_connections")
		.select("page_access_token, channel, page_id, channel_user_id")
		.eq("organization_id", orgId)
		.eq("is_active", true);

	if (channel === "instagram") {
		query = query
			.eq("channel", "instagram")
			.eq("channel_user_id", payload.pageId ?? "");
	} else {
		query = query
			.eq("channel", "messenger")
			.eq("page_id", payload.pageId ?? "");
	}

	const { data: connection, error } = await query.maybeSingle();
	if (error || !connection?.page_access_token)
		throw new Error("Facebook page credentials unavailable");

	const decryptedToken = decryptSecret(connection.page_access_token);
	const messagingType =
		payload.messaging_type === "MESSAGE_TAG"
			? "RESPONSE"
			: (payload.messaging_type ?? "RESPONSE");

	const fbChannel = new FacebookChannel({
		pageId: connection.page_id ?? payload.pageId ?? undefined,
		pageAccessToken: decryptedToken,
	});
	const sent = await fbChannel.sendMessage(
		payload.channelUserId,
		payload.message,
		{
			messagingType,
		},
	);
	if (!sent) throw new Error("Facebook broadcast delivery failed");
}
