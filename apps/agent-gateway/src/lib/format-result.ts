import "server-only";

/**
 * Format a write-tool result (from the write engine or legacy write tools)
 * into a user-facing message for chat channels.
 */
export function formatWriteResult(result: unknown): string {
	if (result === null || result === undefined) {
		return "✅ Амжилттай.";
	}

	if (typeof result === "string") {
		return result.trim().length > 0 ? result : "✅ Амжилттай.";
	}

	if (typeof result === "object") {
		const obj = result as Record<string, unknown>;
		if (typeof obj.success === "boolean") {
			const message =
				typeof obj.message === "string" ? obj.message : "Үйлдэл гүйцэтгэгдлээ.";
			return obj.success ? `✅ ${message}` : `❌ ${message}`;
		}
		if (typeof obj.error === "string") {
			return `❌ ${obj.error}`;
		}
		const json = JSON.stringify(obj);
		return json.length <= 4000 ? json : `${json.slice(0, 4000)}…`;
	}

	return String(result);
}
