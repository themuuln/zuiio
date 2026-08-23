import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getFacebookOAuthScopes } from "@/lib/facebook-scopes";
import { sha256Hex } from "@/lib/service-signature";
import {
	createMetaOAuthRepository,
	metaApiError,
	parseRecord,
	repositoryError,
	signatureError,
	verifyZerControlRequest,
} from "@/meta/http";

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
			typeof body.organizationId !== "string" ||
			typeof body.userId !== "string"
		) {
			return metaApiError("INVALID_REQUEST", "Request body is invalid", 400);
		}
		const appId =
			process.env.FB_APP_ID ?? process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
		const redirectUri = process.env.FB_OAUTH_REDIRECT_URI;
		if (!appId || !redirectUri) {
			return metaApiError("META_NOT_CONFIGURED", "Meta is not configured", 503);
		}
		const tenantId = await repository.upsertTenant(body.organizationId);
		const state = randomBytes(32).toString("base64url");
		await repository.createTransaction({
			tenantId,
			requestedBy: body.userId,
			stateDigest: sha256Hex(state),
			expiresAt: new Date(Date.now() + 15 * 60 * 1_000).toISOString(),
		});
		const authorizationUrl = new URL(
			`https://www.facebook.com/${process.env.FB_GRAPH_API_VERSION ?? "v25.0"}/dialog/oauth`,
		);
		authorizationUrl.search = new URLSearchParams({
			client_id: appId,
			redirect_uri: redirectUri,
			response_type: "code",
			scope: getFacebookOAuthScopes(),
			state,
		}).toString();
		return NextResponse.json({ authorizationUrl: authorizationUrl.toString() });
	} catch (error) {
		return repositoryError(error);
	}
}
