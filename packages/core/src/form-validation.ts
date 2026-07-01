/**
 * Form error infrastructure — dependency-free helpers for server actions
 * and client form state management.
 */

/** Flatten Zod issues into a fieldErrors record: { fieldName: "first error message" }. */
export function flattenFieldErrors(
  issues: ReadonlyArray<{ path: readonly PropertyKey[]; message: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

/**
 * Unified action state for server actions returning field-level errors.
 *
 * @example
 * ```ts
 * type CreateUserState = ActionState<{ userId: string }>;
 * ```
 */
export type ActionState<
  TSuccess extends Record<string, unknown> = Record<string, never>,
> = {
  formError?: string;
  fieldErrors?: Record<string, string>;
  values?: TSuccess;
};
