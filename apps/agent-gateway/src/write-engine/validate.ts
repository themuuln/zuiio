import type {
	WriteCatalog,
	WritePlan,
	WritePlanValidationError,
} from "./types";

export interface WriteValidationResult {
	valid: boolean;
	errors: WritePlanValidationError[];
	warnings: string[];
}

/**
 * Validates a WritePlan against the write catalog.
 *
 * This is a deterministic, pure function — no DB, no LLM. It enforces:
 *  - the dataset exists and is writable for the requested operation
 *  - update/delete supply a target PK
 *  - every field in `data` exists, is writable, and passes type/enum checks
 *  - required fields (on insert) are present
 *  - organization_id is never supplied by the LLM (tenant leak)
 *
 * Non-fatal issues (e.g., an unknown field the LLM guessed) are downgraded to
 * a warning and stripped at compile time, so a single bad field doesn't fail
 * the whole write.
 */
export function validateWritePlan(
	plan: WritePlan,
	catalog: WriteCatalog,
): WriteValidationResult {
	const errors: WritePlanValidationError[] = [];
	const warnings: string[] = [];

	const dataset = catalog.datasets[plan.dataset];
	if (!dataset) {
		errors.push({
			code: "DATASET_NOT_FOUND",
			message: `"${plan.dataset}" бичих боломжтой өгөгдлийн багц олдсонгүй`,
		});
		return { valid: false, errors, warnings };
	}

	// Operation permission
	switch (plan.operation) {
		case "insert":
			if (!dataset.insertable) {
				errors.push({
					code: "OPERATION_NOT_ALLOWED",
					message: `"${plan.dataset}" өгөгдлийн багц руу бүртгэл хийхийг зөвшөөрөхгүй`,
				});
			}
			break;
		case "update":
			if (!dataset.updatable) {
				errors.push({
					code: "OPERATION_NOT_ALLOWED",
					message: `"${plan.dataset}" өгөгдлийн багц руу шинэчлэл хийхийг зөвшөөрөхгүй`,
				});
			}
			if (!plan.id) {
				errors.push({
					code: "MISSING_ID",
					message: `Шинэчлэхийн тулд "${dataset.pk}" талбарын утга шаардлагатай`,
					field: dataset.pk,
				});
			}
			break;
		case "delete":
			if (!dataset.deletable) {
				errors.push({
					code: "OPERATION_NOT_ALLOWED",
					message: `"${plan.dataset}" өгөгдлийн багц руу устгахыг зөвшөөрөхгүй`,
				});
			}
			if (!plan.id) {
				errors.push({
					code: "MISSING_ID",
					message: `Устгахын тулд "${dataset.pk}" талбарын утга шаардлагатай`,
					field: dataset.pk,
				});
			}
			break;
	}

	// data presence (insert/update need it)
	if (plan.operation !== "delete" && (!plan.data || Object.keys(plan.data).length === 0)) {
		errors.push({
			code: "MISSING_DATA",
			message: `"${plan.operation}" үйлдэлд өгөгдөл (data) шаардлагатай`,
		});
		return { valid: errors.length === 0, errors, warnings };
	}

	const tenantColumn = catalog.tenant.column;

	// Field-level checks
	for (const [rawField, rawValue] of Object.entries(plan.data ?? {})) {
		// Tenant column leak — engine injects this, LLM must not
		if (rawField === tenantColumn) {
			errors.push({
				code: "TENANT_COLUMN_LEAKED",
				message: `Tenant талбар "${tenantColumn}" өгөгдөлд орж болохгүй (engine автоматаар нэмнэ)`,
				field: rawField,
			});
			continue;
		}

		const field = dataset.fields[rawField];
		if (!field) {
			// Unknown field → strip with a warning rather than hard-fail
			warnings.push(
				`"${rawField}" талбар "${plan.dataset}" дээр байхгүй — алгаслаа`,
			);
			continue;
		}

		if (field.writable === false) {
			errors.push({
				code: "FIELD_NOT_WRITABLE",
				message: `"${rawField}" талбар бичихээр зөвшөөрөгдөхгүй`,
				field: rawField,
			});
			continue;
		}

		// Enum / allowed-values check
		if (field.allowedValues && field.allowedValues.length > 0) {
			const str = String(rawValue);
			if (!field.allowedValues.includes(str)) {
				errors.push({
					code: "INVALID_ENUM_VALUE",
					message: `"${rawField}" талбарын утга "${str}" зөвшөөрөгдөхгүй. Боломжит: ${field.allowedValues.join(", ")}`,
					field: rawField,
				});
				continue;
			}
		}

		// Type coercion sanity check (non-fatal for null/undefined)
		if (rawValue !== null && rawValue !== undefined) {
			const typeOk = coerceValue(rawValue, field.type);
			if (!typeOk.ok) {
				errors.push({
					code: "INVALID_TYPE",
					message: `"${rawField}" талбарын төрөл буруу: ${typeOk.reason}`,
					field: rawField,
				});
			}
		}
	}

	// Required fields (insert only) — check every writable field flagged required
	if (plan.operation === "insert") {
		for (const [name, field] of Object.entries(dataset.fields)) {
			if (field.required && field.writable !== false) {
				if (plan.data?.[name] === undefined || plan.data?.[name] === null) {
					errors.push({
						code: "FIELD_REQUIRED",
						message: `"${name}" талбар шаардлагатай (insert)`,
						field: name,
					});
				}
			}
		}
	}

	return { valid: errors.length === 0, errors, warnings };
}

/**
 * Checks whether a value can be coerced to the target Postgres type.
 * Returns ok:false with a reason when it cannot — the validator surfaces the
 * reason in the error message.
 */
function coerceValue(
	value: unknown,
	type: WriteCatalog["datasets"][string]["fields"][string]["type"],
): { ok: boolean; reason?: string } {
	switch (type) {
		case "uuid":
			return typeof value === "string" && /^[0-9a-fA-F-]{36}$/.test(value)
				? { ok: true }
				: { ok: false, reason: "uuid биш" };
		case "number":
			return typeof value === "number" && !Number.isNaN(value)
				? { ok: true }
				: { ok: false, reason: "тоо биш" };
		case "boolean":
			return typeof value === "boolean"
				? { ok: true }
				: { ok: false, reason: "логик утга биш" };
		case "string":
		case "text":
			return typeof value === "string"
				? { ok: true }
				: { ok: false, reason: "текст биш" };
		case "timestamp":
			return typeof value === "string" || value instanceof Date
				? { ok: true }
				: { ok: false, reason: "хугацааны утга биш" };
		default:
			return { ok: true };
	}
}
