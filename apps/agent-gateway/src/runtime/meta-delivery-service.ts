import type { OutboundIntent } from "@zuiio/gateway-core";
import { type MetaGraphClient, MetaGraphError } from "@zuiio/gateway-facebook";
import { decryptMetaSecret } from "@/lib/meta-token-crypto";

export type DeliveryResult =
	| { status: "sent"; providerMessageId: string | null }
	| { status: "retryable_failed"; errorCode: string }
	| { status: "delivery_unknown"; errorCode: string }
	| { status: "terminal"; errorCode: string };

export interface MetaDeliveryRecord {
	conversationId: string;
	channelUserId: string;
	installationId: string;
	pageId: string;
	sourceEventId: string | null;
	lastInboundAt: string | null;
	encryptedCredential: string;
}

export interface MetaDeliveryRepository {
	claimOutbound(
		outboundId: string,
		leaseSeconds: number,
	): Promise<MetaDeliveryRecord | null>;
	markOutboundResult(outboundId: string, result: DeliveryResult): Promise<void>;
	markInstallationReauthorization(installationId: string): Promise<void>;
}

function mapDeliveryError(error: unknown): DeliveryResult {
	if (error instanceof MetaGraphError) {
		if (error.requiresReauthorization) {
			return {
				status: "terminal",
				errorCode: "META_CREDENTIAL_REAUTH_REQUIRED",
			};
		}
		if (error.status === 429) {
			return { status: "terminal", errorCode: "META_PROVIDER_QUOTA" };
		}
		return error.retryable
			? { status: "retryable_failed", errorCode: error.code }
			: { status: "terminal", errorCode: error.code };
	}
	if (
		error instanceof DOMException ||
		error instanceof TypeError ||
		(error instanceof Error && /abort|timeout|network|fetch/i.test(error.name))
	) {
		return {
			status: "delivery_unknown",
			errorCode: "META_DELIVERY_UNCERTAIN",
		};
	}
	return { status: "terminal", errorCode: "META_DELIVERY_FAILED" };
}

export class MetaDeliveryService {
	constructor(
		private readonly repository: MetaDeliveryRepository,
		private readonly graph: MetaGraphClient,
	) {}

	async deliver(
		outboundId: string,
		intent: OutboundIntent,
	): Promise<DeliveryResult> {
		const record = await this.repository.claimOutbound(outboundId, 60);
		if (!record) {
			return { status: "retryable_failed", errorCode: "OUTBOUND_LEASE_HELD" };
		}
		if (
			!intent.sourceEventId &&
			(!record.lastInboundAt ||
				Date.now() - Date.parse(record.lastInboundAt) > 24 * 60 * 60 * 1_000)
		) {
			const result: DeliveryResult = {
				status: "terminal",
				errorCode: "META_REPLY_WINDOW_CLOSED",
			};
			await this.repository.markOutboundResult(outboundId, result);
			return result;
		}
		try {
			const accessToken = decryptMetaSecret(record.encryptedCredential);
			const providerMessageId =
				intent.kind === "quick_replies" && intent.quickReplies?.length
					? await this.graph.sendQuickReplies({
							pageId: record.pageId,
							pageAccessToken: accessToken,
							recipientId: record.channelUserId,
							text: intent.text,
							quickReplies: intent.quickReplies,
						})
					: await this.graph.sendMessage({
							pageId: record.pageId,
							pageAccessToken: accessToken,
							recipientId: record.channelUserId,
							text: intent.text,
						});
			const result: DeliveryResult = {
				status: "sent",
				providerMessageId,
			};
			await this.repository.markOutboundResult(outboundId, result);
			return result;
		} catch (error) {
			const result = mapDeliveryError(error);
			if (
				result.status === "terminal" &&
				result.errorCode === "META_CREDENTIAL_REAUTH_REQUIRED"
			) {
				await this.repository.markInstallationReauthorization(
					record.installationId,
				);
			}
			await this.repository.markOutboundResult(outboundId, result);
			return result;
		}
	}
}
