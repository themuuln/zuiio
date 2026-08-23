import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc:v2";

function activeKeyVersion(): string {
	const version = process.env.META_TOKEN_ENCRYPTION_ACTIVE_VERSION;
	if (!version || !/^\d+$/.test(version) || Number(version) < 1) {
		throw new Error("META_TOKEN_ENCRYPTION_ACTIVE_VERSION_INVALID");
	}
	return version;
}

function encryptionKey(version: string): Buffer {
	const raw = process.env[`META_TOKEN_ENCRYPTION_KEY_V${version}`];
	if (!raw) throw new Error(`META_TOKEN_ENCRYPTION_KEY_V${version}_MISSING`);
	const key = /^[0-9a-f]{64}$/i.test(raw)
		? Buffer.from(raw, "hex")
		: Buffer.from(raw, "base64");
	if (key.length !== 32) {
		throw new Error(`META_TOKEN_ENCRYPTION_KEY_V${version}_INVALID`);
	}
	return key;
}

export function encryptMetaSecret(plaintext: string): string {
	if (!plaintext) throw new Error("META_SECRET_EMPTY");
	const version = activeKeyVersion();
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", encryptionKey(version), iv);
	const ciphertext = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	return [
		PREFIX,
		version,
		iv.toString("base64url"),
		cipher.getAuthTag().toString("base64url"),
		ciphertext.toString("base64url"),
	].join(":");
}

export function decryptMetaSecret(encrypted: string): string {
	const parts = encrypted.split(":");
	if (
		parts.length !== 6 ||
		parts[0] !== "enc" ||
		parts[1] !== "v2" ||
		!parts[2]
	) {
		throw new Error("META_SECRET_FORMAT_INVALID");
	}
	const [, , version, ivValue, tagValue, ciphertextValue] = parts;
	const iv = Buffer.from(ivValue, "base64url");
	const tag = Buffer.from(tagValue, "base64url");
	const ciphertext = Buffer.from(ciphertextValue, "base64url");
	if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) {
		throw new Error("META_SECRET_FORMAT_INVALID");
	}
	try {
		const decipher = createDecipheriv(
			"aes-256-gcm",
			encryptionKey(version),
			iv,
		);
		decipher.setAuthTag(tag);
		return Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(),
		]).toString("utf8");
	} catch {
		throw new Error("META_SECRET_DECRYPT_FAILED");
	}
}

export function encryptMetaPayload(value: unknown): string {
	return encryptMetaSecret(JSON.stringify(value));
}

export function decryptMetaPayload<T>(encrypted: string): T {
	try {
		return JSON.parse(decryptMetaSecret(encrypted)) as T;
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error("META_PAYLOAD_INVALID");
		}
		throw error;
	}
}
