import { sha256Hex } from "./meta-signature";

export interface InboundQueueMessage {
	kind: "process_inbound_event";
	eventId: string;
	traceId: string;
}

export interface InstallationQueueMessage {
	kind: "provision_meta_installation" | "refresh_meta_installation";
	installationId: string;
	traceId: string;
}

export interface ReplayQueueMessage {
	kind: "replay_inbound_event";
	eventId: string;
	traceId: string;
}

export type MetaQueueMessage =
	| InboundQueueMessage
	| InstallationQueueMessage
	| ReplayQueueMessage;

export interface MetaEventEnvelope {
	provider: "meta";
	providerEventId: string;
	externalEndpointId: string;
	payload: Record<string, unknown>;
	metadata: {
		channel: "messenger" | "instagram";
		senderId: string;
		kind: "message" | "quick_reply" | "postback" | "referral";
		referral?: string;
	};
	traceId: string;
}

function record(value: unknown): Record<string, unknown> | null {
	return value !== null && typeof value === "object"
		? (value as Record<string, unknown>)
		: null;
}

function text(value: unknown): string | null {
	return typeof value === "string" && value.length > 0 ? value : null;
}

export async function splitMetaEvents(
	payload: unknown,
): Promise<MetaEventEnvelope[]> {
	const root = record(payload);
	const entries = Array.isArray(root?.entry) ? root.entry : [];
	const output: MetaEventEnvelope[] = [];
	for (const rawEntry of entries) {
		const entry = record(rawEntry);
		const endpoint = text(entry?.id);
		const messaging = Array.isArray(entry?.messaging) ? entry.messaging : [];
		if (!endpoint) continue;
		for (const rawEvent of messaging) {
			const event = record(rawEvent);
			if (!event) continue;
			const sender = record(event.sender);
			const message = record(event.message);
			const postback = record(event.postback);
			const rawReferral = record(message?.referral) ?? record(event.referral);
			const senderId = text(sender?.id);
			const timestamp =
				typeof event.timestamp === "number"
					? String(event.timestamp)
					: text(event.timestamp);
			if (!senderId || !timestamp) continue;
			const isEcho = message?.is_echo === true || Boolean(message?.echo);
			if (isEcho) continue;
			let kind: MetaEventEnvelope["metadata"]["kind"];
			let discriminator: string;
			let referral: string | undefined;
			if (postback) {
				kind = "postback";
				discriminator = text(postback.payload) ?? "";
			} else if (record(message?.quick_reply)) {
				kind = "quick_reply";
				const quickReply = record(message?.quick_reply);
				discriminator = text(quickReply?.payload) ?? text(message?.mid) ?? "";
			} else if (rawReferral) {
				kind = "referral";
				referral = text(rawReferral.ref) ?? undefined;
				discriminator = referral ?? text(rawReferral.source) ?? "";
			} else if (message) {
				kind = "message";
				discriminator = text(message.mid) ?? text(message.text) ?? "";
			} else {
				continue;
			}
			const channel =
				text(event.messaging_product) === "instagram" ||
				text(event.channel) === "instagram"
					? "instagram"
					: "messenger";
			const providerEventId =
				text(message?.mid) ??
				(await sha256Hex(
					`${channel}:${endpoint}:${senderId}:${timestamp}:${kind}:${discriminator}`,
				));
			output.push({
				provider: "meta",
				providerEventId,
				externalEndpointId: endpoint,
				payload: event,
				metadata: {
					channel,
					senderId,
					kind,
					...(referral ? { referral } : {}),
				},
				traceId: crypto.randomUUID(),
			});
		}
	}
	return output;
}
