/**
 * Shared null-safe string trimmer for Supabase update transforms.
 *
 * Usage in service fieldMap:
 * ```ts
 * import { trimField } from "./trim-field";
 *
 * const fieldMap: FieldMap<typeof params> = {
 *   columns: { name: "name", email: "email" },
 *   transforms: { name: trimField, email: trimField },
 * };
 * ```
 *
 * Behavior:
 *   trimField("  Hello  ") → "Hello"
 *   trimField("")          → null      // empty → null for DB
 *   trimField(null)        → null      // null → null (safe)
 *   trimField(undefined)   → null      // unused (buildUpdates skips undefined)
 */
export function trimField(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}
