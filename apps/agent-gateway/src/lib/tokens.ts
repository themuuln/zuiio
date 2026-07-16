import "server-only";
import { createHmac } from "node:crypto";
import { env, envOrThrow } from "./env";

const TOKEN_EXPIRY_MS = 15 * 60 * 1000;

function tokenSecret(): string {
	return env("NODE_ENV") === "production"
		? envOrThrow("TOKEN_SIGNING_SECRET")
		: (env("TOKEN_SIGNING_SECRET") ?? "dev-secret-change-in-production");
}

/**
 * Create a compact link token that fits within Telegram's 64-char limit.
 *
 * Format: `<payload_b64>.<sig12>` where:
 *   payload = orgId (16 bytes UUID) + userId (16 bytes UUID) + flags (1 byte) + exp (4 bytes uint32)
 *   = 37 bytes → base64url = 50 chars
 *   sig = HMAC-SHA256 truncated to 12 chars
 * Total: 50 + 1 + 12 = 63 chars
 *
 * Org-less link tokens (for API-based generation) use random IDs with the
 * host app providing the full UUID via a separate channel.
 */
export function createCompactToken(
	orgId: string,
	userId: string,
	productType: string,
): string {
	// Pack org UUID (16 bytes binary)
	const orgBytes = uuidToBytes(orgId);
	// Pack user ID (16 bytes binary — treat as UUID-like)
	const userBytes = uuidToBytes(userId);

	// Flags byte: bit 0 = productType (0=zer, 1=tolom), bits 1-7 reserved
	const flags = productType === "tolom" ? 0x01 : 0x00;

	// Expiry as 4-byte big-endian seconds since epoch
	const expSec = Math.floor((Date.now() + TOKEN_EXPIRY_MS) / 1000);
	const expBytes = new Uint8Array(4);
	new DataView(expBytes.buffer).setUint32(0, expSec, false);

	// Assemble payload
	const payload = new Uint8Array(16 + 16 + 1 + 4);
	payload.set(orgBytes, 0);
	payload.set(userBytes, 16);
	payload[32] = flags;
	payload.set(expBytes, 33);

	const payloadB64 = Buffer.from(payload).toString("base64url");

	// HMAC-SHA256 truncated to 12 chars
	const sig = createHmac("sha256", tokenSecret())
		.update(payloadB64)
		.digest("base64url")
		.slice(0, 12);

	return `${payloadB64}.${sig}`;
}

/**
 * Verify a compact link token.
 * Returns the decoded payload if the signature is valid and not expired.
 */
export function verifyCompactToken(
	token: string,
): { orgId: string; userId: string; productType: "tolom" | "zer" } | null {
	const dotIdx = token.lastIndexOf(".");
	if (dotIdx < 0) return null;

	const payloadB64 = token.slice(0, dotIdx);
	const sig = token.slice(dotIdx + 1);

	if (sig.length !== 12) return null;

	// Verify HMAC
	const expectedSig = createHmac("sha256", tokenSecret())
		.update(payloadB64)
		.digest("base64url")
		.slice(0, 12);

	if (sig !== expectedSig) return null;

	// Decode payload
	let payload: Uint8Array;
	try {
		payload = new Uint8Array(Buffer.from(payloadB64, "base64url"));
	} catch {
		return null;
	}

	if (payload.length !== 37) return null;

	// Extract fields
	const orgId = bytesToUuid(payload.slice(0, 16));
	const userId = bytesToUuid(payload.slice(16, 32));
	const flags = payload[32]!;
	const expView = new DataView(payload.buffer, payload.byteOffset + 33, 4);
	const expSec = expView.getUint32(0, false);

	// Check expiry
	if (expSec * 1000 < Date.now()) return null;

	const productType = flags & 0x01 ? "tolom" : "zer";

	return { orgId, userId, productType };
}

// ─── UUID ↔ bytes helpers ──────────────────────────────────────────────────

function uuidToBytes(uuid: string): Uint8Array {
	const hex = uuid.replace(/-/g, "");
	const bytes = new Uint8Array(16);
	for (let i = 0; i < 16; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
