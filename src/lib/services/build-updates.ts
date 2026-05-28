/**
 * Shared helper for building Supabase update objects.
 * Eliminates the repetitive `if (params.x !== undefined) updates.x = ...` pattern.
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
 * Skips undefined fields automatically. Applies optional transforms.
 *
 * @example
 * ```ts
 * const updates = buildUpdates(params, {
 *   columns: { firstName: "first_name", email: "email" },
 *   transforms: {
 *     firstName: (v) => v.trim() || null,
 *     email: (v) => v.trim() || null,
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
    updates[column] = transform
      ? transform(value as NonNullable<T[keyof T]>, params)
      : value;
  }

  return updates;
}
