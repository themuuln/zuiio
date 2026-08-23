import { NextResponse } from "next/server";
import { getEnabledMetaChannels } from "@/lib/facebook-scopes";
import { decryptMetaPayload, encryptMetaSecret } from "@/lib/meta-token-crypto";
import { sha256Hex } from "@/lib/service-signature";
import { enqueueMetaJob } from "@/lib/worker-enqueue";
import {
	createMetaOAuthRepository,
	metaApiError,
	parseRecord,
	repositoryError,
	signatureError,
	verifyZerControlRequest,
} from "@/meta/http";
import type { MetaOAuthPayload } from "@/meta/oauth-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
	const rawBody = await request.text();
	const repository = createMetaOAuthRepository();
	try {
		const signature = await verifyZerControlRequest({
			request,
			rawBody,
			repository,
		});
		if (!signature.ok) return signatureError(signature);
		const body = parseRecord(rawBody);
		if (
			body?.version !== 1 ||
			typeof body.transaction !== "string" ||
			typeof body.userId !== "string" ||
			typeof body.pageId !== "string"
		) {
			return metaApiError("INVALID_REQUEST", "Request body is invalid", 400);
		}
		const transaction = await repository.getBySelection(
			sha256Hex(body.transaction),
			body.userId,
		);
		if (!transaction) {
			return metaApiError(
				"OAUTH_TRANSACTION_EXPIRED",
				"OAuth transaction expired",
				410,
			);
		}
		if (
			!transaction.encrypted_payload ||
			(transaction.status !== "authorized" && transaction.status !== "selected")
		) {
			return metaApiError(
				transaction.error_code ?? "OAUTH_TRANSACTION_INVALID",
				"OAuth transaction is not available",
				409,
			);
		}
		const payload = decryptMetaPayload<MetaOAuthPayload>(
			transaction.encrypted_payload,
		);
		const page = payload.pages.find(
			(candidate) => candidate.id === body.pageId,
		);
		if (!page) {
			return metaApiError(
				"OAUTH_PAGE_NOT_FOUND",
				"Selected Page is not part of this OAuth transaction",
				400,
			);
		}
		const keyVersion = Number(process.env.META_TOKEN_ENCRYPTION_ACTIVE_VERSION);
		if (!Number.isSafeInteger(keyVersion) || keyVersion < 1) {
			return metaApiError(
				"META_ENCRYPTION_NOT_CONFIGURED",
				"Meta encryption is not configured",
				503,
			);
		}
		const installation = await repository.completeInstallation({
			transactionId: transaction.id,
			tenantId: transaction.tenant_id,
			requestedBy: transaction.requested_by,
			page,
			encryptedPageToken: encryptMetaSecret(page.accessToken),
			encryptedUserToken: encryptMetaSecret(payload.userAccessToken),
			keyVersion,
			userTokenExpiresAt: payload.userTokenExpiresAt,
			enableInstagram: getEnabledMetaChannels().includes("instagram"),
		});
		await enqueueMetaJob({
			kind: "provision_meta_installation",
			installationId: installation.installationId,
			traceId: crypto.randomUUID(),
		});
		return NextResponse.json(
			{
				installation: {
					id: installation.installationId,
					status: installation.status,
				},
			},
			{ status: 202 },
		);
	} catch (error) {
		return repositoryError(error);
	}
}
