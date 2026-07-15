/**
 * Shared action state contract for all identity Server Actions.
 * Every login, signup, recovery, and profile mutation returns this shape
 * so the same form shell can render field errors, form errors, and redirects.
 */
export interface AuthActionState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  redirectTo?: string;
}
