import type { ToolParam } from "@zuiio/ai-agent";

export type ToolArgumentValidation =
	| { ok: true }
	| { ok: false; message: string };

function matchesType(value: unknown, type: string): boolean {
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
			return typeof value === "object" && value !== null && !Array.isArray(value);
		default:
			return false;
	}
}

/** Validate untrusted LLM or service arguments before product execution. */
export function validateToolArguments(
	parameters: ToolParam[],
	args: Record<string, unknown>,
): ToolArgumentValidation {
	const declaredNames = new Set(parameters.map((parameter) => parameter.name));
	const unknownName = Object.keys(args).find((name) => !declaredNames.has(name));
	if (unknownName) {
		return { ok: false, message: `Unknown argument: ${unknownName}` };
	}

	for (const parameter of parameters) {
		const value = args[parameter.name];
		if (value === undefined || value === null) {
			if (parameter.required) {
				return {
					ok: false,
					message: `Missing required argument: ${parameter.name}`,
				};
			}
			continue;
		}

		if (!matchesType(value, parameter.type)) {
			return {
				ok: false,
				message: `Invalid type for ${parameter.name}: expected ${parameter.type}`,
			};
		}

		if (
			parameter.enum &&
			(typeof value !== "string" || !parameter.enum.includes(value))
		) {
			return {
				ok: false,
				message: `Invalid value for ${parameter.name}`,
			};
		}

		if (Array.isArray(value) && parameter.items) {
			if (value.some((item) => !matchesType(item, parameter.items?.type ?? ""))) {
				return {
					ok: false,
					message: `Invalid item type for ${parameter.name}`,
				};
			}
		}

		if (parameter.type === "object" && parameter.properties) {
			const objectValue = value as Record<string, unknown>;
			for (const [propertyName, definition] of Object.entries(
				parameter.properties,
			)) {
				const propertyValue = objectValue[propertyName];
				if (
					propertyValue !== undefined &&
					!matchesType(propertyValue, definition.type)
				) {
					return {
						ok: false,
						message: `Invalid type for ${parameter.name}.${propertyName}`,
					};
				}
			}
		}
	}

	return { ok: true };
}
