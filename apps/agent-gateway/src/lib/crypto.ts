import "server-only";

import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";
import { capture } from "@zuiio/capture";

/**
 * At-rest encryption for Meta page access tokens (AES-256-GCM).
 *
 * Format: `enc:v1:<iv_b64>:<tag_b64>:<cipher_b64>`
 *
 * The key comes from META_TOKEN_ENCRYPTION_KEY. Any string is accepted —
 * the raw value is hashed with SHA-256 to derive a robust 32-byte key, so
 * hex/base64 32-byte keys and passphrases both work.
 *
 * Degradation: when the key is unset, encrypt() prefixes the plaintext with
 * `plain:` and decrypt() passes it through unchanged (and vice versa for
 * legacy plaintext rows). A warning is logged via capture so the gap is
 * visible in telemetry.
 */

const PLAINTEXT_PREFIX = "plain:";
const ENCRYPTED_PREFIX = "enc:v1:";

/** Derive the 32-byte AES key from the env var, or null when unset. */
function getEncryptionKey(): Buffer | null {
	const raw = process.env.META_TOKEN_ENCRYPTION_KEY;
	if (!raw) return null;
	return createHash("sha256").update(raw).digest();
}

/**
 * Encrypt a secret with AES-256-GCM.
 * Returns `plain:<value>` (and logs a warning) when META_TOKEN_ENCRYPTION_KEY is unset.
 */
export function encryptSecret(plain: string): string {
	if (!plain) return plain;

	const key = getEncryptionKey();
	if (!key) {
		capture(
			new Error(
				"META_TOKEN_ENCRYPTION_KEY is unset — storing Meta token in plaintext",
			),
			{ context: "agent-gateway: crypto encryptSecret" },
		);
		return `${PLAINTEXT_PREFIX}${plain}`;
	}

	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plain, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();

	return `${ENCRYPTED_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypt a value produced by encryptSecret.
 * Passes through `plain:`-prefixed and legacy plaintext values unchanged;
 * returns the raw input when the key is unset or decryption fails (logged).
 */
export function decryptSecret(encrypted: string): string {
	if (!encrypted) return encrypted;

	if (encrypted.startsWith(PLAINTEXT_PREFIX)) {
		return encrypted.slice(PLAINTEXT_PREFIX.length);
	}
	if (!encrypted.startsWith(ENCRYPTED_PREFIX)) {
		// Legacy plaintext stored before encryption was rolled out.
		return encrypted;
	}

	const key = getEncryptionKey();
	if (!key) {
		capture(
			new Error(
				"META_TOKEN_ENCRYPTION_KEY is unset — cannot decrypt stored Meta token",
			),
			{ context: "agent-gateway: crypto decryptSecret" },
		);
		return encrypted;
	}

	const parts = encrypted.split(":");
	if (parts.length !== 5) {
		capture(
			new Error("Malformed encrypted token (expected enc:v1:<iv>:<tag>:<ct>)"),
			{ context: "agent-gateway: crypto decryptSecret" },
		);
		return encrypted;
	}

	try {
		const iv = Buffer.from(parts[2], "base64");
		const tag = Buffer.from(parts[3], "base64");
		const ciphertext = Buffer.from(parts[4], "base64");
		const decipher = createDecipheriv("aes-256-gcm", key, iv);
		decipher.setAuthTag(tag);
		return Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(),
		]).toString("utf8");
	} catch (err) {
		capture(err, { context: "agent-gateway: crypto decryptSecret" });
		return encrypted;
	}
}
