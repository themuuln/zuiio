import "server-only";

import { createSignedServiceHeaders } from "@/lib/service-signature";

export type WorkerQueueMessage =
	| {
			kind: "process_inbound_event" | "replay_inbound_event";
			eventId: string;
			traceId: string;
	  }
	| {
			kind: "provision_meta_installation" | "refresh_meta_installation";
			installationId: string;
			traceId: string;
	  };

export async function enqueueMetaJob(
	message: WorkerQueueMessage,
): Promise<void> {
	const baseUrl = process.env.META_WORKER_INTERNAL_URL;
	const secret = process.env.GATEWAY_WORKER_SHARED_SECRET;
	if (!baseUrl || !secret)
		throw new Error("META_WORKER_ENQUEUE_NOT_CONFIGURED");
	const pathname = "/internal/enqueue";
	const rawBody = JSON.stringify(message);
	const response = await fetch(new URL(pathname, baseUrl), {
		method: "POST",
		headers: createSignedServiceHeaders({
			clientId: "agent-gateway",
			secret,
			method: "POST",
			pathname,
			rawBody,
		}),
		body: rawBody,
		signal: AbortSignal.timeout(10_000),
	});
	if (!response.ok) {
		throw new Error(`META_WORKER_ENQUEUE_${response.status}`);
	}
}
