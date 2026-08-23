const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer): string {
	return [...new Uint8Array(bytes)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function bytes(value: string): Uint8Array {
	if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0)
		return new Uint8Array();
	const output = new Uint8Array(value.length / 2);
	for (let index = 0; index < output.length; index += 1)
		output[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
	return output;
}

export async function sha256Hex(value: ArrayBuffer | string): Promise<string> {
	return hex(
		await crypto.subtle.digest(
			"SHA-256",
			typeof value === "string" ? encoder.encode(value) : value,
		),
	);
}

export function canonicalRequest(
	method: string,
	pathname: string,
	timestamp: string,
	nonce: string,
	bodyHash: string,
): string {
	return `${method.toUpperCase()}\n${pathname}\n${timestamp}\n${nonce}\n${bodyHash}`;
}

export async function hmacHex(secret: string, value: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function verifyMetaSignature(
	rawBody: ArrayBuffer,
	header: string | null,
	appSecret: string,
): Promise<boolean> {
	if (!header?.startsWith("sha256=") || !appSecret) return false;
	const expected = bytes(header.slice(7));
	if (expected.length !== 32) return false;
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(appSecret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"],
	);
	return crypto.subtle.verify("HMAC", key, expected, rawBody);
}

export async function signServiceRequest(
	method: string,
	pathname: string,
	body: string,
	clientId: string,
	secret: string,
	timestamp = Math.floor(Date.now() / 1000).toString(),
	nonce = crypto.randomUUID(),
): Promise<Headers> {
	const signature = await hmacHex(
		secret,
		canonicalRequest(method, pathname, timestamp, nonce, await sha256Hex(body)),
	);
	return new Headers({
		"content-type": "application/json",
		"x-zuiio-client-id": clientId,
		"x-zuiio-timestamp": timestamp,
		"x-zuiio-nonce": nonce,
		"x-zuiio-signature": signature,
	});
}
