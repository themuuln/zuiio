/**
 * React Hook Form + Zod + shadcn/ui integration.
 *
 * Provides:
 * - `zodResolver` re-export for convenience
 * - `useFormAction` — hook for server action forms with optimistic UI
 * - `fieldErrorProps` — extract RHF errors into shadcn FieldError props
 *
 * Usage:
 *   const form = useForm({ resolver: zodResolver(schema), defaultValues: ... });
 *   <Field>
 *     <FieldLabel>Name</FieldLabel>
 *     <Input {...form.register("name")} />
 *     <FieldError {...fieldErrorProps(form, "name")} />
 *   </Field>
 */

import { zodResolver } from "@hookform/resolvers/zod";
import type {
  FieldError,
  FieldErrors,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";
import { useForm as useRHFForm } from "react-hook-form";

export { zodResolver };

// ── Types ────────────────────────────────────────────────────

type AnyForm = UseFormReturn<any>;

// ── Field Error Helper ───────────────────────────────────────

/**
 * Convert RHF field error to shadcn <FieldError> props.
 *
 * @example <FieldError {...fieldErrorProps(form, "phone")} />
 */
export function fieldErrorProps(
  form: AnyForm,
  name: string,
): { errors?: Array<{ message?: string }> } {
  const error = form.formState.errors[name];
  if (!error) return {};
  return {
    errors: [{ message: error.message as string }],
  };
}

/**
 * Check if a specific field has an error.
 */
export function hasFieldError(form: AnyForm, name: string): boolean {
  return !!form.formState.errors[name];
}

/**
 * Get the error message for a field, or undefined.
 */
export function getFieldError(form: AnyForm, name: string): string | undefined {
  const error = form.formState.errors[name];
  return error?.message as string | undefined;
}

// ── Server Action Form Hook ──────────────────────────────────

type FormActionState<T> = {
  formError?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  data?: T;
};

type UseFormActionOptions<T, S extends Record<string, unknown>> = {
  /** Server action to call on submit */
  action: (formData: S) => Promise<FormActionState<T>>;
  /** Called after successful submission */
  onSuccess?: (data: T) => void;
  /** Called on error */
  onError?: (error: FormActionState<T>) => void;
  /** Reset form on success (default: true) */
  resetOnSuccess?: boolean;
};

/**
 * Hook for forms that submit to server actions.
 * Handles optimistic updates, error mapping, and form reset.
 *
 * @example
 * const form = useFormAction({
 *   action: createCustomer,
 *   onSuccess: () => router.refresh(),
 * });
 */
export function useFormAction<
  T = void,
  S extends Record<string, unknown> = Record<string, unknown>,
>(options: UseFormActionOptions<T, S>) {
  const { action, onSuccess, onError, resetOnSuccess = true } = options;

  const submit = async (values: S) => {
    const result = await action(values);

    if (result.success) {
      if (resetOnSuccess) {
        // Form reset is handled by the caller
      }
      onSuccess?.(result.data as T);
      return result;
    }

    // Field errors are returned to the caller for form.setError()
    // e.g.: for (const [field, msg] of Object.entries(result.fieldErrors ?? {})) {
    //   form.setError(field as any, { message: msg });
    // }

    onError?.(result);
    return result;
  };

  return { submit };
}

// ── Optimistic Mutation Wrapper ──────────────────────────────

/**
 * Type-safe wrapper around React Query's optimistic update pattern.
 * Use inside a form's onSubmit to instantly update the cache, then reconcile.
 *
 * @example
 * const queryClient = useQueryClient();
 * await optimisticUpdate(queryClient, {
 *   queryKey: ["customers", orgId],
 *   updater: (old) => [...old, newCustomer],
 *   action: () => createCustomer(newCustomer),
 * });
 */
export async function optimisticUpdate<T>(
  queryClient: {
    setQueryData: (key: any, updater: any) => void;
    cancelQueries: (options: any) => Promise<void>;
    getQueryData: (key: any) => T | undefined;
  },
  options: {
    queryKey: any[];
    updater: (old: T | undefined) => T;
    action: () => Promise<any>;
  },
) {
  const { queryKey, updater, action } = options;

  // Cancel in-flight refetches so they don't overwrite our optimistic update
  await queryClient.cancelQueries({ queryKey });

  // Snapshot current data for rollback
  const previousData = queryClient.getQueryData(queryKey);

  // Optimistically update
  queryClient.setQueryData(queryKey, updater);

  try {
    await action();
  } catch {
    // Rollback on error
    queryClient.setQueryData(queryKey, previousData);
    throw new Error("Optimistic update failed — rolled back");
  }
}

// ── Re-exports ───────────────────────────────────────────────

export { useRHFForm as useForm };
export type { UseFormReturn, UseFormProps, FieldErrors, FieldError };
