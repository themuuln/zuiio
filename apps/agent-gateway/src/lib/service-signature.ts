import "server-only";

import {
	createHash,
	createHmac,
	randomUUID,
	timingSafeEqual,
} from "node:crypto";

const SIGNATURE_WINDOW_SECONDS = 300;
export interface SignedServiceHeaders {
	[key: string]: string;
	"content-type": "application/json";
	"x-zuiio-client-id": string;
	"x-zuiio-timestamp": string;
	"x-zuiio-nonce": string;
	"x-zuiio-signature": string;
}

export type ServiceSignatureResult =
	| { ok: true; clientId: string; nonce: string }
	| {
			ok: false;
			code:
				| "SIGNATURE_HEADERS_MISSING"
				| "SIGNATURE_TIMESTAMP_INVALID"
				| "SIGNATURE_CLIENT_INVALID"
				| "SIGNATURE_INVALID"
				| "REPLAYED_REQUEST";
			status: 401 | 409;
	  };

export function sha256Hex(value: string | Buffer): string {
	return createHash("sha256").update(value).digest("hex");
}

export function canonicalServiceRequest(input: {
	method: string;
	pathname: string;
	timestamp: string;
	nonce: string;
	rawBody: string;
}): string {
	return [
		input.method.toUpperCase(),
		input.pathname,
		input.timestamp,
		input.nonce,
		sha256Hex(input.rawBody),
	].join("\n");
}

export function signServiceRequest(
	secret: string,
	canonicalRequest: string,
): string {
	if (!secret) throw new Error("SERVICE_SIGNATURE_SECRET_MISSING");
	return createHmac("sha256", secret).update(canonicalRequest).digest("hex");
}

export function createSignedServiceHeaders(input: {
	clientId: string;
	secret: string;
	method: string;
	pathname: string;
	rawBody: string;
	timestamp?: string;
	nonce?: string;
}): SignedServiceHeaders {
	const timestamp = input.timestamp ?? String(Math.floor(Date.now() / 1_000));
	const nonce = input.nonce ?? randomUUID();
	const canonical = canonicalServiceRequest({
		method: input.method,
		pathname: input.pathname,
		timestamp,
		nonce,
		rawBody: input.rawBody,
	});
	return {
		"content-type": "application/json",
		"x-zuiio-client-id": input.clientId,
		"x-zuiio-timestamp": timestamp,
		"x-zuiio-nonce": nonce,
		"x-zuiio-signature": signServiceRequest(input.secret, canonical),
	};
}

export async function verifyServiceRequest(input: {
	request: Request;
	rawBody: string;
	secret: string;
	expectedClientId: string;
	consumeNonce: (input: {
		clientId: string;
		nonce: string;
		expiresAt: string;
	}) => Promise<boolean>;
	now?: Date;
}): Promise<ServiceSignatureResult> {
	const clientId = input.request.headers.get("x-zuiio-client-id");
	const timestamp = input.request.headers.get("x-zuiio-timestamp");
	const nonce = input.request.headers.get("x-zuiio-nonce");
	const signature = input.request.headers.get("x-zuiio-signature");
	if (!clientId || !timestamp || !nonce || !signature) {
		return { ok: false, code: "SIGNATURE_HEADERS_MISSING", status: 401 };
	}
	if (clientId !== input.expectedClientId) {
		return { ok: false, code: "SIGNATURE_CLIENT_INVALID", status: 401 };
	}
	const timestampSeconds = Number(timestamp);
	const now = input.now ?? new Date();
	if (
		!Number.isSafeInteger(timestampSeconds) ||
		Math.abs(Math.floor(now.getTime() / 1_000) - timestampSeconds) >
			SIGNATURE_WINDOW_SECONDS
	) {
		return { ok: false, code: "SIGNATURE_TIMESTAMP_INVALID", status: 401 };
	}
	const expected = signServiceRequest(
		input.secret,
		canonicalServiceRequest({
			method: input.request.method,
			pathname: new URL(input.request.url).pathname,
			timestamp,
			nonce,
			rawBody: input.rawBody,
		}),
	);
	const receivedBytes = Buffer.from(signature, "hex");
	const expectedBytes = Buffer.from(expected, "hex");
	if (
		receivedBytes.length !== expectedBytes.length ||
		!timingSafeEqual(receivedBytes, expectedBytes)
	) {
		return { ok: false, code: "SIGNATURE_INVALID", status: 401 };
	}
	const accepted = await input.consumeNonce({
		clientId,
		nonce,
		expiresAt: new Date(
			(timestampSeconds + SIGNATURE_WINDOW_SECONDS) * 1_000,
		).toISOString(),
	});
	if (!accepted) {
		return { ok: false, code: "REPLAYED_REQUEST", status: 409 };
	}
	return { ok: true, clientId, nonce };
}
