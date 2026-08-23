import { NextResponse } from "next/server";
import { decryptMetaPayload } from "@/lib/meta-token-crypto";
import { sha256Hex } from "@/lib/service-signature";
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
			typeof body.userId !== "string"
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
		if (transaction.status === "failed") {
			return metaApiError(
				transaction.error_code ?? "META_AUTH_FAILED",
				"Meta authorization failed",
				400,
			);
		}
		if (transaction.status !== "authorized" || !transaction.encrypted_payload) {
			return metaApiError(
				"OAUTH_TRANSACTION_USED",
				"OAuth transaction is no longer available",
				409,
			);
		}
		const payload = decryptMetaPayload<MetaOAuthPayload>(
			transaction.encrypted_payload,
		);
		return NextResponse.json({
			pages: payload.pages.map(({ id, name }) => ({ id, name })),
		});
	} catch (error) {
		return repositoryError(error);
	}
}
