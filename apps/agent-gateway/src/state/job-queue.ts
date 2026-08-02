import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import type { GatewayContext } from "@/gateway/types";

/**
 * Durable async job queue for agent-gateway.
 *
 * Webhooks return within ~8s; messages that outlive the request are enqueued
 * here and processed by the process-jobs cron. The two-step claim (select
 * oldest pending, then flip status by id) keeps concurrent cron runs from
 * double-processing the same row.
 */

export type AsyncJobStatus = "pending" | "processing" | "done" | "failed";

/** Full serialized payload: resolved context, message text, and routing. */
export interface JobPayload {
	ctx: GatewayContext;
	text: string;
	chatType: string;
	productType: GatewayContext["productType"];
}

export interface AsyncJobRow {
	id: string;
	organization_id: string;
	channel: string;
	payload: JobPayload;
	status: AsyncJobStatus;
	attempts: number;
	last_error: string | null;
	created_at: string;
	updated_at: string;
}

/** A job is retried up to this many attempts before being left as failed. */
export const MAX_ATTEMPTS = 3;

/**
 * Enqueue a pending job for durable background processing.
 * Returns the new row id, or null when the insert failed.
 */
export async function enqueueJob(
	sb: SupabaseClient,
	ctx: GatewayContext,
	text: string,
	chatType: string,
): Promise<{ id: string } | null> {
	const { data, error } = await sb
		.from("agent_async_jobs")
		.insert({
			organization_id: ctx.orgId,
			channel: ctx.channel,
			payload: {
				ctx,
				text,
				chatType,
				productType: ctx.productType,
			},
		})
		.select("id")
		.single();

	if (error) {
		capture(error, { context: "agent-gateway: enqueue async job" });
		return null;
	}

	return data;
}

/**
 * Claim up to `limit` oldest pending jobs, marking them processing.
 * Two-step claim: select the oldest pending rows, then flip status by id so
 * a concurrent cron run cannot double-claim them.
 */
export async function claimJobs(
	sb: SupabaseClient,
	limit = 5,
): Promise<AsyncJobRow[]> {
	const { data: pending, error } = await sb
		.from("agent_async_jobs")
		.select("*")
		.eq("status", "pending")
		.order("created_at", { ascending: true })
		.limit(limit);

	if (error) {
		capture(error, { context: "agent-gateway: claim async jobs" });
		return [];
	}

	if (!pending || pending.length === 0) return [];

	const ids = pending.map((row) => row.id);
	const { error: updateErr } = await sb
		.from("agent_async_jobs")
		.update({ status: "processing", updated_at: new Date().toISOString() })
		.in("id", ids)
		.eq("status", "pending");

	if (updateErr) {
		capture(updateErr, { context: "agent-gateway: claim async jobs update" });
		return [];
	}

	return pending as AsyncJobRow[];
}

/**
 * Mark a job complete. Without `error` → done. With `error` → attempts+1 and
 * the job is requeued as pending while attempts remain under MAX_ATTEMPTS,
 * then left as failed once the cap is reached.
 */
export async function completeJob(
	sb: SupabaseClient,
	id: string,
	error?: string,
): Promise<void> {
	const { data, error: readErr } = await sb
		.from("agent_async_jobs")
		.select("attempts")
		.eq("id", id)
		.single();

	if (readErr) {
		capture(readErr, { context: "agent-gateway: complete async job read" });
		return;
	}

	const attempts = ((data?.attempts as number) ?? 0) + 1;

	const status: AsyncJobStatus = error
		? attempts >= MAX_ATTEMPTS
			? "failed"
			: "pending"
		: "done";

	const patch: Partial<{
		status: AsyncJobStatus;
		attempts: number;
		last_error: string;
		updated_at: string;
	}> = { status, attempts, updated_at: new Date().toISOString() };

	if (error) patch.last_error = error;

	const { error: updateErr } = await sb
		.from("agent_async_jobs")
		.update(patch)
		.eq("id", id);

	if (updateErr) {
		capture(updateErr, { context: "agent-gateway: complete async job" });
	}
}
