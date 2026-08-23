import { randomBytes } from "node:crypto";
import { MetaGraphClient, MetaGraphError } from "@zuiio/gateway-facebook";
import { NextResponse } from "next/server";
import { encryptMetaPayload } from "@/lib/meta-token-crypto";
import { sha256Hex } from "@/lib/service-signature";
import {
	createMetaOAuthRepository,
	metaApiError,
	repositoryError,
} from "@/meta/http";
import type { MetaOAuthPayload } from "@/meta/oauth-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function selectorRedirect(transaction: string): NextResponse {
	const selectorUrl = process.env.ZER_META_SELECTOR_URL;
	if (!selectorUrl) throw new Error("ZER_META_SELECTOR_URL_MISSING");
	const redirect = new URL(selectorUrl);
	redirect.searchParams.set("transaction", transaction);
	return NextResponse.redirect(redirect);
}

export async function GET(request: Request): Promise<NextResponse> {
	const params = new URL(request.url).searchParams;
	const state = params.get("state");
	if (!state) {
		return metaApiError("OAUTH_STATE_INVALID", "OAuth state is invalid", 400);
	}
	const repository = createMetaOAuthRepository();
	try {
		const transaction = await repository.claimState(sha256Hex(state));
		if (!transaction) {
			return metaApiError(
				"OAUTH_STATE_INVALID",
				"OAuth state is invalid or already used",
				400,
			);
		}
		const selection = randomBytes(32).toString("base64url");
		const selectionDigest = sha256Hex(selection);
		if (params.get("error") === "access_denied") {
			await repository.markFailure({
				transactionId: transaction.id,
				selectionDigest,
				errorCode: "META_AUTH_DENIED",
			});
			return selectorRedirect(selection);
		}
		const code = params.get("code");
		if (!code) {
			await repository.markFailure({
				transactionId: transaction.id,
				selectionDigest,
				errorCode: "META_CODE_MISSING",
			});
			return selectorRedirect(selection);
		}
		const appId =
			process.env.FB_APP_ID ?? process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
		const appSecret = process.env.FB_APP_SECRET;
		const redirectUri = process.env.FB_OAUTH_REDIRECT_URI;
		if (!appId || !appSecret || !redirectUri) {
			await repository.markFailure({
				transactionId: transaction.id,
				selectionDigest,
				errorCode: "META_NOT_CONFIGURED",
			});
			return selectorRedirect(selection);
		}
		const graph = new MetaGraphClient({
			appId,
			appSecret,
			apiVersion: process.env.FB_GRAPH_API_VERSION,
		});
		try {
			const shortLived = await graph.exchangeCode({ code, redirectUri });
			const longLived = await graph.exchangeLongLivedToken(
				shortLived.accessToken,
			);
			const pages = await graph.listManagedPages(longLived.accessToken);
			if (pages.length === 0) {
				await repository.markFailure({
					transactionId: transaction.id,
					selectionDigest,
					errorCode: "META_NO_PAGES",
				});
				return selectorRedirect(selection);
			}
			const userTokenExpiresAt = longLived.expiresIn
				? new Date(Date.now() + longLived.expiresIn * 1_000).toISOString()
				: null;
			const payload: MetaOAuthPayload = {
				userAccessToken: longLived.accessToken,
				userTokenExpiresAt,
				pages: pages.map((page) => ({
					id: page.id,
					name: page.name,
					accessToken: page.accessToken,
					instagramBusinessAccountId: page.instagramBusinessAccount?.id ?? null,
				})),
			};
			await repository.setAuthorizedPayload({
				transactionId: transaction.id,
				selectionDigest,
				encryptedPayload: encryptMetaPayload(payload),
			});
			return selectorRedirect(selection);
		} catch (error) {
			await repository.markFailure({
				transactionId: transaction.id,
				selectionDigest,
				errorCode:
					error instanceof MetaGraphError && error.requiresReauthorization
						? "META_AUTH_INVALID"
						: "META_GRAPH_FAILED",
			});
			return selectorRedirect(selection);
		}
	} catch (error) {
		return repositoryError(error);
	}
}
