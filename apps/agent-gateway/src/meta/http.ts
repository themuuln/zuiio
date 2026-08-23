import "server-only";

import { NextResponse } from "next/server";
import { createGatewayControlClient } from "@/lib/gateway-control-client";
import {
	type ServiceSignatureResult,
	verifyServiceRequest,
} from "@/lib/service-signature";
import {
	MetaOAuthRepository,
	OAuthRepositoryError,
} from "@/meta/oauth-repository";

export function metaApiError(
	code: string,
	message: string,
	status: number,
): NextResponse {
	return NextResponse.json({ error: { code, message } }, { status });
}

export function createMetaOAuthRepository(): MetaOAuthRepository {
	return new MetaOAuthRepository(createGatewayControlClient());
}

export async function verifyZerControlRequest(input: {
	request: Request;
	rawBody: string;
	repository: MetaOAuthRepository;
}): Promise<ServiceSignatureResult> {
	const secret = process.env.ZER_GATEWAY_CONTROL_SECRET;
	if (!secret) throw new OAuthRepositoryError("CONTROL_SECRET_MISSING", 500);
	return verifyServiceRequest({
		request: input.request,
		rawBody: input.rawBody,
		secret,
		expectedClientId: "zer",
		consumeNonce: (nonceInput) =>
			input.repository.consumeServiceNonce(nonceInput),
	});
}

export function signatureError(
	result: Exclude<ServiceSignatureResult, { ok: true }>,
): NextResponse {
	const message =
		result.code === "REPLAYED_REQUEST"
			? "This request was already used"
			: "Request signature is invalid";
	return metaApiError(result.code, message, result.status);
}

export function repositoryError(error: unknown): NextResponse {
	if (error instanceof OAuthRepositoryError) {
		return metaApiError(
			error.code,
			"Meta connection request failed",
			error.status,
		);
	}
	return metaApiError(
		"META_CONTROL_FAILED",
		"Meta connection request failed",
		500,
	);
}

export function parseRecord(rawBody: string): Record<string, unknown> | null {
	try {
		const value: unknown = JSON.parse(rawBody);
		return value !== null && typeof value === "object" && !Array.isArray(value)
			? (value as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}
