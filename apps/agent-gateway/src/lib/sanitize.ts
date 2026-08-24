import type { ToolParam } from "@zuiio/ai-agent";

/**
 * OWASP LLM Prompt Injection Prevention.
 *
 * Input is sanitized before it is placed in a prompt, then wrapped by the
 * caller in explicit data delimiters. Sanitization is not the only control:
 * the model also receives a system-level instruction to treat user content as
 * untrusted data.
 */
const INJECTION_PATTERNS = [
	/ignore\s+previous\s+instructions/gi,
	/ignore\s+all\s+instructions/gi,
	/pretend\s+you\s+are/gi,
	/\bDAN\b/gi,
	/jailbreak/gi,
	/system\s+prompt/gi,
	/you\s+are\s+now/gi,
	/\[SYSTEM\]/gi,
	/```system/gi,
];

const FORBIDDEN_KEYS: Record<string, true> = {
	["__proto__" as string]: true as const,
	constructor: true as const,
	prototype: true as const,
} as const;
const MAX_INPUT_LENGTH = 2000;

export function sanitizeUserInput(input: string): string {
	let sanitized = input.slice(0, MAX_INPUT_LENGTH);
	// Remove zero-width / control chars (except \n, \t).
	sanitized = sanitized.replace(
		/[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
		"",
	);
	for (const pattern of INJECTION_PATTERNS) {
		sanitized = sanitized.replace(pattern, "");
	}
	// Neutralize executable URL and script markers.
	sanitized = sanitized
		.replace(/javascript\s*:/gi, "")
		.replace(/data\s*:/gi, "")
		.replace(/<script/gi, "")
		.replace(/<\s*\/?\s*user_input\s*>/gi, "");
	return sanitized.trim().replace(/\s{3,}/g, "  ");
}

/** Wrap untrusted user text so the model must treat it as data. */
export function wrapUserData(input: string): string {
	return `<user_input>\n${sanitizeUserInput(input)}\n</user_input>`;
}

/** Detect known prompt-injection phrases before sanitization removes them. */
export function containsInjectionAttempt(input: string): boolean {
	return INJECTION_PATTERNS.some((pattern) => {
		pattern.lastIndex = 0;
		return pattern.test(input);
	});
}

interface ValidToolArguments {
	valid: true;
	args: Record<string, unknown>;
}

interface InvalidToolArguments {
	valid: false;
	error: string;
}

/**
 * Validate model-generated tool arguments against the tool parameter contract.
 * Unknown top-level keys are rejected and prototype-pollution keys are removed
 * from nested objects before the tool receives the value.
 */
export function validateToolArguments(
	input: unknown,
	parameters: readonly ToolParam[],
): ValidToolArguments | InvalidToolArguments {
	if (typeof input !== "object" || input === null || Array.isArray(input)) {
		return {
			valid: false,
			error: "Хэрэгслийн параметр буруу форматтай байна.",
		};
	}

	const source = input as Record<string, unknown>;
	const known = new Map(
		parameters.map((parameter) => [parameter.name, parameter]),
	);
	const args = Object.create(null) as Record<string, unknown>;

	for (const key of Object.keys(source)) {
		if (FORBIDDEN_KEYS[key] === true) {
			continue;
		}

		const parameter = known.get(key);
		if (!parameter) {
			return {
				valid: false,
				error: `Хэрэгслийн зөвшөөрөгдөөгүй параметр: ${key}`,
			};
		}

		const value = source[key];
		if (!matchesToolType(value, parameter.type)) {
			return {
				valid: false,
				error: `Хэрэгслийн параметрийн төрөл буруу: ${key}`,
			};
		}
		if (
			parameter.enum &&
			typeof value === "string" &&
			!parameter.enum.includes(value)
		) {
			return {
				valid: false,
				error: `Хэрэгслийн параметрийн утга зөвшөөрөгдөөгүй: ${key}`,
			};
		}

		args[key] = cloneToolValue(value);
	}

	for (const parameter of parameters) {
		if (parameter.required && !(parameter.name in args)) {
			return {
				valid: false,
				error: `Хэрэгслийн шаардлагатай параметр дутуу: ${parameter.name}`,
			};
		}
	}

	return { valid: true, args };
}

function matchesToolType(value: unknown, type: ToolParam["type"]): boolean {
	switch (type) {
		case "string":
			return typeof value === "string";
		case "number":
			return typeof value === "number" && Number.isFinite(value);
		case "boolean":
			return typeof value === "boolean";
		case "array":
			return Array.isArray(value);
		case "object":
			return (
				typeof value === "object" && value !== null && !Array.isArray(value)
			);
		default:
			return false;
	}
}

function cloneToolValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(cloneToolValue);
	}
	if (typeof value !== "object" || value === null) {
		return value;
	}

	const source = value as Record<string, unknown>;
	const clone = Object.create(null) as Record<string, unknown>;
	for (const key of Object.keys(source)) {
		if (FORBIDDEN_KEYS[key] !== true) {
			clone[key] = cloneToolValue(source[key]);
		}
	}
	return clone;
}

/**
 * Sanitize a Telegram user's name to prevent prompt injection.
 */
export function sanitizeDisplayName(name: string): string {
	// Strip anything that looks like system prompt instructions
	return name
		.replace(/["\\{}[\]()<>]/g, "")
		.trim()
		.slice(0, 100);
}

/**
 * Sanitize a database error message before returning it to the LLM.
 * Never expose schema, column names, or table names.
 */
export function sanitizeDbError(_rawError: unknown): string {
	// Always return generic message — no raw error text
	return "Би тэр өгөгдлийг олж чадсангүй. Өөр үг хэллэгээр асууна уу.";
}

/**
 * Truncate a tool result using the PARTIAL contract.
 * Returns: useful prefix + structural PARTIAL marker + total length info.
 * The model can detect truncation and request continuation.
 */
export function truncateResult(
	result: string,
	maxTokens: number = 2048,
): string {
	// Rough estimate: 1 token ≈ 4 chars
	const maxChars = maxTokens * 4;
	if (result.length <= maxChars) return result;

	// Cut at a natural boundary (newline) near the limit for cleaner output
	let cutPoint = maxChars;
	const lastNewline = result.lastIndexOf("\n", maxChars);
	if (lastNewline > maxChars * 0.8) {
		cutPoint = lastNewline;
	}

	const prefix = result.slice(0, cutPoint);
	const totalLen = result.length;
	const remaining = totalLen - cutPoint;

	return (
		prefix +
		`\n\n---\n[PARTIAL: ${remaining} тэмдэгт үлдсэн. Нийт ${totalLen} тэмдэгт.]`
	);
}

/**
 * Sanitize an error message before showing it to users.
 * Strips file paths, stack traces, and internal details.
 */
export function sanitizeErrorMessage(err: unknown): string {
	if (!(err instanceof Error)) {
		return "Алдаа гарлаа. Дахин оролдоно уу.";
	}
	const msg = err.message;
	// Strip anything that looks like a file path, stack trace, or internal detail
	const sanitized = msg
		.replace(/\/[\w/.-]+\.\w+:\d+/g, "[internal]") // file paths with line numbers
		.replace(/at\s+[\w.]+\s+\([^)]+\)/g, "") // stack traces
		.replace(/node_modules[/\\][^\s:]+/g, "[internal]") // node_modules paths
		.replace(/(?:password|secret|token|key)[=:]\s*\S+/gi, "[redacted]") // secrets
		.trim();
	// If nothing useful remains, return generic message
	if (!sanitized || sanitized.length < 3) {
		return "Алдаа гарлаа. Дахин оролдоно уу.";
	}
	// Cap length
	return sanitized.slice(0, 200);
}
