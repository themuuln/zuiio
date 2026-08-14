/**
 * Shared helper for building Supabase update objects.
 * Eliminates the repetitive `if (params.x !== undefined) updates.x = ...` pattern.
 *
 * ## Null-safety
 *
 * - `undefined` fields are **skipped** (not provided in the request → don't change).
 * - `null` fields are **passed through as-is** (intentionally clearing a field).
 *   Transforms are NOT applied to null values — the transform's job is
 *   cleaning up string values, not handling null.
 * - All other values go through their optional transform.
 *
 * ## Testing
 *
 * If you're adding a new service that uses `buildUpdates`, test with:
 * - `undefined`: field should be absent from the update object
 * - `null`: field should be `null` in the update object (clear the column)
 * - `"  text  "`: field should be trimmed (`"text"`)
 * - `""`: field should be `null` (empty string → null for DB)
 */

type TransformFn<T> = (value: unknown, params: T) => unknown;

export interface FieldMap<T> {
  /** Maps param keys to DB column names. */
  columns: Partial<Record<keyof T, string>>;
  /** Optional per-field transforms (e.g., trim, null-coalesce). */
  transforms?: Partial<Record<keyof T, TransformFn<T>>>;
}

/**
 * Build a Supabase update record from params and a field map.
 *
 * Skips `undefined` fields. Passes `null` through without transforms.
 * Applies optional transforms to non-null values.
 *
 * @example
 * ```ts
 * const updates = buildUpdates(params, {
 *   columns: { firstName: "first_name", email: "email" },
 *   transforms: {
 *     firstName: trimField,
 *     email: trimField,
 *   },
 * });
 * ```
 */
export function buildUpdates<T extends object>(
  params: T,
  fieldMap: FieldMap<T>,
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  const paramsRecord = params as Record<string, unknown>;
  for (const [key, column] of Object.entries(fieldMap.columns) as [
    string,
    string,
  ][]) {
    if (paramsRecord[key] === undefined) continue;
    const value = paramsRecord[key];
    const transform = fieldMap.transforms?.[key as keyof T];
    // null means "clear this field in DB" — pass through, no transform
    if (value === null) {
      updates[column] = null;
    } else {
      updates[column] = transform
        ? transform(value as NonNullable<T[keyof T]>, params)
        : value;
    }
  }

  return updates;
}
